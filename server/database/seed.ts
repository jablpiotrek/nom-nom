import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { names } from '../database/schema'
import boysData from './seed/boys.json'
import girlsData from './seed/girls.json'

const sqlite = new Database('sqlite.db')
sqlite.pragma('journal_mode = WAL')
const db = drizzle(sqlite)

const boyRows = boysData.map(name => ({ name, sex: 'boy' as const }))
const girlRows = girlsData.map(name => ({ name, sex: 'girl' as const }))

db.insert(names)
  .values([...boyRows, ...girlRows])
  .onConflictDoNothing()
  .run()

console.log(
  `Seeded ${boyRows.length} boy names and ${girlRows.length} girl names.`
)
sqlite.close()
