import { readFile, rm, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

import {
  formatMarsArcadeFinding,
  marsArcadeAnimationSources,
  marsArcadeAnimationErrors,
  parseMarsArcadeAnimations,
  validateMarsArcadeAnimations,
} from './src/game/marsArcadeAnimations.ts'
import { parseMarsArcadeTuning } from './src/game/marsArcadeTuning.ts'
import { saveGymArt } from './tools/dev/arcadeArtSave.ts'
import { MARS_ARCADE_BACKDROP } from './src/game/marsArcadeStage.ts'
import { LASER_EFFECT_ART, CAPTAIN_FLYBY_ART, CAP_EFFECT_ART, MOONBASE_PANORAMA } from './src/game/marsArcadeArt.ts'

/** Ship only referenced PNGs; Blender/source masters and generation archives stay local. */
function marsArcadeAssets(): Plugin {
  return {
    name: 'mars-arcade-assets',
    apply: 'build',
    async generateBundle() {
      const file = parseMarsArcadeAnimations(JSON.parse(await readFile(resolve(import.meta.dirname, 'src/game/marsArcadeAnimations.json'), 'utf8')))
      const sources = new Set([
        ...marsArcadeAnimationSources(file),
        ...MARS_ARCADE_BACKDROP.map(layer => layer.src),
        MOONBASE_PANORAMA.src,
        ...Object.values(LASER_EFFECT_ART).map(art => art.src),
        ...CAPTAIN_FLYBY_ART,
        ...Object.values(CAP_EFFECT_ART).map(art => art.src),
      ])
      for (const src of sources) {
        if (!src.startsWith('/art-source/arcade/') || src.includes('..') || !src.endsWith('.png')) throw new Error(`Invalid arcade asset path: ${src}`)
        const fileName = src.slice(1)
        this.emitFile({ type: 'asset', fileName, source: await readFile(resolve(import.meta.dirname, fileName)) })
      }
    },
  }
}

/** Preserve historical sources in Git while keeping unused files out of the player build. */
function omitHistoricalPublicAssets(): Plugin {
  let outDir: string
  const unused = [
    'favicon.ico', // The existing 14 KB TMB2 base image is the favicon.
    'models/model-y-reward.glb', // The reward is now the protected film.
    'models/optimus-guide-review.glb', // Superseded by the dance_02 review candidate.
    'images/intro/tmb2/contact-sheet.png', // Source review sheet, never requested by the game.
    'images/a320-fo-view.png', // Historical reference, never requested by the game.
  ]
  return {
    name: 'omit-historical-public-assets',
    apply: 'build',
    enforce: 'post',
    configResolved(config) { outDir = resolve(config.root, config.build.outDir) },
    async closeBundle() {
      for (const path of unused) await rm(resolve(outDir, path), { force: true })
    },
  }
}

/**
 * Dev-only endpoint the character gym posts the animation table to.
 *
 * The gym edits hitboxes and holds in a browser, and those edits have to end up in
 * the file the harness reads — otherwise every tuning session is lost on reload. One
 * POST target, one fixed destination, and it exists only in `serve` mode so nothing
 * like it can reach a build.
 *
 * The payload is parsed and run through the same rules the tests enforce BEFORE it
 * is written, so the gym cannot leave the file in a state the next test run rejects.
 * Warnings are allowed through; errors are refused with the findings in the body.
 */
function arcadeGymSave(): Plugin {
  const target = resolve(import.meta.dirname, 'src/game/marsArcadeAnimations.json')
  const tuningTarget = resolve(import.meta.dirname, 'src/game/marsArcadeTuning.json')
  return {
    name: 'arcade-gym-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__gym/art', (request, response) => {
        if (request.method !== 'POST') { response.statusCode = 405; response.end('POST only'); return }
        const origin = request.headers.origin
        if (origin && origin !== `http://${request.headers.host}` && origin !== `https://${request.headers.host}`) { response.statusCode = 403; response.end('Use the local gym to save art'); return }
        const chunks: Buffer[] = []
        let length = 0, oversized = false
        request.on('data', (chunk: Buffer) => {
          length += chunk.length
          if (length > 1024 * 1024) { oversized = true; return }
          if (!oversized) chunks.push(chunk)
        })
        request.on('end', () => {
          if (oversized) { response.statusCode = 413; response.end('Correction request is too large'); return }
          void (async () => {
            try {
              const result = await saveGymArt(import.meta.dirname, JSON.parse(Buffer.concat(chunks).toString('utf8')))
              response.setHeader('content-type', 'application/json')
              response.end(JSON.stringify(result))
            } catch (error) { response.statusCode = 422; response.end(String(error)) }
          })()
        })
      })
      // The playground's tuning file: same shape of endpoint, parsed before writing.
      server.middlewares.use('/__gym/tuning', (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.end('POST only')
          return
        }
        const chunks: Buffer[] = []
        request.on('data', (chunk: Buffer) => chunks.push(chunk))
        request.on('end', () => {
          void (async () => {
            try {
              const tuning = parseMarsArcadeTuning(JSON.parse(Buffer.concat(chunks).toString('utf8')))
              await writeFile(tuningTarget, `${JSON.stringify(tuning, null, 2)}\n`, 'utf8')
              response.statusCode = 200
              response.end(`written ${tuningTarget}`)
            } catch (error) {
              response.statusCode = 400
              response.end(String(error))
            }
          })()
        })
      })
      server.middlewares.use('/__gym/animations', (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.end('POST only')
          return
        }
        const chunks: Buffer[] = []
        request.on('data', (chunk: Buffer) => chunks.push(chunk))
        request.on('end', () => {
          void (async () => {
            try {
              const body = Buffer.concat(chunks).toString('utf8')
              const file = parseMarsArcadeAnimations(JSON.parse(body))
              const errors = marsArcadeAnimationErrors(validateMarsArcadeAnimations(file))
              if (errors.length > 0) {
                response.statusCode = 422
                response.end(errors.map(formatMarsArcadeFinding).join('\n'))
                return
              }
              await writeFile(target, `${JSON.stringify(file, null, 2)}\n`, 'utf8')
              response.statusCode = 200
              response.end(`written ${target}`)
            } catch (error) {
              response.statusCode = 400
              response.end(String(error))
            }
          })()
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), arcadeGymSave(), marsArcadeAssets(), omitHistoricalPublicAssets()],
  server: {
    watch: {
      // Recovery copies and isolated review projects must not reload the live gym.
      ignored: (path) => {
        const local = relative(import.meta.dirname, path).replaceAll('\\', '/')
        return local === 'preview-renders' || local.startsWith('preview-renders/') ||
          local === '.cache' || local.startsWith('.cache/')
      },
    },
  },
  build: {
    rollupOptions: { input: { game: resolve(import.meta.dirname, 'index.html'), arcade: resolve(import.meta.dirname, 'mars-arcade.html') } },
    sourcemap: false,
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
})
