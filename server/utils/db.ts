import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../database/schema'

function getTursoOrThrow() {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  if (!url) {
    throw new Error(
      'TURSO_DATABASE_URL is not set. Add your Turso database URL to .env (see .env.example).'
    )
  }
  if (authToken === undefined || authToken === null) {
    throw new Error(
      'TURSO_AUTH_TOKEN is not set. Add your Turso token to .env (see .env.example).'
    )
  }
  return { url, authToken }
}

export const db = drizzle(
  createClient(getTursoOrThrow()),
  { schema }
)
