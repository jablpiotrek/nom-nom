export default defineNuxtRouteMiddleware((to) => {
  const uuid = to.params.uuid as string
  if (!uuid) return

  const cookie = useCookie(`nom_${uuid}`)
  if (!cookie.value) {
    return navigateTo(`/${uuid}/auth`)
  }
})
