process.loadEnvFile()

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
    })
})

export const env = envSchema.parse(process.env)
