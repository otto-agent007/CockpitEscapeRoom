export type IntroAsset = { id: string; kind: 'image'; path: string }

export type IntroAssetFailure = {
  assetId: string
  assetPath: string
  message: string
}

export type IntroAssetLoadState =
  | { status: 'loading'; attempt: number }
  | { status: 'ready'; attempt: number }
  | { status: 'error'; attempt: number; failure: IntroAssetFailure }

export type IntroPlaybackMode = 'blocked' | 'cinematic' | 'legacy'

export class IntroAssetPreloadError extends Error {
  readonly assetId: string
  readonly assetPath: string

  constructor(asset: IntroAsset, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : String(cause)
    super(`Intro asset ${asset.id} failed to decode at ${asset.path}: ${detail}`, { cause })
    this.name = 'IntroAssetPreloadError'
    this.assetId = asset.id
    this.assetPath = asset.path
  }
}

export const INTRO_ASSET_BASE = 'images/intro/'

export const introAssets = [
  { id: 'popt-idle-sheet', kind: 'image', path: 'images/intro/popt/idle-sheet.png' },
  { id: 'popt-run-sheet', kind: 'image', path: 'images/intro/popt/run-sheet.png' },
  { id: 'popt-reach-sheet', kind: 'image', path: 'images/intro/popt/reach-catch-sheet.png' },
] as const satisfies readonly IntroAsset[]

export function createIntroAssetLoadState(): IntroAssetLoadState {
  return { status: 'loading', attempt: 0 }
}

export function beginIntroAssetLoad(state: IntroAssetLoadState): IntroAssetLoadState {
  return { status: 'loading', attempt: state.attempt + 1 }
}

export function completeIntroAssetLoad(state: IntroAssetLoadState): IntroAssetLoadState {
  return { status: 'ready', attempt: state.attempt }
}

export function failIntroAssetLoad(state: IntroAssetLoadState, error: unknown): IntroAssetLoadState {
  const failure = error instanceof IntroAssetPreloadError
    ? { assetId: error.assetId, assetPath: error.assetPath, message: error.message }
    : { assetId: 'intro-manifest', assetPath: INTRO_ASSET_BASE, message: String(error) }
  return { status: 'error', attempt: state.attempt, failure }
}

export function getIntroPlaybackMode(
  state: IntroAssetLoadState,
  options: { development: boolean; legacyRequested: boolean },
): IntroPlaybackMode {
  if (options.development && options.legacyRequested) return 'legacy'
  if (state.status === 'ready') return 'cinematic'
  if (options.development && state.status === 'error') return 'legacy'
  return 'blocked'
}

export function validateIntroAssets(assets: readonly IntroAsset[]): void {
  const seen = new Set<string>()
  for (const asset of assets) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(asset.id)) throw new Error(`Unsafe intro asset id: ${asset.id}`)
    if (seen.has(asset.id)) throw new Error(`Duplicate intro asset id: ${asset.id}`)
    if (!/^images\/intro\/[a-z0-9/_-]+\.png$/.test(asset.path)) throw new Error(`Asset must use a safe local path: ${asset.path}`)
    seen.add(asset.id)
  }
}

export async function preloadIntroAssets(baseUrl: string): Promise<Map<string, HTMLImageElement>> {
  validateIntroAssets(introAssets)
  const entries = await Promise.all(introAssets.map(async (asset) => {
    const image = new Image()
    image.decoding = 'async'
    image.src = `${baseUrl}${asset.path}`
    try {
      await image.decode()
    } catch (error) {
      throw new IntroAssetPreloadError(asset, error)
    }
    return [asset.id, image] as const
  }))
  return new Map(entries)
}
