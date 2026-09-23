/**
 * Mars arcade character gym — a per-frame bounds authoring tool.
 *
 * Dev-only, served at /dev/gym.html. Not an entry in the production build and
 * nothing in the application imports it.
 *
 * The problem it solves: `reach` in `marsArcadeFighters.ts` is a bare number with no
 * tie to the drawing, so the arm and the hitbox can disagree forever and no test
 * notices. Boxes have to be authored against the art, frame by frame, and the only
 * honest way to do that is to look at them on top of the sprite.
 *
 * Deliberately vanilla, like the box harness: no React, so there is no StrictMode
 * double-mount to reason about in a tool whose job is a stable canvas.
 */
import {
  MARS_ARCADE_BOUND_KINDS,
  MARS_ARCADE_BOUNDS_VERSION,
  MARS_ARCADE_CELL,
  marsArcadeBoundsIndex,
  marsArcadeBoundsKey,
  marsArcadeBoxToStage,
  parseMarsArcadeBounds,
  type MarsArcadeAnimationBounds,
  type MarsArcadeBoundKind,
  type MarsArcadeBox,
  type MarsArcadeFrameBounds,
  type MarsArcadeFramePhase,
} from '../game/marsArcadeBounds'
import rawBounds from '../game/marsArcadeBounds.json'
import { marsArcadeFighter, type MarsArcadeFighterId } from '../game/marsArcadeFighters'

const SCALE = 4
const PHASES: MarsArcadeFramePhase[] = ['startup', 'active', 'recovery', 'neutral']

/** Where each authored animation's frames actually live on disk. */
const FRAME_SOURCES: Record<string, string[]> = {
  'booster:jab': [
    '/art-source/arcade/booster/normalised-sleek-ready/anticipation/anticipation-00.png',
    '/art-source/arcade/booster/normalised-sleek-ready/jab/jab-00.png',
    '/art-source/arcade/booster/normalised-sleek-ready/recovery/recovery-00.png',
  ],
  'oracle:heavy': [
    '/art-source/arcade/oracle/normalised-heavy-ready/heavy-startup/heavy-startup-00.png',
    '/art-source/arcade/oracle/normalised-heavy-ready/heavy-active/heavy-active-00.png',
    '/art-source/arcade/oracle/normalised-heavy-ready/heavy-recovery/heavy-recovery-00.png',
  ],
  'booster:block': ['/art-source/arcade/booster/normalised-sleek-ready/block/block-00.png'],
  'oracle:block': ['/art-source/arcade/oracle/normalised-exchange-ready/block/block-00.png'],
}

const KIND_COLOURS: Record<MarsArcadeBoundKind, string> = {
  collision: '#4ac4ff',
  hit: '#56d63e',
  attack: '#e83232',
  guard: '#ffb238',
}

interface GymState {
  file: { version: number; animations: MarsArcadeAnimationBounds[] }
  key: string
  frame: number
  kind: MarsArcadeBoundKind
  playing: boolean
  speed: number
  showAll: boolean
  dirty: boolean
}

const images = new Map<string, HTMLImageElement>()

/**
 * Redraw hook, set once the gym is running.
 *
 * Without it the canvas paints whatever is decoded at the instant a frame button is
 * pressed, and a frame whose sprite has not arrived yet draws its boxes over an
 * empty cell — which looks exactly like a missing sprite and is the whole tool
 * silently lying about the art. Fixed timeouts after startup hid this for the first
 * frame only, because that was the one already in cache.
 */
let onImageReady: (() => void) | null = null

function loadImage(src: string): HTMLImageElement {
  const existing = images.get(src)
  if (existing) return existing
  const image = new Image()
  image.addEventListener('load', () => onImageReady?.())
  image.src = src
  images.set(src, image)
  return image
}

function entryOf(state: GymState): MarsArcadeAnimationBounds {
  const found = state.file.animations.find(
    (entry) => marsArcadeBoundsKey(entry.fighter, entry.animation) === state.key,
  )
  if (!found) throw new Error(`gym: no animation ${state.key}`)
  return found
}

function frameOf(state: GymState): MarsArcadeFrameBounds {
  const entry = entryOf(state)
  const frame = entry.frames[Math.min(state.frame, entry.frames.length - 1)]
  if (!frame) throw new Error(`gym: no frame ${state.frame} in ${state.key}`)
  return frame
}

function boxOf(state: GymState): MarsArcadeBox | undefined {
  return frameOf(state)[state.kind]
}

function setBox(state: GymState, box: MarsArcadeBox | undefined): void {
  const frame = frameOf(state)
  if (box) frame[state.kind] = box
  else delete frame[state.kind]
  state.dirty = true
}

function clampBox(box: MarsArcadeBox): MarsArcadeBox {
  const size = MARS_ARCADE_CELL.size
  const width = Math.max(1, Math.min(size, Math.round(box.width)))
  const height = Math.max(1, Math.min(size, Math.round(box.height)))
  return {
    width,
    height,
    x: Math.max(0, Math.min(size - width, Math.round(box.x))),
    y: Math.max(0, Math.min(size - height, Math.round(box.y))),
  }
}

function render(state: GymState, canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const size = MARS_ARCADE_CELL.size
  canvas.width = size * SCALE
  canvas.height = size * SCALE
  ctx.imageSmoothingEnabled = false
  // A mid-grey checkerboard, not the stage's near-black.
  //
  // The booster wears a black leather jacket. On the dark field this canvas started
  // with, his silhouette was invisible while the boxes floated over apparently empty
  // space — which defeats the only thing the gym is for. A checkerboard also shows
  // where the cell is transparent, which matters when judging whether a hurtbox is
  // hugging the drawing or a margin.
  const tile = 8 * SCALE
  for (let y = 0; y < canvas.height; y += tile) {
    for (let x = 0; x < canvas.width; x += tile) {
      ctx.fillStyle = ((x / tile) + (y / tile)) % 2 === 0 ? '#5d5d68' : '#4a4a55'
      ctx.fillRect(x, y, tile, tile)
    }
  }

  const sources = FRAME_SOURCES[state.key] ?? []
  const src = sources[Math.min(state.frame, sources.length - 1)]
  if (src) {
    const image = loadImage(src)
    if (image.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    }
  }

  // The contract baseline and pivot, always drawn. A box authored against a sprite
  // whose feet are not on the baseline is wrong in a way that is invisible without
  // the line to check it against.
  ctx.fillStyle = '#5a4a7a'
  ctx.fillRect(0, MARS_ARCADE_CELL.baselineRow * SCALE, canvas.width, 1)
  ctx.fillRect(MARS_ARCADE_CELL.centreColumn * SCALE, 0, 1, canvas.height)

  const frame = frameOf(state)
  for (const kind of MARS_ARCADE_BOUND_KINDS) {
    const box = frame[kind]
    if (!box) continue
    const selected = kind === state.kind
    if (!state.showAll && !selected) continue
    // Inactive frames render faint, active frames solid — the reference's own rule,
    // and the only way to see at a glance which frames a hitbox is live on.
    const live = kind !== 'attack' || frame.phase === 'active'
    ctx.globalAlpha = selected ? 1 : 0.45
    ctx.lineWidth = selected ? 2 : 1
    ctx.setLineDash(live ? [] : [4, 4])
    ctx.strokeStyle = KIND_COLOURS[kind]
    ctx.strokeRect(box.x * SCALE, box.y * SCALE, box.width * SCALE, box.height * SCALE)
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  }
}

function summary(state: GymState): string {
  const entry = entryOf(state)
  const frame = frameOf(state)
  const box = boxOf(state)
  const lines = [
    `${entry.fighter} · ${entry.animation}  frame ${state.frame + 1}/${entry.frames.length}  phase ${frame.phase}`,
  ]
  if (entry.moveId) {
    const content = marsArcadeFighter(entry.fighter)
    const move = (['light', 'heavy', 'special'] as const)
      .map((button) => content.moves[button])
      .find((candidate) => candidate.id === entry.moveId)
    if (move) {
      lines.push(`move ${move.id}  reach ${move.reach}  ${move.startupFrames}/${move.activeFrames}/${move.recoveryFrames}`)
      if (frame.attack) {
        const stage = marsArcadeBoxToStage(frame.attack, 0, 1)
        const delta = stage.maxX - move.reach
        lines.push(
          delta === 0
            ? `attack reaches ${stage.maxX} — matches reach`
            : `attack reaches ${stage.maxX} — ${delta > 0 ? '+' : ''}${delta} against reach ${move.reach}`,
        )
      }
    }
  }
  lines.push(box ? `${state.kind}: x ${box.x} y ${box.y} w ${box.width} h ${box.height}` : `${state.kind}: none`)
  return lines.join('\n')
}

export function startArcadeGym(root: HTMLElement): void {
  const parsed = parseMarsArcadeBounds(rawBounds)
  const state: GymState = {
    file: { version: parsed.version, animations: parsed.animations },
    key: marsArcadeBoundsKey('booster' as MarsArcadeFighterId, 'jab'),
    frame: 0,
    kind: 'attack',
    playing: false,
    speed: 1,
    showAll: true,
    dirty: false,
  }

  const canvas = root.querySelector<HTMLCanvasElement>('#gym-canvas')
  const info = root.querySelector<HTMLPreElement>('#gym-info')
  const status = root.querySelector<HTMLElement>('#gym-status')
  const frameBar = root.querySelector<HTMLElement>('#gym-frames')
  const animSelect = root.querySelector<HTMLSelectElement>('#gym-animation')
  const kindSelect = root.querySelector<HTMLSelectElement>('#gym-kind')
  const phaseSelect = root.querySelector<HTMLSelectElement>('#gym-phase')
  if (!canvas || !info || !status || !frameBar || !animSelect || !kindSelect || !phaseSelect) return

  const fields: Record<string, HTMLInputElement | null> = {
    x: root.querySelector('#gym-x'),
    y: root.querySelector('#gym-y'),
    width: root.querySelector('#gym-w'),
    height: root.querySelector('#gym-h'),
  }
  const activeToggle = root.querySelector<HTMLInputElement>('#gym-active')

  for (const entry of state.file.animations) {
    const option = document.createElement('option')
    option.value = marsArcadeBoundsKey(entry.fighter, entry.animation)
    option.textContent = `${entry.fighter} · ${entry.animation}`
    animSelect.append(option)
  }
  for (const kind of MARS_ARCADE_BOUND_KINDS) {
    const option = document.createElement('option')
    option.value = kind
    option.textContent = kind
    kindSelect.append(option)
  }
  for (const phase of PHASES) {
    const option = document.createElement('option')
    option.value = phase
    option.textContent = phase
    phaseSelect.append(option)
  }
  animSelect.value = state.key
  kindSelect.value = state.kind

  function syncFields(): void {
    const box = boxOf(state)
    fields.x!.value = String(box?.x ?? '')
    fields.y!.value = String(box?.y ?? '')
    fields.width!.value = String(box?.width ?? '')
    fields.height!.value = String(box?.height ?? '')
    if (activeToggle) activeToggle.checked = Boolean(box)
    phaseSelect!.value = frameOf(state).phase
  }

  function refresh(): void {
    const entry = entryOf(state)
    frameBar!.replaceChildren()
    entry.frames.forEach((frame, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = String(index + 1)
      button.setAttribute('aria-pressed', String(index === state.frame))
      if (frame.attack) button.dataset.hitbox = 'true'
      button.addEventListener('click', () => {
        state.frame = index
        refresh()
      })
      frameBar!.append(button)
    })
    syncFields()
    render(state, canvas!)
    info!.textContent = summary(state)
    status!.textContent = state.dirty ? 'unsaved changes' : 'saved'
  }

  animSelect.addEventListener('change', () => {
    state.key = animSelect.value
    state.frame = 0
    refresh()
  })
  kindSelect.addEventListener('change', () => {
    state.kind = kindSelect.value as MarsArcadeBoundKind
    refresh()
  })
  phaseSelect.addEventListener('change', () => {
    const frame = frameOf(state)
    const next = phaseSelect.value as MarsArcadeFramePhase
    // Dropping out of `active` would strand an attack box on a frame the parser
    // rejects, so the box goes with it rather than the file becoming unloadable.
    if (next !== 'active' && frame.attack) delete frame.attack
    frame.phase = next
    state.dirty = true
    refresh()
  })

  for (const [key, input] of Object.entries(fields)) {
    input?.addEventListener('change', () => {
      const box = boxOf(state) ?? { x: 56, y: 56, width: 16, height: 16 }
      const value = Number.parseInt(input.value, 10)
      if (!Number.isFinite(value)) return
      setBox(state, clampBox({ ...box, [key]: value }))
      refresh()
    })
  }

  activeToggle?.addEventListener('change', () => {
    if (activeToggle.checked) {
      if (state.kind === 'attack') frameOf(state).phase = 'active'
      setBox(state, clampBox(boxOf(state) ?? { x: 72, y: 60, width: 20, height: 14 }))
    } else {
      setBox(state, undefined)
    }
    refresh()
  })

  // Drag to move, shift-drag to resize from the bottom-right.
  let drag: { startX: number; startY: number; box: MarsArcadeBox; resize: boolean } | null = null
  canvas.addEventListener('pointerdown', (event) => {
    const box = boxOf(state)
    if (!box) return
    canvas.setPointerCapture(event.pointerId)
    drag = { startX: event.offsetX, startY: event.offsetY, box: { ...box }, resize: event.shiftKey }
  })
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return
    const dx = Math.round((event.offsetX - drag.startX) / SCALE)
    const dy = Math.round((event.offsetY - drag.startY) / SCALE)
    setBox(state, clampBox(
      drag.resize
        ? { ...drag.box, width: drag.box.width + dx, height: drag.box.height + dy }
        : { ...drag.box, x: drag.box.x + dx, y: drag.box.y + dy },
    ))
    refresh()
  })
  const endDrag = (): void => { drag = null }
  canvas.addEventListener('pointerup', endDrag)
  canvas.addEventListener('pointercancel', endDrag)

  root.querySelector('#gym-prev')?.addEventListener('click', () => {
    const entry = entryOf(state)
    state.frame = (state.frame - 1 + entry.frames.length) % entry.frames.length
    refresh()
  })
  root.querySelector('#gym-next')?.addEventListener('click', () => {
    const entry = entryOf(state)
    state.frame = (state.frame + 1) % entry.frames.length
    refresh()
  })
  root.querySelector('#gym-play')?.addEventListener('click', () => {
    state.playing = !state.playing
  })
  for (const speed of [0.5, 1, 2]) {
    root.querySelector(`#gym-speed-${String(speed).replace('.', '')}`)?.addEventListener('click', () => {
      state.speed = speed
    })
  }
  root.querySelector('#gym-showall')?.addEventListener('change', (event) => {
    state.showAll = (event.target as HTMLInputElement).checked
    refresh()
  })

  root.querySelector('#gym-apply-all')?.addEventListener('click', () => {
    const box = boxOf(state)
    if (!box) return
    // Applies to every frame of this animation EXCEPT attack boxes, which are
    // per-frame by definition — copying one across the whole animation is exactly
    // the mistake the schema exists to prevent.
    if (state.kind === 'attack') {
      status.textContent = 'attack boxes are per-frame — not applied'
      return
    }
    for (const frame of entryOf(state).frames) frame[state.kind] = { ...box }
    state.dirty = true
    refresh()
  })

  root.querySelector('#gym-save')?.addEventListener('click', () => {
    void (async () => {
      const payload = { version: MARS_ARCADE_BOUNDS_VERSION, animations: state.file.animations }
      try {
        // Validate before sending, so a bad box is caught here with a useful message
        // rather than landing on disk and breaking the next test run.
        parseMarsArcadeBounds(JSON.parse(JSON.stringify(payload)))
      } catch (error) {
        status.textContent = `not saved — ${String(error)}`
        return
      }
      const response = await fetch('/__gym/bounds', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload, null, 2),
      })
      if (response.ok) {
        state.dirty = false
        status.textContent = 'saved to src/game/marsArcadeBounds.json'
      } else {
        status.textContent = `save failed: ${await response.text()}`
      }
    })()
  })

  let last = 0
  const tick = (now: number): void => {
    if (state.playing && now - last > 120 / state.speed) {
      last = now
      const entry = entryOf(state)
      state.frame = (state.frame + 1) % entry.frames.length
      refresh()
    }
    window.requestAnimationFrame(tick)
  }
  window.requestAnimationFrame(tick)

  onImageReady = refresh
  refresh()

  // The index is built only to surface a duplicate key as a visible error rather
  // than a silently ignored animation.
  if (marsArcadeBoundsIndex(state.file).size !== state.file.animations.length) {
    status.textContent = 'duplicate animation keys in the bounds file'
  }
}
