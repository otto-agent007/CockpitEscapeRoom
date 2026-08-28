import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { pngMetadata } from './intro-asset-contract.mjs'

const ARCHIVE_FILENAME = 'Memphis_Nashville.zip'
const EXTRACTED_PACKAGE_DIRECTORY = 'Memphis_Nashville'
const CREDIT = 'Memphis scenery derived from the Memphis/Nashville Scenery Package by Ted Davis.'
const EXCLUDED_FAMILIES = ['AutoGate/', 'opensceneryx/', 'Planes/']
const SOURCE_URL = 'https://theosdavis.com/xpfiles/ewExternalFiles/Memphis_Nashville.zip'

export const DC9_MEMPHIS_ARCHIVE_SHA256 =
  'fc403141223be066094814d9ea06d820f75477fea419870b04ffd65153434b95'

export const DC9_MEMPHIS_SELECTED_FILES = [
  { path: 'KMEM/ConcourseB.obj', sha256: 'e88ab8411a033d5996c53053b14a894ff9824380a76891b27659549a7e9e6424' },
  { path: 'KMEM/ConcourseB_2.obj', sha256: 'e4bb0f830c515d9c5a42cfe60bce5eb4dc3fb6ba5fdce6ca9c66d16ef49f7000' },
  { path: 'KMEM/ConcourseB_2e.obj', sha256: '2bf6f39b0e5e1f6a2e24fefb9469fc1c598884ddcfefc9f20b825cac375a109d' },
  { path: 'KMEM/KMEMterminal.png', sha256: '416c081c5e9f9ca40b183477da54f7ec8c5baa62ae0b9c0bdd961329ac394505' },
  { path: 'KMEM/KMEMterminal_LIT.png', sha256: '6a561147ceae328b311fba38de849d3102a4d2eb1238c3ddbbfb2315b7cf91e5' },
  { path: 'KMEM/KMEMterminal_NML.png', sha256: '9e1f272c64807981bee997aa08e7a3273ab5c4242f4ff58fb92cc20b1f8bf7e8' },
]

export const DC9_MEMPHIS_PERMISSION_BASIS =
  'owner-attested-private-noncommercial-2026-08-27'

export const DC9_MEMPHIS_ALTERNATIVES = [
  {
    url: 'https://forums.x-plane.org/files/file/12796-kmem-memphis-international-airport/',
    decision: 'rejected',
    reason: 'Requires OpenSceneryX and does not provide a clearer portable Concourse B authority.',
  },
  {
    url: 'https://forums.x-plane.org/files/file/25605-kmem-fdx-memphis-fedex-hub/',
    decision: 'rejected',
    reason: 'FedEx-hub focus and mixed third-party objects do not match the older passenger Concourse B target.',
  },
]

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function sameRecords(actual, expected) {
  if (!Array.isArray(actual) || actual.length !== expected.length) return false
  return actual.every((entry, index) => entry?.path === expected[index].path
    && entry?.sha256 === expected[index].sha256)
}

function sameAlternatives(actual) {
  if (!Array.isArray(actual) || actual.length !== DC9_MEMPHIS_ALTERNATIVES.length) return false
  return actual.every((entry, index) => entry?.url === DC9_MEMPHIS_ALTERNATIVES[index].url
    && entry?.decision === DC9_MEMPHIS_ALTERNATIVES[index].decision
    && entry?.reason === DC9_MEMPHIS_ALTERNATIVES[index].reason)
}

export function validateDc9MemphisSourceRecord(record) {
  const errors = []
  if (record?.archiveSha256 !== DC9_MEMPHIS_ARCHIVE_SHA256) {
    errors.push('archive SHA-256 does not match the owner-approved source')
  }
  if (record?.permissionBasis !== DC9_MEMPHIS_PERMISSION_BASIS) {
    errors.push('permission basis does not match the owner attestation')
  }
  if (record?.credit !== CREDIT) errors.push('Ted Davis credit does not match the required attribution')
  if (!sameRecords(record?.selectedFiles, DC9_MEMPHIS_SELECTED_FILES)) {
    errors.push('selected file set does not exactly match the six approved files and hashes')
  }
  if (!Array.isArray(record?.excludedFamilies)
    || record.excludedFamilies.length !== EXCLUDED_FAMILIES.length
    || record.excludedFamilies.some((family, index) => family !== EXCLUDED_FAMILIES[index])) {
    errors.push('excluded families do not exactly preserve AutoGate, OpenSceneryX, and Planes exclusions')
  }
  if (!sameAlternatives(record?.alternatives)) {
    errors.push('rejected alternatives do not exactly preserve both decisions and reasons')
  }
  return errors
}

function sourceFilePath(extractedRoot, sourcePath) {
  return join(extractedRoot, ...sourcePath.split('/'))
}

function textureRecords(extractedRoot) {
  return DC9_MEMPHIS_SELECTED_FILES
    .filter((entry) => entry.path.endsWith('.png'))
    .map((entry) => ({ path: entry.path, ...pngMetadata(sourceFilePath(extractedRoot, entry.path)) }))
}

export function writeDc9MemphisSourceRecord(sourceDir, outputPath) {
  const archivePath = join(sourceDir, ARCHIVE_FILENAME)
  const extractedRoot = join(sourceDir, 'extracted', EXTRACTED_PACKAGE_DIRECTORY)
  if (!existsSync(archivePath) || !statSync(archivePath).isFile()) {
    throw new Error(`missing immutable archive: ${archivePath}`)
  }

  const selectedFiles = DC9_MEMPHIS_SELECTED_FILES.map((entry) => {
    const path = sourceFilePath(extractedRoot, entry.path)
    if (!existsSync(path) || !statSync(path).isFile()) throw new Error(`missing selected source file: ${entry.path}`)
    return { path: entry.path, sha256: sha256File(path) }
  })
  const record = {
    sourceUrl: SOURCE_URL,
    sourceAuthor: 'Ted Davis',
    archivePath: relative(process.cwd(), archivePath).split(sep).join('/'),
    archiveSha256: sha256File(archivePath),
    extractedPackageRoot: relative(process.cwd(), extractedRoot).split(sep).join('/'),
    permissionBasis: DC9_MEMPHIS_PERMISSION_BASIS,
    credit: CREDIT,
    selectedFiles,
    textureDimensions: textureRecords(extractedRoot),
    excludedFamilies: [...EXCLUDED_FAMILIES],
    alternatives: DC9_MEMPHIS_ALTERNATIVES.map((entry) => ({ ...entry })),
  }
  const errors = validateDc9MemphisSourceRecord(record)
  if (errors.length > 0) throw new Error(`invalid DC-9 Memphis source intake:\n- ${errors.join('\n- ')}`)
  writeFileSync(outputPath, `${JSON.stringify(record, null, 2)}\n`)
  return record
}

function parseCliArguments(argumentsList) {
  const sourceDirectoryFlag = argumentsList.indexOf('--source-dir')
  const outputFlag = argumentsList.indexOf('--output')
  if (sourceDirectoryFlag < 0 || outputFlag < 0
    || !argumentsList[sourceDirectoryFlag + 1] || !argumentsList[outputFlag + 1]) {
    throw new Error('usage: node tools/assets/dc9-memphis-source-contract.mjs --source-dir <directory> --output <report.json>')
  }
  return { sourceDir: argumentsList[sourceDirectoryFlag + 1], outputPath: argumentsList[outputFlag + 1] }
}

if (process.argv[1]?.endsWith('dc9-memphis-source-contract.mjs')) {
  const { sourceDir, outputPath } = parseCliArguments(process.argv.slice(2))
  const record = writeDc9MemphisSourceRecord(sourceDir, outputPath)
  console.log(`Wrote ${outputPath} with ${record.selectedFiles.length} hash-bound selected files.`)
}
