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
  scale = 1.12,
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

export function deriveIntroAnimation(timeSeconds: number, reducedMotion: boolean): IntroAnimationFrame {
  const normalizedTime = normalizeIntroTime(timeSeconds)
  const scene = getIntroScene(normalizedTime)
  const duration = scene.endSeconds - scene.startSeconds
  const rawProgress = clamp01((normalizedTime - scene.startSeconds) / duration)
  const storyTime = reducedMotion
    ? REPRESENTATIVE_SCENE_TIME[scene.id] ?? scene.startSeconds + duration / 2
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
    pixelCollapse: 0,
  }

  const frame = ((): IntroAnimationFrame => {
  switch (scene.id) {
    case 'tmb2-ident':
      return {
        ...base,
        logo: reducedMotion
          ? { visible: true, buildProgress: 1, highlightOpacity: 0 }
          : {
              visible: true,
              buildProgress: clamp01(sceneProgress / 0.72),
              highlightOpacity: clamp01((sceneProgress - 0.78) / 0.22),
            },
      }
    case 'duffel': {
      // Panel 1 into panel 2: Pop T assembles from blue pixels on a darkened
      // stage, strides to the bag, then fights it with beat-locked tugs.
      const t = storyTime
      const assembleEnd = INTRO_MUSIC_CUES.assembleDone
      const walkEnd = 7.95
      const fx: IntroFxFrame[] = []
      const backgroundDim = t < 6.8 ? 0.55 * (1 - (t - 6) / 0.8) : 0

      let popt: SpriteActorFrame
      if (t < assembleEnd) {
        const assembleProgress = clamp01((t - 6) / (assembleEnd - 6))
        const x = 52 + assembleProgress * 18
        fx.push({ kind: 'pixel-assemble', progress: assembleProgress, x, y: 188 })
        popt = poptActor('run', elapsedMs, x, 190, 1.12, 0, false, 0.25 + 0.75 * assembleProgress)
      } else if (t < walkEnd) {
        const walkProgress = easeInOut((t - assembleEnd) / (walkEnd - assembleEnd))
        popt = poptActor('run', elapsedMs, 70 + walkProgress * 68, 190)
      } else {
        const joltStart = INTRO_MUSIC_CUES.firstDuffelJolt
        const sinceJolt = t - joltStart
        const joltCount = sinceJolt >= 0 ? Math.floor(sinceJolt / DUFFEL_JOLT_PERIOD_SECONDS) : -1
        const joltPhase = sinceJolt >= 0
          ? (sinceJolt % DUFFEL_JOLT_PERIOD_SECONDS) / DUFFEL_JOLT_PERIOD_SECONDS
          : 0
        const joltStrength = joltCount < 0 ? 0 : Math.min(1, 0.4 + joltCount * 0.2)
        const tugOffset = -7 * Math.sin(joltPhase * Math.PI) * joltStrength
        popt = poptActor('duffel-pull', clipElapsedMs(t, walkEnd), 138 + tugOffset, 190)
        if (t >= 9.5) {
          const dropletLift = Math.sin(joltPhase * Math.PI)
          fx.push(
            { kind: 'sweat', x: 126, y: 102 - dropletLift * 7, scale: 1, opacity: 0.9 * dropletLift },
            { kind: 'sweat', x: 148, y: 108 - dropletLift * 5, scale: 0.8, opacity: 0.7 * dropletLift },
          )
        }
        return {
          ...base,
          backgroundDim,
          popt,
          fx,
          props: [prop('duffel', 206, 156, 1, Math.sin(joltPhase * Math.PI) * 0.055 * joltStrength)],
        }
      }
      return {
        ...base,
        backgroundDim,
        popt,
        fx,
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
      if (t >= EXCLAIM && t < EXCLAIM + 0.66) {
        const pop = (t - EXCLAIM) / 0.66
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

      return {
        ...base,
        popt,
        key,
        fx,
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
      const popt = poptActor('run', elapsedMs, poptX, 190 - hop * 14, 1.12, -hop * 0.08)

      const cartX = 473 - 90 * sceneT

      return {
        ...base,
        backgroundOffsetX: reducedMotion ? 0 : -12 * sceneProgress,
        popt,
        key: keyActor('fly', elapsedMs, keySample.x, keySample.y, 0.36, keySample.rotation),
        fx,
        props: [prop('runway-cart', cartX, 184, 0.68)],
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
        const phase = (t - DEFLECT) / 0.53
        fx.push({
          kind: 'impact-star',
          x: D.x,
          y: D.y,
          scale: 0.3 + Math.sin(phase * Math.PI) * 0.1,
          rotation: phase * 0.6,
          opacity: Math.sin(phase * Math.PI),
        })
      }

      let popt: SpriteActorFrame
      if (t < SLIDE_START) {
        popt = poptActor('run', elapsedMs, 36 + ((t - 22) / (SLIDE_START - 22)) * 84, 190)
      } else {
        const slide = 1 - (1 - clamp01((t - SLIDE_START) / 2.2)) ** 2
        popt = poptActor('baseball-slide', clipElapsedMs(t, SLIDE_START), 120 + 118 * slide, 194, 1.18, -0.05)
        if (t < 25.5) {
          props.push(prop('cloud-puff', 120 + 118 * slide - 20, 198, 0.3, 0, 0.5))
        }
      }

      return { ...base, popt, key: keyActor('fly', elapsedMs, keySample.x, keySample.y, 0.36, keySample.rotation), fx, props }
    }
    case 'city-finance':
      return {
        ...base,
        popt: poptActor('bull-spin', elapsedMs, 54 + eased * 156, 188, 1.14, sceneProgress * Math.PI * 0.35),
        key: keyActor('run', elapsedMs, 106 + sceneProgress * 150, 172 - sceneProgress * 72, 0.36),
        props: [
          prop('graph', 160, 152, 1),
          prop('bull-impact', 222, 178, 0.3 + Math.sin(sceneProgress * Math.PI) * 0.08, 0, Math.sin(sceneProgress * Math.PI)),
        ],
      }
    case 'sky':
      return {
        ...base,
        popt: poptActor('pilot-glide', elapsedMs, 46 + eased * 92, 166 - Math.sin(sceneProgress * Math.PI) * 26, 1.08),
        key: keyActor('fly', elapsedMs, 202 + Math.sin(sceneProgress * Math.PI * 2) * 22, 108 - sceneProgress * 18, 0.36),
        props: [prop('cloud-puff', 340 - sceneProgress * 410, 132, 0.55, 0, 0.72)],
      }
    case 'final-pursuit': {
      const missArc = Math.sin(sceneProgress * Math.PI * 2)
      const poptX = 72 + eased * 112
      const poptY = 158 - missArc * 20
      return {
        ...base,
        popt: poptActor('pilot-glide', elapsedMs, poptX, poptY, 1.1, missArc * 0.08),
        key: keyActor('fly', elapsedMs, 220 - eased * 28, 116 + missArc * 16, 0.36),
        props: [prop('pilot-wings', poptX, poptY - 38, 0.52, missArc * 0.08)],
      }
    }
    case 'catch':
      return {
        ...base,
        popt: poptActor('victory-recovery', elapsedMs, 150, 190, 1.16),
        key: keyActor('taunt', elapsedMs, 214 + Math.sin(elapsedMs / 150) * 8, 126, 0.36, Math.sin(elapsedMs / 120) * 0.12),
      }
    case 'loop-reset':
      return {
        ...base,
        popt: poptActor('victory-recovery', elapsedMs, 124 + eased * 260, 190, 1.16, eased * 0.18),
        key: keyActor('tug', elapsedMs, 190 + eased * 260, 154, 0.38, eased * 0.24),
        pixelCollapse: clamp01((sceneProgress - 0.48) / 0.52),
      }
  }
  })()

  if (!reducedMotion || frame.fx.length === 0) return frame
  return { ...frame, fx: frame.fx.filter((fx) => REDUCED_MOTION_FX.has(fx.kind)) }
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
