import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useCompactCockpit } from './useCompactCockpit'

interface CockpitHelpProps {
  children: ReactNode
  onOpen?: () => void
}

function CompactHelp({ children, onOpen }: CockpitHelpProps) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const id = useId()
  const close = () => {
    dialogRef.current?.close()
    setOpen(false)
    triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    dialog?.showModal()
    closeRef.current?.focus()
    return () => { if (dialog?.open) dialog.close() }
  }, [open])

  return (
    <div className="cockpit-touch-help">
      <button ref={triggerRef} type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined}
        onClick={() => { setOpen(true); onOpen?.() }}>Help</button>
      {open && createPortal(
        <dialog id={id} ref={dialogRef} className="cockpit-touch-help__content" aria-label="Cockpit help"
          onKeyDown={(event) => {
            if (event.key !== 'Tab') return
            const targets = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')]
              .filter((element) => element.getClientRects().length > 0)
            const first = targets[0], last = targets.at(-1)
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
            if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
          }}
          onCancel={(event) => { event.preventDefault(); close() }}>
          <button ref={closeRef} type="button" className="cockpit-touch-help__close" onClick={close}>Close help</button>
          {children}
        </dialog>, document.body,
      )}
    </div>
  )
}

/** Unmount compact Help at the breakpoint so an old dialog cannot reopen on rotation. */
export function CockpitHelp(props: CockpitHelpProps) {
  return useCompactCockpit() ? <CompactHelp {...props} /> : <>{props.children}</>
}
