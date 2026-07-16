import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const assetName = process.argv[2]
const assets = {
  dc9: {
    blend: 'art-source/blender/dc9_master.blend',
    output: 'public/models/dc9-cockpit.glb',
    root: 'DC9_ROOT',
    prepare: 'tools/blender/build_dc9_production.py',
    tangentMesh: 'DC9_PROP_CAPTAINS_KEY_MESH_GEOMETRY',
    celebration: {
      node: 'DC9_PROP_CAPTAINS_KEY',
      output: 'public/images/captains-key-celebration.png',
      cacheOutput: '.cache/assets/dc9/celebration/captains-key-celebration.png',
      distanceFactor: 2.1,
      presentationRotationDegrees: [-90, 98, 67],
    },
  },
  airbus: {
    blend: 'art-source/cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend',
    output: 'public/models/airbus-captain.glb',
    root: 'AIRBUS_ROOT',
    prepare: 'tools/blender/prepare_airbus_captain.py',
  },
  tesla: {
    blend: 'art-source/blender/tesla_reward.blend',
    output: 'public/models/model-y-reward.glb',
    root: 'TESLA_ROOT',
  },
  locker: {
    blend: 'art-source/blender/locker_room_master.blend',
    output: 'public/models/locker-room.glb',
    root: 'LOCKER_ROOT',
    prepare: 'tools/blender/import_locker_room_props.py',
  },
}

if (!assetName || !(assetName in assets)) {
  console.error('Usage: node tools/assets/build-asset.mjs <dc9|airbus|tesla|locker>')
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
const deployableGlb = config.tangentMesh ? resolve(cacheDir, `${assetName}.tangents.glb`) : rawGlb
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

if (config.prepare) {
  run(
    blender,
    ['--background', '--disable-autoexec', config.blend, '--python', config.prepare],
    'prepare source assets',
  )
}

run(blender, ['--background', config.blend, '--python', 'tools/blender/validate_scene.py'], 'validate scene')
run(blender, ['--background', config.blend, '--python', 'tools/blender/render_preview.py'], 'render approval views')
run(blender, ['--background', config.blend, '--python', 'tools/blender/export_glb.py'], 'export raw GLB')
if (config.tangentMesh) {
  run('node', ['tools/assets/generate-node-tangents.mjs', rawGlb, deployableGlb, config.tangentMesh], 'generate required tangents')
}
run('npx', ['gltf-transform', 'validate', deployableGlb], 'validate GLB')
run('npx', ['gltf-transform', 'inspect', deployableGlb], 'inspect GLB')

mkdirSync(dirname(resolve(config.output)), { recursive: true })
copyFileSync(deployableGlb, config.output)

if (config.celebration) {
  run(
    blender,
    [
      '--background',
      '--factory-startup',
      '--disable-autoexec',
      '--python',
      'tools/blender/render_glb_node.py',
      '--',
      '--source',
      config.output,
      '--node',
      config.celebration.node,
      '--output',
      config.celebration.cacheOutput,
      '--distance-factor',
      String(config.celebration.distanceFactor ?? 2.65),
      '--presentation-rotation-degrees',
      ...config.celebration.presentationRotationDegrees.map(String),
    ],
    'render celebration image',
  )
  mkdirSync(dirname(resolve(config.celebration.output)), { recursive: true })
  copyFileSync(resolve(config.celebration.cacheOutput), resolve(config.celebration.output))
}

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
