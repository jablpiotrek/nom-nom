import { eq, and } from 'drizzle-orm'
import { swipes } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')!
  verifyGameAuth(event, uuid)

  const nameIdRaw = getQuery(event).nameId
  const parent = getQuery(event).parent as string
  const nameId = Number(nameIdRaw)

  if (!Number.isFinite(nameId) || !parent || !['mommy', 'daddy'].includes(parent)) {
    throw createError({
      statusCode: 400,
      message: 'nameId and parent (mommy|daddy) are required'
    })
  }

  const parentRole = parent as 'mommy' | 'daddy'

  const removed = await db
    .delete(swipes)
    .where(
      and(
        eq(swipes.gameId, uuid),
        eq(swipes.nameId, nameId),
        eq(swipes.parent, parentRole)
      )
    )
    .returning({ id: swipes.id })

  if (removed.length === 0) {
    throw createError({ statusCode: 404, message: 'Swipe not found' })
  }

  return { ok: true }
})
