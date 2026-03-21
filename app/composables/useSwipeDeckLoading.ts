/**
 * Shared while the swipe deck is fetching — game layout hides the role subtitle.
 */
export function useSwipeDeckLoading() {
  return useState('swipe-deck-loading', () => false)
}
