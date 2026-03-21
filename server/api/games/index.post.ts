import { eq } from 'drizzle-orm'
import { games } from '../../database/schema'

const ID_CHARS = 'ABCDEFGHJKMNPQRSTVWXYZ23456789'
const ID_LENGTH = 6

function generateGameId(): string {
  let id = ''
  for (let i = 0; i < ID_LENGTH; i++) {
    id += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]
  }
  return id
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { sex, pin } = body

  if (!sex || !['boy', 'girl'].includes(sex)) {
    throw createError({
      statusCode: 400,
      message: 'Sex must be "boy" or "girl"'
    })
  }
  if (!pin || String(pin).length < 4) {
    throw createError({
      statusCode: 400,
      message: 'PIN must be at least 4 characters'
    })
  }

  let id = generateGameId()
  while (db.select().from(games).where(eq(games.id, id)).get()) {
    id = generateGameId()
  }

  const pinHash = hashPin(String(pin))
  db.insert(games).values({ id, sex, pinHash }).run()
  setGameCookie(event, id)

  return { id }
})
