import { existsSync } from 'node:fs'
import { countColours, decodePng, measureGrid } from './png-raster.mjs'

/**
 * Prove every intro image is the kind of art it claims to be.
 *
 * The intro composites two layers that must share one pixel grid. That invariant broke
 * silently and stayed broken through a fully green suite: the sprites are genuine Pixel
 * Snapper output (exact 2px grid, 14 colours) while the background plates are raw ImageGen
 * (no grid at any block size, 100k+ colours). Nothing in the pipeline ever asserted the
 * difference, so a mismatch nobody could miss on screen was invisible to CI.
 *
 * Thresholds below are measured, not guessed. The grid ratio is the decisive signal —
 * snapped art reads 0.00% and continuous-tone art reads ~90% — so it is held tight. The
 * palette ceiling is deliberately loose: it exists to catch a category error (a painting
 * arriving where sprite art belongs), not to police how many colours the artist used.
 */
const SNAPPED_GRID_LIMIT = 0.005
const CATEGORY_COLOUR_LIMIT = 512

const GROUPS = [
  {
    label: 'Pop T sprite sheets',
    globs: ['public/images/intro/tmb2/popt/*/*-sheet.png', 'public/images/intro/popt/*-sheet.png'],
    // Canonical 128 exported at 256, so one art pixel is exactly two image pixels.
    block: 2,
  },
  {
    label: 'cartoon key poses',
    globs: ['public/images/intro/tmb2/key/*-sheet.png'],
    block: 2,
  },
  {
    label: 'background plates',
    globs: ['public/images/intro/tmb2/backgrounds/*.png'],
    // Phase B target: generated natively on the stage grid, so one art pixel is one image
    // pixel and there is no block structure left to measure. Dimensions and palette carry
    // the contract instead.
    dimensions: { width: 320, height: 224 },
    // KNOWN DEFICIT: these are raw 1586x992 ImageGen plates that never went through Pixel
    // Snapper - recorded in asset-reports as "preserved byte-identically". They do not share
    // the sprites' grid, which is the dominant visual defect in the intro.
    //
    // When Phase B lands, delete `knownUnsnapped` so these become hard failures. Do not
    // relax the thresholds to make a run pass.
    knownUnsnapped: true,
  },
]

async function expand(globs) {
  const { glob } = await import('node:fs/promises')
  const files = []
  for (const pattern of globs) {
    for await (const entry of glob(pattern)) files.push(entry)
  }
  return [...new Set(files)].sort()
}

function inspect(file, group) {
  const image = decodePng(file)
  const problems = []

  if (group.block) {
    const interior = measureGrid(image, group.block)
    if (interior > SNAPPED_GRID_LIMIT) {
      problems.push(
        `off-grid: ${(interior * 100).toFixed(2)}% interior change at block ${group.block}`
        + ` (limit ${(SNAPPED_GRID_LIMIT * 100).toFixed(2)}%)`,
      )
    }
  }

  if (group.dimensions) {
    const { width, height } = group.dimensions
    if (image.width !== width || image.height !== height) {
      problems.push(`wrong size: ${image.width}x${image.height}, expected ${width}x${height}`)
    }
  }

  const colours = countColours(image, CATEGORY_COLOUR_LIMIT + 1)
  if (colours > CATEGORY_COLOUR_LIMIT) {
    problems.push(`continuous tone: >${CATEGORY_COLOUR_LIMIT} colours`)
  }
  return problems
}

const failures = []
const deficits = []

for (const group of GROUPS) {
  const files = await expand(group.globs)
  if (files.length === 0) {
    failures.push(`${group.label}: no files matched ${group.globs.join(', ')}`)
    continue
  }
  for (const file of files) {
    if (!existsSync(file)) continue
    const problems = inspect(file, group)
    if (problems.length === 0) continue
    const detail = `${file} - ${problems.join('; ')}`
    if (group.knownUnsnapped) deficits.push(detail)
    else failures.push(detail)
  }
}

if (deficits.length > 0) {
  console.warn(`\nKNOWN DEFICIT - ${deficits.length} asset(s) are not on the stage grid:`)
  for (const line of deficits) console.warn(`  ${line}`)
  console.warn('  Tracked as Phase B of the intro pixel-grid work; not a new regression.\n')
}

if (failures.length > 0) {
  console.error('TMB2 intro grid contract failed:')
  for (const line of failures) console.error(`  ${line}`)
  process.exit(1)
}

console.log(`TMB2 intro grid contract passed (${GROUPS.length} groups, ${deficits.length} recorded deficits).`)
