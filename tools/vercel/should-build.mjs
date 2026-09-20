#!/usr/bin/env node
/**
 * Vercel Ignored Build Step.
 *
 * Wired up by `vercel.json` as `ignoreCommand`. Per Vercel's contract the exit
 * code is inverted from the obvious reading:
 *
 *   exit 0  -> IGNORE the build (skip it)
 *   exit 1  -> CONTINUE the build
 *
 * The deployed site is ~166 MB, 139 MB of it GLBs, so a build for a
 * documentation-only branch costs real transfer and storage for no change in
 * what anyone can load.
 *
 * This runs before `npm install`, so it may use Node builtins only.
 *
 * ## Failing safe
 *
 * A wrong skip is far more expensive than a wrong build: it leaves a preview
 * that looks current but is stale, which is exactly how an owner review ends up
 * approving the previous commit's work. So this builds unless it can prove every
 * changed path is inert, and builds whenever it cannot work out what changed.
 */

import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

/**
 * A path belongs here only if changing it cannot change a single byte in
 * `dist/`. When in doubt, leave it out — the cost of omitting a path is one
 * unnecessary build.
 */
export const DEPLOY_INERT_PREFIXES = [
  'docs/',
  'plans/',
  'prompts/',
  'asset-reports/',
  'art-source/', // already excluded by .vercelignore, so never even uploaded
  'e2e/',
  'dev/', // the box harness page, served only by `npm run dev`
  'src/dev/', // harness code; nothing in the application imports it
  '.github/',
  '.agents/',
]

/** Repository-root Markdown, e.g. README.md, CLAUDE.md, AGENTS.md, TEST_REPORT.md. */
const ROOT_MARKDOWN = /^[^/]+\.md$/

export function isDeployInert(file) {
  if (ROOT_MARKDOWN.test(file)) return true
  return DEPLOY_INERT_PREFIXES.some((prefix) => file.startsWith(prefix))
}

/**
 * @param {string[]} changedFiles
 * @returns {boolean} true to build, false to skip.
 */
export function shouldBuild(changedFiles) {
  // No list means we could not determine the diff. Build.
  if (!Array.isArray(changedFiles) || changedFiles.length === 0) return true
  return !changedFiles.every((file) => isDeployInert(file))
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function commitExists(sha) {
  if (!sha) return false
  try {
    git(['cat-file', '-e', `${sha}^{commit}`])
    return true
  } catch {
    return false
  }
}

/**
 * The base to diff against: the last SUCCESSFULLY DEPLOYED commit.
 *
 * There is deliberately no `HEAD^` fallback. `HEAD^` sees only the newest
 * commit, so a push of several commits whose last one happens to be
 * documentation would skip a build the earlier commits needed, leaving a
 * preview that looks current and is not. Measured on this very branch: against
 * the last deployed commit the diff is 19 files including `src/game/*` and
 * correctly builds; against `HEAD^` it is 6 documentation files and wrongly
 * skips.
 *
 * Vercel exposes `VERCEL_GIT_PREVIOUS_SHA` once an ignore step is configured,
 * but it is absent on the first such deploy and the object may be missing from
 * a shallow clone. In either case we build.
 */
function resolveBase() {
  const previous = process.env.VERCEL_GIT_PREVIOUS_SHA
  if (commitExists(previous)) return { base: previous, source: 'VERCEL_GIT_PREVIOUS_SHA' }
  return { base: null, source: previous ? 'previous deploy SHA not present in this shallow clone' : 'no previous deploy SHA' }
}

function main() {
  const { base, source } = resolveBase()
  if (!base) {
    console.log(`[ignore-step] no usable diff base (${source}); building.`)
    process.exit(1)
  }

  let changed
  try {
    changed = git(['diff', '--name-only', base, 'HEAD']).split('\n').filter(Boolean)
  } catch (error) {
    console.log(`[ignore-step] git diff against ${base} failed (${error.message}); building.`)
    process.exit(1)
  }

  console.log(`[ignore-step] base: ${base} (${source})`)
  console.log(`[ignore-step] ${changed.length} changed file(s)`)

  if (shouldBuild(changed)) {
    const reasons = changed.filter((file) => !isDeployInert(file))
    console.log(
      reasons.length === 0
        ? '[ignore-step] no changed files detected; building to be safe.'
        : `[ignore-step] building — affects the deployed site:\n${reasons.slice(0, 20).map((f) => `    ${f}`).join('\n')}`,
    )
    process.exit(1)
  }

  console.log('[ignore-step] every changed path is deploy-inert; skipping the build.')
  process.exit(0)
}

// Only run the CLI when executed directly, so the test can import the predicates.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
