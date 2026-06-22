import { env } from '@shared/config/env'
import { Id } from '@shared/core/base'
import { db } from '@shared/db/config'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { betterAuth } from 'better-auth/minimal'

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
  }
})
