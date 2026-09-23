import { describe, expect, it } from 'vitest'
import { APPROVAL_LABEL, diffDependencies, verdict } from './new-deps-guard.mjs'

const base = { dependencies: { react: '19' }, devDependencies: { vitest: '3' } }

describe('new production dependency guard', () => {
  it('fails a new production dependency without the approval label', () => {
    const diff = diffDependencies(base, { ...base, dependencies: { ...base.dependencies, lodash: '4' } })
    expect(diff.production).toEqual(['lodash'])
    expect(verdict(diff, []).ok).toBe(false)
    expect(verdict(diff, ['unrelated']).ok).toBe(false)
  })

  it('passes it once the owner labels the PR', () => {
    const diff = diffDependencies(base, { ...base, dependencies: { ...base.dependencies, lodash: '4' } })
    expect(verdict(diff, [APPROVAL_LABEL]).ok).toBe(true)
  })

  it('does not fail on version bumps or new devDependencies', () => {
    const diff = diffDependencies(base, { dependencies: { react: '20' }, devDependencies: { vitest: '3', '@axe-core/playwright': '4' } })
    expect(diff).toEqual({ production: [], development: ['@axe-core/playwright'] })
    expect(verdict(diff, []).ok).toBe(true)
  })
})
