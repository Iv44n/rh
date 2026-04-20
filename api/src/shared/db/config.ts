import { env } from '@shared/config/env'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const client = new Pool({ connectionString: env.DATABASE_URL })

export const db = drizzle({ client })
