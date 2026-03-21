import { eq, and, sql } from 'drizzle-orm'
import { names, swipes } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')!

  verifyGameAuth(event, uuid)

  const matches = await db
    .select({
      nameId: names.id,
      name: names.name
    })
    .from(names)
    .innerJoin(
      swipes,
      and(
        eq(swipes.nameId, names.id),
        eq(swipes.gameId, uuid),
        eq(swipes.action, 'like')
      )
    )
    .groupBy(names.id)
    .having(sql`count(distinct ${swipes.parent}) = 2`)
    .all()

  return { matches }
})
