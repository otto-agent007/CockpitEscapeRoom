export const DC9_MEMPHIS_SHADING_PATHS = Object.freeze({
  approval: 'art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-shading/shading-approval.json',
  manifest: 'art-source/cockpit-pipeline/jobs/dc9-memphis-legacy-shading/manifests/shading-complete.json',
  materialGate: 'art-source/cockpit-pipeline/gates/dc9-memphis-legacy-material-optimization.json',
  approvedBlend: 'art-source/cockpit-pipeline/builds/shaded/dc9-memphis-legacy-shading/dc9-memphis-legacy-shaded.blend',
  approvedGlb: 'art-source/cockpit-pipeline/builds/shaded/dc9-memphis-legacy-shading/dc9-memphis-legacy-shaded.glb',
  productionBlend: 'art-source/blender/dc9-memphis-legacy-departure.blend',
})

function recordMatches(actual, expected, expectedPath) {
  return actual?.path === expectedPath
    && actual?.sha256 === expected?.sha256
    && actual?.bytes === expected?.bytes
}

export function validateDc9MemphisShadingApproval({
  approval,
  approvalPath,
  manifest,
  materialGate,
  currentBlend,
  currentGlb,
}) {
  const errors = []
  if (!approval || typeof approval !== 'object') return ['Formal DC-9 Memphis shading approval is required.']
  if (approvalPath !== DC9_MEMPHIS_SHADING_PATHS.approval) {
    errors.push(`DC-9 Memphis build must use the exact approval path ${DC9_MEMPHIS_SHADING_PATHS.approval}.`)
  }
  if (approval.approved !== true) errors.push('DC-9 Memphis shading approval must record approved: true.')
  if (approval.stage !== 'shading-approved') errors.push('DC-9 Memphis shading approval stage must be shading-approved.')
  if (approval.jobId !== 'dc9-memphis-legacy-shading' || approval.assemblyJobId !== 'dc9-memphis-legacy-assembly') {
    errors.push('DC-9 Memphis shading approval must retain the exact shading and assembly job IDs.')
  }
  if (approval.shadingManifest !== DC9_MEMPHIS_SHADING_PATHS.manifest
    || manifest?.path !== DC9_MEMPHIS_SHADING_PATHS.manifest
    || approval.shadingManifestSha256 !== manifest?.sha256) {
    errors.push('DC-9 Memphis shading manifest path/hash does not match the current approved manifest.')
  }
  if (approval.materialGate !== DC9_MEMPHIS_SHADING_PATHS.materialGate
    || materialGate?.path !== DC9_MEMPHIS_SHADING_PATHS.materialGate
    || approval.materialGateSha256 !== materialGate?.sha256) {
    errors.push('DC-9 Memphis material gate path/hash does not match the current approved gate.')
  }

  const artifacts = Array.isArray(approval.approvedArtifacts) ? approval.approvedArtifacts : []
  const artifactPaths = artifacts.map((record) => record?.path).sort()
  const expectedArtifactPaths = [
    DC9_MEMPHIS_SHADING_PATHS.approvedBlend,
    DC9_MEMPHIS_SHADING_PATHS.approvedGlb,
  ].sort()
  if (JSON.stringify(artifactPaths) !== JSON.stringify(expectedArtifactPaths)) {
    errors.push('DC-9 Memphis approval must contain exactly the approved blend and GLB artifact records.')
  }
  const blendRecord = artifacts.find((record) => record?.path === DC9_MEMPHIS_SHADING_PATHS.approvedBlend)
  const glbRecord = artifacts.find((record) => record?.path === DC9_MEMPHIS_SHADING_PATHS.approvedGlb)
  if (!recordMatches(blendRecord, currentBlend, DC9_MEMPHIS_SHADING_PATHS.approvedBlend)) {
    errors.push('DC-9 Memphis approved blend path/hash/byte record does not match the current production blend.')
  }
  if (!recordMatches(glbRecord, currentGlb, DC9_MEMPHIS_SHADING_PATHS.approvedGlb)) {
    errors.push('DC-9 Memphis approved GLB path/hash/byte record does not match the current deployable GLB.')
  }
  if (currentBlend?.path !== DC9_MEMPHIS_SHADING_PATHS.productionBlend
    || blendRecord?.sha256 !== currentBlend?.sha256
    || blendRecord?.bytes !== currentBlend?.bytes) {
    errors.push('DC-9 Memphis current production blend must be byte-identical to its approved artifact record.')
  }
  if (currentGlb?.path !== DC9_MEMPHIS_SHADING_PATHS.approvedGlb) {
    errors.push('DC-9 Memphis current GLB must resolve to the exact approved deployable path.')
  }
  return errors
}
