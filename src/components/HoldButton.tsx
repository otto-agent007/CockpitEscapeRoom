import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

interface HoldButtonProps {
  children: ReactNode
  className: string
  label?: string
  control: string
  onHold: (pressed: boolean) => void
  disabled?: boolean
}

/** Native keyboard and independent captured touch holds, without touch stealing focus. */
export function HoldButton({ children, className, label, control, onHold, disabled = false }: HoldButtonProps) {
  const pointers = useRef(new Set<number>())
  const keyboardHeld = useRef(false)
  const onHoldRef = useRef(onHold)
  const [held, setHeld] = useState(false)
  useLayoutEffect(() => { onHoldRef.current = onHold }, [onHold])

  const update = () => {
    const pressed = keyboardHeld.current || pointers.current.size > 0
    setHeld(pressed)
    onHoldRef.current(pressed)
  }
  const releasePointer = (id: number) => { pointers.current.delete(id); update() }

  useEffect(() => {
    const pointerSet = pointers.current
    const release = () => {
      pointers.current.clear()
      keyboardHeld.current = false
      setHeld(false)
      onHoldRef.current(false)
    }
    const visibility = () => { if (document.hidden) release() }
    window.addEventListener('blur', release)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      window.removeEventListener('blur', release)
      document.removeEventListener('visibilitychange', visibility)
      if (pointerSet.size || keyboardHeld.current) onHoldRef.current(false)
    }
  }, [])

  return (
    <button type="button" className={className} aria-label={label} data-hold={control} data-held={held} disabled={disabled}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        if (event.pointerType === 'touch') event.preventDefault()
        pointers.current.add(event.pointerId)
        try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* Native holds still work without capture. */ }
        update()
      }}
      onPointerUp={(event) => releasePointer(event.pointerId)}
      onPointerCancel={(event) => releasePointer(event.pointerId)}
      onLostPointerCapture={(event) => releasePointer(event.pointerId)}
      onPointerLeave={(event) => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) releasePointer(event.pointerId) }}
      onKeyDown={(event) => {
        if (event.key !== ' ' && event.key !== 'Enter') return
        event.preventDefault(); keyboardHeld.current = true; update()
      }}
      onKeyUp={(event) => {
        if (event.key !== ' ' && event.key !== 'Enter') return
        event.preventDefault(); keyboardHeld.current = false; update()
      }}
      onBlur={() => { keyboardHeld.current = false; update() }}
      onContextMenu={(event) => event.preventDefault()}
    >{children}</button>
  )
}
