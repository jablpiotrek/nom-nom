import { readResume } from '~/utils/gameResume'

export default defineNuxtRouteMiddleware((to) => {
  if (to.path !== '/') return

  const resume = readResume()
  if (!resume) return

  if (resume.role) {
    return navigateTo(`/${resume.gameId}/${resume.role}`, { replace: true })
  }
  return navigateTo(`/${resume.gameId}`, { replace: true })
})
