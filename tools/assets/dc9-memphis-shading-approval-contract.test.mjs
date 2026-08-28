import assert from 'node:assert/strict'
const { test } = await import(process.env.VITEST ? 'vitest' : 'node:test')
import {
  DC9_MEMPHIS_SHADING_PATHS,
  validateDc9MemphisShadingApproval,
} from './dc9-memphis-shading-approval-contract.mjs'

const RECORDS = {
  manifest: {
    path: DC9_MEMPHIS_SHADING_PATHS.manifest,
    sha256: 'manifest-sha',
    bytes: 7328,
  },
  materialGate: {
    path: DC9_MEMPHIS_SHADING_PATHS.materialGate,
    sha256: 'gate-sha',
    bytes: 1100,
  },
  blend: {
    path: DC9_MEMPHIS_SHADING_PATHS.approvedBlend,
    sha256: 'blend-sha',
    bytes: 1_908_346,
  },
  glb: {
    path: DC9_MEMPHIS_SHADING_PATHS.approvedGlb,
    sha256: 'glb-sha',
    bytes: 1_873_520,
  },
}

function validApproval() {
  return {
    jobId: 'dc9-memphis-legacy-shading',
    assemblyJobId: 'dc9-memphis-legacy-assembly',
    stage: 'shading-approved',
    approved: true,
    shadingManifest: RECORDS.manifest.path,
    shadingManifestSha256: RECORDS.manifest.sha256,
    materialGate: RECORDS.materialGate.path,
    materialGateSha256: RECORDS.materialGate.sha256,
    approvedArtifacts: [RECORDS.blend, RECORDS.glb],
  }
}

function validate(approval, overrides = {}) {
  return validateDc9MemphisShadingApproval({
    approval,
    approvalPath: DC9_MEMPHIS_SHADING_PATHS.approval,
    manifest: RECORDS.manifest,
    materialGate: RECORDS.materialGate,
    currentBlend: { ...RECORDS.blend, path: DC9_MEMPHIS_SHADING_PATHS.productionBlend },
    currentGlb: RECORDS.glb,
    ...overrides,
  })
}

test('accepts the exact current shading approval and promoted artifacts', () => {
  assert.deepEqual(validate(validApproval()), [])
})

test('fails closed when the formal shading approval is missing', () => {
  const errors = validate(undefined)
  assert.ok(errors.some((error) => error.includes('shading approval is required')))
})

test('rejects unapproved and wrong-stage approval records', () => {
  const approval = validApproval()
  approval.approved = false
  approval.stage = 'shading_complete'
  const errors = validate(approval)
  assert.ok(errors.some((error) => error.includes('approved: true')))
  assert.ok(errors.some((error) => error.includes('shading-approved')))
})

test('rejects mismatched manifest, material-gate, and approved artifact records', () => {
  const approval = validApproval()
  approval.shadingManifestSha256 = 'changed-manifest'
  approval.materialGate = 'wrong/gate.json'
  approval.approvedArtifacts[0] = { ...approval.approvedArtifacts[0], bytes: 1 }
  approval.approvedArtifacts[1] = { ...approval.approvedArtifacts[1], sha256: 'changed-glb' }
  approval.approvedArtifacts.push({ path: 'unexpected.bin', sha256: 'extra', bytes: 1 })
  const errors = validate(approval)
  assert.ok(errors.some((error) => error.includes('shading manifest')))
  assert.ok(errors.some((error) => error.includes('material gate')))
  assert.ok(errors.some((error) => error.includes('approved blend')))
  assert.ok(errors.some((error) => error.includes('approved GLB')))
  assert.ok(errors.some((error) => error.includes('exactly the approved blend and GLB')))
})

test('rejects a wrong approval path, IDs, or promoted bytes', () => {
  const approval = validApproval()
  approval.jobId = 'wrong-job'
  approval.assemblyJobId = 'wrong-assembly'
  const errors = validate(approval, {
    approvalPath: 'wrong/approval.json',
    currentBlend: { ...RECORDS.blend, path: DC9_MEMPHIS_SHADING_PATHS.productionBlend, sha256: 'changed' },
  })
  assert.ok(errors.some((error) => error.includes('exact approval path')))
  assert.ok(errors.some((error) => error.includes('job IDs')))
  assert.ok(errors.some((error) => error.includes('current production blend')))
})
