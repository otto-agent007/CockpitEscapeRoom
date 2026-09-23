#!/usr/bin/env node
/**
 * Does this change need the browser suite?
 *
 * The browser suite (`npm run test:e2e`, 30-55 min) exercises the built game.
 * A change can only affect it if it can change `dist/` or the tests themselves.
 * This reuses the Vercel ignore step's list of deploy-inert paths, with two
 * deliberate differences: `e2e/` and the workflow files are inert for a deploy
 * but NOT for the suite, so a change there must run it.
 *
 * Fails safe, like the Vercel step: anything it cannot classify, or a diff it
 * cannot compute, runs the suite. A wrong skip lets a broken game merge green;
 * a wrong run only costs time.
 *
 *   node tools/ci/changes.mjs <base-sha> <head-sha>
 *
 * Prints the decision and, under GitHub Actions, writes `e2e=true|false` to
 * $GITHUB_OUTPUT.
 */

import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { isDeployInert } from '../vercel/should-build.mjs'

/** Deploy-inert, but the browser suite reads them or runs because of them. */
const SUITE_RELEVANT_PREFIXES = ['e2e/', '.github/workflows/', 'playwright.config.ts']

export function needsBrowserSuite(file) {
  if (SUITE_RELEVANT_PREFIXES.some((prefix) => file.startsWith(prefix))) return true
  return !isDeployInert(file)
}

/**
 * @param {string[] | null} changedFiles
 * @returns {{ run: boolean, reasons: string[] }}
 */
export function decide(changedFiles) {
  if (!Array.isArray(changedFiles) || changedFiles.length === 0) {
    return { run: true, reasons: ['could not determine the changed files'] }
  }
  const reasons = changedFiles.filter(needsBrowserSuite)
  return { run: reasons.length > 0, reasons }
}

function changedBetween(base, head) {
  try {
    return execFileSync('git', ['diff', '--name-only', `${base}...${head}`], { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
  } catch (error) {
    console.log(`[changes] git diff ${base}...${head} failed (${error.message})`)
    return null
  }
}

function main() {
  const [base, head] = process.argv.slice(2)
  const changed = base && head ? changedBetween(base, head) : null
  const { run, reasons } = decide(changed)
  if (run) {
    console.log(`[changes] browser suite NEEDED:\n${reasons.slice(0, 20).map((f) => `    ${f}`).join('\n')}`)
  } else {
    console.log(`[changes] all ${changed.length} changed file(s) are outside the game and the suite; skipping it.`)
  }
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `e2e=${run}\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
