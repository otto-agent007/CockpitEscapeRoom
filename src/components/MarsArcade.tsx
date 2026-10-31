import { useEffect, useRef, useState } from 'react'

/** A separate document owns the arcade loop; leaving destroys its inputs/audio/timers. */
export function MarsArcade({ onClose }: { onClose: () => void }) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    closeRef.current?.focus()
    // iframe onError cannot reliably detect failed documents or initial script loads.
    const timeout = window.setTimeout(() => setStatus('error'), 15_000)
    const message = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return
      switch (event.data) {
        case 'mars-arcade-request-access':
          frameRef.current?.contentWindow?.postMessage('mars-arcade-access-granted', window.location.origin)
          break
        case 'mars-arcade-ready': window.clearTimeout(timeout); setStatus('ready'); frameRef.current?.contentWindow?.focus(); break
        case 'mars-arcade-error': window.clearTimeout(timeout); setStatus('error'); break
        case 'mars-arcade-close': onClose(); break
      }
    }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('message', message)
    window.addEventListener('keydown', escape)
    return () => { window.clearTimeout(timeout); window.removeEventListener('message', message); window.removeEventListener('keydown', escape) }
  }, [onClose, revision])
  return (
    <main className="mars-arcade-view" aria-label="Mars arcade">
      <div className="mars-arcade-bar">
        <strong>CockpitEscapeRoom · Mars arcade</strong>
        <button ref={closeRef} type="button" className="secondary-button" onClick={onClose}>Return to game</button>
      </div>
      {status === 'loading' && <p role="status">Opening the Mars arcade…</p>}
      {status === 'error' && <div role="alert"><p>The arcade could not open. Your game progress is safe.</p><button type="button" className="secondary-button" onClick={() => { setStatus('loading'); setRevision(value => value + 1) }}>Retry arcade</button></div>}
      <iframe key={revision} ref={frameRef} title="Mars arcade" src={`${import.meta.env.BASE_URL}mars-arcade.html`} onLoad={() => frameRef.current?.contentWindow?.postMessage('mars-arcade-access-granted', window.location.origin)} onError={() => setStatus('error')} />
    </main>
  )
}
