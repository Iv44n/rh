import { env } from '@shared/config/env'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schemas'

const client = new Pool({ connectionString: env.DATABASE_URL })

export const db = drizzle({ client, schema })
