import { gameCopy } from './config'
import { getIntroScene, normalizeIntroTime, type IntroSceneId } from './introConfig'
import { BEAT_GRID_SECONDS, INTRO_MUSIC_CUES } from './introMusicCues'

export type SpriteLoopMode = 'loop' | 'once' | 'hold-last'

export type SpriteTiming = {
  durations: readonly number[]
  loopMode: SpriteLoopMode
}

export type SpriteClip = SpriteTiming & {
  assetId: string
  path: string
  frameWidth: number
  frameHeight: number
  columns: number
  pivot: { x: number; y: number }
  frameIndices: readonly number[]
}

function scrambleClip(
  assetId: string,
  path: string,
  frameWidth: number,
  frameHeight: number,
  columns: number,
  pivot: { x: number; y: number },
  durations: readonly number[],
  loopMode: SpriteLoopMode,
  /** Sheet cells to play, in order. Defaults to the sheet's own order, which
   * is only the cycle order when the sheet was packed in cycle order. */
  frameIndices?: readonly number[],
): SpriteClip {
  return {
    assetId,
    path,
    frameWidth,
    frameHeight,
    columns,
    pivot,
    durations,
    loopMode,
    frameIndices: frameIndices ?? durations.map((_, index) => index),
  }
}

/**
 * Where the finale title sits on the stage. The plate keeps its upper band
 * dark precisely so this stays legible over it.
 */
export const TITLE_CARD = {
  text: gameCopy.title.toUpperCase(),
  x: 160,
  y: 44,
} as const

/**
 * Where the runtime letters the book covers on `card-logbook-books`, in stage
 * pixels. Measured from the deployed 320x224 card.
 */
/** The logbook beat's four animation stages, as offsets from its cue. */
export const LOGBOOK_STAGES = [
  [0, 'card-logbook-books'],
  [0.9, 'card-logbook-sweep'],
  [1.6, 'card-logbook'],
  [2.4, 'card-logbook-lift'],
] as const

/** FLIGHT LOG on the lifted cover; measured off the deployed lift card. */
export const LIFT_LABELS: readonly Omit<IntroLabelFrame, 'opacity'>[] = [
  { text: 'FLIGHT LOG', x: 140, y: 74, sizePx: 9, ink: 'light' },
  { text: 'CAPT. POP T', x: 140, y: 90, sizePx: 6, ink: 'light' },
]

export const BOOK_LABELS: readonly Omit<IntroLabelFrame, 'opacity'>[] = [
  { text: 'ELON MUSK', x: 118, y: 75, sizePx: 8, ink: 'light' },
  { text: 'REACHER', x: 216, y: 115, sizePx: 7, ink: 'light' },
  { text: 'LEE CHILD', x: 276, y: 122, sizePx: 6, ink: 'light' },
]

/**
 * The walk cycle, rebuilt from the art 2026-08-24.
 *
 * Two things had to be measured off the drawings rather than chosen.
 *
 * ORDER. `deploy-scramble-intro.py` packs the sheet as Wave S4 pose 1, Wave
 * S16 tween 1, pose 2, tween 2 … on the assumption that each generated sheet
 * held its poses in walk-cycle order. Neither did. Measuring where every
 * drawing puts its planted boot — the boot's x against the head centre, taken
 * on the source art where the figure is 554 px (poses) and ~950 px (tweens)
 * tall, so a tenth of a sprite pixel resolves — sorts them into one clean
 * step. In sheet order that boot jumped +3.8, −2.3, −0.8, +4.2, +2.5, −1.0:
 * the legs scissored back and forth instead of striding.
 *
 * COUNT. Six, not the twelve the sheet holds, and this is arithmetic rather
 * than taste. `drawSprite` rounds the sprite to whole stage pixels, so the
 * body can only move in whole pixels; motion is even only when every drawing
 * carries exactly one of them. That fixes
 *
 *   speed = 1 px / drawing, so   drawings per step = step length x cadence
 *
 * and the art fixes the step length at 6.45 px, so a walking cadence of about
 * 2.2 steps a second wants SIX drawings a step. Playing all twelve at 40 ms
 * moved him a pixel on every SECOND drawing, which is what still read as shaky
 * after the order was fixed: the silhouette change alternated 14%, 23%, 9%,
 * 11%, 15%, 18% … a lurch every other frame. The six kept here change by
 * 19-24% each, a coefficient of variation of 0.08 against 0.38, and the six
 * dropped (cells 0, 9, 1, 5, 11, 3) are the ones whose poses duplicate a kept
 * neighbour — two transitions in the twelve measured 4.4% and 5.2%, i.e. a
 * held drawing.
 *
 * `boot` is that measured boot offset. `head` is where the cell puts the
 * centre of his cap, measured on the PACKED sheet: `cell_pack` centres each
 * cell on its bounding box, so a drawing with a wider leg spread carries its
 * head half a pixel off the others. It is recorded so the boot's true world x
 * can be computed. Cross-correlating the rigid upper bodies says the twelve
 * cells need no whole-pixel re-registration, so that half pixel is the floor.
 */
export const WALK_CYCLE = [
  { frame: 6, boot: 4.2, head: 12.0 },
  { frame: 7, boot: 3.06, head: 12.5 },
  { frame: 8, boot: 2.51, head: 12.0 },
  { frame: 4, boot: -0.78, head: 12.0 },
  { frame: 10, boot: -0.95, head: 12.0 },
  { frame: 2, boot: -2.25, head: 12.0 },
] as const

/**
 * One drawing, one stage pixel, every 75 ms: 13.3 px a second and 2.22 steps a
 * second, which is a brisk walk. Tying the two rates together IS the anti-judder
 * fix — see WALK_CYCLE.
 */
export const WALK_FRAME_MS = 75

/** How far the drawn boot sweeps in one step: 6.45 stage px. The six pixels he
 * actually covers sit inside the scatter of the drawings themselves — the two
 * contact poses measure their own feet 6.54 and 6.63 px apart. */
export const WALK_BOOT_SWEEP_PX = WALK_CYCLE[0].boot - WALK_CYCLE[WALK_CYCLE.length - 1]!.boot

/** Stage px covered in one step — one per drawing, by construction. */
export const WALK_STEP_PX = WALK_CYCLE.length

/** Where he starts the scale shot, in stage px. */
export const WALK_START_X = 50

/**
 * How far he has walked, in whole stage px, `elapsedMs` into the scene.
 *
 * The speed is set by the art, not by the shot: the drawings sweep his boot
 * 6.45 px through the cell in a step, so 13.3 px/s is what his own stride can
 * carry. The shot used to lerp him 120 px across its 4.04 s while the drawings
 * carried his boots 33 — a 3.6x moonwalk.
 */
export function walkAdvance(elapsedMs: number): number {
  const safe = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0
  return Math.floor(safe / WALK_FRAME_MS)
}

export const POPT_CLIPS = {
  /** The Wave S7 ident acting: a 64 px six-phase run plus the six hat-gag
   * poses. Every pivot is the foot-span midpoint, measured off the normalised
   * sprite — not the bounding-box centre, which drifts on lopsided poses. */
  run: scrambleClip('popt-run', 'images/intro/tmb2/scramble/sprites/popt-run-sheet.png', 50, 66, 12, { x: 25, y: 65 }, Array.from({ length: 12 }, () => 40), 'loop'),
  skid: scrambleClip('popt-skid', 'images/intro/tmb2/scramble/sprites/popt-skid.png', 57, 68, 1, { x: 43, y: 67 }, [1000], 'hold-last'),
  blinded: scrambleClip('popt-blinded', 'images/intro/tmb2/scramble/sprites/popt-blinded.png', 39, 67, 1, { x: 13, y: 66 }, [1000], 'hold-last'),
  forearm: scrambleClip('popt-forearm', 'images/intro/tmb2/scramble/sprites/popt-forearm.png', 44, 68, 1, { x: 12, y: 67 }, [1000], 'hold-last'),
  flick: scrambleClip('popt-flick', 'images/intro/tmb2/scramble/sprites/popt-flick.png', 39, 94, 1, { x: 16, y: 93 }, [1000], 'hold-last'),
  crooked: scrambleClip('popt-crooked', 'images/intro/tmb2/scramble/sprites/popt-crooked.png', 32, 68, 1, { x: 18, y: 67 }, [1000], 'hold-last'),
  salute: scrambleClip('popt-salute', 'images/intro/tmb2/scramble/sprites/popt-salute.png', 28, 73, 1, { x: 18, y: 72 }, [1000], 'hold-last'),
  // Wave S13 in-betweens: the gag played 6 poses over 3.22 s (1.9 per second),
  // which read as a slideshow. These sit between the poses above and double it.
  tip: scrambleClip('popt-tip', 'images/intro/tmb2/scramble/sprites/popt-tip.png', 34, 68, 1, { x: 12, y: 67 }, [1000], 'hold-last'),
  cover: scrambleClip('popt-cover', 'images/intro/tmb2/scramble/sprites/popt-cover.png', 34, 64, 1, { x: 14, y: 63 }, [1000], 'hold-last'),
  fall: scrambleClip('popt-fall', 'images/intro/tmb2/scramble/sprites/popt-fall.png', 45, 63, 1, { x: 9, y: 62 }, [1000], 'hold-last'),
  swing: scrambleClip('popt-swing', 'images/intro/tmb2/scramble/sprites/popt-swing.png', 43, 65, 1, { x: 16, y: 64 }, [1000], 'hold-last'),
  lookup: scrambleClip('popt-lookup', 'images/intro/tmb2/scramble/sprites/popt-lookup.png', 34, 63, 1, { x: 18, y: 62 }, [1000], 'hold-last'),
  /**
   * The cap alone, pivoted at its centre. Split out of the airborne pose so the
   * flight can be a smooth interpolated arc at the display refresh rate rather
   * than two held drawings — generating more poses could never match this.
   */
  cap: scrambleClip('popt-cap', 'images/intro/tmb2/scramble/sprites/popt-cap.png', 16, 13, 1, { x: 8, y: 6 }, [1000], 'hold-last'),
  landed: scrambleClip('popt-landed', 'images/intro/tmb2/scramble/sprites/popt-landed.png', 34, 68, 1, { x: 15, y: 67 }, [1000], 'hold-last'),
  /**
   * The walk cycle: 48 px figure in a 26×50 cell, feet on row 49. The sheet
   * holds twelve drawings; `WALK_CYCLE` picks six of them and puts them in
   * cycle order, which the sheet is not in. Overridden here rather than in
   * `deploy-scramble-intro.py` so the packed PNG stays byte-for-byte what the
   * asset report signed off, and so the order lives next to the measurement
   * that found it.
   */
  walk: scrambleClip('popt-walk', 'images/intro/tmb2/scramble/sprites/popt-walk-sheet.png', 26, 50, 12, { x: 13, y: 49 }, WALK_CYCLE.map(() => WALK_FRAME_MS), 'loop', WALK_CYCLE.map((step) => step.frame)),
  /** Backlit doorway silhouette, single held frame. */
  backlit: scrambleClip('popt-backlit', 'images/intro/tmb2/scramble/sprites/popt-backlit.png', 28, 64, 1, { x: 14, y: 63 }, [1000], 'hold-last'),
} as const satisfies Record<string, SpriteClip>

export type PoptClipId = keyof typeof POPT_CLIPS

export type SpriteActorFrame = {
  clipId: PoptClipId
  assetId: string
  sourceFrame: number
  x: number
  y: number
  scale: number
  rotation: number
  flipX: boolean
  opacity: number
}

export type IntroFxFrame =
  | { kind: 'sparkle'; x: number; y: number; size: number; opacity: number; tint: 'blue' | 'white' | 'gold' }
  | { kind: 'radial-rays'; x: number; y: number; scale: number; rotation: number; opacity: number }
  | { kind: 'beacon'; x: number; y: number; on: boolean }
  | { kind: 'beacon-sweep'; x: number; opacity: number }

export type IntroFxKind = IntroFxFrame['kind']

/**
 * The finale title, lettered by the runtime. The text comes from the game's
 * own config so the intro and the opening screen can never disagree, and so no
 * generated art has to carry text — which the asset pack forbids outright.
 */
export type IntroTitleFrame = {
  text: string
  x: number
  y: number
  opacity: number
}

/**
 * Small runtime lettering over generated art, centred on (x, y) in stage
 * pixels. The asset pack forbids text in generated images (the model garbles
 * it), so anything that must read as words — the case nameplate once, the book
 * covers now — is drawn by the runtime instead.
 */
export type IntroLabelFrame = {
  text: string
  x: number
  y: number
  /** Stage pixels tall. */
  sizePx: number
  /** 'dark' ink for light surfaces, 'light' for dark ones. */
  ink: 'dark' | 'light'
  opacity: number
}

/** A second full-frame image revealed over the background along an axis —
 * the floodlight row-slam (top-to-bottom) and the instrument panel waking
 * left-to-right between two generated states. */
export type IntroRevealFrame = {
  assetId: string
  progress: number
  axis: 'ltr' | 'ttb'
}

/** Sliding hangar-door leaves drawn over the actors; gap is the half-opening
 * in stage px from the doorway centreline at x=160. */
export type IntroDoorsFrame = { gap: number }

/** Runtime lettering over a generated blank plate (models garble type, so no
 * generated asset carries text — plan 0031 pack rule 2). */
/**
 * A punch-in camera: (x, y) is the focal stage point that stays put on screen
 * while the world scales around it by zoom; offsetX/offsetY displace the view
 * in screen space (shake). Identity draws exactly the untransformed stage.
 */
export type IntroCameraFrame = {
  zoom: number
  x: number
  y: number
  offsetX: number
  offsetY: number
}

export const IDENTITY_CAMERA: IntroCameraFrame = Object.freeze({
  zoom: 1,
  x: 160,
  y: 112,
  offsetX: 0,
  offsetY: 0,
})

/** A full-stage accent flash drawn above the card, below the Start handoff. */
export type IntroFlashFrame = {
  color: 'white' | 'red'
  opacity: number
}

/**
 * SEGA-style hitstop: the acting clock freezes at the accent for holdSeconds,
 * then catches back up to real time over catchupSeconds at a slightly faster
 * rate. Continuous everywhere, so the frame-step motion contract holds, and
 * fully resynced with the music once the catch-up window closes.
 */
export function hitstopTime(
  t: number,
  accentSeconds: number,
  holdSeconds: number,
  catchupSeconds = holdSeconds * 2.5,
): number {
  const since = t - accentSeconds
  if (since < 0) return t
  if (since < holdSeconds) return accentSeconds
  if (since < holdSeconds + catchupSeconds) {
    return accentSeconds
      + (since - holdSeconds) * ((holdSeconds + catchupSeconds) / catchupSeconds)
  }
  return t
}

/**
 * A push-in below this is invisible but still costs the stage its pixel grid,
 * so it snaps back to identity (plan 0030).
 */
const ZOOM_DEADZONE = 0.02

/**
 * Zoom rests at exactly 1 and is only ever lifted by a punch. Framing is
 * staged, never zoomed: a held fractional zoom point-samples every world draw
 * for the whole scene while moving nothing the eye can follow.
 */
function punchZoom(...lifts: readonly number[]): number {
  const lift = lifts.reduce((total, value) => total + value, 0)
  return lift < ZOOM_DEADZONE ? 1 : 1 + lift
}

/** Camera punch envelope: fast linear attack to 1, quadratic ease-out decay. */
export function accentPunch(t: number, accentSeconds: number, attack = 0.06, decay = 0.5): number {
  const since = t - accentSeconds
  if (since < 0 || since >= attack + decay) return 0
  if (since < attack) return since / attack
  const fall = (since - attack) / decay
  return (1 - fall) ** 2
}

/**
 * Deterministic decaying screen shake after an accent: offsets come from
 * fixed integer lattices quantized to 60 fps so the jitter is frame-coherent,
 * never random, and always lands on whole stage pixels.
 */
export function accentShake(
  t: number,
  accentSeconds: number,
  amplitude: number,
  duration = 0.4,
): { x: number; y: number } {
  const since = t - accentSeconds
  if (since < 0 || since >= duration) return { x: 0, y: 0 }
  const envelope = (1 - since / duration) ** 2
  const lattice = Math.floor(since * 60)
  const x = Math.round(amplitude * envelope * ((((lattice * 73 + 19) % 7) - 3) / 3))
  const y = Math.round(amplitude * envelope * ((((lattice * 41 + 7) % 5) - 2) / 2))
  return { x, y }
}

/** Accent flash envelope: full for the first third of the window, then falls. */
export function accentFlash(t: number, accentSeconds: number, duration = 0.18): number {
  const since = t - accentSeconds
  if (since < 0 || since >= duration) return 0
  const phase = since / duration
  return phase < 0.35 ? 1 : (1 - phase) / 0.65
}

export type IntroPropFrame = {
  id: 'cloud-puff'
  x: number
  y: number
  scale: number
  rotation: number
  opacity: number
}

export type IntroAnimationFrame = {
  sceneId: IntroSceneId
  sceneProgress: number
  backgroundAssetId: string | null
  backgroundOffsetX: number
  backgroundDim: number
  backgroundReveal: IntroRevealFrame | null
  doors: IntroDoorsFrame | null
  logo: { visible: boolean; buildProgress: number; highlightOpacity: number }
  popt: SpriteActorFrame | null
  cap: SpriteActorFrame | null
  props: readonly IntroPropFrame[]
  fx: readonly IntroFxFrame[]
  title: IntroTitleFrame | null
  labels: readonly IntroLabelFrame[]
  camera: IntroCameraFrame
  flash: IntroFlashFrame | null
}

export type HandoffFrame = {
  progress: number
  x: number
  y: number
  scale: number
  flashOpacity: number
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function easeInOut(value: number): number {
  const clamped = clamp01(value)
  return clamped < 0.5
    ? 2 * clamped * clamped
    : 1 - ((-2 * clamped + 2) ** 2) / 2
}

export function getSpriteFrame(clip: SpriteTiming, elapsedMs: number): number {
  if (clip.durations.length === 0) return 0
  const totalDuration = clip.durations.reduce((total, duration) => total + Math.max(1, duration), 0)
  const safeElapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0
  const clipElapsed = clip.loopMode === 'loop'
    ? safeElapsed % totalDuration
    : Math.min(safeElapsed, totalDuration - 1)
  let boundary = 0
  for (let index = 0; index < clip.durations.length; index += 1) {
    boundary += Math.max(1, clip.durations[index]!)
    if (clipElapsed < boundary) return index
  }
  return clip.durations.length - 1
}

function poptActor(
  clipId: PoptClipId,
  elapsedMs: number,
  x: number,
  y: number,
  /**
   * Stage pixels per sheet pixel. Must stay a whole number: the sheet is
   * point sampled (`imageSmoothingEnabled = false`), so a fractional scale
   * spreads one art pixel across an uneven 2-or-3 stage pixels.
   */
  scale = 1,
  rotation = 0,
  flipX = false,
  opacity = 1,
): SpriteActorFrame {
  const clip = POPT_CLIPS[clipId]
  const sequenceFrame = getSpriteFrame(clip, elapsedMs)
  return {
    clipId,
    assetId: clip.assetId,
    sourceFrame: clip.frameIndices[sequenceFrame] ?? clip.frameIndices.at(-1) ?? 0,
    x,
    y,
    scale,
    rotation,
    flipX,
    opacity,
  }
}


/**
 * Milliseconds elapsed since a story event, for once/hold-last clips whose
 * acting starts mid-scene rather than at the scene boundary.
 */
export function clipElapsedMs(normalizedTimeSeconds: number, eventStartSeconds: number): number {
  return Math.max(0, (normalizedTimeSeconds - eventStartSeconds) * 1_000)
}

function prop(
  id: IntroPropFrame['id'],
  x: number,
  y: number,
  scale = 1,
  rotation = 0,
  opacity = 1,
): IntroPropFrame {
  return { id, x, y, scale, rotation, opacity }
}

/** The anti-collision beacon flashes locked to the beat grid after light-off. */
export function beaconOn(timeSeconds: number): boolean {
  if (timeSeconds < INTRO_MUSIC_CUES.aircraftReveal) return false
  return ((timeSeconds - INTRO_MUSIC_CUES.aircraftReveal) / BEAT_GRID_SECONDS) % 1 < 0.14
}


/**
 * Reduced motion holds one curated representative story time per scene, so a
 * held pose is a deliberate mid-action frame rather than whatever the scene
 * midpoint happens to land on.
 */
const REPRESENTATIVE_SCENE_TIME: Partial<Record<IntroSceneId, number>> = {
  'beacon-dark': 7.2,
  ritual: 9.4,
  'suit-up': 13.5,
  doors: 19.6,
  'standing-alone': 22.2,
  'walk-out': 27,
  walk: 34.5,
  'aircraft-reveal': 36.4,
  inserts: 40.3,
  'right-seat': 48.4,
  title: 50.4,
}

/** Fx kinds that stay visible (frozen) under reduced motion. */
const REDUCED_MOTION_FX: ReadonlySet<IntroFxKind> = new Set(['radial-rays'])

/**
 * The one accent per scene that freezes the acting SEGA-style. Flashes and
 * camera punches keep running on real time through the hold.
 */
const SCENE_HITSTOP: Partial<Record<IntroSceneId, { accent: number; hold: number }>> = {
}

/** Montage helper: the latest beat at or before t, from [time, assetId] cuts. */
function activeCut<T>(t: number, cuts: ReadonlyArray<readonly [number, T]>): readonly [number, T] {
  let active = cuts[0]!
  for (const cut of cuts) {
    if (t >= cut[0]) active = cut
  }
  return active
}

/** Shared card-cut accents: a small punch into the subject and a white pop. */
function cardCutAccents(
  normalizedTime: number,
  cutSeconds: number,
  focal: { x: number; y: number } = { x: 160, y: 102 },
): { camera: IntroCameraFrame; flash: IntroFlashFrame | null } {
  const flashLevel = 0.35 * accentFlash(normalizedTime, cutSeconds, 0.1)
  return {
    camera: {
      zoom: punchZoom(0.1 * accentPunch(normalizedTime, cutSeconds, 0.04, 0.35)),
      x: focal.x,
      y: focal.y,
      offsetX: 0,
      offsetY: 0,
    },
    flash: flashLevel > 0 ? { color: 'white', opacity: flashLevel } : null,
  }
}

export function deriveIntroAnimation(timeSeconds: number, reducedMotion: boolean): IntroAnimationFrame {
  const normalizedTime = normalizeIntroTime(timeSeconds)
  const scene = getIntroScene(normalizedTime)
  const duration = scene.endSeconds - scene.startSeconds
  const rawProgress = clamp01((normalizedTime - scene.startSeconds) / duration)
  const hitstop = SCENE_HITSTOP[scene.id]
  const storyTime = reducedMotion
    ? REPRESENTATIVE_SCENE_TIME[scene.id] ?? scene.startSeconds + duration / 2
    : hitstop
      ? hitstopTime(normalizedTime, hitstop.accent, hitstop.hold)
      : normalizedTime
  const elapsedMs = (storyTime - scene.startSeconds) * 1_000
  const base: IntroAnimationFrame = {
    sceneId: scene.id,
    sceneProgress: rawProgress,
    backgroundAssetId: null,
    backgroundOffsetX: 0,
    backgroundDim: 0,
    backgroundReveal: null,
    doors: null,
    logo: { visible: false, buildProgress: 0, highlightOpacity: 0 },
    popt: null,
    cap: null,
    props: [],
    fx: [],
    title: null,
    labels: [],
    camera: IDENTITY_CAMERA,
    flash: null,
  }
  const CUES = INTRO_MUSIC_CUES

  const frame = ((): IntroAnimationFrame => {
  switch (scene.id) {
    case 'tmb2-ident': {
      // The hat gag (plan 0034): the logo slams together, Pop T sprints in and
      // skids, the slam gusts his cap down over his eyes, it slides onto his
      // forearm, he flicks it back up, it lands crooked, he straightens it and
      // salutes. Beats sit on the 0.72 s accent grid extrapolated from the
      // measured cues. He is never separated from the cap.
      if (reducedMotion) {
        return { ...base, logo: { visible: true, buildProgress: 1, highlightOpacity: 0 } }
      }
      const t = storyTime
      const ENTER = 1.776
      const SKID = 2.496
      const BLIND = 3.216
      const FLICK = 3.936
      const CROOKED = 4.656
      const SALUTE = 5.376
      const GROUND = 196
      const fx: IntroFxFrame[] = []
      const props: IntroPropFrame[] = []

      // Twelve poses instead of six: the key poses still land on the 0.72 s
      // accents, and the Wave S13 in-betweens fill the gaps, taking the gag
      // from 1.9 poses/sec to roughly 4 (owner note 2026-08-20).
      const GAG: ReadonlyArray<readonly [number, PoptClipId]> = [
        [SKID, 'skid'],
        [2.856, 'tip'],
        [BLIND, 'blinded'],
        [3.456, 'cover'],
        [3.696, 'fall'],
        [FLICK, 'forearm'],
        [4.176, 'swing'],
        [4.416, 'flick'],
        [CROOKED, 'lookup'],
        [4.896, 'crooked'],
        [5.136, 'landed'],
        [SALUTE, 'salute'],
      ]

      // The cap is in the air between the flick and the moment it lands askew.
      const CAP_LAUNCH = 4.5
      const CAP_LAND = 4.896

      let popt: SpriteActorFrame | null = null
      let cap: SpriteActorFrame | null = null
      if (t >= SALUTE + 0.34) {
        const runOff = t - (SALUTE + 0.34)
        popt = poptActor('run', clipElapsedMs(t, SALUTE + 0.34), 168 + (runOff / 0.29) * 190, GROUND)
      } else if (t >= SKID) {
        let chosen: readonly [number, PoptClipId] = GAG[0]!
        for (const entry of GAG) if (t >= entry[0]) chosen = entry
        if (chosen[1] === 'skid') {
          const skidSlide = 1 - (1 - clamp01((t - SKID) / 0.3)) ** 2
          popt = poptActor('skid', clipElapsedMs(t, SKID), 138 + 30 * skidSlide, GROUND)
          if (t < SKID + 0.55) {
            props.push(
              prop('cloud-puff', 126 + 20 * skidSlide, GROUND + 6, 0.28, 0, 0.5 * (1 - (t - SKID) / 0.55)),
            )
          }
        } else {
          popt = poptActor(chosen[1], clipElapsedMs(t, chosen[0]), 168, GROUND)
        }
        // The cap's flight, interpolated rather than cut: it leaves his hand at
        // the flick, arcs up over him and drops onto his head. Continuous, so
        // it moves at whatever rate the browser draws.
        if (t >= CAP_LAUNCH && t < CAP_LAND) {
          const flight = clamp01((t - CAP_LAUNCH) / (CAP_LAND - CAP_LAUNCH))
          cap = poptActor(
            'cap',
            0,
            Math.round(184 - 22 * flight),
            Math.round(GROUND - 62 - 46 * Math.sin(Math.PI * flight)),
            1,
            flight * Math.PI * 2.5,
          )
        }
      } else if (t >= ENTER) {
        popt = poptActor('run', clipElapsedMs(t, ENTER), -24 + ((t - ENTER) / (SKID - ENTER)) * 162, GROUND)
      }

      // The straighten sparkle rides the crooked-to-salute correction.
      if (t >= SALUTE && t < SALUTE + 0.5) {
        const fade = 1 - (t - SALUTE) / 0.5
        for (let index = 0; index < 3; index += 1) {
          const twinkle = (t - SALUTE) * 3.4 + index * 2.1
          fx.push({
            kind: 'sparkle',
            x: 156 + index * 14 + Math.sin(twinkle) * 3,
            y: 128 + Math.cos(twinkle * 0.8) * 4,
            size: 1 + (index % 2),
            opacity: (0.55 + 0.35 * Math.sin(twinkle * 1.4)) * fade,
            tint: index === 1 ? 'white' : 'gold',
          })
        }
      }

      const zoom = punchZoom(0.16 * accentPunch(t, SKID))
      const shake = accentShake(t, SKID, 2.5, 0.35)
      const flashLevel = accentFlash(t, SKID, 0.15)
      return {
        ...base,
        logo: {
          visible: true,
          buildProgress: clamp01(t / 1.7),
          highlightOpacity: clamp01((t - SKID) / (BLIND - SKID)),
        },
        popt,
        cap,
        fx,
        props,
        camera: { zoom, x: 160, y: 128, offsetX: shake.x, offsetY: shake.y },
        flash: flashLevel > 0 ? { color: 'white', opacity: 0.5 * flashLevel } : null,
      }
    }
    case 'beacon-dark': {
      // A lone beacon sweep crossing the black — the breath before the ritual.
      const p = clamp01((storyTime - 6) / (CUES.bootsDown - 6))
      return {
        ...base,
        fx: [{ kind: 'beacon-sweep', x: -40 + 400 * p, opacity: 0.8 }],
      }
    }
    case 'ritual': {
      // Hard-cut stills on the measured beats. Every card is a full-frame
      // generated plate.
      const t = storyTime
      const cuts = [
        [CUES.bootsDown, 'card-boots'],
        [CUES.coffeeDown, 'card-coffee'],
      ] as const
      const [cutTime, assetId] = activeCut(t, cuts)
      const accents = cardCutAccents(normalizedTime, cutTime)
      return { ...base, backgroundAssetId: assetId, ...accents }
    }
    case 'suit-up': {
      // The montage: six identity beats, each a generated card, each cut
      // landing on its cue with a punch. Two-frame cards snap to their second
      // frame a fraction after the cut so the action lands on the beat.
      const t = storyTime
      // Owner order (2026-08-20): cap flip, wings, four stripes, watch,
      // logbook, aviators. The hat is caught FIRST so every later card may
      // wear it, and the four stripes take the track's largest hit.
      const cuts = [
        [
          CUES.capFlip,
          t >= CUES.capFlip + 0.5
            ? 'card-cap-b'
            : t >= CUES.capFlip + 0.25
              ? 'card-cap-mid'
              : 'card-cap-a',
        ],
        [CUES.wingsPinned, 'card-wings'],
        [CUES.fourStripes, 'card-stripes'],
        [CUES.watchCheck, 'card-watch'],
      ] as const
      const [cutTime, assetId] = activeCut(t, cuts)
      const accents = cardCutAccents(normalizedTime, cutTime)
      const fx: IntroFxFrame[] = []
      if (assetId === 'card-wings') {
        for (let index = 0; index < 3; index += 1) {
          const twinkle = t * 3 + index * 2.1
          if (Math.sin(twinkle) > 0.2) {
            fx.push({
              kind: 'sparkle',
              x: 130 + index * 32,
              y: 78 + (index % 2) * 10,
              size: 1 + (index % 2),
              opacity: 0.7,
              tint: 'gold',
            })
          }
        }
      }
      if (assetId === 'card-watch' && t >= CUES.watchCheck + 0.15 && t < CUES.watchCheck + 0.55) {
        const fade = 1 - (t - CUES.watchCheck - 0.15) / 0.4
        fx.push({ kind: 'sparkle', x: 190, y: 122, size: 2, opacity: 0.9 * fade, tint: 'gold' })
      }
      if (assetId === 'card-cap-b' && t < CUES.capFlip + 0.9) {
        const fade = 1 - (t - CUES.capFlip - 0.5) / 0.4
        fx.push({ kind: 'sparkle', x: 160, y: 128, size: 2, opacity: 0.85 * fade, tint: 'gold' })
      }
      return { ...base, backgroundAssetId: assetId, fx, ...accents }
    }
    case 'doors': {
      // The gates themselves open on the 18 s "standing there alone" downbeat
      // (owner: the release-lever insert stole the hit this lyric asks for).
      // The leaves grind apart around his backlit silhouette for the full
      // three seconds of the vocal, easing to the gap the shadow hold keeps.
      const t = storyTime
      const accents = cardCutAccents(normalizedTime, CUES.doorsParting)
      const p = easeInOut(clamp01((t - CUES.doorsParting) / (CUES.standingAlone - CUES.doorsParting)))
      return {
        ...base,
        backgroundAssetId: 'plate-doorway',
        doors: { gap: Math.round(10 + 26 * p) },
        popt: poptActor('backlit', elapsedMs, 160, 208),
        ...accents,
      }
    }
    case 'walk-out': {
      // The suit-up on the way out: four beats noticed as he goes, with the
      // shades going on as he steps into the light. The logbook beat is a
      // two-state story (owner, 2026-08-20): his reading pile — the white
      // Isaacson biography and the road-worn Reacher paperbacks — swept aside
      // to reach the logbook underneath. The covers are drawn textless per the
      // pack rule; the runtime letters them.
      const t = storyTime
      // The logbook beat animates in four stages: the pile, the mid-sweep, the
      // hand settling on the bare log, and the log lifted in the hand
      // (owner, 2026-08-20). Each stage is a full generated frame of the same
      // continuous motion.
      const logbookStage = (sinceSeconds: number): typeof LOGBOOK_STAGES[number][1] => {
        let stage: typeof LOGBOOK_STAGES[number][1] = LOGBOOK_STAGES[0]![1]
        for (const [offset, assetId] of LOGBOOK_STAGES) if (sinceSeconds >= offset) stage = assetId
        return stage
      }
      const cuts = [
        [CUES.logbookSnap, logbookStage(t - CUES.logbookSnap)],
        [CUES.headsetUp, 'card-headset'],
        [CUES.shadesDown, 'card-shades'],
      ] as const
      const [cutTime, assetId] = activeCut(t, cuts)
      const liftTime = CUES.logbookSnap + (LOGBOOK_STAGES[3]?.[0] ?? 2.4)
      const accents = cardCutAccents(
        normalizedTime,
        assetId === 'card-logbook-lift' ? liftTime : cutTime,
      )
      const fx: IntroFxFrame[] = []
      const labels: IntroLabelFrame[] = []
      if (assetId === 'card-logbook-books') {
        const settle = clamp01((t - CUES.logbookSnap) / 0.25)
        for (const spot of BOOK_LABELS) labels.push({ ...spot, opacity: settle })
      }
      if (assetId === 'card-logbook') {
        // The pile is swept clear and the logbook reads as what it is.
        const settle = clamp01((t - (CUES.logbookSnap + 1.6)) / 0.25)
        labels.push({ text: 'FLIGHT LOG', x: 128, y: 114, sizePx: 7, ink: 'light', opacity: settle })
        labels.push({ text: 'CAPT. POP T', x: 128, y: 126, sizePx: 5, ink: 'light', opacity: settle })
      }
      if (assetId === 'card-logbook-lift') {
        // The lifted cover carries the same lettering, larger with the book.
        const settle = clamp01((t - (CUES.logbookSnap + 2.4)) / 0.2)
        for (const spot of LIFT_LABELS) labels.push({ ...spot, opacity: settle })
      }
      if (assetId === 'card-shades' && t < CUES.shadesDown + 0.35) {
        const fade = 1 - (t - CUES.shadesDown) / 0.35
        fx.push({ kind: 'sparkle', x: 118, y: 96, size: 2, opacity: 0.9 * fade, tint: 'white' })
        fx.push({ kind: 'sparkle', x: 206, y: 96, size: 2, opacity: 0.9 * fade, tint: 'white' })
      }
      return { ...base, backgroundAssetId: assetId, fx, labels, ...accents }
    }
    case 'standing-alone': {
      // The track's deepest quiet (measured 30.5-32.0 s). No accent, no shake,
      // no flash, and — owner call 2026-08-21 — no push-in either: the shot
      // holds dead still. The creep it used to carry moved 0.067 px a frame,
      // inside the band plan 0030 measured as invisible, while costing this
      // scene's whole 2.4 s hold its pixel grid. It is the strongest frame in
      // the intro; it now sits on the grid for every frame of it.
      return { ...base, backgroundAssetId: 'card-shadow' }
    }
    case 'walk': {
      // The scale shot: the 48 px walk cycle striding out toward the looming
      // nose. How far he gets is not a choice — his own drawn stride sets it
      // (see WALK_CYCLE), which at 2.22 steps a second carries him 54 px in
      // the shot's 4.04 s and stops him short of the nose gear he used to end
      // up standing inside.
      return {
        ...base,
        backgroundAssetId: 'plate-walk-tarmac',
        popt: poptActor('walk', elapsedMs, WALK_START_X + walkAdvance(elapsedMs), 196),
      }
    }
    case 'aircraft-reveal': {
      // The plane, with him. Floodlight rows slam down the dark plate and the
      // Northwest DC-9 is there; two beats later its engine lights off and the
      // anti-collision beacon starts flashing and never stops again. The old
      // hangar-reveal and engine-start scenes merged here when the owner moved
      // the aircraft to the end of the ground act (2026-08-20).
      const t = storyTime
      const shake = accentShake(normalizedTime, CUES.aircraftReveal, 3.5, 0.4)
      const flashLevel = 0.55 * accentFlash(normalizedTime, CUES.aircraftReveal, 0.2)
      const fx: IntroFxFrame[] = [{ kind: 'beacon', x: 268, y: 32, on: beaconOn(storyTime) }]
      return {
        ...base,
        backgroundAssetId: 'plate-hangar-dark',
        backgroundReveal: {
          assetId: 'plate-hangar-reveal',
          progress: clamp01((t - CUES.aircraftReveal) / 0.36),
          axis: 'ttb',
        },
        fx,
        camera: {
          zoom: punchZoom(0.16 * accentPunch(normalizedTime, CUES.aircraftReveal)),
          x: 160,
          y: 140,
          offsetX: shake.x,
          offsetY: shake.y,
        },
        flash: flashLevel > 0 ? { color: 'white', opacity: flashLevel } : null,
      }
    }
    case 'inserts': {
      // The departure plays from INSIDE (owner cut the runway lineup act): the
      // panel wakes, the overhead sweeps on, the engines light off, then the
      // hand settles on the throttles and pushes them up on 45.12, and the
      // panel surges on the 46.008 rotate.
      const t = storyTime
      // The nacelle spools through its three generated states.
      const nacelleStage = (since: number): 'card-nacelle-a' | 'card-nacelle-b' | 'card-nacelle-c' =>
        since < 0.6 ? 'card-nacelle-a' : since < 1.2 ? 'card-nacelle-b' : 'card-nacelle-c'
      const cuts = [
        [CUES.instrumentsAlive, 'card-instruments'],
        [CUES.overheadPanel, 'card-overhead'],
        [CUES.nacelleLight, nacelleStage(t - CUES.nacelleLight)],
        [CUES.handOnThrottles, 'card-throttles-a'],
        [CUES.throttlesUp, 'card-throttles-b'],
      ] as const
      const [cutTime, assetId] = activeCut(t, cuts)
      const accents = cardCutAccents(normalizedTime, cutTime)
      const fx: IntroFxFrame[] = [{ kind: 'beacon', x: 268, y: 32, on: beaconOn(storyTime) }]
      let reveal: IntroRevealFrame | null = null
      if (assetId === 'card-instruments') {
        reveal = {
          assetId: 'card-instruments-b',
          progress: clamp01((t - CUES.instrumentsAlive) / 0.6),
          axis: 'ltr',
        }
      }
      // Rotate: the panel surges and the airframe rumbles on whole pixels.
      const rotateFlash = 0.5 * accentFlash(normalizedTime, CUES.rotate, 0.2)
      const shake = accentShake(normalizedTime, CUES.rotate, 2.5, 0.35)
      let offsetX = accents.camera.offsetX + shake.x
      let offsetY = accents.camera.offsetY + shake.y
      if (normalizedTime >= CUES.throttlesUp && normalizedTime < CUES.intoTheSeat) {
        const lattice = Math.floor(normalizedTime * 60)
        offsetX += ((lattice * 73 + 19) % 3) - 1
        offsetY += ((lattice * 41 + 7) % 3) - 1
      }
      return {
        ...base,
        backgroundAssetId: assetId,
        backgroundReveal: reveal,
        fx,
        camera: { ...accents.camera, offsetX, offsetY },
        flash: rotateFlash > 0
          ? { color: 'white', opacity: Math.max(rotateFlash, accents.flash?.opacity ?? 0) }
          : accents.flash,
      }
    }
    case 'right-seat': {
      // Hard cut inside. The first officer's seat is empty, harness loose, the
      // panel awake — the seat the player takes the moment they press start.
      const t = storyTime
      const settle = clamp01((t - CUES.intoTheSeat) / 0.5)
      const shake = accentShake(normalizedTime, CUES.intoTheSeat, 2, 0.3)
      const cutFlash = 0.5 * accentFlash(normalizedTime, CUES.intoTheSeat, 0.18)
      return {
        ...base,
        backgroundAssetId: 'plate-right-seat',
        // A breath of extra dark on the cut that lifts as the eye settles.
        backgroundDim: 0.45 * (1 - settle),
        camera: {
          zoom: punchZoom(0.12 * accentPunch(normalizedTime, CUES.intoTheSeat)),
          x: 160,
          y: 120,
          offsetX: shake.x,
          offsetY: shake.y,
        },
        flash: cutFlash > 0 ? { color: 'white', opacity: cutFlash } : null,
      }
    }
    case 'title': {
      // The instrument glow resolves into the game's own title over the seat.
      const t = storyTime
      const reveal = clamp01((t - CUES.titleCard) / 0.26)
      const shake = accentShake(normalizedTime, CUES.titleCard, 2, 0.3)
      const stampFlash = 0.6 * accentFlash(normalizedTime, CUES.titleCard, 0.22)
      return {
        ...base,
        backgroundAssetId: 'plate-right-seat',
        fx: [{
          kind: 'radial-rays',
          x: 160,
          y: TITLE_CARD.y,
          scale: 1,
          rotation: (t - CUES.titleCard) * 0.35,
          opacity: 0.4 * reveal,
        }],
        camera: { zoom: 1, x: 160, y: 120, offsetX: shake.x, offsetY: shake.y },
        flash: stampFlash > 0 ? { color: 'white', opacity: stampFlash } : null,
        title: { ...TITLE_CARD, opacity: reveal },
      }
    }
  }
  })()

  if (!reducedMotion) return frame
  return {
    ...frame,
    fx: frame.fx.filter((fx) => REDUCED_MOTION_FX.has(fx.kind)),
    camera: IDENTITY_CAMERA,
    flash: null,
  }
}

/** The Start handoff zooms the lettered title out of the finale card and
 * whites out into the menu, so pressing Start walks through the game's own
 * name and into the seat the last frame was holding. */
export function deriveHandoffAnimation(progress: number): HandoffFrame {
  const safeProgress = clamp01(progress)
  const eased = easeInOut(safeProgress)
  return {
    progress: safeProgress,
    x: TITLE_CARD.x,
    y: TITLE_CARD.y,
    scale: 1 + eased * 3.5,
    flashOpacity: safeProgress === 1 ? 1 : clamp01((safeProgress - 0.55) / 0.45),
  }
}
