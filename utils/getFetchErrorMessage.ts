export function getFetchErrorMessage(error: unknown): string | undefined {
  if (error === null || typeof error !== 'object') {
    return undefined
  }
  const data = (error as { data?: unknown }).data
  if (data === null || typeof data !== 'object') {
    return undefined
  }
  const message = (data as { message?: unknown }).message
  return typeof message === 'string' ? message : undefined
}
