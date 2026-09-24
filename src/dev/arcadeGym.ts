/**
 * Mars arcade character gym — the animation table's authoring tool.
 *
 * Dev-only, served at /dev/gym.html. Not an entry in the production build and
 * nothing in the application imports it.
 *
 * It edits `marsArcadeAnimations.json`: every drawing a fighter has, what each pose
 * is called, which phase it belongs to, how many engine frames it is held, and the
 * boxes authored against it. The harness plays the same file, so what the gym shows
 * is what the fight draws, at the timing the fight uses.
 *
 * Deliberately vanilla, like the box harness: no React, so there is no StrictMode
 * double-mount to reason about in a tool whose job is a stable canvas.
 *
 * Keys, when the canvas has focus or nothing does:
 *   [ / ]           previous / next frame
 *   space           play / pause at the table's holds
 *   arrows          nudge the selected box 1 px (Shift: 5 px)
 *   C / Shift+C     copy the selected kind / every kind from the previous frame
 *   O               onion skin (previous and next drawings as ghosts)
 *   M               mirrored preview, as the left-hand fighter is drawn
 *   Ctrl+Z          undo
 */
import {
  formatMarsArcadeFinding,
  marsArcadeAnimationDuration,
  marsArcadeAnimationErrors,
  marsArcadeAnimationKey,
  marsArcadeAnimationsIndex,
  marsArcadeAttackReach,
  marsArcadeFrameAt,
  marsArcadeMoveById,
  parseMarsArcadeAnimations,
  validateMarsArcadeAnimations,
  MARS_ARCADE_ANIMATIONS_VERSION,
  type MarsArcadeAnimation,
  type MarsArcadeAnimationFinding,
  type MarsArcadeAnimationFrame,
  type MarsArcadeAnimationsFile,
} from '../game/marsArcadeAnimations'
import rawAnimations from '../game/marsArcadeAnimations.json'
import {
  MARS_ARCADE_BOUND_KINDS,
  MARS_ARCADE_CELL,
  marsArcadeBoxToStage,
  marsArcadeBoxesOverlap,
  type MarsArcadeBoundKind,
  type MarsArcadeBox,
  type MarsArcadeFramePhase,
} from '../game/marsArcadeBounds'
import { type MarsArcadeFighterId } from '../game/marsArcadeFighters'

const SCALE = 4
const PHASES: MarsArcadeFramePhase[] = ['startup', 'active', 'recovery', 'neutral']
const LOOPS = ['once', 'loop', 'hold-last', 'by-velocity', 'by-stun'] as const
const MAX_UNDO = 100

const KIND_COLOURS: Record<MarsArcadeBoundKind, string> = {
  collision: '#4ac4ff',
  hurt: '#56d63e',
  attack: '#e83232',
  guard: '#ffb238',
}

interface GymState {
  file: MarsArcadeAnimationsFile
  key: string
  /** Engine frames into the clip; the frame on screen follows from the holds. */
  tick: number
  kind: MarsArcadeBoundKind
  /** Which hurt or attack box, when the kind is a list. */
  boxIndex: number
  playing: boolean
  speed: number
  visible: Record<MarsArcadeBoundKind, boolean>
  onion: boolean
  mirrored: boolean
  opponent: { enabled: boolean; separation: number }
  dirty: boolean
  undo: string[]
  findings: MarsArcadeAnimationFinding[]
}

const images = new Map<string, HTMLImageElement>()
/** Opaque bounding box per drawing, measured once from the decoded pixels. */
const silhouettes = new Map<string, MarsArcadeBox | null>()

/**
 * Redraw hook, set once the gym is running.
 *
 * Without it the canvas paints whatever is decoded at the instant a frame button is
 * pressed, and a frame whose sprite has not arrived yet draws its boxes over an
 * empty cell — which looks exactly like a missing sprite and is the whole tool
 * silently lying about the art.
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

function ready(image: HTMLImageElement): boolean {
  return image.complete && image.naturalWidth > 0
}

/** The drawing's opaque bounding box, alpha 128 and up, like the CLI measures it. */
function silhouetteOf(src: string): MarsArcadeBox | null {
  if (silhouettes.has(src)) return silhouettes.get(src) ?? null
  const image = loadImage(src)
  if (!ready(image)) return null
  const scratch = document.createElement('canvas')
  scratch.width = image.naturalWidth
  scratch.height = image.naturalHeight
  const ctx = scratch.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(image, 0, 0)
  const { data, width, height } = ctx.getImageData(0, 0, scratch.width, scratch.height)
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3]! < 128) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  const box = maxX < 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
  silhouettes.set(src, box)
  return box
}

function entryOf(state: GymState): MarsArcadeAnimation {
  const found = state.file.animations.find((entry) => marsArcadeAnimationKey(entry.fighter, entry.animation) === state.key)
  if (!found) throw new Error(`gym: no animation ${state.key}`)
  return found
}

function frameIndexOf(state: GymState): number {
  return marsArcadeFrameAt(entryOf(state), state.tick).index
}

function frameOf(state: GymState): MarsArcadeAnimationFrame {
  return entryOf(state).frames[frameIndexOf(state)]!
}

/** The first tick of frame `index`, so a frame button lands on the start of its hold. */
function tickOfFrame(entry: MarsArcadeAnimation, index: number): number {
  return entry.frames.slice(0, index).reduce((sum, frame) => sum + frame.hold, 0)
}

function boxesOf(frame: MarsArcadeAnimationFrame, kind: MarsArcadeBoundKind): MarsArcadeBox[] {
  if (kind === 'hurt' || kind === 'attack') return frame[kind] ?? []
  const single = frame[kind]
  return single ? [single] : []
}

function boxOf(state: GymState): MarsArcadeBox | undefined {
  return boxesOf(frameOf(state), state.kind)[state.boxIndex]
}

function setBoxes(frame: MarsArcadeAnimationFrame, kind: MarsArcadeBoundKind, boxes: MarsArcadeBox[]): void {
  if (kind === 'hurt' || kind === 'attack') {
    if (boxes.length) frame[kind] = boxes
    else delete frame[kind]
  } else if (boxes[0]) {
    frame[kind] = boxes[0]
  } else {
    delete frame[kind]
  }
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

function snapshot(state: GymState): void {
  state.undo.push(JSON.stringify(state.file))
  if (state.undo.length > MAX_UNDO) state.undo.shift()
}

/** Every edit goes through here: it records the undo point and marks the file dirty. */
function mutate(state: GymState, edit: () => void): void {
  snapshot(state)
  edit()
  state.dirty = true
}

function setBox(state: GymState, box: MarsArcadeBox | undefined): void {
  mutate(state, () => {
    const frame = frameOf(state)
    const boxes = boxesOf(frame, state.kind)
    if (box) boxes[Math.min(state.boxIndex, boxes.length)] = box
    else boxes.splice(state.boxIndex, 1)
    setBoxes(frame, state.kind, boxes)
    if (frame.attack && frame.phase !== 'active') frame.phase = 'active'
  })
}

function drawBox(ctx: CanvasRenderingContext2D, box: MarsArcadeBox, colour: string, alpha: number, width: number): void {
  ctx.globalAlpha = alpha
  ctx.lineWidth = width
  ctx.strokeStyle = colour
  ctx.strokeRect(box.x * SCALE + 0.5, box.y * SCALE + 0.5, box.width * SCALE - 1, box.height * SCALE - 1)
  ctx.globalAlpha = 1
}

function drawSprite(ctx: CanvasRenderingContext2D, src: string, alpha: number): void {
  const image = loadImage(src)
  if (!ready(image)) return
  ctx.globalAlpha = alpha
  ctx.drawImage(image, 0, 0, MARS_ARCADE_CELL.size * SCALE, MARS_ARCADE_CELL.size * SCALE)
  ctx.globalAlpha = 1
}

/** The opposing fighter's idle drawing and hurt boxes, for the opponent overlay. */
function opponentOf(state: GymState): { entry: MarsArcadeAnimation; frame: MarsArcadeAnimationFrame } | null {
  const me = entryOf(state)
  const other: MarsArcadeFighterId = me.fighter === 'booster' ? 'oracle' : 'booster'
  const index = marsArcadeAnimationsIndex(state.file)
  const entry = index.get(marsArcadeAnimationKey(other, 'idle'))
  return entry ? { entry, frame: entry.frames[0]! } : null
}

function render(state: GymState, canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const size = MARS_ARCADE_CELL.size * SCALE
  const opponentWidth = state.opponent.enabled ? state.opponent.separation * SCALE : 0
  canvas.width = size + opponentWidth
  canvas.height = size
  ctx.imageSmoothingEnabled = false
  // A mid-grey checkerboard, not the stage's near-black: the booster wears a black
  // leather jacket and vanished against a dark field while the boxes floated over
  // apparently empty space. The checkerboard also shows where the cell is transparent.
  const tile = 8 * SCALE
  for (let y = 0; y < canvas.height; y += tile) {
    for (let x = 0; x < canvas.width; x += tile) {
      ctx.fillStyle = ((x / tile) + (y / tile)) % 2 === 0 ? '#5d5d68' : '#4a4a55'
      ctx.fillRect(x, y, tile, tile)
    }
  }

  const entry = entryOf(state)
  const index = frameIndexOf(state)
  const frame = entry.frames[index]!

  ctx.save()
  if (state.mirrored) {
    // Mirror about the pivot column, as the harness draws the left-hand fighter.
    ctx.translate(MARS_ARCADE_CELL.centreColumn * SCALE * 2, 0)
    ctx.scale(-1, 1)
  }

  if (state.onion) {
    const previous = entry.frames[(index - 1 + entry.frames.length) % entry.frames.length]
    const next = entry.frames[(index + 1) % entry.frames.length]
    if (previous && previous !== frame) drawSprite(ctx, previous.src, 0.35)
    if (next && next !== frame && next !== previous) drawSprite(ctx, next.src, 0.18)
  }
  drawSprite(ctx, frame.src, 1)

  // The contract baseline and pivot, always drawn. A box authored against a sprite
  // whose feet are not on the baseline is wrong in a way that is invisible without
  // the line to check it against.
  ctx.fillStyle = '#5a4a7a'
  ctx.fillRect(0, MARS_ARCADE_CELL.baselineRow * SCALE, size, 1)
  ctx.fillRect(MARS_ARCADE_CELL.centreColumn * SCALE, 0, 1, size)

  for (const kind of MARS_ARCADE_BOUND_KINDS) {
    if (!state.visible[kind]) continue
    boxesOf(frame, kind).forEach((box, which) => {
      const selected = kind === state.kind && which === state.boxIndex
      drawBox(ctx, box, KIND_COLOURS[kind], selected ? 1 : 0.45, selected ? 2 : 1)
    })
  }
  ctx.restore()

  if (state.opponent.enabled) {
    const opponent = opponentOf(state)
    if (opponent) {
      ctx.save()
      // The opponent stands `separation` px away, facing us: drawn mirrored about its
      // own pivot, which sits at our pivot plus the separation.
      ctx.translate((MARS_ARCADE_CELL.centreColumn + state.opponent.separation) * SCALE, 0)
      ctx.scale(-1, 1)
      ctx.translate(-MARS_ARCADE_CELL.centreColumn * SCALE, 0)
      drawSprite(ctx, opponent.frame.src, 0.6)
      for (const hurt of opponent.frame.hurt ?? []) drawBox(ctx, hurt, KIND_COLOURS.hurt, 0.35, 1)
      if (opponent.frame.collision) drawBox(ctx, opponent.frame.collision, KIND_COLOURS.collision, 0.25, 1)
      ctx.restore()
    }
  }
}

/** Whether the frame's live hitboxes overlap the opponent's idle hurt boxes at the chosen separation. */
function connects(state: GymState): { boxes: boolean; engine: boolean | null } | null {
  if (!state.opponent.enabled) return null
  const frame = frameOf(state)
  const opponent = opponentOf(state)
  if (!opponent || frame.phase !== 'active' || !frame.attack?.length) return null
  const hurts = (opponent.frame.hurt ?? []).map((box) => marsArcadeBoxToStage(box, state.opponent.separation, -1))
  const attacks = frame.attack.map((box) => marsArcadeBoxToStage(box, 0, 1))
  const boxes = attacks.some((attack) => hurts.some((hurt) => marsArcadeBoxesOverlap(attack, hurt)))
  const move = entryOf(state).moveId ? marsArcadeMoveById(entryOf(state).moveId!) : null
  return { boxes, engine: move ? state.opponent.separation <= move.reach : null }
}

function summary(state: GymState): string {
  const entry = entryOf(state)
  const index = frameIndexOf(state)
  const frame = entry.frames[index]!
  const box = boxOf(state)
  const duration = marsArcadeAnimationDuration(entry)
  const lines = [
    `${entry.fighter} · ${entry.animation}  ${entry.loop}  ${duration} frames${entry.reviewed ? '' : '  UNREVIEWED'}`,
    `frame ${index + 1}/${entry.frames.length} "${frame.pose}"  phase ${frame.phase}  hold ${frame.hold}  tick ${state.tick}`,
    frame.src.replace('/art-source/arcade/', ''),
  ]
  const silhouette = silhouetteOf(frame.src)
  if (silhouette) {
    lines.push(`drawing: x ${silhouette.x}–${silhouette.x + silhouette.width - 1}  y ${silhouette.y}–${silhouette.y + silhouette.height - 1}  forward ${silhouette.x + silhouette.width - MARS_ARCADE_CELL.centreColumn} past pivot`)
  }
  if (entry.moveId) {
    const move = marsArcadeMoveById(entry.moveId)
    if (move) {
      lines.push(`move ${move.id}  reach ${move.reach}  ${move.startupFrames}/${move.activeFrames}/${move.recoveryFrames}`)
      const reach = marsArcadeAttackReach(frame)
      if (reach !== null) {
        const delta = reach - move.reach
        lines.push(delta === 0 ? `attack reaches ${reach} — matches reach` : `attack reaches ${reach} — ${delta > 0 ? '+' : ''}${delta} against reach ${move.reach}`)
      }
      if (entry.reachException) lines.push(`reach exception: ${entry.reachException}`)
    }
  }
  const hit = connects(state)
  if (hit) {
    lines.push(`opponent at ${state.opponent.separation}: boxes ${hit.boxes ? 'CONNECT' : 'miss'}${hit.engine === null ? '' : `, engine reach ${hit.engine ? 'CONNECTS' : 'misses'}`}`)
  }
  const count = boxesOf(frame, state.kind).length
  lines.push(box
    ? `${state.kind}${count > 1 ? ` ${state.boxIndex + 1}/${count}` : ''}: x ${box.x} y ${box.y} w ${box.width} h ${box.height}`
    : `${state.kind}: none`)
  return lines.join('\n')
}

function findingsFor(state: GymState): string {
  const mine = state.findings.filter((finding) => finding.key === state.key)
  const errors = marsArcadeAnimationErrors(state.findings).length
  const head = errors ? `${errors} error${errors === 1 ? '' : 's'} in the file — save is refused until they are fixed` : 'no errors in the file'
  return [head, ...mine.map(formatMarsArcadeFinding)].join('\n')
}

export function startArcadeGym(root: HTMLElement): void {
  const parsed = parseMarsArcadeAnimations(rawAnimations)
  const state: GymState = {
    file: parsed,
    key: marsArcadeAnimationKey('booster', 'jab'),
    tick: 0,
    kind: 'attack',
    boxIndex: 0,
    playing: false,
    speed: 1,
    visible: { collision: true, hurt: true, attack: true, guard: true },
    onion: false,
    mirrored: false,
    opponent: { enabled: false, separation: 40 },
    dirty: false,
    undo: [],
    findings: validateMarsArcadeAnimations(parsed),
  }

  const $ = <T extends Element>(selector: string): T | null => root.querySelector<T>(selector)
  const canvas = $<HTMLCanvasElement>('#gym-canvas')
  const info = $<HTMLPreElement>('#gym-info')
  const findings = $<HTMLPreElement>('#gym-findings')
  const status = $<HTMLElement>('#gym-status')
  const frameBar = $<HTMLElement>('#gym-frames')
  const animSelect = $<HTMLSelectElement>('#gym-animation')
  const kindSelect = $<HTMLSelectElement>('#gym-kind')
  const boxSelect = $<HTMLSelectElement>('#gym-box')
  const phaseSelect = $<HTMLSelectElement>('#gym-phase')
  const loopSelect = $<HTMLSelectElement>('#gym-loop')
  const timeline = $<HTMLInputElement>('#gym-timeline')
  if (!canvas || !info || !findings || !status || !frameBar || !animSelect || !kindSelect || !boxSelect || !phaseSelect || !loopSelect || !timeline) return

  const fields = {
    x: $<HTMLInputElement>('#gym-x'),
    y: $<HTMLInputElement>('#gym-y'),
    width: $<HTMLInputElement>('#gym-w'),
    height: $<HTMLInputElement>('#gym-h'),
  }
  const holdField = $<HTMLInputElement>('#gym-hold')
  const poseField = $<HTMLInputElement>('#gym-pose')
  const srcField = $<HTMLInputElement>('#gym-src')
  const reviewedToggle = $<HTMLInputElement>('#gym-reviewed')
  const onionToggle = $<HTMLInputElement>('#gym-onion')
  const mirrorToggle = $<HTMLInputElement>('#gym-mirror')
  const opponentToggle = $<HTMLInputElement>('#gym-opponent')
  const separationField = $<HTMLInputElement>('#gym-separation')

  const option = (select: HTMLSelectElement, value: string, text = value): void => {
    const element = document.createElement('option')
    element.value = value
    element.textContent = text
    select.append(element)
  }
  const rebuildAnimationList = (): void => {
    animSelect.replaceChildren()
    for (const entry of state.file.animations) {
      option(animSelect, marsArcadeAnimationKey(entry.fighter, entry.animation), `${entry.fighter} · ${entry.animation}${entry.reviewed ? '' : ' *'}`)
    }
    animSelect.value = state.key
  }
  rebuildAnimationList()
  for (const kind of MARS_ARCADE_BOUND_KINDS) option(kindSelect, kind)
  for (const phase of PHASES) option(phaseSelect, phase)
  for (const loop of LOOPS) option(loopSelect, loop)
  kindSelect.value = state.kind
  for (const kind of MARS_ARCADE_BOUND_KINDS) {
    const toggle = $<HTMLInputElement>(`#gym-show-${kind}`)
    toggle?.addEventListener('change', () => {
      state.visible[kind] = toggle.checked
      refresh()
    })
  }

  function revalidate(): void {
    state.findings = validateMarsArcadeAnimations(state.file)
  }

  function syncFields(): void {
    const entry = entryOf(state)
    const frame = frameOf(state)
    const box = boxOf(state)
    fields.x!.value = String(box?.x ?? '')
    fields.y!.value = String(box?.y ?? '')
    fields.width!.value = String(box?.width ?? '')
    fields.height!.value = String(box?.height ?? '')
    phaseSelect!.value = frame.phase
    loopSelect!.value = entry.loop
    if (holdField) holdField.value = String(frame.hold)
    if (poseField && document.activeElement !== poseField) poseField.value = frame.pose
    if (srcField && document.activeElement !== srcField) srcField.value = frame.src
    if (reviewedToggle) reviewedToggle.checked = entry.reviewed
    const count = boxesOf(frame, state.kind).length
    boxSelect!.replaceChildren()
    for (let which = 0; which < count; which += 1) option(boxSelect!, String(which), `${state.kind} ${which + 1}`)
    boxSelect!.value = String(Math.min(state.boxIndex, Math.max(0, count - 1)))
    boxSelect!.disabled = count < 2
    timeline!.max = String(Math.max(0, marsArcadeAnimationDuration(entry) - 1))
    timeline!.value = String(state.tick)
  }

  function refresh(): void {
    const entry = entryOf(state)
    state.boxIndex = Math.min(state.boxIndex, Math.max(0, boxesOf(frameOf(state), state.kind).length - 1))
    frameBar!.replaceChildren()
    const current = frameIndexOf(state)
    entry.frames.forEach((frame, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = String(index + 1)
      button.title = `${frame.pose} — ${frame.phase}, ${frame.hold} frames`
      button.setAttribute('aria-pressed', String(index === current))
      if (frame.attack) button.dataset.hitbox = 'true'
      button.addEventListener('click', () => {
        state.tick = tickOfFrame(entry, index)
        refresh()
      })
      frameBar!.append(button)
    })
    syncFields()
    render(state, canvas!)
    info!.textContent = summary(state)
    findings!.textContent = findingsFor(state)
    if (!state.dirty) status!.textContent = 'saved'
    else if (status!.textContent === 'saved') status!.textContent = 'unsaved changes'
  }

  const gotoFrame = (delta: number): void => {
    const entry = entryOf(state)
    const index = (frameIndexOf(state) + delta + entry.frames.length) % entry.frames.length
    state.tick = tickOfFrame(entry, index)
    refresh()
  }

  animSelect.addEventListener('change', () => {
    state.key = animSelect.value
    state.tick = 0
    state.boxIndex = 0
    refresh()
  })
  kindSelect.addEventListener('change', () => {
    state.kind = kindSelect.value as MarsArcadeBoundKind
    state.boxIndex = 0
    refresh()
  })
  boxSelect.addEventListener('change', () => {
    state.boxIndex = Number(boxSelect.value)
    refresh()
  })
  phaseSelect.addEventListener('change', () => {
    mutate(state, () => {
      const frame = frameOf(state)
      const next = phaseSelect.value as MarsArcadeFramePhase
      // Dropping out of `active` would strand an attack box on a frame the parser
      // rejects, so the box goes with it rather than the file becoming unloadable.
      if (next !== 'active' && frame.attack) delete frame.attack
      frame.phase = next
    })
    revalidate()
    refresh()
  })
  loopSelect.addEventListener('change', () => {
    mutate(state, () => { entryOf(state).loop = loopSelect.value as MarsArcadeAnimation['loop'] })
    revalidate()
    refresh()
  })
  holdField?.addEventListener('change', () => {
    const value = Number.parseInt(holdField.value, 10)
    if (!Number.isFinite(value) || value < 1 || value === frameOf(state).hold) return
    const index = frameIndexOf(state)
    mutate(state, () => { frameOf(state).hold = value })
    state.tick = tickOfFrame(entryOf(state), index)
    revalidate()
    refresh()
  })
  poseField?.addEventListener('change', () => {
    if (!poseField.value) return
    mutate(state, () => { frameOf(state).pose = poseField.value })
    refresh()
  })
  srcField?.addEventListener('change', () => {
    if (!srcField.value.startsWith('/art-source/arcade/')) {
      status.textContent = 'a drawing lives under /art-source/arcade/'
      return
    }
    mutate(state, () => { frameOf(state).src = srcField.value })
    revalidate()
    refresh()
  })
  reviewedToggle?.addEventListener('change', () => {
    mutate(state, () => { entryOf(state).reviewed = reviewedToggle.checked })
    revalidate()
    rebuildAnimationList()
    refresh()
  })
  onionToggle?.addEventListener('change', () => { state.onion = onionToggle.checked; refresh() })
  mirrorToggle?.addEventListener('change', () => { state.mirrored = mirrorToggle.checked; refresh() })
  opponentToggle?.addEventListener('change', () => { state.opponent.enabled = opponentToggle.checked; refresh() })
  separationField?.addEventListener('input', () => {
    const value = Number.parseInt(separationField.value, 10)
    if (Number.isFinite(value) && value >= 0) state.opponent.separation = Math.min(200, value)
    refresh()
  })
  timeline.addEventListener('input', () => {
    state.tick = Number(timeline.value)
    refresh()
  })

  for (const [key, input] of Object.entries(fields)) {
    input?.addEventListener('change', () => {
      const box = boxOf(state) ?? { x: 56, y: 56, width: 16, height: 16 }
      const value = Number.parseInt(input.value, 10)
      if (!Number.isFinite(value)) return
      setBox(state, clampBox({ ...box, [key]: value }))
      revalidate()
      refresh()
    })
  }

  $('#gym-box-add')?.addEventListener('click', () => {
    const frame = frameOf(state)
    const existing = boxesOf(frame, state.kind)
    if ((state.kind === 'collision' || state.kind === 'guard') && existing.length) {
      status.textContent = `a frame has one ${state.kind} box`
      return
    }
    state.boxIndex = existing.length
    const starter = state.kind === 'attack' ? { x: 72, y: 60, width: 20, height: 14 } : { x: 44, y: 16, width: 40, height: 103 }
    setBox(state, clampBox(starter))
    revalidate()
    refresh()
  })
  $('#gym-box-remove')?.addEventListener('click', () => {
    if (!boxOf(state)) return
    setBox(state, undefined)
    state.boxIndex = Math.max(0, state.boxIndex - 1)
    revalidate()
    refresh()
  })

  /** Copy one kind, or every kind, from the previous frame onto this one. */
  const copyFromPrevious = (everything: boolean): void => {
    const entry = entryOf(state)
    const index = frameIndexOf(state)
    if (entry.frames.length < 2) return
    const source = entry.frames[(index - 1 + entry.frames.length) % entry.frames.length]!
    mutate(state, () => {
      const target = frameOf(state)
      for (const kind of everything ? MARS_ARCADE_BOUND_KINDS : [state.kind]) {
        // A hitbox is per-frame by definition; it is only copied onto another active
        // frame, never onto a frame that would then have to become active to hold it.
        if (kind === 'attack' && target.phase !== 'active') continue
        setBoxes(target, kind, boxesOf(source, kind).map((box) => ({ ...box })))
      }
    })
    revalidate()
    refresh()
  }
  $('#gym-copy-prev')?.addEventListener('click', () => copyFromPrevious(false))
  $('#gym-copy-prev-all')?.addEventListener('click', () => copyFromPrevious(true))

  $('#gym-apply-all')?.addEventListener('click', () => {
    const boxes = boxesOf(frameOf(state), state.kind)
    if (!boxes.length) return
    // Applies to every frame of this animation EXCEPT attack boxes, which are
    // per-frame by definition — copying one across the whole animation is exactly
    // the mistake the schema exists to prevent.
    if (state.kind === 'attack') {
      status.textContent = 'attack boxes are per-frame — not applied'
      return
    }
    mutate(state, () => {
      for (const frame of entryOf(state).frames) setBoxes(frame, state.kind, boxes.map((box) => ({ ...box })))
    })
    revalidate()
    refresh()
  })

  /** Propose a hurt box from the drawing's silhouette, 2 px inside it, feet kept. */
  $('#gym-fit-hurt')?.addEventListener('click', () => {
    const silhouette = silhouetteOf(frameOf(state).src)
    if (!silhouette) return
    const inset = 2
    state.kind = 'hurt'
    kindSelect.value = 'hurt'
    state.boxIndex = 0
    setBox(state, clampBox({ x: silhouette.x + inset, y: silhouette.y + inset, width: silhouette.width - inset * 2, height: silhouette.height - inset }))
    revalidate()
    refresh()
  })
  /** Propose a body box: the silhouette's columns, standing on the baseline. */
  $('#gym-fit-body')?.addEventListener('click', () => {
    const silhouette = silhouetteOf(frameOf(state).src)
    if (!silhouette) return
    state.kind = 'collision'
    kindSelect.value = 'collision'
    state.boxIndex = 0
    setBox(state, clampBox({ x: silhouette.x, y: silhouette.y, width: silhouette.width, height: MARS_ARCADE_CELL.baselineRow - silhouette.y }))
    revalidate()
    refresh()
  })

  $('#gym-frame-duplicate')?.addEventListener('click', () => {
    const entry = entryOf(state)
    const index = frameIndexOf(state)
    mutate(state, () => {
      entry.frames.splice(index + 1, 0, structuredClone(entry.frames[index]!))
    })
    state.tick = tickOfFrame(entry, index + 1)
    revalidate()
    refresh()
  })
  $('#gym-frame-delete')?.addEventListener('click', () => {
    const entry = entryOf(state)
    if (entry.frames.length < 2) {
      status.textContent = 'a clip keeps at least one frame'
      return
    }
    const index = frameIndexOf(state)
    mutate(state, () => { entry.frames.splice(index, 1) })
    state.tick = tickOfFrame(entry, Math.min(index, entry.frames.length - 1))
    revalidate()
    refresh()
  })
  const moveFrame = (delta: number): void => {
    const entry = entryOf(state)
    const index = frameIndexOf(state)
    const target = index + delta
    if (target < 0 || target >= entry.frames.length) return
    mutate(state, () => {
      const [frame] = entry.frames.splice(index, 1)
      entry.frames.splice(target, 0, frame!)
    })
    state.tick = tickOfFrame(entry, target)
    revalidate()
    refresh()
  }
  $('#gym-frame-earlier')?.addEventListener('click', () => moveFrame(-1))
  $('#gym-frame-later')?.addEventListener('click', () => moveFrame(1))

  // Drag to move, shift-drag to resize from the bottom-right. Mirrored preview flips
  // the horizontal sense so the box follows the pointer.
  let drag: { startX: number; startY: number; box: MarsArcadeBox; resize: boolean } | null = null
  canvas.addEventListener('pointerdown', (event) => {
    canvas.focus()
    const box = boxOf(state)
    if (!box) return
    canvas.setPointerCapture(event.pointerId)
    drag = { startX: event.offsetX, startY: event.offsetY, box: { ...box }, resize: event.shiftKey }
  })
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return
    const dx = Math.round((event.offsetX - drag.startX) / SCALE) * (state.mirrored ? -1 : 1)
    const dy = Math.round((event.offsetY - drag.startY) / SCALE)
    const next = clampBox(
      drag.resize
        ? { ...drag.box, width: drag.box.width + dx, height: drag.box.height + dy }
        : { ...drag.box, x: drag.box.x + dx, y: drag.box.y + dy },
    )
    // One undo point per drag, not one per pointer event.
    const frame = frameOf(state)
    const boxes = boxesOf(frame, state.kind)
    boxes[state.boxIndex] = next
    setBoxes(frame, state.kind, boxes)
    state.dirty = true
    refresh()
  })
  const endDrag = (): void => {
    if (drag) revalidate()
    drag = null
  }
  // The undo point for a drag is taken once, before the first move.
  canvas.addEventListener('pointerdown', () => { if (boxOf(state)) snapshot(state) }, { capture: true })
  canvas.addEventListener('pointerup', endDrag)
  canvas.addEventListener('pointercancel', endDrag)

  $('#gym-prev')?.addEventListener('click', () => gotoFrame(-1))
  $('#gym-next')?.addEventListener('click', () => gotoFrame(1))
  $('#gym-play')?.addEventListener('click', () => { state.playing = !state.playing })
  for (const speed of [0.5, 1, 2]) {
    $(`#gym-speed-${String(speed).replace('.', '')}`)?.addEventListener('click', () => { state.speed = speed })
  }

  const undo = (): void => {
    const previous = state.undo.pop()
    if (!previous) return
    state.file = JSON.parse(previous) as MarsArcadeAnimationsFile
    state.dirty = true
    revalidate()
    rebuildAnimationList()
    refresh()
  }
  $('#gym-undo')?.addEventListener('click', undo)

  root.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement | null
    if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) return
    const step = event.shiftKey ? 5 : 1
    const nudge = (dx: number, dy: number): void => {
      const box = boxOf(state)
      if (!box) return
      setBox(state, clampBox({ ...box, x: box.x + dx, y: box.y + dy }))
      revalidate()
      refresh()
    }
    switch (event.key) {
      case '[': gotoFrame(-1); break
      case ']': gotoFrame(1); break
      case ' ': state.playing = !state.playing; break
      case 'ArrowLeft': nudge(-step, 0); break
      case 'ArrowRight': nudge(step, 0); break
      case 'ArrowUp': nudge(0, -step); break
      case 'ArrowDown': nudge(0, step); break
      case 'c': copyFromPrevious(false); break
      case 'C': copyFromPrevious(true); break
      case 'o': case 'O': state.onion = !state.onion; if (onionToggle) onionToggle.checked = state.onion; refresh(); break
      case 'm': case 'M': state.mirrored = !state.mirrored; if (mirrorToggle) mirrorToggle.checked = state.mirrored; refresh(); break
      case 'z': case 'Z': if (event.ctrlKey || event.metaKey) undo(); else return; break
      default: return
    }
    event.preventDefault()
  })

  $('#gym-save')?.addEventListener('click', () => {
    void (async () => {
      revalidate()
      const errors = marsArcadeAnimationErrors(state.findings)
      if (errors.length) {
        status.textContent = `not saved — ${errors.length} error${errors.length === 1 ? '' : 's'}; see the findings panel`
        refresh()
        return
      }
      const payload = { version: MARS_ARCADE_ANIMATIONS_VERSION, animations: state.file.animations }
      let response: Response
      try {
        response = await fetch('/__gym/animations', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } catch (error) {
        status.textContent = `save failed: ${String(error)}`
        return
      }
      if (response.ok) {
        state.dirty = false
        status.textContent = 'saved to src/game/marsArcadeAnimations.json'
      } else {
        status.textContent = `save refused (${response.status}): ${await response.text()}`
      }
    })()
  })

  // Playback at the table's holds: 60 engine frames a second, scaled.
  let carry = 0
  let last = performance.now()
  const tickPlayback = (now: number): void => {
    const elapsed = now - last
    last = now
    if (state.playing) {
      carry += (elapsed / (1000 / 60)) * state.speed
      const advance = Math.floor(carry)
      if (advance > 0) {
        carry -= advance
        const entry = entryOf(state)
        const duration = marsArcadeAnimationDuration(entry)
        state.tick = entry.loop === 'loop' ? (state.tick + advance) % duration : Math.min(duration - 1, state.tick + advance)
        if (entry.loop !== 'loop' && state.tick === duration - 1) {
          // A once / hold-last clip parks on its last drawing, then restarts on the
          // next press, which is how the reference gym reads too.
          state.playing = false
        }
        refresh()
      }
    }
    window.requestAnimationFrame(tickPlayback)
  }
  window.requestAnimationFrame(tickPlayback)

  onImageReady = refresh
  refresh()

  // The index is built only to surface a duplicate key as a visible error rather
  // than a silently ignored animation.
  if (marsArcadeAnimationsIndex(state.file).size !== state.file.animations.length) {
    status.textContent = 'duplicate animation keys in the animation table'
  }
}
