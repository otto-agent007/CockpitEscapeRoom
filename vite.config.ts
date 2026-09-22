import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Dev-only endpoint the character gym posts authored bounds to.
 *
 * The gym edits hitboxes in a browser, and those edits have to end up in a file the
 * game reads — otherwise every tuning session is lost on reload and the boxes drift
 * back to whatever was hard-coded. One POST target, one fixed destination, and it
 * exists only in `serve` mode so nothing like it can reach a build.
 *
 * The payload is validated by `parseMarsArcadeBounds` on the CLIENT before it is
 * sent and again by the test suite on the way in, so a malformed box cannot quietly
 * land on disk; this handler only refuses to write anywhere but the one path.
 */
function arcadeGymSave(): Plugin {
  const target = resolve(__dirname, 'src/game/marsArcadeBounds.json')
  return {
    name: 'arcade-gym-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__gym/bounds', (request, response) => {
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
              JSON.parse(body)
              await writeFile(target, `${body}\n`, 'utf8')
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
