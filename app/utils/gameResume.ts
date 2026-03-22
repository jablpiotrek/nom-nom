const GAME_ID_KEY = 'nom_game_id'
const GAME_ROLE_KEY = 'nom_game_role'

const GAME_ID_RE = /^[A-Z0-9]{6}$/

export type GameRole = 'mommy' | 'daddy'

export function isValidStoredGameId(id: string): boolean {
  return GAME_ID_RE.test(id.trim().toUpperCase())
}

export type GameResumeState = { gameId: string, role?: GameRole }

export function readResume(): GameResumeState | null {
  if (typeof localStorage === 'undefined') return null
  const id = localStorage.getItem(GAME_ID_KEY)?.trim()
  if (!id) return null
  const gameId = id.toUpperCase()
  if (!isValidStoredGameId(gameId)) return null
  const roleRaw = localStorage.getItem(GAME_ROLE_KEY)?.trim()
  const role = roleRaw === 'mommy' || roleRaw === 'daddy' ? roleRaw : undefined
  return role ? { gameId, role } : { gameId }
}

export function setResumeGameId(gameId: string) {
  if (typeof localStorage === 'undefined') return
  const u = gameId.trim().toUpperCase()
  if (!isValidStoredGameId(u)) return
  localStorage.setItem(GAME_ID_KEY, u)
  localStorage.removeItem(GAME_ROLE_KEY)
}

export function setResumeRole(role: GameRole) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(GAME_ROLE_KEY, role)
}

export function setResumeGameAndRole(gameId: string, role: GameRole) {
  if (typeof localStorage === 'undefined') return
  const u = gameId.trim().toUpperCase()
  if (!isValidStoredGameId(u)) return
  localStorage.setItem(GAME_ID_KEY, u)
  localStorage.setItem(GAME_ROLE_KEY, role)
}

export function clearResume() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(GAME_ID_KEY)
  localStorage.removeItem(GAME_ROLE_KEY)
}

/** If URL game differs from stored id, reset stored id and clear role. */
export function syncResumeGameIdIfChanged(gameId: string) {
  const u = gameId.trim().toUpperCase()
  if (!isValidStoredGameId(u)) return
  const stored = typeof localStorage === 'undefined'
    ? null
    : localStorage.getItem(GAME_ID_KEY)?.trim().toUpperCase()
  if (stored === u) return
  setResumeGameId(u)
}
