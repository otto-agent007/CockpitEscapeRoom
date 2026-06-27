import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const assetName = process.argv[2]
const assets = {
  dc9: {
    blend: 'art-source/blender/dc9_master.blend',
    output: 'public/models/dc9-cockpit.glb',
    root: 'DC9_ROOT',
  },
  airbus: {
    blend: 'art-source/blender/airbus_master.blend',
    output: 'public/models/airbus-bonus.glb',
    root: 'AIRBUS_ROOT',
  },
  tesla: {
    blend: 'art-source/blender/tesla_reward.blend',
    output: 'public/models/model-y-reward.glb',
    root: 'TESLA_ROOT',
  },
}

if (!assetName || !(assetName in assets)) {
  console.error('Usage: node tools/assets/build-asset.mjs <dc9|airbus|tesla>')
  process.exit(2)
}

const config = assets[assetName]
const blender = process.env.BLENDER_BIN
if (!blender) {
  console.error('BLENDER_BIN is not set. See docs/BLENDER_PIPELINE.md.')
  process.exit(2)
}
if (!existsSync(blender)) {
  console.error(`BLENDER_BIN does not exist: ${blender}`)
  process.exit(2)
}
if (!existsSync(config.blend)) {
  console.error(`Missing Blender source file: ${config.blend}`)
  process.exit(2)
}

const cacheDir = resolve('.cache', 'assets', assetName)
const rawGlb = resolve(cacheDir, `${assetName}.raw.glb`)
const reportPath = resolve(cacheDir, 'asset-report.json')
mkdirSync(cacheDir, { recursive: true })

function run(command, args, label) {
  console.log(`\n[${label}] ${command} ${args.join(' ')}`)
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      ASSET_NAME: assetName,
      ASSET_ROOT: config.root,
      ASSET_OUTPUT: rawGlb,
      ASSET_REPORT_DIR: cacheDir,
    },
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run(blender, ['--background', config.blend, '--python', 'tools/blender/validate_scene.py'], 'validate scene')
run(blender, ['--background', config.blend, '--python', 'tools/blender/render_preview.py'], 'render approval views')
run(blender, ['--background', config.blend, '--python', 'tools/blender/export_glb.py'], 'export raw GLB')
run('npx', ['gltf-transform', 'validate', rawGlb], 'validate GLB')
run('npx', ['gltf-transform', 'inspect', rawGlb], 'inspect GLB')

mkdirSync(dirname(resolve(config.output)), { recursive: true })
copyFileSync(rawGlb, config.output)

const validationPath = resolve(cacheDir, 'validation.json')
const exportContractPath = resolve(cacheDir, 'export-contract-report.json')
const validation = existsSync(validationPath)
  ? JSON.parse(readFileSync(validationPath, 'utf8'))
  : { warning: 'No validation report was generated.' }
const exportContract = existsSync(exportContractPath)
  ? JSON.parse(readFileSync(exportContractPath, 'utf8'))
  : { warning: 'No export contract report was generated.' }

writeFileSync(
  reportPath,
  JSON.stringify(
    {
      asset: assetName,
      blenderSource: config.blend,
      deployableOutput: config.output,
      rootObject: config.root,
      builtAt: new Date().toISOString(),
      note: 'No destructive optimization is applied by default; preserve node names, pivots, hierarchy, extras, and animations.',
      exportContract,
      validation,
    },
    null,
    2,
  ) + '\n',
)

console.log(`\nAsset ready: ${config.output}`)
console.log(`Report: ${reportPath}`)
