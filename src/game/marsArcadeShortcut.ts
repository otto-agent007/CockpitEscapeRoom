export const MARS_ARCADE_HOLD_MS = 1_500
const LETTERS = new Set(['t', 'm', 'b'])

/** DOM-independent continuous hold; repeats cannot extend it or retrigger it. */
export function createMarsArcadeShortcut(activate: () => void) {
  const held = new Set<string>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let fired = false
  const cancel = () => { clearTimeout(timer); timer = undefined }
  return {
    down(key: string): boolean {
      const letter = key.toLowerCase()
      if (!LETTERS.has(letter)) return false
      held.add(letter)
      if (held.size === LETTERS.size && timer === undefined && !fired) {
        timer = setTimeout(() => { timer = undefined; fired = true; activate() }, MARS_ARCADE_HOLD_MS)
      }
      return held.size === LETTERS.size
    },
    up(key: string): void {
      held.delete(key.toLowerCase())
      if (held.size < LETTERS.size) cancel()
      if (held.size === 0) fired = false
    },
    reset(): void { cancel(); held.clear(); fired = false },
  }
}
