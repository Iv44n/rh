# Plan de arquitectura de billing: Polar como fuente de verdad comercial + DB local para capacidades del producto

## Contexto

Arquitectura de billing donde **Polar es la fuente de verdad para todo lo comercial** (catálogo, precios, checkout, impuestos, renovaciones, facturas) y **la base de datos de la app es la fuente de verdad para las capacidades del producto** (límites de plan, features). Este documento traduce esa decisión a un plan de implementación concreto para este repo.

Investigación previa confirmó que **ya existe una integración parcial de Polar** que hay que extender, no una base vacía:

- `api/src/modules/billing/` — módulo DDD ya funcional: `list-plans` (lee el catálogo de Polar en vivo), `create-organization-portal-url` (resuelve el customer vía una llamada en vivo a Polar filtrando por `metadata.referenceId`), gateway `PolarBillingGateway`, repo `DrizzleMemberRepository` (el único acceso a DB hoy, solo lee `members` para permisos).
- `api/src/modules/auth/infrastructure/better-auth/auth.config.ts` — ya configura el plugin `@polar-sh/better-auth` (`checkout`, `portal`, `webhooks`). El handler de webhooks es un **stub que solo hace `console.info(payload.type)`** — no persiste nada. Este es el hueco principal que este plan resuelve.
- **No existen tablas `plan` ni `subscription` en la DB hoy.** `domain/plan.ts` documenta explícitamente que `Plan` es "una proyección de lectura del catálogo del proveedor, no un agregado propio."
- Frontend (`web/src/features/billing/`, `web/src/sdk/modules/billing/`) ya está armado end-to-end contra este módulo.

Convenciones DDD ya establecidas en el repo (a seguir sin desviarse): `Entity<Attrs>()` (clases congeladas), `Result<T, AppError>` + `okOrThrow` para el puente a HTTP, ids `text` generados con `Id.generate()` (uuid v7), capas `domain/` (entities, `ports/*.port.ts`, errores) → `application/` (casos de uso sin decoradores) → `infrastructure/{http,persistence,polar}`, DI manual vía `<módulo>.tokens.ts` + `useFactory`, catálogo de errores HTTP registrado por side-effect import.

---

## Decisión arquitectónica

- **Polar** sigue siendo dueño de: catálogo de productos, precios, moneda, intervalo de facturación, trials, impuestos, checkout, invoices, renovaciones.
- **La DB local** gana dos tablas nuevas, ambas dentro de `api/src/modules/billing/infrastructure/persistence/billing.schemas.ts` (no en `shared/db/`, siguiendo el patrón de que cada módulo es dueño de su propio schema, reexportado desde `shared/db/schemas.ts`):
  - **`plans`**: `slug`, `name`, `description`, `polarProductId` (referencia, no el precio), `features` (jsonb `string[]`), `limits` (jsonb tipado), `isActive`. Fuente de verdad local para qué desbloquea cada plan.
  - **`subscriptions`**: `organizationId` (FK a `organizations`), `polarSubscriptionId` (clave de idempotencia), `polarCustomerId`, `polarProductId`, `status`, `currentPeriodEnd`, `cancelAtPeriodEnd`. Caché local del estado de Polar, sincronizada por webhooks — **no** es una segunda fuente de verdad de facturación, es un puntero rápido.
- **Nunca se duplica precio/moneda/intervalo/impuestos en la DB.** Esos campos siempre se leen en vivo desde Polar cuando hace falta mostrarlos (ej. `GET /billing/plans` sigue enriqueciendo con datos de Polar).
- Sin tabla/FK entre `plans` y `subscriptions`: el join se hace en memoria por `polarProductId` al momento de leer, así el webhook nunca falla por un producto todavía no sembrado localmente.

---

## Diseño: Schema de base de datos

Archivo nuevo: `api/src/modules/billing/infrastructure/persistence/billing.schemas.ts`, reexportado con una línea nueva en `api/src/shared/db/schemas.ts` (que hoy solo hace `export * from '@modules/auth/.../auth.schemas'`).

```ts
export const plans = pgTable('plans', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  polarProductId: text('polar_product_id'), // null solo para el plan Free local-only
  features: jsonb('features').$type<string[]>().notNull().default([]),
  limits: jsonb('limits').$type<PlanLimits>().notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, table => [
  uniqueIndex('plans_slug_uidx').on(table.slug),
  uniqueIndex('plans_polar_product_id_uidx').on(table.polarProductId)
])

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  polarSubscriptionId: text('polar_subscription_id').notNull(),
  polarCustomerId: text('polar_customer_id').notNull(),
  polarProductId: text('polar_product_id').notNull(),
  status: text('status').notNull(), // valor crudo del SubscriptionStatus de Polar
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  polarModifiedAt: timestamp('polar_modified_at'), // guarda de last-write-wins, no dato de negocio
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, table => [
  uniqueIndex('subscriptions_polar_subscription_id_uidx').on(table.polarSubscriptionId),
  index('subscriptions_organization_id_idx').on(table.organizationId)
])
```

**`features`/`limits` en `jsonb`, no en tabla normalizada**: a esta escala (un puñado de planes, gestionados por script de seed, sin UI admin) un `jsonb` tipado evita joins innecesarios y permite agregar claves sin migración. Tipo de dominio:

```ts
export type PlanLimits = {
  maxProjects: number | null   // null = ilimitado
  maxUsers: number | null
  maxStorageMb: number | null
}
```

---

## Diseño: capa de dominio en `modules/billing`

- **`Plan`** pasa de ser un `type` puro a una `Entity` persistida (`domain/plan.ts`). El shape actual (`id`=id de producto Polar, `prices`, `benefits`) se conserva como un tipo separado `PlanCatalogEntry` (lo que devuelve `GET /billing/plans`, sin romper el contrato con `useCheckout()` que hoy pasa `plan.id` como `productId`), enriquecido con `slug`, `features`, `limits` de la tabla local.
- **Nuevo `domain/subscription.ts`**: `Subscription extends Entity<SubscriptionAttrs>()` con un método `isEntitled()` que trata `active`, `trialing` y `past_due` como con derecho a acceso (Polar reintenta el cobro antes de revocar; el acceso no debe caer hasta `subscription.revoked`).
- **Nuevos ports**: `domain/ports/plan-repository.port.ts` (`findActive`, `findByPolarProductId`, `findBySlug`) y `domain/ports/subscription-repository.port.ts` (`findCurrentByOrganizationId`, `upsertFromPolar`).
- **Nuevos repos Drizzle**: `infrastructure/persistence/drizzle-plan.repository.ts`, `drizzle-subscription.repository.ts`, mismo estilo que `DrizzleMemberRepository` (`@Injectable()`, sin constructor, usan el singleton `db` compartido).
- **Upsert idempotente** por `polarSubscriptionId` con `onConflictDoUpdate` + `setWhere` comparando `polarModifiedAt`, para que eventos de webhook fuera de orden o duplicados no rompan el estado (última escritura gana por fecha de Polar, no por orden de llegada). El `id` nunca se sobrescribe en el conflicto.
- **`ListPlansUseCase`** ahora recibe también `PlanRepository` y hace merge en memoria: `products` (Polar, vivo) `+ localPlans` (DB) emparejados por `polarProductId`.
- **`CreateOrganizationPortalUrlUseCase`** deja de llamar `billingGateway.findActiveSubscriptionCustomerId` (llamada en vivo a Polar) y en su lugar lee `subscriptionRepository.findCurrentByOrganizationId(organizationId)` + `.isEntitled()`; solo la creación de la URL del portal sigue siendo una llamada en vivo a Polar (es inherentemente así). Se elimina `findActiveSubscriptionCustomerId` del port y del gateway (queda sin uso).
- **Mecanismo de entitlements**: un caso de uso que resuelve, dado un `organizationId`, cuál es el plan efectivo (la suscripción activa local, o el plan `free` como fallback) y expone sus `features`/`limits`. Este caso de uso se expone tanto por HTTP (`GET /billing/entitlements`) como export del módulo (vía `BILLING_TOKENS`) para que otros módulos lo puedan inyectar directamente sin pasar por HTTP. **Fuera de alcance de este plan**: el detalle de cómo un módulo de features (ej. proyectos) lo consumiría para bloquear una acción — eso es una decisión de implementación posterior.

---

## Diseño: sincronización vía webhooks

**Decisión**: los handlers van dentro de `auth.config.ts`, no en un controller NestJS aparte. Razón: el plugin `webhooks()` de `@polar-sh/better-auth` ya valida la firma (`POLAR_WEBHOOK_SECRET`) y maneja el body crudo — reimplementar eso en un controller paralelo duplicaría lógica ya probada. `auth.config.ts` ya importa directamente singletons que no pasan por el DI de Nest (`db`, `polarClient`, `Id`, `email.*`); construir aquí el repo/caso de uso a mano sigue ese mismo patrón, no inventa uno nuevo.

**Sin dependencia circular**: `auth.config.ts` (en `modules/auth`) importaría de `modules/billing/application` y `modules/billing/infrastructure/{persistence,polar}` — una sola dirección. `modules/billing` solo importa de `modules/auth/infrastructure/http` (guard de sesión) — un subárbol distinto.

Se reemplaza el `onPayload` stub por handlers granulares del plugin (`onSubscriptionCreated/Updated/Active/Canceled/Uncanceled/Revoked`, `onOrderPaid`), todos delegando a un único `syncSubscription()` que:
1. Extrae `metadata.referenceId` (el `organizationId`) del payload — si falta, se loguea y se ignora (reintentar no lo arregla).
2. Llama a `SyncSubscriptionFromWebhookUseCase.execute()`, que hace el upsert idempotente descrito arriba.

Semántica por evento (todos terminan en el mismo upsert, solo cambian los valores que trae el payload):
- `subscription.created` → insert inicial (a veces `status=incomplete`).
- `subscription.updated` → upsert genérico (cambios de plan/seats).
- `subscription.active` → `status=active`, `isEntitled()` pasa a true.
- `subscription.canceled` → `cancelAtPeriodEnd=true`, `status` sigue `active` — **el acceso se mantiene** hasta `currentPeriodEnd`.
- `subscription.uncanceled` → `cancelAtPeriodEnd` vuelve a `false`.
- `subscription.revoked` → evento terminal de Polar; el `status` persistido pasa a `canceled` y `isEntitled()` naturalmente da `false` — este es el mecanismo real de corte de acceso, sin caso especial.
- `order.paid` → confirmación de renovación usando el `subscription` anidado del payload, por si `subscription.updated` no llegó de forma independiente.

Si el handler lanza una excepción (ej. error de DB), el plugin la propaga como respuesta no-2xx y Polar reintenta la entrega según su propio backoff — esto es deseable para errores transitorios.

---

## Diseño: seeding de planes y rollout

Sin UI de admin — un script idempotente, ejecutado a mano:

- **`api/scripts/seed-plans.ts`** (nuevo): mapa de seeds por entorno (`sandbox`/`production`, según `env.POLAR_SERVER`), porque los `polarProductId` son distintos entre ambos. Upsert por **`slug`** (no por `polarProductId`, ya que ese es justo el campo que cambia entre entornos y el que un re-run necesita actualizar).
- El plan `free` se siembra con `polarProductId: null` — es un fallback local, no un producto de checkout en Polar.
- Los productos Pro/Enterprise se siguen creando primero en el dashboard de Polar (ahí vive el precio); el script solo enlaza el `slug` local con el `polarProductId` correspondiente.
- Scripts nuevos en `api/package.json`: `db:seed` y `db:backfill-subscriptions`, usando `ts-node -r tsconfig-paths/register --transpile-only` (ambas devDependencies ya presentes en `api/package.json`, hoy sin uso).
- **`api/scripts/backfill-subscriptions.ts`** (nuevo, un solo uso post-deploy): pagina `polarClient.subscriptions.list({active:true})` y llama al repo directamente (no al caso de uso, ya que es una operación de administración confiable) para poblar `subscriptions` con lo que ya existía en Polar antes de este cambio.

---

## Diseño: superficie de API

- `GET /billing/plans` — cambia de forma de manera aditiva (agrega `slug`, `features`, `limits` a cada entrada), no rompe a los consumidores actuales.
- **Nuevo** `GET /billing/entitlements` — protegido por `SessionGuard`, resuelve `organizationId` desde `session.session.activeOrganizationId` (mismo patrón que `POST /billing/portal`), devuelve `{ planSlug, planName, features, limits, subscriptionStatus, isEntitled }`.
- `BillingModule` exporta el token del caso de uso de entitlements para que otros módulos lo inyecten directamente sin pasar por HTTP.
- No se necesitan códigos de error nuevos en `billing.error-catalog.ts`.

---

## Diseño: impacto en frontend (mínimo)

Solo plumbing aditivo, sin nueva UI:
- `web/src/sdk/modules/billing/types.d.ts` — agregar `slug`, `features`, `limits` a `Plan`; agregar tipos `PlanLimits`/`OrganizationEntitlements`.
- `web/src/sdk/modules/billing/routes.ts` + `client.ts` — agregar ruta y método `getEntitlements()`.
- Nuevo hook `web/src/features/billing/hooks/use-organization-entitlements.ts`, mismo estilo que `use-plans.ts`.
- **Sin cambios** en `organization-billing.tsx` ni en `use-organization-subscription.ts` — ese hook sigue leyendo el estado de suscripción en vivo vía el proxy de better-auth para la página de facturación; el nuevo caché local es para otro propósito (gating de features), no reemplaza esa vista.

---

## Diseño: mecánica de migración

Confirmado directamente: `api/drizzle/` no existe todavía — no hay historial de migraciones (`db:generate`/`db:migrate` nunca se corrieron), la DB de desarrollo se mantiene sincronizada con `db:push`. `drizzle.config.ts` apunta a `./src/shared/db/schemas.ts` como schema y `./drizzle` como output.

**Recomendación**: usar `pnpm run db:push`, no `db:generate`. Generar una "primera" migración ahora emitiría `CREATE TABLE` también para las tablas de better-auth que ya existen en la DB de dev, y fallaría. Bootstrapear el historial de migraciones para todo el proyecto es un tema aparte, más grande que este cambio de billing. `db:push` es aditivo aquí: solo va a emitir `CREATE TABLE plans` / `CREATE TABLE subscriptions`.

Orden de rollout: schema (`db:push`) → seed (`db:seed`) → deploy del código con los webhooks → backfill (`db:backfill-subscriptions`) una sola vez para organizaciones con suscripción previa a este cambio.

---

## Plan de verificación (sandbox de Polar + Polar CLI)

1. Confirmar en `api/.env`: `POLAR_SERVER=sandbox`, `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` válidos.
2. Crear un producto recurrente "Pro" de prueba en el dashboard sandbox de Polar; copiar su product id.
3. Completar `PLAN_SEEDS.sandbox` con ese id; correr `pnpm run db:push && pnpm run db:seed`.
4. Levantar el stack (`docker compose -f docker-compose.dev.yml up`) y el frontend.
5. Apuntar el túnel de webhooks (`polar listen <url>`) a `http://localhost:3001/api/auth/polar/webhooks` (la ruta que expone el sub-plugin `webhooks()` bajo el mount de `BetterAuthMiddleware`).
6. `GET /api/billing/plans` → confirmar que el producto Pro trae `slug: 'pro'` y `limits`/`features` poblados (el merge funciona).
7. Desde el frontend: iniciar sesión, seleccionar organización, suscribirse a Pro con una tarjeta de prueba de Polar.
8. Revisar logs de la API por `[polar] webhook recibido: subscription.created / subscription.active / order.paid`, sin excepciones no manejadas.
9. Verificar en la DB (`pnpm run db:studio`) que existe una fila en `subscriptions` con `status='active'`, `polar_product_id` correcto, `current_period_end`, `cancel_at_period_end=false`.
10. `GET /api/billing/entitlements` (autenticado, con organización activa) → `planSlug: 'pro'`, `isEntitled: true`.
11. Cancelar la suscripción desde el portal de cliente (botón "Gestionar suscripción", que ahora resuelve el customer desde la caché local) → confirmar que `subscription.canceled` llega, `cancel_at_period_end=true`, `isEntitled` sigue `true` (periodo de gracia).
12. Simular/esperar `subscription.revoked` → confirmar que `status` pasa a `canceled` y `GET /billing/entitlements` cae al plan `free`.
13. Reenviar un evento ya procesado (replay del Polar CLI) → confirmar que el upsert es un no-op y no genera error (idempotencia).

---

## Archivos críticos (referencia para la implementación)

- `api/src/modules/billing/infrastructure/persistence/billing.schemas.ts` (nuevo)
- `api/src/modules/billing/domain/subscription.ts` (nuevo)
- `api/src/modules/billing/domain/plan.ts` (modificado)
- `api/src/modules/billing/application/sync-subscription-from-webhook.use-case.ts` (nuevo)
- `api/src/modules/billing/application/get-organization-entitlements.use-case.ts` (nuevo)
- `api/src/modules/billing/application/list-plans.use-case.ts` (modificado)
- `api/src/modules/billing/application/create-organization-portal-url.use-case.ts` (modificado)
- `api/src/modules/billing/billing.module.ts` y `billing.tokens.ts` (modificados)
- `api/src/modules/auth/infrastructure/better-auth/auth.config.ts` (modificado — webhooks granulares)
- `api/src/shared/db/schemas.ts` (modificado — agrega el reexport)
- `api/scripts/seed-plans.ts`, `api/scripts/backfill-subscriptions.ts` (nuevos)
- `web/src/sdk/modules/billing/{routes.ts,client.ts,types.d.ts}` (modificados)
- `web/src/features/billing/hooks/use-organization-entitlements.ts` (nuevo)
