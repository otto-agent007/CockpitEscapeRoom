export const SECRET_ARCADE_HOLD_MS = 3000

/** One earned activation per continuous hold; interrupted time never carries over. */
export function createSecretArcadeHold(open: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let fired = false
  return {
    start() {
      if (timer !== undefined || fired) return
      timer = setTimeout(() => {
        timer = undefined
        fired = true
        open()
      }, SECRET_ARCADE_HOLD_MS)
    },
    cancel() {
      clearTimeout(timer)
      timer = undefined
      fired = false
    },
  }
}
