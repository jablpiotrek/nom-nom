import { eq } from 'drizzle-orm'
import { games } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')!
  const { pin } = await readBody(event)

  if (!pin) {
    throw createError({ statusCode: 400, message: 'PIN is required' })
  }

  const game = await db.select().from(games).where(eq(games.id, uuid)).get()
  if (!game) {
    throw createError({ statusCode: 404, message: 'Game not found' })
  }

  if (!verifyPin(String(pin), game.pinHash)) {
    throw createError({ statusCode: 401, message: 'Invalid PIN' })
  }

  setGameCookie(event, uuid)

  return { ok: true }
})
