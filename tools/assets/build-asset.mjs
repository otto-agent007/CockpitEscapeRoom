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
      report: 'asset-reports/dc9-captains-key-celebration.json',
      distanceFactor: 2.1,
      presentationRotationDegrees: [-90, 98, 67],
    },
  },
  'dc9-memphis': {
    blend: 'art-source/blender/dc9-memphis-legacy-departure.blend',
    output: 'public/models/dc9-memphis-legacy-departure.glb',
    root: 'KMEM_LEGACY_ROOT',
    approvedGlb: 'art-source/cockpit-pipeline/builds/shaded/dc9-memphis-legacy-shading/dc9-memphis-legacy-shaded.glb',
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
    build: 'tools/blender/build_tesla_reward.py',
    tangentMesh: 'TESLA_MODEL_Y_BODY_GEOMETRY',
    presentationImages: [
      {
        cacheOutput: '.cache/assets/tesla/previews/model-y-narrow-static.png',
        output: 'public/images/model-y-reward-narrow-static.png',
      },
      {
        cacheOutput: '.cache/assets/tesla/previews/model-y-narrow-final.png',
        output: 'public/images/model-y-reward-narrow-final.png',
      },
    ],
  },
  locker: {
    blend: 'art-source/blender/locker_room_master.blend',
    output: 'public/models/locker-room.glb',
    root: 'LOCKER_ROOT',
    prepare: 'tools/blender/import_locker_room_props.py',
  },
}

if (!assetName || !(assetName in assets)) {
  console.error('Usage: node tools/assets/build-asset.mjs <dc9|dc9-memphis|airbus|tesla|locker>')
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
const cacheDir = resolve('.cache', 'assets', assetName)
const rawGlb = resolve(cacheDir, `${assetName}.raw.glb`)
const deployableGlb = config.approvedGlb
  ? resolve(config.approvedGlb)
  : (config.tangentMesh ? resolve(cacheDir, `${assetName}.tangents.glb`) : rawGlb)
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

if (config.build) {
  run(
    blender,
    ['--background', '--factory-startup', '--disable-autoexec', '--python', config.build],
    'build deterministic source',
  )
}
if (!existsSync(config.blend)) {
  console.error(`Missing Blender source file: ${config.blend}`)
  process.exit(2)
}

if (config.prepare) {
  run(
    blender,
    ['--background', '--disable-autoexec', config.blend, '--python', config.prepare],
    'prepare source assets',
  )
}

if (config.approvedGlb) {
  if (!existsSync(config.approvedGlb)) {
    console.error(`Missing approved deployable GLB: ${config.approvedGlb}`)
    process.exit(2)
  }
  run(
    blender,
    [
      '--background', '--factory-startup', '--disable-autoexec', config.blend,
      '--python', 'tools/blender/shade_dc9_memphis_legacy.py', '--',
      '--assembly-approval', 'art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-assembly/assembly-approval.json',
      '--source-dir', '.cache/cockpit-pipeline/sources/dc9-memphis/ted-davis-memphis-nashville/extracted/Memphis_Nashville/KMEM',
      '--output-dir', 'art-source/cockpit-pipeline/builds/shaded/dc9-memphis-legacy-shading',
      '--material-gate', 'art-source/cockpit-pipeline/gates/dc9-memphis-legacy-material-optimization.json',
      '--validate-shaded-master',
    ],
    'validate owner-approved shaded master',
  )
} else {
  run(blender, ['--background', config.blend, '--python', 'tools/blender/validate_scene.py'], 'validate scene')
  run(blender, ['--background', config.blend, '--python', 'tools/blender/render_preview.py'], 'render approval views')
  run(blender, ['--background', config.blend, '--python', 'tools/blender/export_glb.py'], 'export raw GLB')
  if (config.tangentMesh) {
    run('node', ['tools/assets/generate-node-tangents.mjs', rawGlb, deployableGlb, config.tangentMesh], 'generate required tangents')
  }
}
run('npx', ['gltf-transform', 'validate', deployableGlb], 'validate GLB')
run('npx', ['gltf-transform', 'inspect', deployableGlb], 'inspect GLB')

mkdirSync(dirname(resolve(config.output)), { recursive: true })
copyFileSync(deployableGlb, config.output)
for (const image of config.presentationImages ?? []) {
  if (!existsSync(image.cacheOutput)) {
    console.error(`Missing generated presentation image: ${image.cacheOutput}`)
    process.exit(2)
  }
  mkdirSync(dirname(resolve(image.output)), { recursive: true })
  copyFileSync(resolve(image.cacheOutput), resolve(image.output))
}

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
  const generatedReportPath = resolve(config.celebration.cacheOutput).replace(/\.png$/i, '.json')
  const generatedReport = JSON.parse(readFileSync(generatedReportPath, 'utf8'))
  mkdirSync(dirname(resolve(config.celebration.report)), { recursive: true })
  writeFileSync(
    resolve(config.celebration.report),
    JSON.stringify(
      {
        asset: 'dc9-captains-key-celebration',
        sourceModel: config.output,
        node: generatedReport.node,
        output: config.celebration.output,
        blenderVersion: generatedReport.blenderVersion,
        meshObjectCount: generatedReport.meshObjectCount,
        materialCount: generatedReport.materialCount,
        resolution: generatedReport.resolution,
        distanceFactor: generatedReport.distanceFactor,
        presentationRotationDegrees: generatedReport.presentationRotationDegrees,
        bounds: generatedReport.bounds,
      },
      null,
      2,
    ) + '\n',
  )
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
      note: config.approvedGlb
        ? 'Promotes the exact owner-approved GLB after read-only semantic Blender validation; no re-export or destructive optimization is applied.'
        : 'No destructive optimization is applied by default; preserve node names, pivots, hierarchy, extras, and animations.',
      exportContract,
      validation,
    },
    null,
    2,
  ) + '\n',
)

console.log(`\nAsset ready: ${config.output}`)
console.log(`Report: ${reportPath}`)
