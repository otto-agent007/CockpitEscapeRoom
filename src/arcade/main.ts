import { loadMarsArcadeUnlock } from '../game/marsArcadeUnlock'
import '../../dev/arcade-shell.css'
import './player.css'

let started = false
let handleEscape = close
const parentOrigin = window.location.origin
const tellParent = (message: string) => { if (window.parent !== window) window.parent.postMessage(message, parentOrigin) }

async function start(): Promise<void> {
  if (started) return
  started = true
  window.removeEventListener('message', access)
  try {
    const [{ mountMarsArcade }, { ARCADE_ANCHOR_SOURCES }] = await Promise.all([
      import('../dev/arcadeHarness'),
      import('../dev/arcadeHarnessSprites'),
    ])
    document.querySelector<HTMLElement>('#arcade-locked')!.hidden = true
    document.querySelector<HTMLElement>('#arcade-game')!.hidden = false
    const session = await mountMarsArcade(true)
    const setup = document.querySelector<HTMLElement>('#arcade-setup')!
    const selectionTitle = document.querySelector<HTMLHeadingElement>('#selection-title')!
    const match = document.querySelector<HTMLElement>('#arcade-match')!
    const choices = document.querySelector<HTMLElement>('#arcade-choices')!
    const fighter = document.querySelector<HTMLSelectElement>('[data-fighter="0"]')!
    const options = document.querySelector<HTMLDetailsElement>('#match-options')!
    const startButton = document.querySelector<HTMLButtonElement>('#start-fight')!
    const cards = document.querySelector<HTMLElement>('#player-cards')!
    const menu = document.querySelector<HTMLDialogElement>('#arcade-menu')!
    const menuButton = document.querySelector<HTMLButtonElement>('#open-arcade-menu')!
    const closeMenu = () => {
      menu.close()
      menuButton.focus({ preventScroll: true })
    }
    menuButton.addEventListener('click', () => {
      session.setPaused(true)
      menu.showModal()
    })
    menu.addEventListener('cancel', event => { event.preventDefault(); closeMenu() })
    menu.querySelector('[data-menu-close]')!.addEventListener('click', closeMenu)
    document.querySelector('#resume-arcade')!.addEventListener('click', () => {
      menu.close()
      session.setPaused(false)
      document.querySelector<HTMLCanvasElement>('#stage')?.focus({ preventScroll: true })
    })
    handleEscape = () => { if (menu.open) closeMenu(); else close() }
    for (const option of fighter.options) {
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.player = option.value
      button.setAttribute('aria-label', option.textContent!)
      const image = document.createElement('img')
      image.src = ARCADE_ANCHOR_SOURCES[option.value as keyof typeof ARCADE_ANCHOR_SOURCES]
      image.alt = ''
      const name = document.createElement('span')
      name.textContent = option.textContent
      button.append(image, name)
      button.addEventListener('click', () => {
        fighter.value = option.value
        fighter.dispatchEvent(new Event('change'))
      })
      cards.append(button)
    }
    const updateSelection = () => {
      for (const button of cards.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.player === fighter.value))
    }
    fighter.addEventListener('change', updateSelection)
    updateSelection()
    startButton.addEventListener('click', () => {
      // Request from the user gesture; a denied request still leaves a full viewport arena.
      if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => {})
      options.append(choices)
      options.open = false
      setup.hidden = true
      match.hidden = false
      window.scrollTo(0, 0)
      session.startRound()
      document.querySelector<HTMLCanvasElement>('#stage')?.focus({ preventScroll: true })
    })
    document.querySelector('#change-selection')!.addEventListener('click', () => {
      session.setActive(false)
      menu.close()
      setup.insertBefore(choices, startButton)
      updateSelection()
      match.hidden = true
      setup.hidden = false
      window.scrollTo(0, 0)
      selectionTitle.focus({ preventScroll: true })
    })
    for (const details of document.querySelectorAll<HTMLDetailsElement>('.match-menu details')) {
      details.addEventListener('toggle', () => {
        if (!details.open && details.contains(document.activeElement)) details.querySelector('summary')?.focus()
      })
    }
    startButton.disabled = false
    selectionTitle.focus({ preventScroll: true })
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
document.querySelectorAll('[data-arcade-return]').forEach(button => button.addEventListener('click', close))
window.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); handleEscape() } })
window.addEventListener('message', access)
if (window.parent !== window) tellParent('mars-arcade-request-access')
else if (loadMarsArcadeUnlock()) document.querySelector<HTMLElement>('#arcade-locked p')!.textContent = 'This Easter egg opens from the game.'
