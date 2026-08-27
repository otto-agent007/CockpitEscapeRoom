import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as introAssetContract from './intro-asset-contract.mjs'
import { introAssets } from '../../src/game/introAssets'

const {
  pngMetadata,
  sha256File,
  validateIntroManifest,
} = introAssetContract

const ONE_PIXEL_RGBA_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+AvzZ4QAAAABJRU5ErkJggg==',
  'base64',
)

describe('TMB2 intro asset contract', () => {
  const roots = []

  afterEach(() => {
    roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true }))
  })

  function createRoot() {
    const root = mkdtempSync(join(tmpdir(), 'tmb2-contract-'))
    roots.push(root)
    return root
  }

  it('accepts a hash-bound alpha PNG and known duplicate source', () => {
    const root = createRoot()
    mkdirSync(join(root, 'key'))
    writeFileSync(join(root, 'key/idle.png'), ONE_PIXEL_RGBA_PNG)
    const hash = sha256File(join(root, 'key/idle.png'))
    const manifest = {
      schemaVersion: 1,
      assets: [{
        id: 'key-idle',
        path: 'key/idle.png',
        sha256: hash,
        bytes: ONE_PIXEL_RGBA_PNG.length,
        width: 1,
        height: 1,
        hasAlpha: true,
      }],
      duplicates: [{ source: 'key-idle-copy', canonical: 'key-idle', sha256: hash }],
      preload: ['key/idle.png'],
    }

    expect(pngMetadata(join(root, 'key/idle.png'))).toEqual({ width: 1, height: 1, hasAlpha: true })
    expect(validateIntroManifest(manifest, root)).toEqual([])
  })

  it('rejects a runtime hash mismatch and protected reward preload', () => {
    const root = createRoot()
    writeFileSync(join(root, 'frame.png'), ONE_PIXEL_RGBA_PNG)
    const manifest = {
      schemaVersion: 1,
      assets: [{
        id: 'key-idle',
        path: 'frame.png',
        sha256: '0'.repeat(64),
        bytes: ONE_PIXEL_RGBA_PNG.length,
        width: 1,
        height: 1,
        hasAlpha: true,
      }],
      duplicates: [],
      preload: ['images/model-y.png'],
    }

    expect(validateIntroManifest(manifest, root)).toEqual(expect.arrayContaining([
      expect.stringContaining('hash mismatch'),
      expect.stringContaining('protected reward'),
      expect.stringContaining('not declared'),
    ]))
  })

  it('rejects duplicate identifiers, missing files, bad dimensions, and unknown duplicate targets', () => {
    const root = createRoot()
    writeFileSync(join(root, 'frame.png'), ONE_PIXEL_RGBA_PNG)
    const hash = sha256File(join(root, 'frame.png'))
    const manifest = {
      schemaVersion: 1,
      assets: [
        {
          id: 'key-idle',
          path: 'frame.png',
          sha256: hash,
          bytes: ONE_PIXEL_RGBA_PNG.length,
          width: 2,
          height: 1,
          hasAlpha: true,
        },
        {
          id: 'key-idle',
          path: 'missing.png',
          sha256: 'f'.repeat(64),
          bytes: 12,
        },
      ],
      duplicates: [{ source: 'missing-copy', canonical: 'not-an-asset', sha256: hash }],
      preload: ['frame.png'],
    }

    expect(validateIntroManifest(manifest, root)).toEqual(expect.arrayContaining([
      expect.stringContaining('duplicate asset id'),
      expect.stringContaining('missing asset'),
      expect.stringContaining('dimensions mismatch'),
      expect.stringContaining('unknown canonical asset'),
    ]))
  })

  it('rejects an unsupported schema and malformed records', () => {
    const root = createRoot()
    expect(validateIntroManifest({ schemaVersion: 2, assets: 'bad', preload: {}, duplicates: null }, root)).toEqual(expect.arrayContaining([
      expect.stringContaining('schemaVersion'),
      expect.stringContaining('assets must be an array'),
      expect.stringContaining('duplicates must be an array'),
      expect.stringContaining('preload must be an array'),
    ]))
  })

  it('binds the approved source and four manifest-backed ident layers', () => {
    const validateTmb2LogoAuthority = introAssetContract.validateTmb2LogoAuthority
    expect(validateTmb2LogoAuthority).toBeTypeOf('function')
    if (typeof validateTmb2LogoAuthority !== 'function') return

    const manifest = JSON.parse(readFileSync('public/images/intro/tmb2/tmb2-intro-assets.json', 'utf8'))
    expect(validateTmb2LogoAuthority({
      sourcePath: 'art-source/intro/tmb2/owner-approved/TMB2logo.png',
      packageRoot: 'public/images/intro/tmb2',
      manifest,
    })).toEqual([])
    expect(manifest.preload).toEqual([
      'logo/tmb2-ident-source.png',
      'logo/tmb2-ident-blue-mask.png',
      'logo/tmb2-ident-base.png',
      'logo/tmb2-ident-highlight-mask.png',
      'scramble/sprites/popt-run-sheet.png',
      'scramble/sprites/popt-skid.png',
      'scramble/sprites/popt-blinded.png',
      'scramble/sprites/popt-forearm.png',
      'scramble/sprites/popt-flick.png',
      'scramble/sprites/popt-crooked.png',
      'scramble/sprites/popt-salute.png',
      'scramble/sprites/popt-tip.png',
      'scramble/sprites/popt-cover.png',
      'scramble/sprites/popt-fall.png',
      'scramble/sprites/popt-swing.png',
      'scramble/sprites/popt-lookup.png',
      'scramble/sprites/popt-cap.png',
      'scramble/sprites/popt-landed.png',
      'scramble/plates/hangar-dark.png',
      'scramble/plates/hangar-reveal.png',
      'scramble/plates/doorway.png',
      'scramble/plates/door-leaf.png',
      'scramble/plates/walk-tarmac.png',
      'scramble/plates/right-seat.png',
      'scramble/plates/right-seat-glow.png',
      'scramble/overlays/title-plaque-gold.png',
      'scramble/cards/boots.png',
      'scramble/cards/coffee.png',
      'scramble/cards/watch.png',
      'scramble/cards/stripes.png',
      'scramble/cards/logbook.png',
      'scramble/cards/wings.png',
      'scramble/cards/cap-a.png',
      'scramble/cards/cap-mid.png',
      'scramble/cards/cap-b.png',
      'scramble/cards/shades.png',
      'scramble/cards/headset.png',
      'scramble/cards/overhead.png',
      'scramble/cards/nacelle-a.png',
      'scramble/cards/nacelle-b.png',
      'scramble/cards/nacelle-c.png',
      'scramble/cards/logbook-books.png',
      'scramble/cards/logbook-sweep.png',
      'scramble/cards/logbook-lift.png',
      'scramble/cards/shadow.png',
      'scramble/cards/instruments.png',
      'scramble/cards/instruments-b.png',
      'scramble/cards/throttles-a.png',
      'scramble/cards/throttles-b.png',
      'scramble/sprites/popt-walk-sheet.png',
      'scramble/sprites/popt-backlit.png',
    ])
  })

  it('hash-binds every runtime image through the manifest preload list', () => {
    const manifest = JSON.parse(readFileSync('public/images/intro/tmb2/tmb2-intro-assets.json', 'utf8'))
    const preload = new Set(manifest.preload)
    for (const asset of introAssets) {
      const packagePath = asset.path.replace('images/intro/tmb2/', '')
      expect(preload.has(packagePath), `${asset.id} (${packagePath}) must be a manifest preload`)
        .toBe(true)
    }
  })

  it('keeps the ident layers at half the stage width and drops the PRODUCTIONS wordmark', () => {
    for (const layer of ['blue-mask', 'base', 'highlight-mask']) {
      const { width, height } = pngMetadata(`public/images/intro/tmb2/logo/tmb2-ident-${layer}.png`)
      expect({ layer, width, height }).toEqual({ layer, width: 160, height: 44 })
    }
    expect(existsSync('public/images/intro/tmb2/logo/tmb2-productions.png')).toBe(false)
  })

  it('rejects source drift and a missing ident layer', () => {
    const validateTmb2LogoAuthority = introAssetContract.validateTmb2LogoAuthority
    expect(validateTmb2LogoAuthority).toBeTypeOf('function')
    if (typeof validateTmb2LogoAuthority !== 'function') return

    const root = createRoot()
    const sourcePath = join(root, 'TMB2logo.png')
    const packageRoot = join(root, 'package')
    mkdirSync(packageRoot)
    writeFileSync(sourcePath, ONE_PIXEL_RGBA_PNG)

    expect(validateTmb2LogoAuthority({
      sourcePath,
      packageRoot,
      manifest: {
        logoAuthority: {
          sha256: '0'.repeat(64),
          bytes: ONE_PIXEL_RGBA_PNG.length,
          width: 1,
          height: 1,
        },
        assets: [],
      },
    })).toEqual(expect.arrayContaining([
      expect.stringContaining('approved TMB2 logo hash'),
      expect.stringContaining('missing ident layer'),
    ]))
  })
})
