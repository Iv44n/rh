import { logger } from '@arcton/logger'
import { env } from './env'

export const log = logger({
  pretty: env.ENVIRONMENT === 'development'
})
