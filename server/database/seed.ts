import 'dotenv/config'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { names } from './schema'
import boysData from './seed/boys.json'
import girlsData from './seed/girls.json'

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  if (!url || authToken === undefined || authToken === null) {
    console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env')
    process.exit(1)
  }

  const db = drizzle(createClient({ url, authToken }))

  const boyRows = boysData.map(name => ({ name, sex: 'boy' as const }))
  const girlRows = girlsData.map(name => ({ name, sex: 'girl' as const }))

  await db.insert(names).values([...boyRows, ...girlRows]).run()

  console.log(
    `Seeded ${boyRows.length} boy names and ${girlRows.length} girl names.`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
