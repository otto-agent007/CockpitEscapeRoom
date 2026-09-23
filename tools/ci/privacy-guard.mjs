#!/usr/bin/env node
/**
 * Privacy guard: no analytics, accounts, uploads, paid APIs or tracking; personal
 * data stays local (CLAUDE.md, "Never").
 *
 * Checks the shipped source (src/, index.html) and package.json. It fails on a
 * known tracking SDK or snippet, on any network API aimed at a remote host, and
 * on any absolute http(s) URL outside a short list of inert namespaces. The game
 * loads everything it needs from its own origin, so a remote URL in source is a
 * change that needs an owner decision, not a quiet merge.
 *
 *   node tools/ci/privacy-guard.mjs [repo-root]
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const TRACKING_PACKAGES = [
  '@vercel/analytics', '@vercel/speed-insights', '@sentry/', 'posthog', 'mixpanel', 'amplitude',
  '@segment/', 'analytics', 'react-ga', 'ga-4', 'gtag', 'hotjar', 'logrocket', 'fullstory',
  '@datadog/', 'newrelic', 'plausible', 'umami', 'firebase', '@supabase/', 'clarity',
]
export const TRACKING_SNIPPETS = [
  /googletagmanager\.com|google-analytics\.com|\bgtag\s*\(|\bfbq\s*\(|clarity\.ms|hotjar\.com|segment\.(com|io)|posthog|mixpanel|plausible\.io|sentry\.io/i,
  /navigator\.sendBeacon|new\s+WebSocket\s*\(|new\s+EventSource\s*\(/,
]
/** Absolute URLs that are identifiers, not network destinations. */
export const INERT_URL_HOSTS = ['www.w3.org']
const ABSOLUTE_URL = /\bhttps?:\/\/([a-z0-9.-]+)/gi

export function scanText(path, text) {
  const findings = []
  for (const pattern of TRACKING_SNIPPETS) {
    const match = text.match(pattern)
    if (match) findings.push(`${path}: tracking or network API "${match[0]}"`)
  }
  for (const match of text.matchAll(ABSOLUTE_URL)) {
    if (!INERT_URL_HOSTS.includes(match[1].toLowerCase())) findings.push(`${path}: remote URL "${match[0]}"`)
  }
  return findings
}

export function scanPackage(pkg) {
  const findings = []
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    for (const name of Object.keys(pkg[section] ?? {})) {
      const hit = TRACKING_PACKAGES.find((bad) => (bad.endsWith('/') ? name.startsWith(bad) : name === bad || name.includes(bad)))
      if (hit) findings.push(`package.json ${section}: "${name}" looks like analytics/tracking ("${hit}")`)
    }
  }
  return findings
}

function sourceFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full))
    else if (/\.(tsx?|jsx?|html|css)$/.test(entry) && !/\.test\.[tj]sx?$/.test(entry)) out.push(full)
  }
  return out
}

export function scanRepo(root) {
  const findings = scanPackage(JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')))
  for (const file of [join(root, 'index.html'), ...sourceFiles(join(root, 'src'))]) {
    findings.push(...scanText(relative(root, file), readFileSync(file, 'utf8')))
  }
  return findings
}

function main() {
  const findings = scanRepo(resolve(process.argv[2] ?? '.'))
  if (findings.length === 0) {
    console.log('[privacy-guard] no tracking SDKs, remote calls or remote URLs in shipped source.')
    return
  }
  console.error(`[privacy-guard] ${findings.length} finding(s):`)
  for (const finding of findings) console.error(`  ${finding}`)
  console.error('CLAUDE.md: never add analytics, accounts, uploads, paid APIs or tracking. Remote URLs need an owner decision.')
  process.exit(1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
