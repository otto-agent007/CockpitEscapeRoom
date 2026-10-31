import { loadMarsArcadeUnlock } from '../game/marsArcadeUnlock'
import '../../dev/arcade-shell.css'
import './player.css'

let started = false
const parentOrigin = window.location.origin
const tellParent = (message: string) => { if (window.parent !== window) window.parent.postMessage(message, parentOrigin) }

async function start(): Promise<void> {
  if (started) return
  started = true
  window.removeEventListener('message', access)
  try {
    const { mountMarsArcade } = await import('../dev/arcadeHarness')
    document.querySelector<HTMLElement>('#arcade-locked')!.hidden = true
    document.querySelector<HTMLElement>('#arcade-game')!.hidden = false
    await mountMarsArcade(true)
    document.querySelector<HTMLCanvasElement>('#stage')?.focus()
    tellParent('mars-arcade-ready')
  } catch {
    document.querySelector<HTMLElement>('#arcade-game')!.hidden = true
    const locked = document.querySelector<HTMLElement>('#arcade-locked')!
    locked.hidden = false
    locked.querySelector('p')!.textContent = 'The arcade could not open. Return to your game and try again.'
    tellParent('mars-arcade-error')
  }
}

function access(event: MessageEvent): void {
  if (window.parent === window || event.origin !== parentOrigin || event.source !== window.parent || event.data !== 'mars-arcade-access-granted') return
  void start()
}
function close(): void {
  if (window.parent === window) window.location.assign(import.meta.env.BASE_URL)
  else tellParent('mars-arcade-close')
}
document.querySelector('#arcade-return')?.addEventListener('click', close)
window.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); close() } })
window.addEventListener('message', access)
if (window.parent !== window) tellParent('mars-arcade-request-access')
else if (loadMarsArcadeUnlock()) document.querySelector<HTMLElement>('#arcade-locked p')!.textContent = 'This Easter egg opens from the game.'
