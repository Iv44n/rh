/** biome-ignore-all lint/style/noNonNullAssertion: <Drizzle requires a database URL> */
import { defineConfig } from 'drizzle-kit'

process.loadEnvFile()

export default defineConfig({
  out: './drizzle',
  schema: './src/shared/db/schemas.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
})
