export type IntroAsset = {
  id: string
  path: string
  role: 'background' | 'sprite' | 'logo-layer'
}

export type IntroAssetTier = 'initial' | 'full'
export type IntroRenderAssets = ReadonlyMap<string, CanvasImageSource>

export type IntroAssetFailure = {
  assetId: string
  assetPath: string
  message: string
}

export type IntroAssetLoadState =
  | { status: 'loading'; attempt: number }
  | { status: 'ready'; attempt: number }
  | { status: 'error'; attempt: number; failure: IntroAssetFailure }

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

export const introAssets = [
  { id: 'logo-source', path: 'images/intro/tmb2/logo/tmb2-ident-source.png', role: 'logo-layer' },
  { id: 'logo-blue-mask', path: 'images/intro/tmb2/logo/tmb2-ident-blue-mask.png', role: 'logo-layer' },
  { id: 'logo-base', path: 'images/intro/tmb2/logo/tmb2-ident-base.png', role: 'logo-layer' },
  { id: 'logo-highlight-mask', path: 'images/intro/tmb2/logo/tmb2-ident-highlight-mask.png', role: 'logo-layer' },
  { id: 'logo-productions', path: 'images/intro/tmb2/logo/tmb2-productions.png', role: 'logo-layer' },
  { id: 'background-duffel', path: 'images/intro/tmb2/backgrounds/duffel-terminal.png', role: 'background' },
  { id: 'popt-duffel-pull', path: 'images/intro/tmb2/popt/duffel-pull/duffel-pull-sheet.png', role: 'sprite' },
  { id: 'popt-startle-stumble', path: 'images/intro/tmb2/popt/startle-stumble/startle-stumble-sheet.png', role: 'sprite' },
  { id: 'key-poses', path: 'images/intro/tmb2/key/key-mascot-poses-sheet.png', role: 'sprite' },
  { id: 'background-runway', path: 'images/intro/tmb2/backgrounds/runway-night.png', role: 'background' },
  { id: 'background-ballpark', path: 'images/intro/tmb2/backgrounds/ballpark-night.png', role: 'background' },
  { id: 'background-finance', path: 'images/intro/tmb2/backgrounds/finance-city.png', role: 'background' },
  { id: 'background-clouds', path: 'images/intro/tmb2/backgrounds/cloud-chase.png', role: 'background' },
  { id: 'popt-idle', path: 'images/intro/tmb2/popt/legacy/idle-sheet.png', role: 'sprite' },
  { id: 'popt-run', path: 'images/intro/tmb2/popt/legacy/run-sheet.png', role: 'sprite' },
  { id: 'popt-reach-catch', path: 'images/intro/tmb2/popt/legacy/reach-catch-sheet.png', role: 'sprite' },
  { id: 'popt-baseball-slide', path: 'images/intro/tmb2/popt/baseball-slide/baseball-slide-sheet.png', role: 'sprite' },
  { id: 'popt-bull-spin', path: 'images/intro/tmb2/popt/bull-spin/bull-spin-sheet.png', role: 'sprite' },
  { id: 'popt-pilot-glide', path: 'images/intro/tmb2/popt/pilot-glide/pilot-glide-sheet.png', role: 'sprite' },
  { id: 'popt-victory-recovery', path: 'images/intro/tmb2/popt/victory-recovery/victory-recovery-sheet.png', role: 'sprite' },
] as const satisfies readonly IntroAsset[]

export const INTRO_INITIAL_ASSET_IDS = [
  'logo-source',
  'logo-blue-mask',
  'logo-base',
  'logo-highlight-mask',
  'logo-productions',
  'background-duffel',
  'popt-duffel-pull',
  'popt-startle-stumble',
  'key-poses',
] as const

export const INTRO_FULL_ASSET_IDS = introAssets.map((asset) => asset.id)

export function getIntroAssetsForTier(tier: IntroAssetTier): readonly IntroAsset[] {
  if (tier === 'full') return introAssets
  const byId = new Map(introAssets.map((asset) => [asset.id, asset]))
  return INTRO_INITIAL_ASSET_IDS.map((id) => byId.get(id)!)
}

export function validateIntroAssets(assets: readonly IntroAsset[]): void {
  const ids = new Set<string>()
  const paths = new Set<string>()
  for (const asset of assets) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(asset.id)) {
      throw new Error(`Unsafe intro asset id: ${asset.id}`)
    }
    if (ids.has(asset.id)) throw new Error(`Duplicate intro asset id: ${asset.id}`)
    if (!/^images\/intro\/[a-z0-9/_-]+\.png$/.test(asset.path)) {
      throw new Error(`Asset must use a safe local PNG path: ${asset.path}`)
    }
    if (paths.has(asset.path)) throw new Error(`Duplicate intro asset path: ${asset.path}`)
    if (/tesla|model[- ]?y|flight mode|mars/i.test(`${asset.id} ${asset.path}`)) {
      throw new Error(`Protected reward leaked into intro assets: ${asset.id}`)
    }
    ids.add(asset.id)
    paths.add(asset.path)
  }
}

export async function preloadIntroAssets(
  baseUrl: string,
  tier: IntroAssetTier,
): Promise<Map<string, HTMLImageElement>> {
  validateIntroAssets(introAssets)
  const selected = getIntroAssetsForTier(tier)
  const entries: Array<readonly [string, HTMLImageElement]> = []
  for (const asset of selected) {
    const image = new Image()
    image.decoding = 'async'
    image.src = `${baseUrl}${asset.path}`
    try {
      await image.decode()
    } catch (error) {
      throw new IntroAssetPreloadError(asset, error)
    }
    entries.push([asset.id, image] as const)
  }
  return new Map(entries)
}

export function mergeIntroAssets(
  current: IntroRenderAssets,
  additions: IntroRenderAssets,
): IntroRenderAssets {
  return new Map([...current, ...additions])
}

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
    : { assetId: 'intro-manifest', assetPath: 'images/intro/', message: String(error) }
  return { status: 'error', attempt: state.attempt, failure }
}
