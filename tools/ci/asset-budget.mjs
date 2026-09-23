#!/usr/bin/env node
/**
 * Build-size budgets (tools/ci/budgets.json) with a Markdown report for the PR.
 *
 * The deployed site is ~173 MB, 139 MB of it GLB models, and the initial download
 * is what a player waits on before the cinematic. A size regression is invisible in
 * code review, so every build reports each measure against its limit, and fails
 * when one is over.
 *
 *   node tools/ci/asset-budget.mjs [dist-dir] [--report out.md]
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { initialFiles } from './spoiler-guard.mjs'

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

export function measure(distDir) {
  const files = walk(distDir).map((file) => ({ path: relative(distDir, file), bytes: statSync(file).size }))
  const scripts = files.filter((f) => f.path.endsWith('.js'))
  return {
    totalBytes: files.reduce((sum, f) => sum + f.bytes, 0),
    initialDownloadBytes: initialFiles(distDir).reduce((sum, f) => sum + statSync(f).size, 0),
    largestScript: scripts.sort((a, b) => b.bytes - a.bytes)[0] ?? { path: '-', bytes: 0 },
    models: files.filter((f) => f.path.endsWith('.glb')).sort((a, b) => b.bytes - a.bytes),
  }
}

export function evaluate(m, budgets) {
  const rows = [
    { name: 'Total build', bytes: m.totalBytes, limit: budgets.totalBytes },
    { name: 'Initial download (before any chapter)', bytes: m.initialDownloadBytes, limit: budgets.initialDownloadBytes },
    { name: `Largest script (${m.largestScript.path})`, bytes: m.largestScript.bytes, limit: budgets.largestScriptBytes },
    ...m.models.map((model) => ({
      name: model.path,
      bytes: model.bytes,
      limit: budgets.models[model.path] ?? budgets.defaultModelBytes,
      unlisted: !(model.path in budgets.models),
    })),
  ]
  return rows.map((row) => ({ ...row, over: row.bytes > row.limit }))
}

const mb = (bytes) => (bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${(bytes / 1e3).toFixed(0)} KB`)

export function markdown(rows) {
  const failed = rows.filter((r) => r.over)
  const lines = [
    '<!-- asset-budget-report -->',
    `### Build size ${failed.length ? `— ❌ ${failed.length} over budget` : '— ✅ within budget'}`,
    '',
    '| Measure | Size | Limit | Used |',
    '| --- | ---: | ---: | ---: |',
    ...rows.map((r) => `| ${r.over ? '❌ ' : ''}${r.name}${r.unlisted ? ' _(no own budget)_' : ''} | ${mb(r.bytes)} | ${mb(r.limit)} | ${Math.round((100 * r.bytes) / r.limit)}% |`),
    '',
    'Limits live in `tools/ci/budgets.json`; raising one is a reviewed change.',
  ]
  return lines.join('\n')
}

function main() {
  const args = process.argv.slice(2)
  const reportAt = args.indexOf('--report')
  const reportPath = reportAt >= 0 ? args[reportAt + 1] : null
  const distDir = resolve(args.find((a, i) => !a.startsWith('--') && i !== reportAt + 1) ?? 'dist')
  const here = dirname(fileURLToPath(import.meta.url))
  const budgets = JSON.parse(readFileSync(join(here, 'budgets.json'), 'utf8'))
  const rows = evaluate(measure(distDir), budgets)
  const report = markdown(rows)
  console.log(report)
  if (reportPath) writeFileSync(reportPath, `${report}\n`)
  if (rows.some((r) => r.over)) process.exit(1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
