#!/usr/bin/env node
/**
 * Spoiler guard: the red Model Y must not reach a player before the DC-9, locker
 * and Airbus chapters are complete (CLAUDE.md, "Never").
 *
 * What a player downloads before any chapter unlocks is `index.html`, the
 * scripts, stylesheets and preloads it names, and every chunk those import
 * STATICALLY. Chunks loaded later with `import()` (the reward, Flight Mode, the
 * vehicle) may say anything. So this walks the static import graph from the
 * entry and fails on any protected term in it, unless the occurrence is one the
 * owner has reviewed (`spoiler-allowlist.json`).
 *
 *   node tools/ci/spoiler-guard.mjs [dist-dir]   (default: dist)
 *
 * Run after `npm run build`. Exit 0 clean, 1 on a leak or an unreadable build.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const PROTECTED = /tesla|model[\s_-]?y\b|flight[\s_-]?mode|cybertruck/gi
const CONTEXT = 80

/** Static `import ... from "./x.js"` and bare `import "./x.js"`, never `import("./x.js")`. */
const STATIC_IMPORT = /\bimport\s*(?:[\w$*{}\s,]+?\s*from\s*)?["'](\.{1,2}\/[^"']+\.js)["']/g
const HTML_REF = /<(?:script|link)\b[^>]*?\b(?:src|href)=["']([^"']+)["'][^>]*>/gi

/** Every file a player receives before any lazy chunk loads, as absolute paths. */
export function initialFiles(distDir) {
  const html = join(distDir, 'index.html')
  const files = new Set([html])
  const queue = []
  for (const match of readFileSync(html, 'utf8').matchAll(HTML_REF)) {
    const ref = match[1]
    if (/^[a-z]+:/i.test(ref)) continue
    queue.push(join(distDir, ref.replace(/^\//, '')))
  }
  while (queue.length > 0) {
    const file = queue.pop()
    if (files.has(file) || !existsSync(file)) continue
    files.add(file)
    if (!file.endsWith('.js')) continue
    for (const match of readFileSync(file, 'utf8').matchAll(STATIC_IMPORT)) {
      queue.push(resolve(dirname(file), match[1]))
    }
  }
  return [...files]
}

/** Protected-term occurrences in `text` not covered by an allowlist entry. */
export function leaks(text, allowlist) {
  const found = []
  for (const match of text.matchAll(PROTECTED)) {
    const start = Math.max(0, match.index - CONTEXT)
    const context = text.slice(start, match.index + match[0].length + CONTEXT)
    if (allowlist.some((entry) => context.includes(entry.context))) continue
    found.push({ term: match[0], context: context.replace(/\s+/g, ' ') })
  }
  return found
}

export function checkDist(distDir, allowlist) {
  if (!existsSync(join(distDir, 'index.html'))) throw new Error(`${distDir}/index.html not found; run npm run build first`)
  const report = []
  for (const file of initialFiles(distDir)) {
    for (const leak of leaks(readFileSync(file, 'utf8'), allowlist)) report.push({ file, ...leak })
  }
  return report
}

function main() {
  const distDir = resolve(process.argv[2] ?? 'dist')
  const here = dirname(fileURLToPath(import.meta.url))
  const { entries } = JSON.parse(readFileSync(join(here, 'spoiler-allowlist.json'), 'utf8'))
  let report
  try {
    report = checkDist(distDir, entries)
  } catch (error) {
    console.error(`[spoiler-guard] ${error.message}`)
    process.exit(1)
  }
  const files = initialFiles(distDir).map((f) => f.slice(distDir.length + 1))
  console.log(`[spoiler-guard] initial download: ${files.join(', ')}`)
  if (report.length === 0) {
    console.log('[spoiler-guard] no protected-reward terms in the initial download (beyond reviewed entries).')
    return
  }
  console.error(`[spoiler-guard] ${report.length} protected-reward term(s) reach players before the reward unlocks:`)
  for (const { file, term, context } of report) console.error(`  ${file.slice(distDir.length + 1)}: "${term}" in …${context}…`)
  console.error('Move the text or asset into a lazily imported chunk, or (owner decision) add a reviewed entry to tools/ci/spoiler-allowlist.json.')
  process.exit(1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
