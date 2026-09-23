#!/usr/bin/env node
/**
 * New production dependency guard (CLAUDE.md: "Never add a production dependency
 * without explaining it and requesting review").
 *
 * Compares `dependencies` in package.json between the PR base and head. Any new
 * production dependency fails the check until the owner adds the
 * `dependency-approved` label to the PR, which is the recorded review.
 * devDependencies never ship, so they are reported but do not fail.
 *
 *   node tools/ci/new-deps-guard.mjs <base-sha>      (labels from $PR_LABELS, comma-separated)
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export const APPROVAL_LABEL = 'dependency-approved'

export function diffDependencies(basePkg, headPkg) {
  const added = (section) => Object.keys(headPkg[section] ?? {}).filter((name) => !(name in (basePkg[section] ?? {})))
  return { production: added('dependencies'), development: added('devDependencies') }
}

export function verdict(diff, labels) {
  if (diff.production.length === 0) return { ok: true, message: 'no new production dependencies' }
  if (labels.includes(APPROVAL_LABEL)) return { ok: true, message: `new production dependencies approved by label: ${diff.production.join(', ')}` }
  return {
    ok: false,
    message: `new production dependencies need owner review: ${diff.production.join(', ')}. Explain them in the PR; the owner approves with the "${APPROVAL_LABEL}" label.`,
  }
}

function main() {
  const base = process.argv[2]
  let basePkg
  try {
    basePkg = JSON.parse(execFileSync('git', ['show', `${base}:package.json`], { encoding: 'utf8' }))
  } catch (error) {
    console.error(`[new-deps-guard] cannot read package.json at ${base}: ${error.message}`)
    process.exit(1)
  }
  const headPkg = JSON.parse(readFileSync('package.json', 'utf8'))
  const diff = diffDependencies(basePkg, headPkg)
  if (diff.development.length) console.log(`[new-deps-guard] new devDependencies (not shipped): ${diff.development.join(', ')}`)
  const labels = (process.env.PR_LABELS ?? '').split(',').map((l) => l.trim()).filter(Boolean)
  const { ok, message } = verdict(diff, labels)
  ;(ok ? console.log : console.error)(`[new-deps-guard] ${message}`)
  if (!ok) process.exit(1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
