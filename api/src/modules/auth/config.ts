import { env } from '@shared/config/env'
import { Id } from '@shared/core/base'
import { db } from '@shared/db/config'
import { members, sessions } from '@shared/db/schemas'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { betterAuth } from 'better-auth/minimal'
import { organization } from 'better-auth/plugins'
import { and, desc, eq, isNotNull } from 'drizzle-orm'

/**
 * Resuelve la organización que debe quedar activa cuando se crea una nueva
 * sesión, de modo que la organización activa persista entre sesiones.
 *
 * - Restaura la última organización activa conocida del usuario (si sigue
 *   siendo miembro de ella).
 * - Si no hay historial pero el usuario pertenece a una sola organización,
 *   la activa automáticamente.
 * - En cualquier otro caso devuelve `null` para que el usuario pase por el
 *   onboarding (sin organizaciones) o el selector (varias sin activa).
 */
async function resolveInitialActiveOrganization(
  userId: string
): Promise<string | null> {
  const memberships = await db
    .select({ organizationId: members.organizationId })
    .from(members)
    .where(eq(members.userId, userId))

  if (memberships.length === 0) {
    return null
  }

  const membershipIds = new Set(memberships.map(m => m.organizationId))

  const [lastActive] = await db
    .select({ activeOrganizationId: sessions.activeOrganizationId })
    .from(sessions)
    .where(
      and(eq(sessions.userId, userId), isNotNull(sessions.activeOrganizationId))
    )
    .orderBy(desc(sessions.createdAt))
    .limit(1)

  if (
    lastActive?.activeOrganizationId &&
    membershipIds.has(lastActive.activeOrganizationId)
  ) {
    return lastActive.activeOrganizationId
  }

  if (memberships.length === 1) {
    return memberships[0].organizationId
  }

  return null
}

export const auth = betterAuth({
  secret: env.AUTH_SECRET,
  baseUrl: env.AUTH_URL,
  trustedOrigins: env.TRUSTED_ORIGINS,
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true
  }),
  experimental: {
    joins: true
  },
  emailAndPassword: {
    enabled: true
  },
  advanced: {
    database: {
      generateId: Id.generate
    }
  },
  databaseHooks: {
    session: {
      create: {
        before: async session => {
          const activeOrganizationId = await resolveInitialActiveOrganization(
            session.userId
          )

          return {
            data: {
              ...session,
              activeOrganizationId
            }
          }
        }
      }
    }
  },
  plugins: [
    organization({
      // La app usa email/contraseña sin flujo de verificación de email, por lo
      // que `emailVerified` es siempre `false`. Better Auth exige email
      // verificado por defecto para aceptar/rechazar/consultar invitaciones y
      // para `list-user-invitations`; sin esto esas operaciones devolverían
      // 403. Las invitaciones se entregan por enlace, que ya prueba propiedad.
      requireEmailVerificationOnInvitation: false,
      /**
       * Sin proveedor de email configurado: registramos el enlace de
       * aceptación en el log del servidor para poder probar el flujo en
       * desarrollo. Sustituir por un envío real (Resend, SES, etc.).
       */
      sendInvitationEmail: async data => {
        const webBaseUrl =
          env.TRUSTED_ORIGINS.find(origin => origin !== '*') ?? env.AUTH_URL
        const inviteLink = `${webBaseUrl}/accept-invitation/${data.id}`

        console.info(
          `[organization] Invitación para ${data.email} a "${data.organization.name}" (invita ${data.inviter.user.email}): ${inviteLink}`
        )
      }
    })
  ]
})
