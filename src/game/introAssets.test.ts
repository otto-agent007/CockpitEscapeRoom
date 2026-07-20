import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  IntroAssetPreloadError,
  beginIntroAssetLoad,
  completeIntroAssetLoad,
  createIntroAssetLoadState,
  failIntroAssetLoad,
  getIntroPlaybackMode,
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

function installDecodeHarness(deferred: Deferred[]): void {
  let imageIndex = 0
  class DecodeControlledImage {
    decoding: 'async' | 'auto' | 'sync' = 'auto'
    src = ''
    readonly decode = vi.fn(() => deferred[imageIndex++]!.promise)
  }
  vi.stubGlobal('Image', DecodeControlledImage)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('intro asset contract', () => {
  it('uses unique safe ids and local deployable paths', () => {
    expect(() => validateIntroAssets(introAssets)).not.toThrow()
    expect(new Set(introAssets.map((asset) => asset.id)).size).toBe(introAssets.length)
    expect(introAssets.every((asset) => asset.path.startsWith('images/intro/'))).toBe(true)
  })

  it('rejects duplicate ids, remote paths, and traversal', () => {
    expect(() => validateIntroAssets([
      { id: 'bad', kind: 'image', path: '../bad.png' },
    ])).toThrow(/safe local path/i)
    expect(() => validateIntroAssets([
      { id: 'same', kind: 'image', path: 'images/intro/a.png' },
      { id: 'same', kind: 'image', path: 'images/intro/b.png' },
    ])).toThrow(/duplicate/i)
  })

  it('does not resolve preload until every declared PNG decodes', async () => {
    const deferred = introAssets.map(createDeferred)
    installDecodeHarness(deferred)
    let settled = false

    const preload = preloadIntroAssets('/cockpit/').then((assets) => {
      settled = true
      return assets
    })
    await Promise.resolve()
    expect(settled).toBe(false)

    for (const pending of deferred.slice(0, -1)) pending.resolve()
    await Promise.resolve()
    expect(settled).toBe(false)

    deferred.at(-1)!.resolve()
    await expect(preload).resolves.toHaveLength(introAssets.length)
    expect(settled).toBe(true)
  })

  it('preserves the failing asset id and path when decode rejects', async () => {
    const deferred = introAssets.map(createDeferred)
    installDecodeHarness(deferred)
    const preload = preloadIntroAssets('/cockpit/')

    deferred[0]!.resolve()
    deferred[1]!.reject(new Error('decode rejected'))
    deferred[2]!.resolve()

    await expect(preload).rejects.toMatchObject({
      name: 'IntroAssetPreloadError',
      assetId: introAssets[1].id,
      assetPath: introAssets[1].path,
    } satisfies Partial<IntroAssetPreloadError>)
    await expect(preload).rejects.toThrow(new RegExp(`${introAssets[1].id}.*${introAssets[1].path}`))
  })

  it('blocks normal playback until ready and limits failure fallback to development', () => {
    const initial = createIntroAssetLoadState()
    const loading = beginIntroAssetLoad(initial)
    expect(getIntroPlaybackMode(loading, { development: false, legacyRequested: false })).toBe('blocked')

    const ready = completeIntroAssetLoad(loading)
    expect(getIntroPlaybackMode(ready, { development: false, legacyRequested: false })).toBe('cinematic')

    const failure = new IntroAssetPreloadError(introAssets[0], new Error('decode rejected'))
    const failed = failIntroAssetLoad(loading, failure)
    expect(failed).toMatchObject({
      status: 'error',
      failure: { assetId: introAssets[0].id, assetPath: introAssets[0].path },
    })
    expect(getIntroPlaybackMode(failed, { development: false, legacyRequested: false })).toBe('blocked')
    expect(getIntroPlaybackMode(failed, { development: true, legacyRequested: false })).toBe('legacy')
    expect(getIntroPlaybackMode(loading, { development: true, legacyRequested: true })).toBe('legacy')
  })
})
