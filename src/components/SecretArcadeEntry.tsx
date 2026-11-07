import { useCallback, useEffect, useMemo, useRef, type PointerEvent, type ReactNode } from 'react'
import { createSecretArcadeHold } from '../game/secretArcadeHold'
import './SecretArcadeEntry.css'

/** Rendered only by the completed tribute with an already-earned open callback. */
export function SecretArcadeEntry({ onOpen, children }: { onOpen: () => void; children: ReactNode }) {
  const button = useRef<HTMLButtonElement>(null)
  const pointer = useRef<number | null>(null)
  const hold = useMemo(() => createSecretArcadeHold(onOpen), [onOpen])

  const cancel = useCallback(() => {
    hold.cancel()
    const id = pointer.current
    pointer.current = null
    if (id !== null && button.current?.hasPointerCapture(id)) {
      try { button.current.releasePointerCapture(id) } catch { /* Capture may already be released. */ }
    }
  }, [hold])

  useEffect(() => {
    const visibility = () => { if (document.hidden) cancel() }
    window.addEventListener('blur', cancel)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      cancel()
      window.removeEventListener('blur', cancel)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [cancel])

  const release = (event: PointerEvent<HTMLButtonElement>) => {
    if (pointer.current === event.pointerId) cancel()
  }

  return (
    <button
      ref={button}
      type="button"
      className="secret-arcade-entry"
      onPointerDown={event => {
        if (event.button !== 0 || pointer.current !== null) return
        event.preventDefault()
        pointer.current = event.pointerId
        try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* Release/leave still cancels. */ }
        hold.start()
      }}
      onPointerMove={event => {
        if (pointer.current !== event.pointerId) return
        const box = event.currentTarget.getBoundingClientRect()
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) cancel()
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      onLostPointerCapture={release}
      onBlur={cancel}
      onContextMenu={event => event.preventDefault()}
      onClick={event => {
        // Native keyboard and assistive activation remain available without a touch hold.
        if (event.detail === 0) {
          cancel()
          onOpen()
        }
      }}
    >
      {children}
    </button>
  )
}
