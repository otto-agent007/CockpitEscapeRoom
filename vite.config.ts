import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

import {
  formatMarsArcadeFinding,
  marsArcadeAnimationErrors,
  parseMarsArcadeAnimations,
  validateMarsArcadeAnimations,
} from './src/game/marsArcadeAnimations'

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
  const target = resolve(__dirname, 'src/game/marsArcadeAnimations.json')
  return {
    name: 'arcade-gym-save',
    apply: 'serve',
    configureServer(server) {
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
  plugins: [react(), arcadeGymSave()],
  build: {
    sourcemap: true,
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
})
