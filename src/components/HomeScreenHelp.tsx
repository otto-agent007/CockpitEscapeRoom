import { useEffect, useRef } from 'react'

/**
 * Shown when the fullscreen button is tapped in a browser that cannot put a web page
 * fullscreen (every iPhone browser). Opening the game from a Home Screen icon runs it with
 * no browser bars, which is as close to fullscreen as iPhone allows for a web page.
 */
export function HomeScreenHelp({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { closeRef.current?.focus() }, [])

  return (
    <div className="home-screen-help-backdrop" onClick={onClose}>
      <section
        className="home-screen-help"
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-screen-help-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            onClose()
          }
          // One control: keep focus on it.
          if (event.key === 'Tab') {
            event.preventDefault()
            closeRef.current?.focus()
          }
        }}
      >
        <h2 id="home-screen-help-title">Full screen on iPhone</h2>
        <p>iPhone browsers can't hide their bars for a web page. Add the game to your Home Screen and it opens with no browser bars, like an app.</p>
        <ol>
          <li>Tap <strong>Share</strong>, the square with the arrow. In Brave it is in the menu.</li>
          <li>Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li>
          <li>Open <strong>Captain's Key</strong> from your Home Screen.</li>
        </ol>
        <p className="home-screen-help__note">The Home Screen copy keeps its own saved progress, so it starts fresh.</p>
        <button ref={closeRef} type="button" className="primary-button" onClick={onClose}>Got it</button>
      </section>
    </div>
  )
}
