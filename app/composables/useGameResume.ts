import {
  clearResume,
  readResume,
  setResumeGameAndRole,
  setResumeGameId,
  setResumeRole,
  syncResumeGameIdIfChanged
} from '~/utils/gameResume'

export function useGameResume() {
  function clearAuthCookie(uuid: string) {
    const cookie = useCookie(`nom_${uuid}`, { path: '/' })
    cookie.value = null
  }

  return {
    readResume,
    setResumeGameId,
    setResumeRole,
    setResumeGameAndRole,
    clearResume,
    syncResumeGameIdIfChanged,
    clearAuthCookie
  }
}
