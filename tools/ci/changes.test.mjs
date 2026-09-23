import { describe, expect, it } from 'vitest'
import { decide, needsBrowserSuite } from './changes.mjs'

describe('browser suite change detection', () => {
  it('runs for anything that can change the built game', () => {
    for (const file of ['src/game/marsArcade.ts', 'src/App.tsx', 'public/models/dc9.glb', 'package.json', 'index.html', 'vite.config.ts']) {
      expect(needsBrowserSuite(file), file).toBe(true)
    }
  })

  it('runs when the tests or the workflow change, though a deploy would not', () => {
    for (const file of ['e2e/smoke.spec.ts', '.github/workflows/ci.yml', 'playwright.config.ts']) {
      expect(needsBrowserSuite(file), file).toBe(true)
    }
  })

  it('skips dev-only arcade work, art sources and documentation', () => {
    const files = ['src/dev/arcadeHarness.ts', 'dev/arcade.html', 'art-source/arcade/booster/x.png', 'asset-reports/r.md', 'plans/0045.md', 'TEST_REPORT.md']
    expect(decide(files)).toEqual({ run: false, reasons: [] })
  })

  it('runs if even one file in a mixed change needs it', () => {
    expect(decide(['docs/a.md', 'src/game/x.ts']).run).toBe(true)
  })

  it('fails safe when the diff is unknown or empty', () => {
    expect(decide(null).run).toBe(true)
    expect(decide([]).run).toBe(true)
  })
})
