import { getIntroScene, normalizeIntroTime, type IntroSceneId } from './introConfig'
import { DUFFEL_JOLT_PERIOD_SECONDS, INTRO_MUSIC_CUES } from './introMusicCues'

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

const POPT_PIVOT = { x: 128, y: 224 } as const
const KEY_PIVOT = { x: 128, y: 224 } as const

function poptClip(
  assetId: string,
  path: string,
  durations: readonly number[],
  loopMode: SpriteLoopMode,
  columns: number,
): SpriteClip {
  return {
    assetId,
    path,
    frameWidth: 256,
    frameHeight: 256,
    columns,
    pivot: POPT_PIVOT,
    durations,
    loopMode,
    frameIndices: durations.map((_, index) => index),
  }
}

export const POPT_CLIPS = {
  idle: poptClip('popt-idle', 'images/intro/tmb2/popt/legacy/idle-sheet.png', [220, 220, 220, 220], 'loop', 4),
  run: poptClip('popt-run', 'images/intro/tmb2/popt/legacy/run-sheet.png', [90, 90, 90, 90, 90, 90, 90, 90], 'loop', 4),
  'reach-catch': poptClip('popt-reach-catch', 'images/intro/tmb2/popt/legacy/reach-catch-sheet.png', [110, 110, 140, 260], 'hold-last', 4),
  'duffel-pull': poptClip('popt-duffel-pull', 'images/intro/tmb2/popt/duffel-pull/duffel-pull-sheet.png', [140, 120, 160, 180], 'loop', 4),
  'startle-stumble': poptClip('popt-startle-stumble', 'images/intro/tmb2/popt/startle-stumble/startle-stumble-sheet.png', [90, 110, 260], 'hold-last', 4),
  'baseball-slide': poptClip('popt-baseball-slide', 'images/intro/tmb2/popt/baseball-slide/baseball-slide-sheet.png', [90, 90, 120, 220], 'hold-last', 4),
  'bull-spin': poptClip('popt-bull-spin', 'images/intro/tmb2/popt/bull-spin/bull-spin-sheet.png', [80, 80, 80, 80, 80, 160], 'once', 4),
  'pilot-glide': poptClip('popt-pilot-glide', 'images/intro/tmb2/popt/pilot-glide/pilot-glide-sheet.png', [120, 120, 120, 120], 'loop', 4),
  'victory-recovery': poptClip('popt-victory-recovery', 'images/intro/tmb2/popt/victory-recovery/victory-recovery-sheet.png', [140, 180, 300], 'hold-last', 4),
} as const satisfies Record<string, SpriteClip>

function keyClip(
  frameIndices: readonly number[],
  loopMode: SpriteLoopMode = 'loop',
): SpriteClip {
  return {
    assetId: 'key-poses',
    path: 'images/intro/tmb2/key/key-mascot-poses-sheet.png',
    frameWidth: 256,
    frameHeight: 256,
    columns: 5,
    pivot: KEY_PIVOT,
    durations: frameIndices.map(() => 120),
    loopMode,
    frameIndices,
  }
}

export const KEY_CLIPS = {
  taunt: keyClip([0, 3, 4, 5]),
  run: keyClip([1, 6, 7, 8, 9, 16]),
  fly: keyClip([12, 13, 14, 15]),
  tug: keyClip([10, 11]),
} as const satisfies Record<string, SpriteClip>

export type PoptClipId = keyof typeof POPT_CLIPS
export type KeyClipId = keyof typeof KEY_CLIPS

export type SpriteActorFrame = {
  clipId: PoptClipId | KeyClipId
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
  | { kind: 'burst-flash'; x: number; y: number; radius: number; opacity: number }
  | { kind: 'exclaim'; x: number; y: number; scale: number; opacity: number }
  | { kind: 'sweat'; x: number; y: number; scale: number; opacity: number }
  | { kind: 'impact-star'; x: number; y: number; scale: number; rotation: number; opacity: number }
  | { kind: 'laser-grid'; horizonY: number; scroll: number; opacity: number }
  | { kind: 'chart-glow'; progress: number; opacity: number }
  | { kind: 'radial-rays'; x: number; y: number; scale: number; rotation: number; opacity: number }
  | { kind: 'pixel-assemble'; progress: number; x: number; y: number }

export type IntroFxKind = IntroFxFrame['kind']

export type IntroCardFrame = {
  assetId: 'emblem-finale'
  x: number
  y: number
  scale: number
  opacity: number
}

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
 * rate. Continuous everywhere, so the ≤4px frame-step motion contract holds,
 * and fully resynced with the music once the catch-up window closes.
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
 * so it snaps back to identity. Measured over 5305 sampled frames: 230 of them
 * sat in this dead zone, 2.3 s of the intro reclaimed for nothing given up.
 */
const ZOOM_DEADZONE = 0.02

/**
 * Zoom rests at exactly 1 and is only ever lifted by a punch. Framing is staged,
 * never zoomed: a held fractional zoom point-samples every world draw for the
 * whole scene while moving nothing the eye can follow.
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
 * Deterministic decaying screen shake after an accent: offsets come from the
 * fixed integer lattices used by drawPixelCollapse, quantized to 60 fps so the
 * jitter is frame-coherent, never random.
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
  // Rounded: the shake is a screen-space displacement of the whole stage, so a
  // fractional offset resamples every world draw for the length of the kick.
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
  id: 'duffel' | 'runway-cart' | 'baseball' | 'base' | 'graph' | 'bull-impact' | 'cloud-puff' | 'pilot-wings'
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
  logo: { visible: boolean; buildProgress: number; highlightOpacity: number }
  popt: SpriteActorFrame | null
  key: SpriteActorFrame | null
  props: readonly IntroPropFrame[]
  fx: readonly IntroFxFrame[]
  card: IntroCardFrame | null
  camera: IntroCameraFrame
  flash: IntroFlashFrame | null
  pixelCollapse: number
}

export type HandoffFrame = {
  progress: number
  keyX: number
  keyY: number
  keyScale: number
  keyRotation: number
  flashOpacity: number
}

const BACKGROUNDS: Partial<Record<IntroSceneId, string>> = {
  duffel: 'background-duffel',
  'key-escape': 'background-duffel',
  runway: 'background-runway',
  ballpark: 'background-ballpark',
  'city-finance': 'background-finance',
  sky: 'background-clouds',
  'final-pursuit': 'background-clouds',
  catch: 'background-clouds',
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
   * Stage pixels per sheet pixel. Must stay a whole number: the sheet is point
   * sampled (`imageSmoothingEnabled = false`), so a fractional scale spreads one
   * art pixel across an uneven 2-or-3 stage pixels and the silhouette steps
   * raggedly against a background drawn 1:1.
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

function keyActor(
  clipId: KeyClipId,
  elapsedMs: number,
  x: number,
  y: number,
  scale = 0.38,
  rotation = 0,
  flipX = false,
  opacity = 1,
): SpriteActorFrame {
  const clip = KEY_CLIPS[clipId]
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
 * acting starts mid-scene (a burst, an impact, a lunge) rather than at the
 * scene boundary.
 */
export function clipElapsedMs(normalizedTimeSeconds: number, eventStartSeconds: number): number {
  return Math.max(0, (normalizedTimeSeconds - eventStartSeconds) * 1_000)
}

/** A parametric actor path in scene-local seconds. */
export type IntroPath = (sceneSeconds: number) => { x: number; y: number; rotation: number }

const TRAIL_TINTS = ['white', 'blue', 'blue'] as const

/**
 * The key's sparkle trail. deriveIntroAnimation is pure, so the trail cannot
 * be stored particle state: it re-samples the same parametric path the key
 * follows at earlier scene-local times, clamped to the scene entry so no
 * sample ever crosses a scene boundary. Jitter uses fixed integer lattices in
 * the drawPixelCollapse style to stay deterministic.
 */
export function keyTrail(
  path: IntroPath,
  sceneSeconds: number,
  count = 6,
  spacingSeconds = 0.05,
): IntroFxFrame[] {
  const trail: IntroFxFrame[] = []
  for (let index = 1; index <= count; index += 1) {
    const sample = path(Math.max(0, sceneSeconds - index * spacingSeconds))
    const fade = 1 - index / (count + 1)
    trail.push({
      kind: 'sparkle',
      x: sample.x - 6 + ((index * 29 + 11) % 13),
      y: sample.y - 26 - ((index * 17 + 5) % 9),
      size: Math.max(1, 4 - Math.floor(index / 2)),
      opacity: Math.round(85 * fade) / 100,
      tint: TRAIL_TINTS[index % 3]!,
    })
  }
  return trail
}

/**
 * The neon chart the key climbs in the finance scene, in stage coordinates.
 * Shared by the key's run path and the renderer's chart glow so the drawn
 * line stays causal.
 */
export const CHART_POINTS = [
  { x: 42, y: 182 },
  { x: 98, y: 164 },
  { x: 142, y: 172 },
  { x: 194, y: 140 },
  { x: 272, y: 104 },
] as const

const CHART_SEGMENT_LENGTHS = CHART_POINTS.slice(1).map((point, index) => {
  const previous = CHART_POINTS[index]!
  return Math.hypot(point.x - previous.x, point.y - previous.y)
})
const CHART_TOTAL_LENGTH = CHART_SEGMENT_LENGTHS.reduce((total, length) => total + length, 0)

/** Position along the chart polyline by arc length, progress in [0, 1]. */
export function chartPointAt(progress: number): { x: number; y: number } {
  let remaining = clamp01(progress) * CHART_TOTAL_LENGTH
  for (let index = 0; index < CHART_SEGMENT_LENGTHS.length; index += 1) {
    const length = CHART_SEGMENT_LENGTHS[index]!
    if (remaining <= length || index === CHART_SEGMENT_LENGTHS.length - 1) {
      const from = CHART_POINTS[index]!
      const to = CHART_POINTS[index + 1]!
      const t = length === 0 ? 0 : Math.min(1, remaining / length)
      return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }
    }
    remaining -= length
  }
  return { ...CHART_POINTS.at(-1)! }
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
 * over half a second. Presented at the owner visual gate.
 */
export const EMBLEM_REVEAL_STYLE: 'stamp' | 'eased' = 'stamp'

function emblemCardScale(sinceStampSeconds: number): number {
  if (EMBLEM_REVEAL_STYLE === 'eased') {
    return 0.9 + 0.1 * easeInOut(clamp01(sinceStampSeconds / 0.5))
  }
  return sinceStampSeconds < 0.08 ? 0.9 : 1
}

/**
 * Reduced motion holds one curated representative story time per scene, so a
 * held pose is a deliberate mid-action frame rather than whatever the scene
 * midpoint happens to land on (for once-clips the midpoint is often the
 * post-impact splat).
 */
const REPRESENTATIVE_SCENE_TIME: Partial<Record<IntroSceneId, number>> = {
  duffel: 9.6,
  'key-escape': 13.6,
  runway: 19,
  ballpark: 24.7,
  'city-finance': 29.5,
  sky: 38.5,
  'final-pursuit': 44,
  catch: 50.3,
}

/** Fx kinds that stay visible (frozen) under reduced motion. */
const REDUCED_MOTION_FX: ReadonlySet<IntroFxKind> = new Set(['laser-grid', 'chart-glow', 'radial-rays'])

/**
 * The one accent per scene that freezes the actors SEGA-style. Impact fx,
 * flashes, and camera punches keep running on real time through the hold.
 */
const SCENE_HITSTOP: Partial<Record<IntroSceneId, { accent: number; hold: number }>> = {
  'key-escape': { accent: INTRO_MUSIC_CUES.exclaim, hold: 0.12 },
  ballpark: { accent: INTRO_MUSIC_CUES.ballDeflect, hold: 0.1 },
  'city-finance': { accent: INTRO_MUSIC_CUES.bullImpact, hold: 0.12 },
  'final-pursuit': { accent: INTRO_MUSIC_CUES.catchGrab, hold: 0.14 },
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
  const eased = easeInOut(sceneProgress)
  const base: IntroAnimationFrame = {
    sceneId: scene.id,
    sceneProgress: rawProgress,
    backgroundAssetId: BACKGROUNDS[scene.id] ?? null,
    backgroundOffsetX: reducedMotion ? 0 : -8 * sceneProgress,
    backgroundDim: 0,
    logo: { visible: false, buildProgress: 0, highlightOpacity: 0 },
    popt: null,
    key: null,
    props: [],
    fx: [],
    card: null,
    camera: IDENTITY_CAMERA,
    flash: null,
    pixelCollapse: 0,
  }

  const frame = ((): IntroAnimationFrame => {
  switch (scene.id) {
    case 'tmb2-ident': {
      // SEGA-style ident gag (plan 0028): the logo slams together fast, Pop T
      // sprints in, skids at the sight of it, taps it on the beat — the tap
      // ignites the gold-white overload — then he sprints off into the story.
      // The ident window is a flat build pad (measured 2026-08-15), so beats
      // sit on the 0.72 s accent grid extrapolated from the measured cues.
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
        popt = poptActor('victory-recovery', clipElapsedMs(t, TAP), 130, 190)
      } else if (t >= SKID) {
        const skidSlide = 1 - (1 - clamp01((t - SKID) / 0.3)) ** 2
        popt = poptActor('startle-stumble', clipElapsedMs(t, SKID), 100 + 30 * skidSlide, 190)
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

      // Zoom is a punch, never a framing device: it rests at exactly 1 so the
      // stage stays on its pixel grid, and only the tap accent pushes in.
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
    case 'duffel': {
      // Panel 1 into panel 2: Pop T assembles from blue pixels on a darkened
      // stage, strides to the bag, then fights it with beat-locked tugs.
      const t = storyTime
      const assembleEnd = INTRO_MUSIC_CUES.assembleDone
      const walkEnd = 7.95
      const fx: IntroFxFrame[] = []
      const backgroundDim = t < 6.8 ? 0.55 * (1 - (t - 6) / 0.8) : 0

      // Dolly toward the struggle; each beat-locked tug kicks the zoom.
      const joltGridStart = INTRO_MUSIC_CUES.firstDuffelJolt
      const lastJoltBeat = normalizedTime >= joltGridStart
        ? joltGridStart
          + Math.floor((normalizedTime - joltGridStart) / DUFFEL_JOLT_PERIOD_SECONDS)
          * DUFFEL_JOLT_PERIOD_SECONDS
        : null
      const camera: IntroCameraFrame = {
        zoom: punchZoom(lastJoltBeat === null ? 0 : 0.05 * accentPunch(normalizedTime, lastJoltBeat, 0.05, 0.4)),
        x: 170,
        y: 165,
        offsetX: 0,
        offsetY: 0,
      }
      const assembleBlink = 0.25 * accentFlash(normalizedTime, assembleEnd, 0.12)
      const flash: IntroFlashFrame | null = assembleBlink > 0
        ? { color: 'white', opacity: assembleBlink }
        : null

      let popt: SpriteActorFrame
      if (t < assembleEnd) {
        const assembleProgress = clamp01((t - 6) / (assembleEnd - 6))
        const x = 52 + assembleProgress * 18
        fx.push({ kind: 'pixel-assemble', progress: assembleProgress, x, y: 188 })
        popt = poptActor('run', elapsedMs, x, 190, 1, 0, false, 0.25 + 0.75 * assembleProgress)
      } else if (t < walkEnd) {
        const walkProgress = easeInOut((t - assembleEnd) / (walkEnd - assembleEnd))
        popt = poptActor('run', elapsedMs, 70 + walkProgress * 82, 190)
      } else {
        const joltStart = INTRO_MUSIC_CUES.firstDuffelJolt
        const sinceJolt = t - joltStart
        const joltCount = sinceJolt >= 0 ? Math.floor(sinceJolt / DUFFEL_JOLT_PERIOD_SECONDS) : -1
        const joltPhase = sinceJolt >= 0
          ? (sinceJolt % DUFFEL_JOLT_PERIOD_SECONDS) / DUFFEL_JOLT_PERIOD_SECONDS
          : 0
        const joltStrength = joltCount < 0 ? 0 : Math.min(1, 0.4 + joltCount * 0.2)
        const tugOffset = -7 * Math.sin(joltPhase * Math.PI) * joltStrength
        popt = poptActor('duffel-pull', clipElapsedMs(t, walkEnd), 152 + tugOffset, 190)
        if (t >= 9.5) {
          const dropletLift = Math.sin(joltPhase * Math.PI)
          fx.push(
            { kind: 'sweat', x: 140, y: 102 - dropletLift * 7, scale: 1, opacity: 0.9 * dropletLift },
            { kind: 'sweat', x: 162, y: 108 - dropletLift * 5, scale: 0.8, opacity: 0.7 * dropletLift },
          )
        }
        return {
          ...base,
          backgroundDim,
          popt,
          fx,
          camera,
          flash,
          props: [prop('duffel', 206, 156, 1, Math.sin(joltPhase * Math.PI) * 0.055 * joltStrength)],
        }
      }
      return {
        ...base,
        backgroundDim,
        popt,
        fx,
        camera,
        flash,
        props: [prop('duffel', 206, 156, 1, Math.sin(elapsedMs / 220) * 0.012)],
      }
    }
    case 'key-escape': {
      // Panel 3: the key blasts out of the bag on the musical pickup, hangs to
      // taunt as the big slam lands a red "!", then rockets offscreen.
      const t = storyTime
      const BURST = INTRO_MUSIC_CUES.keyBurst
      const TAUNT_START = 12.984
      const FLY_EXIT = INTRO_MUSIC_CUES.keyFlyExit
      const BAG_MOUTH = { x: 210, y: 148 }
      const APEX = { x: 172, y: 96 }
      const fx: IntroFxFrame[] = []

      const keyPath: IntroPath = (sceneSeconds) => {
        const pathTime = 12 + sceneSeconds
        if (pathTime <= BURST) return { x: BAG_MOUTH.x, y: BAG_MOUTH.y, rotation: -0.35 }
        if (pathTime < TAUNT_START) {
          const raw = (pathTime - BURST) / (TAUNT_START - BURST)
          const p = 1 - (1 - raw) ** 2
          return {
            x: BAG_MOUTH.x + (APEX.x - BAG_MOUTH.x) * p,
            y: BAG_MOUTH.y + (APEX.y - BAG_MOUTH.y) * p - Math.sin(p * Math.PI) * 18,
            rotation: -0.35 * (1 - p),
          }
        }
        if (pathTime < FLY_EXIT) {
          const hover = pathTime - TAUNT_START
          return {
            x: APEX.x + Math.sin(hover * 3.4) * 4,
            y: APEX.y + Math.sin(hover * 5.1) * 3,
            rotation: Math.sin(hover * 8) * 0.08,
          }
        }
        const raw = (pathTime - FLY_EXIT) / (16 - FLY_EXIT)
        const p = raw * raw
        return {
          x: APEX.x + 172 * p,
          y: APEX.y - 30 * p,
          rotation: 0.5 * Math.min(1, raw * 1.6),
        }
      }

      const sceneT = t - 12
      const keySample = keyPath(sceneT)
      let key: SpriteActorFrame | null = null
      if (t > BURST) {
        const clipId = t < TAUNT_START ? 'fly' : t < FLY_EXIT ? 'taunt' : 'fly'
        const clipStart = t < TAUNT_START ? BURST : t < FLY_EXIT ? TAUNT_START : FLY_EXIT
        key = keyActor(
          clipId,
          clipElapsedMs(t, clipStart),
          keySample.x,
          keySample.y,
          0.38,
          keySample.rotation,
        )
        if (t < TAUNT_START || t >= FLY_EXIT) fx.push(...keyTrail(keyPath, sceneT))
      }

      if (t > BURST && t < BURST + 0.3) {
        const flash = (t - BURST) / 0.3
        fx.push({
          kind: 'burst-flash',
          x: BAG_MOUTH.x,
          y: BAG_MOUTH.y,
          radius: 8 + flash * 16,
          opacity: 1 - flash,
        })
      }
      if (t > BURST && t < BURST + 0.45) {
        const spray = (t - BURST) / 0.45
        for (let index = 0; index < 5; index += 1) {
          const angle = index * 2.4 + 0.7
          const distance = 10 + spray * 26
          fx.push({
            kind: 'sparkle',
            x: BAG_MOUTH.x + Math.cos(angle) * distance,
            y: BAG_MOUTH.y - 8 + Math.sin(angle) * distance * 0.7,
            size: 3 - (index % 2),
            opacity: 0.9 * (1 - spray),
            tint: index % 2 === 0 ? 'gold' : 'white',
          })
        }
      }

      const knockback = t <= BURST
        ? 0
        : 1 - (1 - Math.min(1, (t - BURST) / 1.2)) ** 2
      const poptX = 138 - 26 * knockback
      const EXCLAIM = INTRO_MUSIC_CUES.exclaim
      if (normalizedTime >= EXCLAIM && normalizedTime < EXCLAIM + 0.66) {
        const pop = (normalizedTime - EXCLAIM) / 0.66
        fx.push({
          kind: 'exclaim',
          x: poptX + 6,
          y: 88,
          scale: pop < 0.25 ? 0.55 + 0.65 * (pop / 0.25) : 1.2 - 0.2 * Math.min(1, (pop - 0.25) / 0.3),
          opacity: pop > 0.8 ? (1 - pop) / 0.2 : 1,
        })
      }

      const popt = t <= BURST
        ? poptActor('duffel-pull', clipElapsedMs(t, 7.95), 138, 190)
        : poptActor('startle-stumble', clipElapsedMs(t, BURST), poptX, 190)

      // The burst punches in at the bag; the track's biggest hit slams red,
      // shakes the frame, and hitstops the actors (SCENE_HITSTOP).
      const shake = accentShake(normalizedTime, EXCLAIM, 3.5, 0.4)
      const burstFlash = 0.4 * accentFlash(normalizedTime, BURST, 0.12)
      // Kept translucent so the storyboard's red "!" reads through the slam.
      const exclaimFlash = 0.32 * accentFlash(normalizedTime, EXCLAIM, 0.18)
      const camera: IntroCameraFrame = {
        zoom: punchZoom(
          0.22 * accentPunch(normalizedTime, BURST, 0.05, 0.6),
          0.12 * accentPunch(normalizedTime, EXCLAIM, 0.05, 0.5),
        ),
        // The focal only bites while a punch is running, so it names the point
        // each punch drives into: the bag on the burst, Pop T on the slam.
        x: normalizedTime < EXCLAIM ? 205 : 178,
        y: 150,
        offsetX: shake.x,
        offsetY: shake.y,
      }

      return {
        ...base,
        popt,
        key,
        fx,
        camera,
        flash: exclaimFlash > 0
          ? { color: 'red', opacity: exclaimFlash }
          : burstFlash > 0
            ? { color: 'white', opacity: burstFlash }
            : null,
        props: [
          t <= BURST
            ? prop('duffel', 206, 156, 1, Math.sin(elapsedMs / 50) * 0.05)
            : prop('duffel', 206, 156, 1, -0.06),
        ],
      }
    }
    case 'runway': {
      // Panel 4: a real chase. Pop T sprints the full stage, the key flies
      // ahead on a sparkle trail, and the cart crosses his lane on the accent.
      const t = storyTime
      const sceneT = t - 16
      const CART_CROSS = INTRO_MUSIC_CUES.cartNearMiss
      const fx: IntroFxFrame[] = []

      const keyPath: IntroPath = (sceneSeconds) => {
        const p = sceneSeconds / 6
        return {
          x: 130 + 170 * p + Math.sin(sceneSeconds * 1.5) * 6,
          y: 158 - 70 * p + Math.sin(sceneSeconds * 2.2) * 8,
          rotation: -0.12 + Math.sin(sceneSeconds * 2.2) * 0.05,
        }
      }
      const keySample = keyPath(sceneT)
      fx.push(...keyTrail(keyPath, sceneT))

      const hop = t > CART_CROSS - 0.2 && t < CART_CROSS + 0.4
        ? Math.sin(((t - (CART_CROSS - 0.2)) / 0.6) * Math.PI)
        : 0
      const poptX = 44 + (224 * sceneT) / 6
      const popt = poptActor('run', elapsedMs, poptX, 190 - hop * 14, 1, -hop * 0.08)

      const cartX = 473 - 90 * sceneT

      // The near-miss kicks the zoom. The focal still follows Pop T, which is
      // inert at rest and only bites while the punch runs — so the push-in
      // drives into him. It sits low so the crossing cart stays in frame.
      const shake = accentShake(normalizedTime, CART_CROSS, 2, 0.3)
      const camera: IntroCameraFrame = {
        zoom: punchZoom(0.1 * accentPunch(normalizedTime, CART_CROSS, 0.05, 0.45)),
        x: Math.max(96, Math.min(224, poptX)),
        y: 185,
        offsetX: shake.x,
        offsetY: shake.y,
      }

      return {
        ...base,
        backgroundOffsetX: reducedMotion ? 0 : -12 * sceneProgress,
        popt,
        key: keyActor('fly', elapsedMs, keySample.x, keySample.y, 0.36, keySample.rotation),
        fx,
        camera,
        // Measured overlay bands in stage rows: the Press Start button occupies
        // 188-195 and the audio controls 204-219, leaving no gap between them
        // wide enough for the cart. It crosses just above the button instead, at
        // Pop T's shin, which also reads as the lane behind him. The 0028 fix
        // could only drop the focal, because the held 1.14 zoom pushed the cart
        // further down the frame; with the zoom retired the prop can simply sit
        // where it reads.
        props: [prop('runway-cart', cartX, 182, 0.68)],
      }
    }
    case 'ballpark': {
      // Panel 5: the ball, the key, and the impact star share one deflection
      // point at the measured accent while Pop T slides past the base below.
      const t = storyTime
      const DEFLECT = INTRO_MUSIC_CUES.ballDeflect
      const D = { x: 196, y: 118 }
      const BALL_IN_START = 22.8
      const BALL_OUT_END = 25.6
      const SLIDE_START = DEFLECT - 0.6
      const fx: IntroFxFrame[] = []

      const keyPath: IntroPath = (sceneSeconds) => {
        const pathTime = 22 + sceneSeconds
        if (pathTime <= DEFLECT) {
          const p = clamp01((pathTime - 22) / (DEFLECT - 22))
          const bob = (1 - p) * 6
          return {
            x: 150 + (D.x - 150) * p + Math.sin(sceneSeconds * 3) * bob * 0.4,
            y: 128 + (D.y + 28 - 128) * p + Math.sin(sceneSeconds * 4.1) * bob,
            rotation: -0.08 * (1 - p),
          }
        }
        if (pathTime < 25.2) {
          const p = 1 - (1 - (pathTime - DEFLECT) / 0.648) ** 2
          return {
            x: D.x + (172 - D.x) * p,
            y: D.y + 28 + (132 - D.y - 28) * p,
            rotation: -0.12 * p,
          }
        }
        const raw = clamp01((pathTime - 25.2) / 2.8)
        const p = raw * raw
        return {
          x: 172 + 130 * p,
          y: 132 - 48 * p,
          rotation: -0.12 + 0.2 * raw,
        }
      }
      const sceneT = t - 22
      const keySample = keyPath(sceneT)
      fx.push(...keyTrail(keyPath, sceneT))

      const props: IntroPropFrame[] = [prop('base', 230, 192, 0.65)]
      if (t >= BALL_IN_START && t <= BALL_OUT_END) {
        const ballPosition = t <= DEFLECT
          ? {
              x: 310 + (D.x - 310) * ((t - BALL_IN_START) / (DEFLECT - BALL_IN_START)),
              y: 70 + (D.y - 70) * ((t - BALL_IN_START) / (DEFLECT - BALL_IN_START)),
            }
          : {
              x: D.x + (320 - D.x) * ((t - DEFLECT) / (BALL_OUT_END - DEFLECT)),
              y: D.y + (52 - D.y) * ((t - DEFLECT) / (BALL_OUT_END - DEFLECT)),
            }
        props.push(prop('baseball', ballPosition.x, ballPosition.y, 0.8))
      }
      if (t >= DEFLECT && t < DEFLECT + 0.53) {
        // Real-time phase so the star holds full presence through the hitstop.
        const phase = clamp01((normalizedTime - DEFLECT) / 0.53)
        fx.push({
          kind: 'impact-star',
          x: D.x,
          y: D.y,
          scale: 0.3 + 0.1 * (1 - phase),
          rotation: phase * 0.6,
          opacity: clamp01(1 - phase ** 2),
        })
      }

      let popt: SpriteActorFrame
      if (t < SLIDE_START) {
        popt = poptActor('run', elapsedMs, 36 + ((t - 22) / (SLIDE_START - 22)) * 84, 190)
      } else {
        const slide = 1 - (1 - clamp01((t - SLIDE_START) / 2.2)) ** 2
        // The clip advances with slide travel (520ms of authored frames spread
        // over the full slide) so the hold pose lands only when he stops.
        popt = poptActor('baseball-slide', slide * 520, 120 + 118 * slide, 194, 1, -0.05)
        if (t < 25.5) {
          props.push(prop('cloud-puff', 120 + 118 * slide - 20, 198, 0.3, 0, 0.5))
        }
      }

      // Drift toward the deflection point, then punch into it on the accent.
      const focalDrift = easeInOut(clamp01((t - 22) / (DEFLECT - 22)))
      const shake = accentShake(normalizedTime, DEFLECT, 2.5, 0.35)
      const deflectFlash = 0.35 * accentFlash(normalizedTime, DEFLECT, 0.12)
      const camera: IntroCameraFrame = {
        zoom: punchZoom(0.24 * accentPunch(normalizedTime, DEFLECT, 0.05, 0.45)),
        x: 140 + (D.x - 140) * focalDrift,
        y: 165 + (D.y + 10 - 165) * focalDrift,
        offsetX: shake.x,
        offsetY: shake.y,
      }

      return {
        ...base,
        popt,
        key: keyActor('fly', elapsedMs, keySample.x, keySample.y, 0.36, keySample.rotation),
        fx,
        camera,
        flash: deflectFlash > 0 ? { color: 'white', opacity: deflectFlash } : null,
        props,
      }
    }
    case 'city-finance': {
      // Panel 6: the key runs up the neon chart, lighting it as it climbs,
      // while Pop T's chase meets the painted bull on the measured accent.
      const t = storyTime
      const IMPACT = INTRO_MUSIC_CUES.bullImpact
      const SPIN_END = 32.2
      const sceneT = t - 28
      const fx: IntroFxFrame[] = []

      const chartProgress = clamp01(sceneT / 5.2)
      const chartPosition = chartPointAt(chartProgress)
      fx.push({ kind: 'chart-glow', progress: chartProgress, opacity: 0.85 })
      let key: SpriteActorFrame
      if (chartProgress < 1) {
        const bounce = Math.abs(Math.sin(sceneT * Math.PI * 4)) * 3
        key = keyActor('run', elapsedMs, chartPosition.x, chartPosition.y - bounce, 0.36)
      } else {
        const hover = sceneT - 5.2
        key = keyActor(
          'taunt',
          clipElapsedMs(t, 33.2),
          chartPosition.x + Math.sin(hover * 3.1) * 4,
          chartPosition.y + Math.sin(hover * 4.6) * 3,
          0.36,
          Math.sin(hover * 6) * 0.1,
        )
      }

      let popt: SpriteActorFrame
      if (t < IMPACT) {
        popt = poptActor('run', elapsedMs, 42 + ((t - 28) / (IMPACT - 28)) * 163, 188, 1)
      } else if (t < SPIN_END) {
        const knock = 1 - (1 - Math.min(1, (t - IMPACT) / 1.2)) ** 2
        const tumble = Math.sin(Math.PI * Math.min(1, (t - IMPACT) / 0.9))
        popt = poptActor(
          'bull-spin',
          clipElapsedMs(t, IMPACT),
          205 - 38 * knock,
          188 - 18 * tumble,
          1,
          0.3 * tumble,
        )
      } else {
        popt = poptActor('run', clipElapsedMs(t, SPIN_END), 167 + ((t - SPIN_END) / 2.8) * 33, 188, 1)
      }
      if (t >= IMPACT && t < IMPACT + 0.6) {
        // Real-time phase so the star holds full presence through the hitstop.
        const phase = clamp01((normalizedTime - IMPACT) / 0.6)
        fx.push({
          kind: 'impact-star',
          x: 238,
          y: 162,
          scale: 0.3 + 0.12 * (1 - phase),
          rotation: phase * 0.5,
          opacity: clamp01(1 - phase ** 2),
        })
      }

      // Follow the climb up the chart; the bull hit slams red and shakes.
      const shake = accentShake(normalizedTime, IMPACT, 3, 0.4)
      const bullFlash = 0.4 * accentFlash(normalizedTime, IMPACT, 0.18)
      const camera: IntroCameraFrame = {
        zoom: punchZoom(0.18 * accentPunch(normalizedTime, IMPACT, 0.05, 0.5)),
        x: Math.max(120, Math.min(230, chartPosition.x)),
        y: 150,
        offsetX: shake.x,
        offsetY: shake.y,
      }

      return {
        ...base,
        popt,
        key,
        fx,
        camera,
        flash: bullFlash > 0 ? { color: 'red', opacity: bullFlash } : null,
        props: [],
      }
    }
    case 'sky': {
      // Panel 7: the chase goes airborne over the red digital horizon.
      const t = storyTime
      const IGNITE = INTRO_MUSIC_CUES.skyGridIgnite
      const sceneT = t - 35
      const fx: IntroFxFrame[] = []

      if (t >= IGNITE) {
        fx.push({
          kind: 'laser-grid',
          horizonY: 152,
          scroll: ((t - IGNITE) * 0.9) % 7,
          opacity: 0.52 * clamp01((t - IGNITE) / 0.76),
        })
      }

      const keyPath: IntroPath = (sceneSeconds) => ({
        x: 190 + (sceneSeconds / 7) * 80 + Math.sin(sceneSeconds * 1.7) * 10,
        y: 120 - (sceneSeconds / 7) * 36 + Math.sin(sceneSeconds * 2.3) * 7,
        rotation: -0.15 + Math.sin(sceneSeconds * 2.3) * 0.05,
      })
      const keySample = keyPath(sceneT)
      fx.push(...keyTrail(keyPath, sceneT))

      const props: IntroPropFrame[] = []
      for (let index = 0; index < 3; index += 1) {
        const puffX = 380 + index * 150 - sceneT * 95
        if (puffX > -70 && puffX < 390) {
          props.push(prop('cloud-puff', puffX, 92 + index * 40, 0.45 + index * 0.08, 0, 0.65))
        }
      }

      // A slow airborne push; the horizon ignition pulses red and trembles.
      const shake = accentShake(normalizedTime, IGNITE, 1.5, 0.3)
      const igniteFlash = 0.3 * accentFlash(normalizedTime, IGNITE, 0.2)
      const camera: IntroCameraFrame = {
        // The sky scene carried a slow 8% push and nothing else. It was pure
        // drift — 0.043 px of screen movement per frame — so it is gone.
        zoom: 1,
        x: 170,
        y: 130,
        offsetX: shake.x,
        offsetY: shake.y,
      }

      return {
        ...base,
        popt: poptActor(
          'pilot-glide',
          elapsedMs,
          40 + (sceneT / 7) * 110,
          172 - (sceneT / 7) * 40 + Math.sin(sceneT * 1.1) * 6,
          1,
          -0.06 + Math.sin(sceneT * 1.1) * 0.05,
        ),
        key: keyActor('fly', elapsedMs, keySample.x, keySample.y, 0.36, keySample.rotation),
        fx,
        camera,
        flash: igniteFlash > 0 ? { color: 'red', opacity: igniteFlash } : null,
        props,
      }
    }
    case 'final-pursuit': {
      // Panels 7-8 bridge: converge, whiff on the lunge accent, recover on the
      // surge, then close the glove on the key at the grab accent.
      const t = storyTime
      const MISS = INTRO_MUSIC_CUES.missLunge
      const RECOVER = INTRO_MUSIC_CUES.catchRecover
      const GRAB = INTRO_MUSIC_CUES.catchGrab
      const sceneT = t - 42
      const fx: IntroFxFrame[] = []

      fx.push({
        kind: 'laser-grid',
        horizonY: 156,
        scroll: ((t - INTRO_MUSIC_CUES.skyGridIgnite) * 0.9) % 7,
        opacity: 0.45,
      })

      let popt: SpriteActorFrame
      if (t < MISS) {
        popt = poptActor(
          'pilot-glide',
          elapsedMs,
          60 + ((t - 42) / (MISS - 42)) * 96,
          150 - (t - 42) * 3.2 + Math.sin(t * 1.3) * 4,
          1,
          Math.sin(t * 1.3) * 0.04,
        )
      } else if (t < RECOVER) {
        const lungeProgress = 1 - (1 - Math.min(1, (t - MISS) / 0.5)) ** 2
        const sag = clamp01((t - (MISS + 0.48)) / 0.4)
        popt = poptActor(
          'reach-catch',
          clipElapsedMs(t, MISS),
          156 + 34 * lungeProgress,
          140 - 18 * Math.sin(Math.PI * Math.min(1, (t - MISS) / 0.888)) + 10 * sag,
          1,
          0.15 * sag,
        )
        if (t >= MISS + 0.48) {
          fx.push({ kind: 'sweat', x: 156 + 34 * lungeProgress - 6, y: 112, scale: 1, opacity: 0.85 })
        }
      } else if (t < 47) {
        const recoverProgress = clamp01((t - RECOVER) / (47 - RECOVER))
        popt = poptActor(
          'pilot-glide',
          clipElapsedMs(t, RECOVER),
          190 + recoverProgress * 18,
          148 - recoverProgress * 10,
          1,
          0.15 * (1 - recoverProgress),
        )
      } else {
        const reach = clamp01((t - 47) / (GRAB - 47))
        popt = poptActor('reach-catch', clipElapsedMs(t, 47), 208 + reach * 14, 138, 1)
      }

      const keyPath: IntroPath = (sceneSeconds) => {
        if (sceneSeconds < MISS - 42) {
          const p = sceneSeconds / (MISS - 42)
          return { x: 214 - p * 10, y: 116 + Math.sin(sceneSeconds * 1.9) * 6, rotation: -0.1 }
        }
        if (sceneSeconds < MISS - 42 + 0.58) {
          const p = (sceneSeconds - (MISS - 42)) / 0.58
          return { x: 204 + 18 * p, y: 116 - 26 * Math.sin(Math.PI * p), rotation: -0.1 + 0.2 * p }
        }
        if (sceneSeconds < 5.3) {
          const p = (sceneSeconds - (MISS - 42 + 0.58)) / (5.3 - (MISS - 42 + 0.58))
          return {
            x: 222 + p * 24,
            y: 116 + p * 6 + Math.sin(sceneSeconds * 3.3) * 2,
            rotation: 0.1 * (1 - p),
          }
        }
        return { x: 246, y: 122 + Math.sin(sceneSeconds * 5) * 1.5, rotation: 0 }
      }

      let key: SpriteActorFrame
      if (t < GRAB) {
        const keySample = keyPath(sceneT)
        key = keyActor('fly', elapsedMs, keySample.x, keySample.y, 0.36, keySample.rotation)
        fx.push(...keyTrail(keyPath, sceneT))
      } else {
        key = keyActor(
          'tug',
          clipElapsedMs(t, GRAB),
          popt.x + 24,
          124,
          0.36,
          Math.sin(t * 14) * 0.18,
        )
        if (t < GRAB + 0.4) {
          // Real-time phase so the star holds full presence through the hitstop.
          const phase = clamp01((normalizedTime - GRAB) / 0.4)
          fx.push({
            kind: 'impact-star',
            x: popt.x + 24,
            y: 124,
            scale: 0.3,
            rotation: phase * 0.5,
            opacity: clamp01(1 - phase ** 2),
          })
        }
      }

      // Track the shrinking gap, kick on the whiff, punch into the grab.
      const shake = {
        x: accentShake(normalizedTime, MISS, 2, 0.3).x + accentShake(normalizedTime, GRAB, 2.5, 0.35).x,
        y: accentShake(normalizedTime, MISS, 2, 0.3).y + accentShake(normalizedTime, GRAB, 2.5, 0.35).y,
      }
      const grabFlash = 0.45 * accentFlash(normalizedTime, GRAB, 0.15)
      const camera: IntroCameraFrame = {
        zoom: punchZoom(
          0.08 * accentPunch(normalizedTime, MISS, 0.05, 0.4),
          0.22 * accentPunch(normalizedTime, GRAB, 0.05, 0.5),
        ),
        x: normalizedTime < GRAB
          ? Math.max(120, Math.min(230, (popt.x + key.x) / 2))
          : popt.x + 24,
        y: normalizedTime < GRAB ? 130 : 132,
        offsetX: shake.x,
        offsetY: shake.y,
      }

      return {
        ...base,
        popt,
        key,
        fx,
        camera,
        flash: grabFlash > 0 ? { color: 'white', opacity: grabFlash } : null,
        props: [prop('pilot-wings', popt.x, popt.y - 38, 0.52, popt.rotation * 0.5)],
      }
    }
    case 'catch': {
      // Panel 8: victory beat with the key wriggling in the raised glove, then
      // the winged-globe emblem card stamps in on the biggest late accent.
      const t = storyTime
      const STAMP = INTRO_MUSIC_CUES.emblemStamp
      const fx: IntroFxFrame[] = []

      if (t < STAMP) {
        const held = clipElapsedMs(t, 48)
        for (let index = 0; index < 3; index += 1) {
          const twinklePhase = (t - 48) * 2.4 + index * 2.1
          fx.push({
            kind: 'sparkle',
            x: 163 + Math.cos(twinklePhase) * (14 + index * 4),
            y: 112 + Math.sin(twinklePhase) * (10 + index * 3),
            size: 2 + (index % 2),
            opacity: 0.55 + 0.35 * Math.sin(twinklePhase * 1.7),
            tint: 'gold',
          })
        }
        return {
          ...base,
          popt: poptActor('victory-recovery', held, 150, 190, 1),
          key: keyActor('tug', held, 163, 116, 0.36, Math.sin(t * 9) * 0.15),
          fx,
          camera: { zoom: 1, x: 160, y: 145, offsetX: 0, offsetY: 0 },
        }
      }

      const reveal = clamp01((t - STAMP) / 0.236)
      fx.push({
        kind: 'radial-rays',
        x: 160,
        y: 104,
        scale: 1,
        rotation: (t - STAMP) * 0.35,
        opacity: 0.55 * reveal,
      })
      const stampFlash = 0.7 * accentFlash(normalizedTime, STAMP, 0.22)
      return {
        ...base,
        backgroundDim: clamp01((t - STAMP) / 0.196),
        fx,
        flash: stampFlash > 0 ? { color: 'white', opacity: stampFlash } : null,
        card: {
          assetId: 'emblem-finale',
          x: 160,
          y: 106,
          scale: emblemCardScale(t - STAMP),
          opacity: reveal,
        },
      }
    }
    case 'loop-reset':
      return {
        ...base,
        popt: poptActor('victory-recovery', elapsedMs, 124 + eased * 260, 190, 1, eased * 0.18),
        key: keyActor('tug', elapsedMs, 190 + eased * 260, 154, 0.38, eased * 0.24),
        pixelCollapse: clamp01((sceneProgress - 0.48) / 0.52),
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

export function deriveHandoffAnimation(progress: number): HandoffFrame {
  const safeProgress = clamp01(progress)
  const eased = easeInOut(safeProgress)
  return {
    progress: safeProgress,
    keyX: 160,
    keyY: 112,
    keyScale: 0.45 + eased * 4.05,
    keyRotation: safeProgress * Math.PI * 2,
    flashOpacity: safeProgress === 1 ? 1 : clamp01((safeProgress - 0.55) / 0.45),
  }
}
