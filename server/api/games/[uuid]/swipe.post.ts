import { eq, and } from 'drizzle-orm'
import { names, swipes } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')!
  const { nameId, parent, action } = await readBody(event)

  verifyGameAuth(event, uuid)

  if (!nameId || !parent || !action) {
    throw createError({
      statusCode: 400,
      message: 'nameId, parent, and action are required'
    })
  }
  if (!['mommy', 'daddy'].includes(parent)) {
    throw createError({
      statusCode: 400,
      message: 'parent must be "mommy" or "daddy"'
    })
  }
  if (!['like', 'dislike'].includes(action)) {
    throw createError({
      statusCode: 400,
      message: 'action must be "like" or "dislike"'
    })
  }

  await db
    .insert(swipes)
    .values({
      gameId: uuid,
      nameId,
      parent,
      action
    })
    .run()

  let matched = false
  let matchedName: string | null = null

  if (action === 'like') {
    const otherParent = parent === 'mommy' ? 'daddy' : 'mommy'
    const otherLike = await db
      .select()
      .from(swipes)
      .where(
        and(
          eq(swipes.gameId, uuid),
          eq(swipes.nameId, nameId),
          eq(swipes.parent, otherParent),
          eq(swipes.action, 'like')
        )
      )
      .get()

    if (otherLike) {
      matched = true
      const name = await db
        .select()
        .from(names)
        .where(eq(names.id, nameId))
        .get()
      matchedName = name?.name ?? null
    }
  }

  return { matched, matchedName }
})
