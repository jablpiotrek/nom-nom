import { eq, and, notInArray, sql } from 'drizzle-orm'
import { games, names, swipes } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')!
  const parent = getQuery(event).parent as string

  verifyGameAuth(event, uuid)

  if (!parent || !['mommy', 'daddy'].includes(parent)) {
    throw createError({
      statusCode: 400,
      message: 'parent must be "mommy" or "daddy"'
    })
  }

  const game = db.select().from(games).where(eq(games.id, uuid)).get()
  if (!game) {
    throw createError({ statusCode: 404, message: 'Game not found' })
  }

  const swipedNameIds = db
    .select({ nameId: swipes.nameId })
    .from(swipes)
    .where(and(eq(swipes.gameId, uuid), eq(swipes.parent, parent)))
    .all()
    .map(s => s.nameId)

  let candidate
  if (swipedNameIds.length > 0) {
    candidate = db
      .select()
      .from(names)
      .where(and(eq(names.sex, game.sex), notInArray(names.id, swipedNameIds)))
      .orderBy(sql`RANDOM()`)
      .limit(1)
      .get()
  } else {
    candidate = db
      .select()
      .from(names)
      .where(eq(names.sex, game.sex))
      .orderBy(sql`RANDOM()`)
      .limit(1)
      .get()
  }

  if (!candidate) {
    return { name: null, nameId: null, done: true }
  }

  return { name: candidate.name, nameId: candidate.id, done: false }
})
