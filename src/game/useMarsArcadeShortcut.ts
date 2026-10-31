import { useEffect } from 'react'
import { createMarsArcadeShortcut } from './marsArcadeShortcut'

export function useMarsArcadeShortcut(enabled: boolean, onOpen: () => void): void {
  useEffect(() => {
    if (!enabled) return
    const shortcut = createMarsArcadeShortcut(onOpen)
    const editing = (target: EventTarget | null) => target instanceof HTMLElement
      && (target.isContentEditable || !!target.closest('input, textarea, select, [contenteditable="true"]'))
    const down = (event: KeyboardEvent) => {
      const target = event.target
      if (event.altKey || event.ctrlKey || event.metaKey || editing(target)) {
        shortcut.reset()
        return
      }
      if (!event.repeat && shortcut.down(event.key)) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }
    const up = (event: KeyboardEvent) => shortcut.up(event.key)
    const reset = () => shortcut.reset()
    const visibility = () => { if (document.hidden) reset() }
    const focus = (event: FocusEvent) => { if (editing(event.target)) reset() }
    window.addEventListener('keydown', down, true)
    window.addEventListener('keyup', up, true)
    window.addEventListener('blur', reset)
    document.addEventListener('visibilitychange', visibility)
    document.addEventListener('focusin', focus)
    return () => {
      reset()
      window.removeEventListener('keydown', down, true)
      window.removeEventListener('keyup', up, true)
      window.removeEventListener('blur', reset)
      document.removeEventListener('visibilitychange', visibility)
      document.removeEventListener('focusin', focus)
    }
  }, [enabled, onOpen])
}
