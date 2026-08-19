export type IntroAsset = {
  id: string
  path: string
  role: 'background' | 'sprite' | 'logo-layer' | 'card'
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
  // Wave S4 ident acting (the legacy 256-cell sheets are fully retired).
  { id: 'popt-run', path: 'images/intro/tmb2/scramble/sprites/popt-run-sheet.png', role: 'sprite' },
  { id: 'popt-skid', path: 'images/intro/tmb2/scramble/sprites/popt-skid.png', role: 'sprite' },
  { id: 'popt-tap', path: 'images/intro/tmb2/scramble/sprites/popt-tap.png', role: 'sprite' },
  // Scramble plates (plan 0031), shipped at exactly 320×224 and drawn 1:1.
  { id: 'plate-hangar-dark', path: 'images/intro/tmb2/scramble/plates/hangar-dark.png', role: 'background' },
  { id: 'plate-hangar-reveal', path: 'images/intro/tmb2/scramble/plates/hangar-reveal.png', role: 'background' },
  { id: 'plate-doorway', path: 'images/intro/tmb2/scramble/plates/doorway.png', role: 'background' },
  { id: 'door-leaf', path: 'images/intro/tmb2/scramble/plates/door-leaf.png', role: 'background' },
  { id: 'plate-walk-tarmac', path: 'images/intro/tmb2/scramble/plates/walk-tarmac.png', role: 'background' },
  { id: 'plate-runway-lineup', path: 'images/intro/tmb2/scramble/plates/runway-lineup.png', role: 'background' },
  { id: 'plate-night-sky', path: 'images/intro/tmb2/scramble/plates/night-sky.png', role: 'background' },
  // Scramble still cards — full-frame generated stills cut on the beats.
  { id: 'card-boots', path: 'images/intro/tmb2/scramble/cards/boots.png', role: 'background' },
  { id: 'card-coffee', path: 'images/intro/tmb2/scramble/cards/coffee.png', role: 'background' },
  { id: 'card-flight-case', path: 'images/intro/tmb2/scramble/cards/flight-case.png', role: 'background' },
  { id: 'card-flight-case-shut', path: 'images/intro/tmb2/scramble/cards/flight-case-shut.png', role: 'background' },
  { id: 'card-watch', path: 'images/intro/tmb2/scramble/cards/watch.png', role: 'background' },
  { id: 'card-stripes', path: 'images/intro/tmb2/scramble/cards/stripes.png', role: 'background' },
  { id: 'card-logbook', path: 'images/intro/tmb2/scramble/cards/logbook.png', role: 'background' },
  { id: 'card-wings', path: 'images/intro/tmb2/scramble/cards/wings.png', role: 'background' },
  { id: 'card-cap-a', path: 'images/intro/tmb2/scramble/cards/cap-a.png', role: 'background' },
  { id: 'card-cap-mid', path: 'images/intro/tmb2/scramble/cards/cap-mid.png', role: 'background' },
  { id: 'card-cap-b', path: 'images/intro/tmb2/scramble/cards/cap-b.png', role: 'background' },
  { id: 'card-shades', path: 'images/intro/tmb2/scramble/cards/shades.png', role: 'background' },
  { id: 'card-nacelle-a', path: 'images/intro/tmb2/scramble/cards/nacelle-a.png', role: 'background' },
  { id: 'card-nacelle-b', path: 'images/intro/tmb2/scramble/cards/nacelle-b.png', role: 'background' },
  { id: 'card-nacelle-c', path: 'images/intro/tmb2/scramble/cards/nacelle-c.png', role: 'background' },
  { id: 'card-instruments', path: 'images/intro/tmb2/scramble/cards/instruments.png', role: 'background' },
  { id: 'card-instruments-b', path: 'images/intro/tmb2/scramble/cards/instruments-b.png', role: 'background' },
  { id: 'card-photo', path: 'images/intro/tmb2/scramble/cards/photo.png', role: 'background' },
  { id: 'card-throttles-a', path: 'images/intro/tmb2/scramble/cards/throttles-a.png', role: 'background' },
  { id: 'card-throttles-b', path: 'images/intro/tmb2/scramble/cards/throttles-b.png', role: 'background' },
  // Scramble sprites at exact on-stage sizes (whole-number scales only).
  { id: 'popt-walk', path: 'images/intro/tmb2/scramble/sprites/popt-walk-sheet.png', role: 'sprite' },
  { id: 'popt-backlit', path: 'images/intro/tmb2/scramble/sprites/popt-backlit.png', role: 'sprite' },
  { id: 'dc9-runway', path: 'images/intro/tmb2/scramble/sprites/dc9-runway.png', role: 'sprite' },
  { id: 'dc9-runway-36', path: 'images/intro/tmb2/scramble/sprites/dc9-runway-36.png', role: 'sprite' },
  { id: 'dc9-runway-26', path: 'images/intro/tmb2/scramble/sprites/dc9-runway-26.png', role: 'sprite' },
  { id: 'dc9-liftoff-48', path: 'images/intro/tmb2/scramble/sprites/dc9-liftoff-48.png', role: 'sprite' },
  { id: 'dc9-liftoff-80', path: 'images/intro/tmb2/scramble/sprites/dc9-liftoff-80.png', role: 'sprite' },
  { id: 'dc9-liftoff-160', path: 'images/intro/tmb2/scramble/sprites/dc9-liftoff-160.png', role: 'sprite' },
  { id: 'dc9-liftoff-320', path: 'images/intro/tmb2/scramble/sprites/dc9-liftoff-320.png', role: 'sprite' },
  { id: 'emblem-finale', path: 'images/intro/tmb2/emblem/finale-card.png', role: 'card' },
] as const satisfies readonly IntroAsset[]

/** Everything the intro needs before the hangar reveal at 13.056 s: the
 * ident (logo + legacy sheets), the beacon dark (code only), the four ritual
 * cards, and both reveal plates. */
export const INTRO_INITIAL_ASSET_IDS = [
  'logo-source',
  'logo-blue-mask',
  'logo-base',
  'logo-highlight-mask',
  'logo-productions',
  'popt-run',
  'popt-skid',
  'popt-tap',
  'card-boots',
  'card-coffee',
  'card-flight-case',
  'card-flight-case-shut',
  'plate-hangar-dark',
  'plate-hangar-reveal',
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
