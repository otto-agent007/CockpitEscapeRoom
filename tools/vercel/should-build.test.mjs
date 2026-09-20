import { describe, expect, it } from 'vitest'
import { DEPLOY_INERT_PREFIXES, isDeployInert, shouldBuild } from './should-build.mjs'

describe('vercel ignored build step', () => {
  it('builds when the diff could not be determined', () => {
    expect(shouldBuild([])).toBe(true)
    expect(shouldBuild(null)).toBe(true)
    expect(shouldBuild(undefined)).toBe(true)
  })

  it('skips a documentation-only change', () => {
    expect(shouldBuild([
      'docs/GAME_DESIGN.md',
      'plans/0044-mars-arcade-fight-loop.md',
      'prompts/05_MARS_ARCADE_SPRITE_WAVE_0.md',
      'asset-reports/mars-arcade-sprite-contract.json',
      'README.md',
      'CLAUDE.md',
    ])).toBe(false)
  })

  it('builds when even one changed file reaches the bundle', () => {
    expect(shouldBuild(['docs/GAME_DESIGN.md', 'src/game/state.ts'])).toBe(true)
    expect(shouldBuild(['README.md', 'public/models/dc9-cockpit.glb'])).toBe(true)
    expect(shouldBuild(['plans/x.md', 'package.json'])).toBe(true)
    expect(shouldBuild(['docs/a.md', 'vite.config.ts'])).toBe(true)
  })

  it('treats the dev-only harness as inert', () => {
    expect(shouldBuild(['dev/arcade.html', 'src/dev/arcadeHarness.ts'])).toBe(false)
  })

  it('still builds for real application source', () => {
    expect(shouldBuild(['src/game/marsArcade.ts'])).toBe(true)
    expect(shouldBuild(['src/components/Hud.tsx'])).toBe(true)
    expect(shouldBuild(['src/scenes/AirbusAtmosphere.tsx'])).toBe(true)
  })

  it('builds for deployment configuration itself', () => {
    // Changing vercel.json can change headers, rewrites or the ignore rule, so it
    // must never be treated as inert.
    expect(shouldBuild(['vercel.json'])).toBe(true)
    expect(shouldBuild(['.vercelignore'])).toBe(true)
    expect(shouldBuild(['tools/vercel/should-build.mjs'])).toBe(true)
  })

  it('matches on path segments, not bare prefixes', () => {
    // A directory that merely starts with an inert name is not inert.
    expect(isDeployInert('docsy/thing.ts')).toBe(false)
    expect(isDeployInert('src/development/thing.ts')).toBe(false)
    expect(isDeployInert('e2etools/thing.ts')).toBe(false)
    expect(shouldBuild(['docsy/thing.ts'])).toBe(true)
  })

  it('only treats Markdown at the repository root as inert', () => {
    expect(isDeployInert('README.md')).toBe(true)
    expect(isDeployInert('docs/nested/deep/note.md')).toBe(true)
    // Markdown inside a bundled directory is not automatically inert.
    expect(isDeployInert('src/game/notes.md')).toBe(false)
    expect(isDeployInert('public/readme.md')).toBe(false)
  })

  it('keeps every declared prefix directory-anchored', () => {
    for (const prefix of DEPLOY_INERT_PREFIXES) {
      expect(prefix.endsWith('/'), `${prefix} must end with a slash`).toBe(true)
    }
  })
})
