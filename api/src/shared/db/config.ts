import { SQL } from 'bun'
import { drizzle } from 'drizzle-orm/bun-sql'
import { env } from '#shared/config/env'
import * as schema from './schemas'

export const db = drizzle({
  client: new SQL(env.DATABASE_URL),
  relations: schema.authRelations
})
