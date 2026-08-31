import assert from 'node:assert/strict'
const { test } = await import(process.env.VITEST ? 'vitest' : 'node:test')
import {
  DC9_MEMPHIS_ALTERNATIVES,
  DC9_MEMPHIS_ARCHIVE_SHA256,
  DC9_MEMPHIS_SELECTED_FILES,
  validateDc9MemphisSourceRecord,
} from './dc9-memphis-source-contract.mjs'

test('accepts only the owner-approved archive, files, permission basis, and credit', () => {
  const record = {
    archiveSha256: DC9_MEMPHIS_ARCHIVE_SHA256,
    permissionBasis: 'owner-attested-private-noncommercial-2026-08-27',
    credit: 'Memphis scenery derived from the Memphis/Nashville Scenery Package by Ted Davis.',
    selectedFiles: DC9_MEMPHIS_SELECTED_FILES.map((entry) => ({ ...entry })),
    excludedFamilies: ['AutoGate/', 'opensceneryx/', 'Planes/'],
    alternatives: DC9_MEMPHIS_ALTERNATIVES.map((entry) => ({ ...entry })),
  }
  assert.deepEqual(validateDc9MemphisSourceRecord(record), [])
})

test('rejects an added library object or changed source hash', () => {
  const errors = validateDc9MemphisSourceRecord({
    archiveSha256: 'changed',
    permissionBasis: 'owner-attested-private-noncommercial-2026-08-27',
    credit: 'Memphis scenery derived from the Memphis/Nashville Scenery Package by Ted Davis.',
    selectedFiles: [
      ...DC9_MEMPHIS_SELECTED_FILES,
      { path: 'AutoGate/Jetways-Steel/AutoGate-14m-steel.obj', sha256: 'changed' },
    ],
    excludedFamilies: ['AutoGate/', 'opensceneryx/', 'Planes/'],
    alternatives: DC9_MEMPHIS_ALTERNATIVES.map((entry) => ({ ...entry })),
  })
  assert.ok(errors.some((error) => error.includes('archive SHA-256')))
  assert.ok(errors.some((error) => error.includes('selected file set')))
})
