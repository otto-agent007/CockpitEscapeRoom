import { useSyncExternalStore } from 'react'

const compactQuery = '(max-width: 900px), (pointer: coarse) and (max-width: 1200px)'
const subscribe = (notify: () => void) => {
  const query = window.matchMedia(compactQuery)
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}
const snapshot = () => window.matchMedia(compactQuery).matches

/** Presentation only: changing orientation never changes earned game progress. */
export function useCompactCockpit() {
  return useSyncExternalStore(subscribe, snapshot, () => false)
}
