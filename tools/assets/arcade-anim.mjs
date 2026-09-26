#!/usr/bin/env node
/**
 * Mars arcade animation table — command line.
 *
 *   node tools/assets/arcade-anim.mjs validate     rules + silhouette checks, exit 1 on errors
 *   node tools/assets/arcade-anim.mjs frame-data   one row per move clip: holds, reach, boxes
 *   node tools/assets/arcade-anim.mjs count        number of distinct drawings the harness preloads
 *   node tools/assets/arcade-anim.mjs list         every clip with its drawings and holds
 *   node tools/assets/arcade-anim.mjs connect      connect distance per move, bounds rule off and on (markdown)
 *   node tools/assets/arcade-anim.mjs wire <fighter> <animation> <cells-dir> [--loop loop|once|hold-last|by-velocity|by-stun]
 *                                        [--hold N] [--move <moveId>] [--phase startup,active,recovery,...]
 *       add (or replace) a clip in the table from a folder of normalised cells, with body and
 *       hurt boxes seeded from each drawing's silhouette and `reviewed: false`, so the clip is
 *       in the gym the moment it is normalised — the owner's rule: every completed animation
 *       goes in the gym, and "completed" means "in the table".
 *
 * The rules validation is the same `validateMarsArcadeAnimations` the tests and the
 * gym's save endpoint run. On top of it this tool reads the PNGs, which the browser
 * and vitest do not, and checks each box against the drawing it is authored on:
 *
 *   - a hurt box must lie inside the drawing's opaque bounding box (a hurt box hanging
 *     in empty air is a free hit for the opponent);
 *   - an attack box's forward edge must sit on or past the drawing's forward extent
 *     (a hitbox that stops short of the drawn fist visibly whiffs); a box that reaches
 *     more than the reach tolerance past the drawing hits things it does not touch;
 *   - every drawing must be a 128x128 cell that exists.
 *
 * The schema module is TypeScript with extensionless imports, which Node's own type
 * stripping cannot resolve, so it is loaded through Vite's server-side module loader
 * rather than kept as a second copy here.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { alphaBounds, readPng } from './lib/png.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const TOLERANCE_PX = 3

async function loadTable() {
  const { createServer } = await import('vite')
  const server = await createServer({
    root,
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  })
  try {
    const mod = await server.ssrLoadModule('/src/game/marsArcadeAnimations.ts')
    const connect = await server.ssrLoadModule('/src/game/marsArcadeConnect.ts')
    const tuning = await server.ssrLoadModule('/src/game/marsArcadeTuning.ts')
    const raw = JSON.parse(readFileSync(resolve(root, 'src/game/marsArcadeAnimations.json'), 'utf8'))
    return { mod, connect, tuning, file: mod.parseMarsArcadeAnimations(raw) }
  } finally {
    await server.close()
  }
}

function silhouetteFindings(file) {
  const findings = []
  const push = (severity, key, frame, rule, message) => findings.push({ severity, key, frame, rule, message })
  for (const entry of file.animations) {
    const key = `${entry.fighter}:${entry.animation}`
    entry.frames.forEach((frame, index) => {
      const path = resolve(root, `.${frame.src}`)
      if (!existsSync(path)) {
        push('error', key, index, 'missing-drawing', `${frame.src} does not exist`)
        return
      }
      const png = readPng(path)
      if (png.width !== 128 || png.height !== 128) {
        push('error', key, index, 'cell-size', `${frame.src} is ${png.width}x${png.height}, not 128x128`)
        return
      }
      const body = alphaBounds(png, 128)
      if (!body) {
        push('error', key, index, 'empty-drawing', `${frame.src} has no opaque pixels`)
        return
      }
      for (const [which, hurt] of (frame.hurt ?? []).entries()) {
        const inside = hurt.x >= body.x && hurt.y >= body.y &&
          hurt.x + hurt.width <= body.x + body.width && hurt.y + hurt.height <= body.y + body.height
        if (!inside) {
          push('warning', key, index, 'hurt-outside-silhouette',
            `hurt[${which}] ${fmt(hurt)} leaves the drawing's silhouette ${fmt(body)}`)
        }
      }
      for (const [which, attack] of (frame.attack ?? []).entries()) {
        const forward = attack.x + attack.width
        const drawn = body.x + body.width
        if (forward < drawn - TOLERANCE_PX) {
          push('warning', key, index, 'attack-short-of-drawing',
            `attack[${which}] ends at column ${forward}; the drawing reaches ${drawn}`)
        }
        if (forward > drawn + TOLERANCE_PX) {
          push('warning', key, index, 'attack-past-drawing',
            `attack[${which}] ends at column ${forward}, ${forward - drawn} past the drawing's ${drawn}`)
        }
      }
      if (frame.collision) {
        const feet = body.y + body.height
        if (Math.abs(feet - 120) > 1 && entry.animation !== 'jump' && entry.animation !== 'knockout') {
          push('warning', key, index, 'feet-off-baseline', `drawing's lowest opaque row is ${feet - 1}, baseline is 119`)
        }
      }
    })
  }
  return findings
}

const fmt = (box) => `[${box.x},${box.y} ${box.width}x${box.height}]`

function print(findings, format) {
  for (const finding of findings) console.log(format(finding))
}

const command = process.argv[2] ?? 'validate'
const { mod, connect, tuning, file } = await loadTable()

if (command === 'count') {
  console.log(mod.marsArcadeAnimationSources(file).length)
} else if (command === 'list') {
  for (const entry of file.animations) {
    console.log(`${entry.fighter}:${entry.animation}  ${entry.loop}${entry.moveId ? `  ${entry.moveId}` : ''}${entry.reviewed ? '' : '  (unreviewed)'}`)
    for (const frame of entry.frames) {
      const boxes = [frame.collision ? 'C' : '-', frame.hurt ? `H${frame.hurt.length}` : '-', frame.attack ? `A${frame.attack.length}` : '-', frame.guard ? 'G' : '-'].join('')
      console.log(`    ${String(frame.hold).padStart(3)}f  ${frame.phase.padEnd(8)} ${boxes.padEnd(7)} ${frame.pose.padEnd(16)} ${frame.src.replace('/art-source/arcade/', '')}`)
    }
  }
} else if (command === 'frame-data') {
  console.log('move                      clip     startup active recovery  reach  drawn  hitbox-rows  reviewed')
  for (const entry of file.animations) {
    if (!entry.moveId) continue
    const move = mod.marsArcadeMoveById(entry.moveId)
    const active = entry.frames.filter((frame) => frame.phase === 'active')
    const reach = Math.max(-1, ...active.map((frame) => mod.marsArcadeAttackReach(frame) ?? -1))
    const rows = active.flatMap((frame) => (frame.attack ?? []).map((box) => `${box.y}-${box.y + box.height - 1}`)).join(',') || '-'
    console.log(`${entry.moveId.padEnd(26)}${entry.animation.padEnd(9)}${String(move.startupFrames).padStart(7)}${String(move.activeFrames).padStart(7)}${String(move.recoveryFrames).padStart(9)}${String(move.reach).padStart(7)}${String(reach < 0 ? '-' : reach).padStart(7)}  ${rows.padEnd(12)} ${entry.reviewed ? 'yes' : 'no'}${entry.reachException ? '  exception: ' + entry.reachException : ''}`)
  }
} else if (command === 'wire') {
  const [fighter, animation, cellsDir] = process.argv.slice(3)
  if (!fighter || !animation || !cellsDir) {
    console.error('usage: arcade-anim.mjs wire <fighter> <animation> <cells-dir> [--loop L] [--hold N] [--move id] [--phase a,b,c]')
    process.exitCode = 2
  } else {
    const option = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback }
    const loop = option('loop', 'loop')
    const hold = Number(option('hold', '6'))
    const moveId = option('move', null)
    const phases = option('phase', null)?.split(',') ?? null
    const { readdirSync } = await import('node:fs')
    const dir = resolve(root, cellsDir)
    const files = readdirSync(dir).filter((name) => name.endsWith('.png')).sort()
    if (files.length === 0) throw new Error(`no cells in ${cellsDir}`)
    const rel = '/' + resolve(dir).slice(root.length + 1).split(/[\\/]/).join('/')
    if (!rel.startsWith('/art-source/arcade/')) throw new Error(`cells must live under art-source/arcade/, not ${rel}`)
    // Cells are named <clip>-NN.png; the pose is what is left after the clip's name. A plain
    // prefix test, not a RegExp: the folder name comes from the command line.
    const clipName = dir.split(/[\\/]/).pop()
    const poseOf = (name, index) => {
      const stem = name.replace(/\.png$/, '')
      const rest = stem.startsWith(clipName) ? stem.slice(clipName.length).replace(/^-/, '') : stem
      return rest || `frame ${index + 1}`
    }
    const frames = files.map((name, index) => {
      const png = readPng(resolve(dir, name))
      const body = alphaBounds(png, 128)
      if (!body) throw new Error(`${name}: empty drawing`)
      const inset = 2
      const frame = {
        src: `${rel}/${name}`,
        pose: poseOf(name, index),
        phase: phases?.[index] ?? 'neutral',
        hold,
        collision: { x: body.x, y: body.y, width: body.width, height: 119 - body.y },
        hurt: [{ x: body.x + inset, y: body.y + inset, width: Math.max(1, body.width - inset * 2), height: Math.max(1, body.height - inset) }],
      }
      return frame
    })
    const entry = { fighter, animation, ...(moveId ? { moveId } : {}), loop, reviewed: false, frames }
    const raw = JSON.parse(readFileSync(resolve(root, 'src/game/marsArcadeAnimations.json'), 'utf8'))
    const existing = raw.animations.findIndex((clip) => clip.fighter === fighter && clip.animation === animation)
    if (existing >= 0) raw.animations[existing] = entry
    else raw.animations.push(entry)
    const parsed = mod.parseMarsArcadeAnimations(raw)
    const errors = mod.marsArcadeAnimationErrors(mod.validateMarsArcadeAnimations(parsed))
    if (errors.length) {
      console.error(errors.map(mod.formatMarsArcadeFinding).join('\n'))
      console.error('not written: fix the entry (holds must match the move, active poses need a hitbox)')
      process.exitCode = 1
    } else {
      const { writeFileSync } = await import('node:fs')
      writeFileSync(resolve(root, 'src/game/marsArcadeAnimations.json'), `${JSON.stringify(parsed, null, 2)}\n`)
      console.log(`${existing >= 0 ? 'replaced' : 'added'} ${fighter}:${animation} with ${frames.length} drawings (${loop}, hold ${hold}); boxes seeded, reviewed: false — it is in the gym now`)
    }
  }
} else if (command === 'validate') {
  const rules = mod.validateMarsArcadeAnimations(file)
  const pixels = silhouetteFindings(file)
  const all = [...rules, ...pixels]
  const errors = all.filter((finding) => finding.severity === 'error')
  const warnings = all.filter((finding) => finding.severity === 'warning')
  print(all, (finding) => mod.formatMarsArcadeFinding(finding))
  console.log(`\n${file.animations.length} clips, ${file.animations.reduce((sum, entry) => sum + entry.frames.length, 0)} frames, ${mod.marsArcadeAnimationSources(file).length} drawings: ${errors.length} errors, ${warnings.length} warnings`)
  process.exitCode = errors.length > 0 ? 1 : 0
} else if (command === 'connect') {
  // Measured with the shipped tuning in force, the way the cabinet plays it.
  tuning.applyShippedMarsArcadeTuning()
  console.log(connect.formatMarsArcadeConnectTable(connect.marsArcadeConnectTable()))
} else {
  console.error(`unknown command ${command}; use validate | frame-data | count | list | connect | wire`)
  process.exitCode = 2
}
