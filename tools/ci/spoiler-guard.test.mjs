import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { checkDist, initialFiles } from './spoiler-guard.mjs'

let dir = ''
function dist(files) {
  dir = mkdtempSync(join(tmpdir(), 'spoiler-'))
  mkdirSync(join(dir, 'assets'))
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body)
  return dir
}
afterEach(() => { if (dir) rmSync(dir, { recursive: true, force: true }) })

const html = '<html><head><script type="module" src="/assets/index.js"></script></head></html>'

describe('spoiler guard', () => {
  it('follows static imports but not dynamic ones', () => {
    const d = dist({
      'index.html': html,
      'assets/index.js': 'import{a}from"./vendor.js";const r=()=>import("./Reward.js")',
      'assets/vendor.js': 'export const a=1',
      'assets/Reward.js': 'The red Tesla Model Y',
    })
    const names = initialFiles(d).map((f) => f.slice(d.length + 1)).sort()
    expect(names).toEqual(['assets/index.js', 'assets/vendor.js', 'index.html'])
  })

  it('passes a build whose only mentions are in a lazy chunk', () => {
    const d = dist({ 'index.html': html, 'assets/index.js': 'const r=()=>import("./Reward.js")', 'assets/Reward.js': 'Model Y Flight Mode TESLA' })
    expect(checkDist(d, [])).toEqual([])
  })

  it('fails a mention in the entry, in a static import, or in index.html', () => {
    for (const [where, files] of Object.entries({
      entry: { 'index.html': html, 'assets/index.js': 'title:"Your new Model Y"' },
      vendor: { 'index.html': html, 'assets/index.js': 'import"./v.js"', 'assets/v.js': 'flight mode ready' },
      html: { 'index.html': html.replace('<head>', '<head><title>Tesla</title>'), 'assets/index.js': '' },
      preload: { 'index.html': html.replace('</head>', '<link rel="modulepreload" href="/assets/tesla.js"></head>'), 'assets/index.js': '', 'assets/tesla.js': '' },
    })) {
      expect(checkDist(dist(files), []).length, where).toBeGreaterThan(0)
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('allows only an occurrence the owner reviewed, not a new one beside it', () => {
    const allow = [{ context: 'The red Tesla Model Y is unlocked.' }]
    const reviewed = dist({ 'index.html': html, 'assets/index.js': 'line:`The red Tesla Model Y is unlocked.`' })
    expect(checkDist(reviewed, allow)).toEqual([])
    rmSync(dir, { recursive: true, force: true })
    const extra = dist({ 'index.html': html, 'assets/index.js': 'line:`The red Tesla Model Y is unlocked.`' + ' '.repeat(200) + 'hint:"a Model Y awaits"' })
    expect(checkDist(extra, allow)).toHaveLength(1)
  })
})
