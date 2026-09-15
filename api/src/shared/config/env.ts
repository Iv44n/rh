import z from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  APP_URL: z.url().optional().default('*'),
  AUTH_SECRET: z.string(),
  AUTH_URL: z.url(),
  DATABASE_URL: z.url(),
  ENVIRONMENT: z.enum(['development', 'production']).default('development'),
  RESEND_API_KEY: z.string(),
  EMAIL_FROM: z.string()
})

export const env = envSchema.parse(process.env)
