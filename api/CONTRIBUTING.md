# 🛠 Engineering Handbook

**Guía de contribución y referencia de arquitectura**  
**Versión 2.0 · Uso interno**

---

## 💡 Propósito

Este documento es la fuente de verdad para contribuir a este proyecto. Define la estrategia de Git, las reglas de arquitectura, los estándares de código y el proceso de Pull Request.

Leerlo una sola vez evita ciclos interminables de revisión y correcciones.

---

## Índice

- [1. Estrategia de ramas](#1-estrategia-de-ramas)
- [2. Arquitectura](#2-arquitectura)
- [3. Estándares de código](#3-estándares-de-código)
- [4. Base de datos y migraciones](#4-base-de-datos-y-migraciones)
- [5. Estrategia de testing](#5-estrategia-de-testing)
- [6. Proceso de Pull Request](#6-proceso-de-pull-request)
- [7. Convención de commits](#7-convención-de-commits)
- [8. Principios de ingeniería](#8-principios-de-ingeniería)
- [9. Referencia rápida](#9-referencia-rápida)

---

# 1. Estrategia de ramas

Seguimos un modelo de ramas basado en estabilidad con dos ramas permanentes y ramas cortas para trabajo puntual.  
Los pushes directos a `main` o `dev` están estrictamente prohibidos. Todo cambio entra mediante Pull Request.

## 1.1 Ramas permanentes

| Rama | Propósito | Quién fusiona |
|------|-----------|---------------|
| `main` | Código listo para producción. Solo releases etiquetadas. | Release manager mediante Release PR validado |
| `dev` | Rama de integración. Destino de todo el trabajo diario. | Cualquier contributor mediante PR aprobado y *Squash & Merge* |

### Regla de oro

Nunca hacer push directo a `main` o `dev`.  
Sin excepciones.

---

## 1.2 Ciclo de vida de ramas cortas

| Prefijo     | Desde  |      Hacia      | Propósito                                |
|-------------|--------|-----------------|------------------------------------------|
| `feat/`     | `dev`  | `dev`           | Nuevas funcionalidades                   |
| `fix/`      | `dev`  | `dev`           | Correcciones de errores                  |
| `hotfix/`   | `main` | `main` + `dev`  | Parches críticos en producción           |
| `refactor/` | `dev`  | `dev`           | Mejoras internas sin cambios funcionales |
| `docs/`     | `dev`  | `dev`           | Actualización de documentación           |
| `chore/`    | `dev`  | `dev`           | Dependencias, tooling, CI, mantenimiento |

---

## 1.3 Convención de nombres

Usar `kebab-case` en minúsculas después del prefijo.  
El nombre debe ser descriptivo y breve. Incluir ticket ID cuando exista.

```bash
<prefix>/<ticket-#id>-<short-description>
````

### Ejemplos

```bash
feat/AUTH-#42-google-oauth-provider
fix/API-#88-null-response-user-fetch
refactor/DB-#15-optimize-connection-pool
chore/update-pnpm-lockfile
```

---

## 1.4 Inicio de trabajo

Antes de crear una rama, sincronizar siempre con el estado más reciente de `dev`.

```bash
git checkout dev
git pull --rebase origin dev
git checkout -b feat/TICKET-#123-your-feature
```

Durante el desarrollo, mantener la rama actualizada:

```bash
git fetch origin
git rebase origin/dev
```

---

# 2. Arquitectura

## Arquitectura limpia + módulos por dominio

El proyecto está organizado en módulos autónomos por funcionalidad.
Cada módulo controla su propio flujo vertical: desde el contrato de dominio hasta el controller HTTP.

La regla principal es simple: cada capa conoce solo a la capa que le corresponde.

---

## 2.1 Estructura de directorios

```bash
src/
└── modules/
    └── <feature-name>/
        ├── domain/
        ├── application/
        ├── infrastructure/
        └── presentation/
```

### Prohibido

No crear módulos directamente dentro de `src/` como `src/reports/`.
Todos los nuevos módulos deben vivir dentro de `src/modules/`.

---

## 2.2 Responsabilidad de cada capa

### `domain/` — núcleo puro

Contiene entidades, value objects y contratos de repositorio.
No debe tener dependencias externas.

**No permitido aquí:**

* Decoradores de NestJS
* Tipos de Drizzle
* Utilidades HTTP
* SDKs externos

---

### `application/` — orquestación del negocio

Contiene use cases, DTOs y validaciones de entrada.

Los use cases reciben interfaces por inyección de dependencias y nunca dependen de implementaciones concretas.

---

### `infrastructure/` — detalles técnicos

Implementa los contratos definidos en `domain/`.
Aquí van los repositorios con Drizzle, adaptadores, clientes externos y cualquier integración técnica.

Esta es la única capa que puede importar drivers, SDKs o adaptadores de infraestructura.

---

### `presentation/` — entrada al sistema

Contiene controllers HTTP, handlers, gateways y cualquier punto de entrada.

Su trabajo es:

* recibir la petición
* validar o delegar la validación
* invocar el use case
* devolver la respuesta

No debe contener lógica de negocio.

---

## 2.3 Flujo de dependencias

### Correcto

```text
Presentation → Application → Domain ← Infrastructure
```

### Prohibido

```text
Presentation → Infrastructure
Domain → Application
Domain → Infrastructure
```

---

## 2.4 Inyección de dependencias con tokens

Como las interfaces de TypeScript desaparecen en tiempo de ejecución, usamos tokens `Symbol` para conectar contratos con implementaciones dentro del contenedor de NestJS.

### Paso 1: definir contrato y token

```ts
// domain/product.repository.ts
import { Product } from './product.entity';

export interface ProductRepository {
  save(product: Product): Promise<void>;
  findById(id: string): Promise<Product | null>;
}

export const ProductRepository = Symbol('ProductRepository');
```

### Paso 2: inyectar el token en el use case

```ts
// application/use-cases/create-product.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { ProductRepository } from '../../domain/product.repository';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(ProductRepository)
    private readonly repository: ProductRepository,
  ) {}

  async execute(name: string, price: number): Promise<void> {
    const product = new Product(name, price);
    await this.repository.save(product);
  }
}
```

### Paso 3: registrar la implementación en el módulo

```ts
@Module({
  controllers: [ProductController],
  providers: [
    CreateProductUseCase,
    {
      provide: ProductRepository,
      useClass: DrizzleProductRepository,
    },
  ],
})
export class ProductsModule {}
```

Cambiar Drizzle por otra tecnología implica modificar únicamente `useClass` en el módulo.
No se toca el dominio ni los use cases.

---

# 3. Estándares de código

## 3.1 TypeScript en modo estricto

El proyecto usa `strict: true` en `tsconfig.json`.
Estas prácticas están bloqueadas:

| Violación                              | Impacto                         | Estado      |
| -------------------------------------- | ------------------------------- | ----------- |
| Usar `any` sin justificación           | Rompe la seguridad de tipos     | ❌ Bloqueado |
| Usar `@ts-ignore` sin explicación      | Oculta errores reales           | ❌ Bloqueado |
| Usar `@ts-expect-error` en producción  | Misma razón                     | ❌ Bloqueado |
| Desactivar checks estrictos localmente | Debilita el estándar del equipo | ❌ Bloqueado |

---

## 3.2 Validación de entrada con Zod

Toda entrada externa debe validarse con Zod:

* body
* query params
* variables de entorno

No confiar en TypeScript para validar datos en runtime.

```ts
import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(120),
  price: z.number().positive(),
  categoryId: z.string().uuid(),
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;
```

---

## 3.3 Validación global con Zod

En lugar de llamar validadores manuales en cada ruta, se usa un pipe global basado en `Reflector` y decoradores como `@UseZodSchema`.

```ts
@Post()
@UseZodSchema(CreateProductSchema)
async create(@Body() body: CreateProductDto) {
  return this.createProduct.execute(body);
}
```

La ventaja es que el controller se mantiene limpio, declarativo y fácil de leer.

---

## 3.4 Convención de nombres

| Elemento              | Convención        | Ejemplo                         |
| --------------------- | ----------------- | ------------------------------- |
| Archivos              | `kebab-case.ts`   | `create-user.use-case.ts`       |
| Clases / interfaces   | `PascalCase`      | `UserRepository`                |
| Variables / funciones | `camelCase`       | `findByEmail()`                 |
| Use cases             | `*.use-case.ts`   | `create-product.use-case.ts`    |
| Repositories          | `*.repository.ts` | `drizzle-product.repository.ts` |
| Controllers           | `*.controller.ts` | `product.controller.ts`         |
| DTOs de entrada       | `*.request.ts`    | `create-product.request.ts`     |
| DTOs de salida        | `*.response.ts`   | `product.response.ts`           |

---

## 3.5 Manejo de errores

El sistema utiliza un **modelo de errores unificado basado en `AppError`**, el cual actúa como un **contrato de salida del backend**.

Esto garantiza:

* respuestas consistentes
* desacoplamiento de NestJS
* control total del formato de errores

---

### 🚫 Regla principal

Nunca lanzar errores genéricos:

```ts
throw new Error('Something went wrong') // ❌ Prohibido
```

---

### ✅ Uso correcto: `AppError`

Todos los errores deben crearse mediante `AppError`, definido en:

```
src/shared/errors/app.error.ts
```

Ejemplo:

```ts
throw AppError.notFound({
  message: 'Product not found',
})

throw AppError.badRequest({
  message: 'Invalid input data',
  details: validationErrors,
})
```

---

### 🧠 ¿Por qué esto es importante?

`AppError`:

* No depende de NestJS
* No usa `HttpException`
* Es portable y testeable
* Representa el **contrato de error del sistema**

Esto permite mantener una arquitectura limpia:

| Capa                    | Responsabilidad                  |
| ----------------------- | -------------------------------- |
| domain / application    | Lanzar `AppError`                |
| infrastructure (NestJS) | Traducir a HTTP                  |
| cliente                 | Consumir un contrato consistente |

---

### 🔥 Traducción a HTTP (Exception Filter)

NestJS **no entiende `AppError` automáticamente**, por lo que se debe usar un **Exception Filter global** que lo transforme en respuesta HTTP.

```ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
} from '@nestjs/common';
import { Response } from 'express';
import { AppError } from '@/shared/errors/app.error';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    // Caso 1: AppError (contrato del sistema)
    if (AppError.isAppError(exception)) {
      return res
        .status(exception.statusCode)
        .json(exception.toJSON());
    }

    // Caso 2: error inesperado
    return res.status(500).json(
      AppError.internal({
        message: 'Unexpected error',
      }).toJSON(),
    );
  }
}
```

---

### 🌐 Registro global

```ts
app.useGlobalFilters(new GlobalExceptionFilter());
```

---

### 🔗 Integración con validación (Zod)

Toda validación debe lanzar `AppError`, no excepciones de Nest:

```ts
throw AppError.badRequest({
  message: 'Validation failed',
  details: error.errors,
})
```

---

### ⚠️ Antipatrones (prohibidos)

```ts
throw new BadRequestException() // ❌ acopla a Nest
throw new Error()               // ❌ rompe el contrato
```

---

### 📦 Beneficios del enfoque

* Contrato de error consistente en toda la API
* Independencia del framework
* Mejor testabilidad
* Fácil evolución (versionado, códigos, tracking)

---

### 🚀 Evolución futura

Este sistema permite escalar hacia:

* códigos de error versionados (`USER_NOT_FOUND`, `PAYMENT_FAILED`)
* integración con logging estructurado
* correlation IDs
* observabilidad avanzada

---

## 3.6 Logging

### Prohibido

* `console.log`
* `console.error`

### Requerido

Usar el `Logger` inyectado de NestJS o una solución equivalente como Pino.

### Formato

Logs estructurados en JSON para facilitar observabilidad y agregación en producción.

### Niveles recomendados

* `info`: eventos de negocio importantes
* `warn`: situaciones anómalas pero controladas
* `error`: fallos que requieren intervención humana

---

# 4. Base de datos y migraciones

## 4.1 Reglas de migración

1. Todo cambio de esquema debe registrarse en una migración.
2. Nunca modificar la base de datos manualmente.
3. Toda PR que altere el esquema debe incluir sus migraciones.
4. El Tech Lead debe aplicar migraciones pendientes antes del despliegue.

- Con Drizzle, el esquema y las migraciones deben mantenerse sincronizados y versionados en Git.
- Antes de subir una migración revisa el archivo SQL generado del ORM para evitar conflictos en producción.

---

## 4.2 Comandos comunes

```bash
# Generar una nueva migración a partir de cambios en el esquema
pnpm db:generate

# Aplicar migraciones pendientes
pnpm db:migrate
```

---

# 5. Estrategia de testing

No buscamos 100% de cobertura.
Buscamos confianza.

Los tests deben detectar regresiones y permitir refactorizaciones seguras.

| Capa              | Tipo de test       | Qué cubrir                                                        |
| ----------------- | ------------------ | ----------------------------------------------------------------- |
| `domain/`         | Unitario           | Invariantes, reglas de value objects, lógica de dominio           |
| `application/`    | Unitario con mocks | Flujos de use cases, errores de validación y negocio              |
| `infrastructure/` | Integración        | Consultas, comportamiento del ORM, restricciones de base de datos |
| `presentation/`   | E2E                | Flujos críticos de API: auth, CRUD principal, respuestas HTTP     |

---

## 5.1 Mock de repositorios

Como los use cases dependen de interfaces, las pruebas unitarias no necesitan base de datos real.

```ts
const mockRepo: ProductRepository = {
  save: vi.fn(),
  findById: vi.fn().mockResolvedValue(null),
};

const useCase = new CreateProductUseCase(mockRepo);
await useCase.execute('Widget', 29.99);

expect(mockRepo.save).toHaveBeenCalledOnce();
```

---

# 6. Proceso de Pull Request

## 6.1 Reglas de calidad

| Regla                  | Detalle                               |
| ---------------------- | ------------------------------------- |
| Alcance atómico        | Un PR = una tarea o ticket            |
| Rama destino           | Siempre `dev`                         |
| Sin auto-aprobación    | Al menos una aprobación del Tech Lead |
| Rebase antes de review | Resolver conflictos localmente        |
| Squash & Merge         | Un solo commit limpio al fusionar     |

Evitar mega-PRs.
Si un PR empieza a crecer demasiado, dividirlo.

---

## 6.2 Checklist previo

La CI valida estas condiciones automáticamente.
Antes de pedir revisión, verificar localmente:

* `pnpm lint`
* `pnpm lint:fix`
* `pnpm format`
* `pnpm lint:fix-all`
* `pnpm test`
* `pnpm build`
* migraciones incluidas si cambió el esquema
* sin `any` ni `@ts-ignore` injustificados


---

# 7. Convención de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/) para generar changelogs automáticos, versionado semántico y un historial legible.

## 7.1 Formato

```bash
<type>(<scope>): <short description in lowercase>
```

### Ejemplos

```bash
feat(auth): add google oauth provider
fix(api): handle null response on user fetch
refactor(db): optimize connection pool configuration
chore: update pnpm lockfile
test(products): add use case unit tests for create flow
docs(contributing): update pr checklist section
```

---

## 7.2 Tipos de commit

| Tipo       | Uso                                                             | Impacto semver |
| ---------- | --------------------------------------------------------------- | -------------- |
| `feat`     | Nueva funcionalidad visible para usuarios o consumidores de API | Minor          |
| `fix`      | Corrección de un error existente                                | Patch          |
| `refactor` | Reestructuración interna sin nuevas funcionalidades             | Ninguno        |
| `test`     | Cambios en pruebas solamente                                    | Ninguno        |
| `docs`     | Cambios en documentación                                        | Ninguno        |
| `chore`    | Tooling, dependencias, CI y mantenimiento                       | Ninguno        |
| `perf`     | Mejora de rendimiento sin cambio de comportamiento              | Patch          |
| `build!`   | Cambio rompedor                                                 | Major          |

### Breaking changes

Si el commit introduce un cambio incompatible con una API o contrato público, agregar `!` al tipo y el footer correspondiente:

```bash
feat(api)!: remove deprecated v1 endpoints

BREAKING CHANGE: v1 endpoints were removed in favor of the new v2 contract.
```

---

# 8. Principios de ingeniería

Estos principios no son teoría abstracta.
Son decisiones diarias que mantienen el código mantenible a medida que el equipo y el producto crecen.

| Principio                 | Aplicación en este proyecto                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| S — Single Responsibility | Un use case = una acción de negocio                                                          |
| O — Open/Closed           | Agregar comportamiento creando nuevas clases, no llenando de `if/else`                       |
| L — Liskov Substitution   | Cualquier implementación de un repositorio debe poder reemplazarse sin romper el caso de uso |
| I — Interface Segregation | Preferir interfaces pequeñas y específicas                                                   |
| D — Dependency Inversion  | Los casos de uso dependen de abstracciones, no de detalles técnicos                          |

---

# 9. Referencia rápida

## Comandos comunes

```bash
pnpm install
pnpm start:dev
pnpm build
pnpm lint
pnpm lint:fix
pnpm format
pnpm lint:fix-all
pnpm test
pnpm test:e2e
pnpm db:generate
pnpm db:migrate
```

---

## Checklist para una nueva funcionalidad

* [ ] Está dentro de `src/modules/<feature-name>/`
* [ ] `domain/` no tiene dependencias externas
* [ ] `application/` usa solo contratos de `domain/`
* [ ] `infrastructure/` implementa esos contratos
* [ ] `presentation/` delega en use cases
* [ ] Hay schema Zod para todas las entradas
* [ ] El token del repositorio está registrado en el módulo
* [ ] Existen tests unitarios de los use cases con mocks
* [ ] Se incluyeron migraciones si cambió el esquema

---

## Contribución

Si una propuesta se aparta de esta guía, abrir una discusión en el repositorio antes de abrir el PR.

---
