export type IntroSpriteClipId = 'idle' | 'run' | 'reach'

export type IntroSpriteClip = {
  assetId: 'popt-idle-sheet' | 'popt-run-sheet' | 'popt-reach-sheet'
  frameWidth: 256
  frameHeight: 256
  columns: number
  rows: number
  frameCount: number
  frameDurationSeconds: number
  playback: 'loop' | 'once'
  anchor: { x: number; y: number }
  drawSize: { width: number; height: number }
}

const SHARED_DRAW_CONTRACT = {
  frameWidth: 256,
  frameHeight: 256,
  anchor: { x: 64, y: 112 },
  drawSize: { width: 128, height: 128 },
} as const

export const introSpriteClips = {
  idle: {
    ...SHARED_DRAW_CONTRACT,
    assetId: 'popt-idle-sheet',
    columns: 4,
    rows: 1,
    frameCount: 4,
    frameDurationSeconds: 0.22,
    playback: 'loop',
  },
  run: {
    ...SHARED_DRAW_CONTRACT,
    assetId: 'popt-run-sheet',
    columns: 4,
    rows: 2,
    frameCount: 8,
    frameDurationSeconds: 0.08,
    playback: 'loop',
  },
  reach: {
    ...SHARED_DRAW_CONTRACT,
    assetId: 'popt-reach-sheet',
    columns: 4,
    rows: 1,
    frameCount: 4,
    frameDurationSeconds: 0.25,
    playback: 'once',
  },
} as const satisfies Record<IntroSpriteClipId, IntroSpriteClip>

export function validateIntroSpriteClips(clips: Record<IntroSpriteClipId, IntroSpriteClip>): void {
  const assetIds = new Set<string>()
  for (const [id, clip] of Object.entries(clips)) {
    if (clip.frameWidth !== 256 || clip.frameHeight !== 256) {
      throw new Error(`${id} must use normalized 256 x 256 cells`)
    }
    if (clip.columns * clip.rows < clip.frameCount) {
      throw new Error(`${id} declares more frames than its grid contains`)
    }
    if (!Number.isInteger(clip.anchor.x) || !Number.isInteger(clip.anchor.y)) {
      throw new Error(`${id} must use an integer runtime anchor`)
    }
    if (clip.anchor.x !== 64 || clip.anchor.y !== 112) {
      throw new Error(`${id} must share the Pop T feet anchor`)
    }
    if (assetIds.has(clip.assetId)) throw new Error(`Duplicate sprite asset: ${clip.assetId}`)
    assetIds.add(clip.assetId)
  }
}

export function getIntroSpriteFrame(clipId: IntroSpriteClipId, elapsedSeconds: number): number {
  const clip = introSpriteClips[clipId]
  const safeSeconds = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0
  const sampledFrame = Math.floor(safeSeconds / clip.frameDurationSeconds)
  return clip.playback === 'loop'
    ? sampledFrame % clip.frameCount
    : Math.min(sampledFrame, clip.frameCount - 1)
}
