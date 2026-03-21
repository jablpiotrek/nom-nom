import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url) {
  throw new Error(
    'TURSO_DATABASE_URL is missing. Set it in .env before running drizzle-kit.'
  )
}
if (authToken === undefined || authToken === null) {
  throw new Error(
    'TURSO_AUTH_TOKEN is missing. Set it in .env before running drizzle-kit.'
  )
}

export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dialect: 'turso',
  dbCredentials: {
    url,
    authToken
  }
})
