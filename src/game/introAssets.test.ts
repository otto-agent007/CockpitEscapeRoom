import { afterEach, describe, expect, it, vi } from 'vitest'
import { KEY_CLIPS, POPT_CLIPS } from './introAnimation'
import {
  INTRO_FULL_ASSET_IDS,
  INTRO_INITIAL_ASSET_IDS,
  IntroAssetPreloadError,
  getIntroAssetsForTier,
  introAssets,
  preloadIntroAssets,
  validateIntroAssets,
} from './introAssets'

type Deferred = {
  promise: Promise<void>
  resolve: () => void
  reject: (reason?: unknown) => void
}

function createDeferred(): Deferred {
  let resolve!: () => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<void>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, resolve, reject }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('TMB2 runtime image tiers', () => {
  it('registers every rendered sheet and background as a safe local PNG', () => {
    expect(() => validateIntroAssets(introAssets)).not.toThrow()
    expect(new Set(introAssets.map((asset) => asset.id)).size).toBe(introAssets.length)
    expect(introAssets).toHaveLength(20)
    expect(introAssets.every((asset) => asset.path.endsWith('.png'))).toBe(true)
    expect(JSON.stringify(introAssets)).not.toMatch(/\.webp|tesla|model[- ]?y|flight mode|mars/i)

    const renderedSpriteIds = new Set([
      ...Object.values(POPT_CLIPS).map((clip) => clip.assetId),
      ...Object.values(KEY_CLIPS).map((clip) => clip.assetId),
    ])
    expect(renderedSpriteIds).toEqual(new Set(
      introAssets.filter((asset) => asset.role === 'sprite').map((asset) => asset.id),
    ))
    expect(introAssets.filter((asset) => asset.role === 'logo-layer').map((asset) => asset.id))
      .toEqual([
        'logo-source',
        'logo-blue-mask',
        'logo-base',
        'logo-highlight-mask',
        'logo-productions',
      ])
  })

  it('decodes only the opening tier before allowing playback', () => {
    expect(INTRO_INITIAL_ASSET_IDS).toEqual([
      'logo-source',
      'logo-blue-mask',
      'logo-base',
      'logo-highlight-mask',
      'logo-productions',
      'background-duffel',
      'popt-duffel-pull',
      'popt-startle-stumble',
      'key-poses',
    ])
    expect(INTRO_FULL_ASSET_IDS).toHaveLength(20)
    expect(getIntroAssetsForTier('initial').map((asset) => asset.id)).toEqual(INTRO_INITIAL_ASSET_IDS)
    expect(getIntroAssetsForTier('full')).toEqual(introAssets)
  })

  it('waits for every selected image to decode and returns stable ids', async () => {
    const deferred = INTRO_INITIAL_ASSET_IDS.map(createDeferred)
    let imageIndex = 0
    class DecodeControlledImage {
      decoding: 'async' | 'auto' | 'sync' = 'auto'
      src = ''
      readonly decode = vi.fn(() => deferred[imageIndex++]!.promise)
    }
    vi.stubGlobal('Image', DecodeControlledImage)

    let settled = false
    const preload = preloadIntroAssets('/cockpit/', 'initial').then((assets) => {
      settled = true
      return assets
    })
    await Promise.resolve()
    expect(settled).toBe(false)

    for (const pending of deferred.slice(0, -1)) pending.resolve()
    await Promise.resolve()
    expect(settled).toBe(false)

    deferred.at(-1)!.resolve()
    const assets = await preload
    expect([...assets.keys()]).toEqual(INTRO_INITIAL_ASSET_IDS)
    expect(settled).toBe(true)
  })

  it('reports the exact asset id and path when decode fails', async () => {
    class RejectingImage {
      decoding: 'async' | 'auto' | 'sync' = 'auto'
      src = ''
      readonly decode = vi.fn(() => Promise.reject(new Error('decode rejected')))
    }
    vi.stubGlobal('Image', RejectingImage)

    await expect(preloadIntroAssets('/cockpit/', 'initial')).rejects.toMatchObject({
      name: 'IntroAssetPreloadError',
      assetId: 'logo-source',
      assetPath: 'images/intro/tmb2/logo/tmb2-ident-source.png',
    } satisfies Partial<IntroAssetPreloadError>)
  })
})
