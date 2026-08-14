import { getIntroScene, normalizeIntroTime, type IntroSceneId } from './introConfig'

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

export function deriveIntroAnimation(timeSeconds: number, reducedMotion: boolean): IntroAnimationFrame {
  const normalizedTime = normalizeIntroTime(timeSeconds)
  const scene = getIntroScene(normalizedTime)
  const duration = scene.endSeconds - scene.startSeconds
  const rawProgress = clamp01((normalizedTime - scene.startSeconds) / duration)
  const sceneProgress = reducedMotion ? 0.5 : rawProgress
  const elapsedMs = reducedMotion ? duration * 500 : (normalizedTime - scene.startSeconds) * 1_000
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
    case 'duffel':
      return {
        ...base,
        popt: poptActor('duffel-pull', elapsedMs, 58 + eased * 86, 190),
        props: [prop('duffel', 205 + eased * 22, 156, 1, Math.sin(elapsedMs / 55) * 0.025)],
      }
    case 'key-escape': {
      const taunting = sceneProgress < 0.55
      return {
        ...base,
        popt: poptActor('startle-stumble', elapsedMs, 84 - eased * 14, 190),
        key: keyActor(
          taunting ? 'taunt' : 'fly',
          elapsedMs,
          166 + eased * 118,
          146 - Math.sin(sceneProgress * Math.PI) * 52,
          0.38,
          taunting ? Math.sin(elapsedMs / 120) * 0.08 : sceneProgress * 0.8,
        ),
        props: [prop('duffel', 206, 154, 1, -0.1)],
      }
    }
    case 'runway':
      return {
        ...base,
        popt: poptActor('run', elapsedMs, 76 + Math.sin(sceneProgress * Math.PI * 6) * 4, 190),
        key: keyActor('run', elapsedMs, 190 - sceneProgress * 18 + Math.sin(sceneProgress * Math.PI * 4) * 5, 174),
        props: [prop('runway-cart', 350 - sceneProgress * 430, 184, 0.68)],
      }
    case 'ballpark':
      return {
        ...base,
        popt: poptActor('baseball-slide', elapsedMs, 42 + eased * 176, 194, 1.18, -0.05),
        key: keyActor('fly', elapsedMs, 176 + Math.sin(sceneProgress * Math.PI * 2) * 42, 104),
        props: [
          prop('baseball', 70 + sceneProgress * 200, 82 + Math.sin(sceneProgress * Math.PI) * 76, 0.8),
          prop('base', 230, 192, 0.65),
        ],
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
