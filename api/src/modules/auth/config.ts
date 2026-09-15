import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { betterAuth } from 'better-auth/minimal'
import { openAPI, organization } from 'better-auth/plugins'
import { env } from '#shared/config/env'
import { log } from '#shared/config/logger'
import { Id } from '#shared/core/base'
import { db } from '#shared/db/config'
import { resend } from '#shared/integrations/resend'

export const auth = betterAuth({
  secret: env.AUTH_SECRET,
  baseURL: env.AUTH_URL,
  trustedOrigins: [env.APP_URL],
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true
  }),
  advanced: {
    database: {
      joins: true,
      generateId: Id.generate
    }
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      log.logger.info(
        `[auth] Sending reset password email to ${user.email}: ${url}`
      )

      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: user.email,
        subject: 'Reset your password',
        html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`
      })
    }
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      log.logger.info(
        `[auth] Sending verification email to ${user.email} with URL: ${url}`
      )

      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: user.email,
        subject: 'Verify your email',
        html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`
      })
    }
  },
  plugins: [
    organization({
      requireEmailVerificationOnInvitation: true,
      sendInvitationEmail: async ({ id, email, organization, inviter }) => {
        const inviteLink = `${env.APP_URL}/accept-invitation/${id}`

        log.logger.info(
          `[organization] Invitación para ${email} a "${organization.name}" (invita ${inviter.user.email}): ${inviteLink}`
        )

        await resend.emails.send({
          from: email,
          to: email,
          subject: `Invitation to join ${organization.name}`,
          html: `<p>Click <a href="${inviteLink}">here</a> to accept the invitation to join ${organization.name}.</p>`
        })
      }
    }),
    openAPI()
  ]
})
