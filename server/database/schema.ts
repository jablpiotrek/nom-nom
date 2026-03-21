import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core'

export const games = sqliteTable('games', {
  id: text('id').primaryKey(),
  sex: text('sex', { enum: ['boy', 'girl'] }).notNull(),
  pinHash: text('pin_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
})

export const names = sqliteTable('names', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  sex: text('sex', { enum: ['boy', 'girl'] }).notNull()
})

export const swipes = sqliteTable(
  'swipes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    gameId: text('game_id')
      .notNull()
      .references(() => games.id),
    nameId: integer('name_id')
      .notNull()
      .references(() => names.id),
    parent: text('parent', { enum: ['mommy', 'daddy'] }).notNull(),
    action: text('action', { enum: ['like', 'dislike'] }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date())
  },
  table => [
    unique('unique_swipe').on(table.gameId, table.nameId, table.parent)
  ]
)
