import { eq, and, notInArray, sql } from 'drizzle-orm'
import { games, names, swipes } from '../../../database/schema'

const MAX_BATCH = 15

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')!
  const parent = getQuery(event).parent as string
  const batchRaw = getQuery(event).batch
  const batchSize = Math.min(MAX_BATCH, Math.max(1, Number(batchRaw) || 1))

  verifyGameAuth(event, uuid)

  if (!parent || !['mommy', 'daddy'].includes(parent)) {
    throw createError({
      statusCode: 400,
      message: 'parent must be "mommy" or "daddy"'
    })
  }

  const game = await db.select().from(games).where(eq(games.id, uuid)).get()
  if (!game) {
    throw createError({ statusCode: 404, message: 'Game not found' })
  }

  const parentRole = parent as 'mommy' | 'daddy'

  const swipedRows = await db
    .select({ nameId: swipes.nameId })
    .from(swipes)
    .where(and(eq(swipes.gameId, uuid), eq(swipes.parent, parentRole)))
    .all()
  const swipedNameIds = swipedRows.map(s => s.nameId)

  const excludeRaw = getQuery(event).exclude
  const excludeExtra: number[] = []
  if (excludeRaw !== undefined && excludeRaw !== null && excludeRaw !== '') {
    for (const part of String(excludeRaw).split(',')) {
      const n = Number(part.trim())
      if (Number.isFinite(n)) {
        excludeExtra.push(n)
      }
    }
  }
  const blockedIds = [...new Set([...swipedNameIds, ...excludeExtra])]

  const nameFilter
    = blockedIds.length > 0
      ? and(eq(names.sex, game.sex), notInArray(names.id, blockedIds))
      : eq(names.sex, game.sex)

  if (batchSize === 1) {
    const candidate = await db
      .select()
      .from(names)
      .where(nameFilter)
      .orderBy(sql`RANDOM()`)
      .limit(1)
      .get()

    if (!candidate) {
      return { name: null, nameId: null, done: true }
    }

    return { name: candidate.name, nameId: candidate.id, done: false }
  }

  const rows = await db
    .select()
    .from(names)
    .where(nameFilter)
    .orderBy(sql`RANDOM()`)
    .limit(batchSize)
    .all()

  if (!rows.length) {
    return { items: [], done: true }
  }

  return {
    items: rows.map(r => ({ nameId: r.id, name: r.name })),
    done: false
  }
})
