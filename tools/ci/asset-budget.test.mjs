import { describe, expect, it } from 'vitest'
import { evaluate, markdown } from './asset-budget.mjs'

const budgets = { totalBytes: 1000, initialDownloadBytes: 100, largestScriptBytes: 200, defaultModelBytes: 50, models: { 'models/a.glb': 300 } }
const within = { totalBytes: 900, initialDownloadBytes: 90, largestScript: { path: 'assets/i.js', bytes: 150 }, models: [{ path: 'models/a.glb', bytes: 280 }] }

describe('asset budget', () => {
  it('passes a build inside every limit', () => {
    expect(evaluate(within, budgets).some((r) => r.over)).toBe(false)
  })

  it('fails each measure that goes over', () => {
    for (const [what, m] of Object.entries({
      total: { ...within, totalBytes: 1001 },
      initial: { ...within, initialDownloadBytes: 101 },
      script: { ...within, largestScript: { path: 'x.js', bytes: 201 } },
      model: { ...within, models: [{ path: 'models/a.glb', bytes: 301 }] },
    })) {
      expect(evaluate(m, budgets).filter((r) => r.over), what).toHaveLength(1)
    }
  })

  it('holds an unlisted new model to the default, and says so', () => {
    const rows = evaluate({ ...within, models: [...within.models, { path: 'models/new.glb', bytes: 60 }] }, budgets)
    const added = rows.find((r) => r.name === 'models/new.glb')
    expect(added).toMatchObject({ limit: 50, over: true, unlisted: true })
    expect(markdown(rows)).toContain('over budget')
  })
})
