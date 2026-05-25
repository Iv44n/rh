import 'dotenv/config'

import z from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  TRUSTED_ORIGINS: z
    .string()
    .optional()
    .transform(value => {
      if (!value) return ['*']
      return value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
    }),
  DATABASE_URL: z.url(),
  AUTH_SECRET: z.string(),
  AUTH_URL: z.string()
})

export const env = envSchema.parse(process.env)
