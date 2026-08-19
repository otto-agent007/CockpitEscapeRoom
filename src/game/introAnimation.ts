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
    frameIndices: durations.map((_, index) => index),
  }
}

export const POPT_CLIPS = {
  /** The Wave S4 ident acting, replacing the retired legacy 256-cell sheets:
   * a 64 px six-phase run, the comic skid, and the triumphant tap pose. */
  run: scrambleClip('popt-run', 'images/intro/tmb2/scramble/sprites/popt-run-sheet.png', 44, 66, 6, { x: 22, y: 65 }, [80, 80, 80, 80, 80, 80], 'loop'),
  skid: scrambleClip('popt-skid', 'images/intro/tmb2/scramble/sprites/popt-skid.png', 45, 56, 1, { x: 22, y: 55 }, [1000], 'hold-last'),
  tap: scrambleClip('popt-tap', 'images/intro/tmb2/scramble/sprites/popt-tap.png', 34, 72, 1, { x: 17, y: 71 }, [1000], 'hold-last'),
  /** The Wave S4 walk cycle: 48 px figure in a 26×50 cell, feet on row 49. */
  walk: scrambleClip('popt-walk', 'images/intro/tmb2/scramble/sprites/popt-walk-sheet.png', 26, 50, 6, { x: 13, y: 49 }, [130, 130, 130, 130, 130, 130], 'loop'),
  /** Backlit doorway silhouette, single held frame. */
  backlit: scrambleClip('popt-backlit', 'images/intro/tmb2/scramble/sprites/popt-backlit.png', 28, 64, 1, { x: 14, y: 63 }, [1000], 'hold-last'),
} as const satisfies Record<string, SpriteClip>

/** The DC-9 sprites. The liftoff pass swaps pre-rendered sizes so every draw
 * keeps a whole-number scale (plan 0030 contract). */
export const JET_CLIPS = {
  runway: scrambleClip('dc9-runway', 'images/intro/tmb2/scramble/sprites/dc9-runway.png', 52, 18, 1, { x: 26, y: 17 }, [1000], 'hold-last'),
  'runway-36': scrambleClip('dc9-runway-36', 'images/intro/tmb2/scramble/sprites/dc9-runway-36.png', 36, 12, 1, { x: 18, y: 11 }, [1000], 'hold-last'),
  'runway-26': scrambleClip('dc9-runway-26', 'images/intro/tmb2/scramble/sprites/dc9-runway-26.png', 26, 9, 1, { x: 13, y: 8 }, [1000], 'hold-last'),
  'liftoff-48': scrambleClip('dc9-liftoff-48', 'images/intro/tmb2/scramble/sprites/dc9-liftoff-48.png', 48, 22, 1, { x: 24, y: 11 }, [1000], 'hold-last'),
  'liftoff-80': scrambleClip('dc9-liftoff-80', 'images/intro/tmb2/scramble/sprites/dc9-liftoff-80.png', 80, 36, 1, { x: 40, y: 18 }, [1000], 'hold-last'),
  'liftoff-160': scrambleClip('dc9-liftoff-160', 'images/intro/tmb2/scramble/sprites/dc9-liftoff-160.png', 160, 72, 1, { x: 80, y: 36 }, [1000], 'hold-last'),
  'liftoff-320': scrambleClip('dc9-liftoff-320', 'images/intro/tmb2/scramble/sprites/dc9-liftoff-320.png', 320, 143, 1, { x: 160, y: 71 }, [1000], 'hold-last'),
} as const satisfies Record<string, SpriteClip>

export type PoptClipId = keyof typeof POPT_CLIPS
export type JetClipId = keyof typeof JET_CLIPS

export type SpriteActorFrame = {
  clipId: PoptClipId | JetClipId
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
  | { kind: 'runway-lights'; speed: number; phase: number }
  | { kind: 'nav-strobe'; x: number; y: number; on: boolean }
  | { kind: 'exhaust'; x: number; y: number; intensity: number }
  | { kind: 'contrail'; progress: number }

export type IntroFxKind = IntroFxFrame['kind']

export type IntroCardFrame = {
  assetId: 'emblem-finale'
  x: number
  y: number
  scale: number
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
export type IntroNameplateFrame = { text: string; x: number; y: number }

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
  nameplate: IntroNameplateFrame | null
  logo: { visible: boolean; buildProgress: number; highlightOpacity: number }
  popt: SpriteActorFrame | null
  jet: SpriteActorFrame | null
  props: readonly IntroPropFrame[]
  fx: readonly IntroFxFrame[]
  card: IntroCardFrame | null
  camera: IntroCameraFrame
  flash: IntroFlashFrame | null
  pixelCollapse: number
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

function jetActor(clipId: JetClipId, x: number, y: number): SpriteActorFrame {
  const clip = JET_CLIPS[clipId]
  return {
    clipId,
    assetId: clip.assetId,
    sourceFrame: 0,
    x,
    y,
    scale: 1,
    rotation: 0,
    flipX: false,
    opacity: 1,
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

/**
 * Owner-comparison switch for the finale card reveal: 'stamp' pops in 16-bit
 * style (0.9 scale for the first beat, then 1.0); 'eased' zooms 0.9 -> 1.0
 * over half a second.
 */
export const EMBLEM_REVEAL_STYLE: 'stamp' | 'eased' = 'stamp'

function emblemCardScale(sinceStampSeconds: number): number {
  if (EMBLEM_REVEAL_STYLE === 'eased') {
    return 0.9 + 0.1 * easeInOut(clamp01(sinceStampSeconds / 0.5))
  }
  return sinceStampSeconds < 0.08 ? 0.9 : 1
}

/** The runtime letters the generated blank nameplate (pack rule: no generated
 * text). Measured centre of the plate in both case cards: (175, 141). */
const CASE_NAMEPLATE: IntroNameplateFrame = Object.freeze({ text: 'CAPT. POP T', x: 175, y: 141 })

/** The anti-collision beacon flashes locked to the beat grid after light-off. */
export function beaconOn(timeSeconds: number): boolean {
  if (timeSeconds < INTRO_MUSIC_CUES.engineStart) return false
  return ((timeSeconds - INTRO_MUSIC_CUES.engineStart) / BEAT_GRID_SECONDS) % 1 < 0.14
}

/** Wing-tip strobes double-blink on a fixed deterministic cycle. */
function strobeOn(timeSeconds: number): boolean {
  return (Math.floor(timeSeconds * 10) % 12) < 2
}

/**
 * Reduced motion holds one curated representative story time per scene, so a
 * held pose is a deliberate mid-action frame rather than whatever the scene
 * midpoint happens to land on.
 */
const REPRESENTATIVE_SCENE_TIME: Partial<Record<IntroSceneId, number>> = {
  'beacon-dark': 7.2,
  ritual: 10.6,
  'hangar-reveal': 14.2,
  'suit-up': 21.7,
  doors: 29.3,
  shades: 30.9,
  walk: 33.5,
  'engine-start': 37.5,
  inserts: 40.3,
  takeoff: 44,
  title: 50.4,
}

/** Fx kinds that stay visible (frozen) under reduced motion. */
const REDUCED_MOTION_FX: ReadonlySet<IntroFxKind> = new Set(['runway-lights', 'contrail', 'radial-rays'])

/**
 * The one accent per scene that freezes the acting SEGA-style. Flashes and
 * camera punches keep running on real time through the hold.
 */
const SCENE_HITSTOP: Partial<Record<IntroSceneId, { accent: number; hold: number }>> = {
  takeoff: { accent: INTRO_MUSIC_CUES.jetPass, hold: 0.12 },
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
  const sceneProgress = reducedMotion
    ? clamp01((storyTime - scene.startSeconds) / duration)
    : rawProgress
  const elapsedMs = (storyTime - scene.startSeconds) * 1_000
  const base: IntroAnimationFrame = {
    sceneId: scene.id,
    sceneProgress: rawProgress,
    backgroundAssetId: null,
    backgroundOffsetX: 0,
    backgroundDim: 0,
    backgroundReveal: null,
    doors: null,
    nameplate: null,
    logo: { visible: false, buildProgress: 0, highlightOpacity: 0 },
    popt: null,
    jet: null,
    props: [],
    fx: [],
    card: null,
    camera: IDENTITY_CAMERA,
    flash: null,
    pixelCollapse: 0,
  }
  const CUES = INTRO_MUSIC_CUES

  const frame = ((): IntroAnimationFrame => {
  switch (scene.id) {
    case 'tmb2-ident': {
      // SEGA-style ident gag (plan 0028, owner-approved, kept unchanged by
      // plan 0031): the logo slams together fast, Pop T sprints in, skids at
      // the sight of it, taps it on the beat — the tap ignites the gold-white
      // overload — then he sprints off into the story. Beats sit on the
      // 0.72 s accent grid extrapolated from the measured cues.
      if (reducedMotion) {
        return { ...base, logo: { visible: true, buildProgress: 1, highlightOpacity: 0 } }
      }
      const t = storyTime
      const ENTER = 1.776
      const SKID = 2.496
      const TAP = 3.936
      const FLARE = 4.656
      const EXIT = 5.376
      const fx: IntroFxFrame[] = []
      const props: IntroPropFrame[] = []

      let popt: SpriteActorFrame | null = null
      if (t >= EXIT) {
        popt = poptActor('run', clipElapsedMs(t, EXIT), 130 + ((t - EXIT) / (6 - EXIT)) * 218, 190)
      } else if (t >= TAP) {
        popt = poptActor('tap', clipElapsedMs(t, TAP), 130, 190)
      } else if (t >= SKID) {
        const skidSlide = 1 - (1 - clamp01((t - SKID) / 0.3)) ** 2
        popt = poptActor('skid', clipElapsedMs(t, SKID), 100 + 30 * skidSlide, 190)
        if (t < SKID + 0.55) {
          props.push(
            prop('cloud-puff', 88 + 20 * skidSlide, 196, 0.28, 0, 0.5 * (1 - (t - SKID) / 0.55)),
          )
        }
      } else if (t >= ENTER) {
        popt = poptActor('run', clipElapsedMs(t, ENTER), -24 + ((t - ENTER) / (SKID - ENTER)) * 124, 190)
      }

      if (t >= FLARE && t < 5.7) {
        for (let index = 0; index < 3; index += 1) {
          const twinkle = (t - FLARE) * 3.1 + index * 2.3
          fx.push({
            kind: 'sparkle',
            x: 64 + index * 96 + Math.sin(twinkle) * 5,
            y: 78 + Math.cos(twinkle * 0.7) * 4,
            size: 2 + (index % 2),
            opacity: 0.6 + 0.3 * Math.sin(twinkle * 1.4),
            tint: index === 1 ? 'white' : 'gold',
          })
        }
      }

      const zoom = punchZoom(0.16 * accentPunch(t, TAP))
      const shake = accentShake(t, TAP, 2.5, 0.35)
      const flashLevel = accentFlash(t, TAP, 0.15)
      return {
        ...base,
        logo: {
          visible: true,
          buildProgress: clamp01(t / 1.7),
          highlightOpacity: clamp01((t - TAP) / (FLARE - TAP)),
        },
        popt,
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
      // generated plate; the runtime letters the blank nameplate.
      const t = storyTime
      const cuts = [
        [CUES.bootsDown, 'card-boots'],
        [CUES.coffeeDown, 'card-coffee'],
        [CUES.flightCase, 'card-flight-case'],
        [CUES.latchesSnap, 'card-flight-case-shut'],
      ] as const
      const [cutTime, assetId] = activeCut(t, cuts)
      const accents = cardCutAccents(normalizedTime, cutTime)
      const fx: IntroFxFrame[] = []
      if (assetId === 'card-flight-case-shut' && t < CUES.latchesSnap + 0.4) {
        // Snap ticks at the two latch positions.
        const fade = 1 - (t - CUES.latchesSnap) / 0.4
        for (const [lx, ly] of [[100, 116], [230, 116]] as const) {
          fx.push({ kind: 'sparkle', x: lx, y: ly, size: 2, opacity: 0.9 * fade, tint: 'gold' })
          fx.push({ kind: 'sparkle', x: lx + 6, y: ly - 6, size: 1, opacity: 0.7 * fade, tint: 'white' })
        }
      }
      return {
        ...base,
        backgroundAssetId: assetId,
        nameplate: assetId.startsWith('card-flight-case') ? CASE_NAMEPLATE : null,
        fx,
        ...accents,
      }
    }
    case 'hangar-reveal': {
      // The track's biggest hit: floodlight rows slam down the dark plate and
      // the Northwest DC-9 appears. Two generated states, revealed
      // top-to-bottom on the accent — no code-drawn lighting.
      const t = storyTime
      const progress = clamp01((t - CUES.hangarReveal) / 0.36)
      const shake = accentShake(normalizedTime, CUES.hangarReveal, 3.5, 0.4)
      const flashLevel = 0.55 * accentFlash(normalizedTime, CUES.hangarReveal, 0.2)
      return {
        ...base,
        backgroundAssetId: 'plate-hangar-dark',
        backgroundReveal: { assetId: 'plate-hangar-reveal', progress, axis: 'ttb' },
        camera: {
          zoom: punchZoom(0.16 * accentPunch(normalizedTime, CUES.hangarReveal)),
          x: 160,
          y: 140,
          offsetX: shake.x,
          offsetY: shake.y,
        },
        flash: flashLevel > 0 ? { color: 'white', opacity: flashLevel } : null,
      }
    }
    case 'suit-up': {
      // The montage: five identity beats, each a generated card, each cut
      // landing on its cue with a punch. Two-frame cards snap to their second
      // frame a fraction after the cut so the action lands on the beat.
      const t = storyTime
      // Continuity: the hat is caught FIRST, so every later card may wear it;
      // the watch check closes the montage as the "time to go" button into
      // the doors (owner reorder 2026-08-18).
      const cuts = [
        [
          CUES.capFlip,
          t >= CUES.capFlip + 0.5
            ? 'card-cap-b'
            : t >= CUES.capFlip + 0.25
              ? 'card-cap-mid'
              : 'card-cap-a',
        ],
        [CUES.fourStripes, 'card-stripes'],
        [CUES.logbookSnap, 'card-logbook'],
        [CUES.wingsPinned, 'card-wings'],
        [CUES.watchCheck, 'card-watch'],
      ] as const
      const [cutTime, assetId] = activeCut(t, cuts)
      const accents = cardCutAccents(normalizedTime, cutTime)
      const fx: IntroFxFrame[] = []
      if (assetId === 'card-watch' && t >= CUES.watchCheck + 0.15 && t < CUES.watchCheck + 0.55) {
        // One glint on the clasp as he checks the time.
        const fade = 1 - (t - CUES.watchCheck - 0.15) / 0.4
        fx.push({ kind: 'sparkle', x: 190, y: 122, size: 2, opacity: 0.9 * fade, tint: 'gold' })
      }
      if (assetId === 'card-logbook' && t < CUES.logbookSnap + 0.4) {
        // The log snaps shut on the click accent.
        const fade = 1 - (t - CUES.logbookSnap) / 0.4
        fx.push({ kind: 'sparkle', x: 150, y: 104, size: 2, opacity: 0.9 * fade, tint: 'gold' })
        fx.push({ kind: 'sparkle', x: 182, y: 112, size: 1, opacity: 0.7 * fade, tint: 'white' })
      }
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
      if (assetId === 'card-cap-b' && t < CUES.capFlip + 0.9) {
        const fade = 1 - (t - CUES.capFlip - 0.5) / 0.4
        fx.push({ kind: 'sparkle', x: 160, y: 128, size: 2, opacity: 0.85 * fade, tint: 'gold' })
      }
      return { ...base, backgroundAssetId: assetId, fx, ...accents }
    }
    case 'doors': {
      // The leaves grind open around the backlit silhouette. The doorway
      // aperture in the plate spans x 119–200 (measured), so the gap eases
      // from a crack to the full opening.
      const p = easeInOut(sceneProgress)
      return {
        ...base,
        backgroundAssetId: 'plate-doorway',
        doors: { gap: Math.round(6 + 38 * p) },
        popt: poptActor('backlit', elapsedMs, 160, 208),
      }
    }
    case 'shades': {
      const shake = accentShake(normalizedTime, CUES.shadesDown, 2, 0.3)
      const accents = cardCutAccents(normalizedTime, CUES.shadesDown, { x: 160, y: 100 })
      return {
        ...base,
        backgroundAssetId: 'card-shades',
        camera: { ...accents.camera, offsetX: shake.x, offsetY: shake.y },
        flash: accents.flash
          ? { color: 'white', opacity: Math.max(accents.flash.opacity, 0.45 * accentFlash(normalizedTime, CUES.shadesDown, 0.12)) }
          : null,
      }
    }
    case 'walk': {
      // The scale shot: the 34 px walk cycle crossing toward the looming nose.
      const p = clamp01((storyTime - 31.5) / (CUES.engineStart - 31.5))
      return {
        ...base,
        backgroundAssetId: 'plate-walk-tarmac',
        popt: poptActor('walk', elapsedMs, Math.round(50 + 120 * p), 196),
      }
    }
    case 'engine-start': {
      // Light-off: still nacelle → blades turning → full-spin disc, and the
      // beacon starts flashing on the beat grid and never stops again.
      const t = storyTime
      const assetId = t < CUES.engineStart + 0.4
        ? 'card-nacelle-a'
        : t < CUES.engineStart + 1.16
          ? 'card-nacelle-b'
          : 'card-nacelle-c'
      const shake = accentShake(normalizedTime, CUES.engineStart, 2, 0.35)
      const flashLevel = 0.4 * accentFlash(normalizedTime, CUES.engineStart, 0.15)
      return {
        ...base,
        backgroundAssetId: assetId,
        fx: [{ kind: 'beacon', x: 268, y: 32, on: beaconOn(storyTime) }],
        camera: {
          zoom: punchZoom(0.14 * accentPunch(normalizedTime, CUES.engineStart)),
          x: 160,
          y: 104,
          offsetX: shake.x,
          offsetY: shake.y,
        },
        flash: flashLevel > 0 ? { color: 'white', opacity: flashLevel } : null,
      }
    }
    case 'inserts': {
      // Cockpit inserts: the panel wakes between its two generated states,
      // the photo gets its quiet twinkle, the hand settles on the throttles.
      const t = storyTime
      const cuts = [
        [CUES.instrumentsAlive, 'card-instruments'],
        [CUES.thePhoto, 'card-photo'],
        [CUES.handOnThrottles, t >= CUES.handOnThrottles + 0.3 ? 'card-throttles-b' : 'card-throttles-a'],
      ] as const
      const [cutTime, assetId] = activeCut(t, cuts)
      const accents = cardCutAccents(normalizedTime, cutTime, { x: 160, y: 112 })
      const fx: IntroFxFrame[] = []
      let reveal: IntroRevealFrame | null = null
      if (assetId === 'card-instruments') {
        reveal = {
          assetId: 'card-instruments-b',
          progress: clamp01((t - CUES.instrumentsAlive) / 0.6),
          axis: 'ltr',
        }
      }
      if (assetId === 'card-photo') {
        const twinkle = t * 2.6
        if (Math.sin(twinkle) > 0) {
          fx.push({ kind: 'sparkle', x: 208, y: 62, size: 2, opacity: 0.8, tint: 'gold' })
        }
        if (Math.cos(twinkle * 0.7) > 0.3) {
          fx.push({ kind: 'sparkle', x: 118, y: 44, size: 1, opacity: 0.6, tint: 'white' })
        }
      }
      return { ...base, backgroundAssetId: assetId, backgroundReveal: reveal, fx, ...accents }
    }
    case 'takeoff': {
      // Lineup, roll, rotate, and the pass. The plate stays pixel-exact; the
      // speed lives in the runtime light FX and the jet's climb, and the pass
      // swaps pre-rendered sprite sizes so scales stay whole.
      const t = storyTime
      const speed = clamp01((t - CUES.throttlesUp) / 1.6)
      const fx: IntroFxFrame[] = [{ kind: 'runway-lights', speed, phase: t }]
      let jet: SpriteActorFrame
      if (t < CUES.jetPass) {
        // The roll reads as receding: the jet accelerates away down the
        // runway, shrinking through pre-rendered sizes, and rotate lifts it
        // off the painted horizon with exhaust.
        const recede = clamp01((t - CUES.throttlesUp) / 2.2) ** 2
        const climb = 14 * clamp01((t - CUES.rotate) / 1) ** 2
        const clipId: JetClipId = recede < 0.25 ? 'runway' : recede < 0.6 ? 'runway-36' : 'runway-26'
        const span = JET_CLIPS[clipId].frameWidth
        const jetY = Math.round(150 - 26 * recede - climb)
        jet = jetActor(clipId, 160, jetY)
        fx.push({ kind: 'beacon', x: 160, y: jetY - Math.round(16 * (span / 52)), on: beaconOn(storyTime) })
        fx.push({ kind: 'nav-strobe', x: 160 - Math.round(24 * (span / 52)), y: jetY - 2, on: strobeOn(t) })
        fx.push({ kind: 'nav-strobe', x: 160 + Math.round(24 * (span / 52)), y: jetY - 2, on: strobeOn(t) })
        if (t >= CUES.rotate) {
          fx.push({ kind: 'exhaust', x: 160, y: jetY + 1, intensity: clamp01((t - CUES.rotate) / 0.5) })
        }
      } else {
        // Overhead pass, up and to the RIGHT — the liftoff sprite noses
        // up-right, so the sweep matches its attitude — then a reverse-angle
        // climb-out rides the contrail's tip toward the corner.
        const pass = clamp01((t - CUES.jetPass) / 0.7)
        const contrailProgress = clamp01((t - CUES.jetPass - 0.7) / 1)
        if (pass < 1) {
          const clipId: JetClipId = pass < 0.45 ? 'liftoff-160' : 'liftoff-320'
          jet = jetActor(clipId, Math.round(90 + 140 * pass), Math.round(130 - 210 * pass))
        } else {
          jet = jetActor(
            'liftoff-48',
            Math.round(60 + 220 * contrailProgress),
            Math.round(150 - 110 * contrailProgress ** 1.3),
          )
        }
        fx.push({ kind: 'contrail', progress: contrailProgress })
      }
      // Continuous 1 px roll rumble between throttles-up and the pass, from
      // the same integer lattice family as accentShake.
      let offsetX = 0
      let offsetY = 0
      if (normalizedTime >= CUES.throttlesUp && normalizedTime < CUES.jetPass) {
        const lattice = Math.floor(normalizedTime * 60)
        offsetX = ((lattice * 73 + 19) % 3) - 1
        offsetY = ((lattice * 41 + 7) % 3) - 1
      }
      const shake = accentShake(normalizedTime, CUES.jetPass, 2.5, 0.35)
      const flashLevel = 0.4 * accentFlash(normalizedTime, CUES.jetPass, 0.15)
      return {
        ...base,
        backgroundAssetId: 'plate-runway-lineup',
        jet,
        fx,
        camera: {
          zoom: punchZoom(
            0.1 * accentPunch(normalizedTime, CUES.throttlesUp),
            0.08 * accentPunch(normalizedTime, CUES.rotate),
            0.2 * accentPunch(normalizedTime, CUES.jetPass),
          ),
          x: 160,
          y: 130,
          offsetX: offsetX + shake.x,
          offsetY: offsetY + shake.y,
        },
        flash: flashLevel > 0 ? { color: 'white', opacity: flashLevel } : null,
      }
    }
    case 'title': {
      // The emblem stamps into the contrail against the stars.
      const t = storyTime
      const reveal = clamp01((t - CUES.emblemStamp) / 0.236)
      const shake = accentShake(normalizedTime, CUES.emblemStamp, 2, 0.3)
      const stampFlash = 0.7 * accentFlash(normalizedTime, CUES.emblemStamp, 0.22)
      return {
        ...base,
        backgroundAssetId: 'plate-night-sky',
        fx: [
          { kind: 'contrail', progress: 1 },
          {
            kind: 'radial-rays',
            x: 160,
            y: 104,
            scale: 1,
            rotation: (t - CUES.emblemStamp) * 0.35,
            opacity: 0.55 * reveal,
          },
        ],
        camera: { zoom: 1, x: 160, y: 104, offsetX: shake.x, offsetY: shake.y },
        flash: stampFlash > 0 ? { color: 'white', opacity: stampFlash } : null,
        card: {
          assetId: 'emblem-finale',
          x: 160,
          y: 106,
          scale: emblemCardScale(t - CUES.emblemStamp),
          opacity: reveal,
        },
      }
    }
    case 'loop-reset':
      // The title holds while the picture collapses into blue pixels.
      return {
        ...base,
        backgroundAssetId: 'plate-night-sky',
        card: { assetId: 'emblem-finale', x: 160, y: 106, scale: 1, opacity: 1 },
        pixelCollapse: clamp01((sceneProgress - 0.3) / 0.7),
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

/** The Start handoff zooms the winged-globe emblem out of the title card and
 * whites out into the menu — the emblem is the game's seal, so pressing
 * Start walks through it. */
export function deriveHandoffAnimation(progress: number): HandoffFrame {
  const safeProgress = clamp01(progress)
  const eased = easeInOut(safeProgress)
  return {
    progress: safeProgress,
    x: 160,
    y: 106,
    scale: 1 + eased * 3.5,
    flashOpacity: safeProgress === 1 ? 1 : clamp01((safeProgress - 0.55) / 0.45),
  }
}
