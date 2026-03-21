import { createHmac, scryptSync, randomBytes, timingSafeEqual } from 'crypto'
import type { H3Event } from 'h3'

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(pin, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  const inputHash = scryptSync(pin, salt!, 64).toString('hex')
  const inputBuf = Buffer.from(inputHash, 'hex')
  const storedBuf = Buffer.from(hash!, 'hex')
  return timingSafeEqual(inputBuf, storedBuf)
}

export function createAuthToken(uuid: string): string {
  const secret = useRuntimeConfig().sessionSecret as string
  return createHmac('sha256', secret).update(uuid).digest('hex')
}

export function setGameCookie(event: H3Event, uuid: string) {
  const token = createAuthToken(uuid)
  setCookie(event, `nom_${uuid}`, token, {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax'
  })
}

export function verifyGameAuth(event: H3Event, uuid: string | undefined) {
  if (!uuid) throw createError({ statusCode: 400, message: 'Missing game ID' })
  const token = getCookie(event, `nom_${uuid}`)
  if (!token || token !== createAuthToken(uuid)) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
}
