import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '../..')

const spriteContracts = [
  {
    id: 'popt-idle-sheet',
    path: 'public/images/intro/popt/idle-sheet.png',
    width: 1024,
    height: 256,
    columns: 4,
    rows: 1,
    sha256: '8b302b8c90ed92d020a166d43719f8474c6e43c80b32c5c811594a1a98c67723',
  },
  {
    id: 'popt-run-sheet',
    path: 'public/images/intro/popt/run-sheet.png',
    width: 1024,
    height: 512,
    columns: 4,
    rows: 2,
    sha256: '432ff43be2405e11e94ba9fc8b13d86ce9c2fc4ab0bc9ecea0735347d584f94f',
  },
  {
    id: 'popt-reach-sheet',
    path: 'public/images/intro/popt/reach-catch-sheet.png',
    width: 1024,
    height: 256,
    columns: 4,
    rows: 1,
    sha256: '8f02190f7ab2ab04608e44f383a59b80e7c9227879978d73e4bce1e82acee6b9',
  },
]

const audioContract = {
  path: 'public/audio/intro-audio-53s.mp3',
  bytes: 1_273_994,
  durationSeconds: 53.04,
  sha256: 'be635257cce2ebb3e7e327cada37e09b4a3b4c292e5e385f280955a1d2843507',
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function readPngDimensions(buffer, id) {
  const signature = buffer.subarray(0, 8).toString('hex')
  if (signature !== '89504e470d0a1a0a') throw new Error(`${id} is not a PNG`)
  if (buffer.subarray(12, 16).toString('ascii') !== 'IHDR') throw new Error(`${id} has no PNG IHDR`)
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

for (const contract of spriteContracts) {
  const buffer = await readFile(resolve(ROOT, contract.path))
  const dimensions = readPngDimensions(buffer, contract.id)
  if (dimensions.width !== contract.width || dimensions.height !== contract.height) {
    throw new Error(`${contract.id} must be ${contract.width} x ${contract.height}`)
  }
  if (contract.width / contract.columns !== 256 || contract.height / contract.rows !== 256) {
    throw new Error(`${contract.id} must use normalized 256 x 256 cells`)
  }
  if (sha256(buffer) !== contract.sha256) throw new Error(`${contract.id} integrity mismatch`)
}

const audio = await readFile(resolve(ROOT, audioContract.path))
if (audio.length !== audioContract.bytes) throw new Error('Intro audio byte length changed')
if (sha256(audio) !== audioContract.sha256) throw new Error('Intro audio integrity mismatch')
if (audio.subarray(0, 3).toString('ascii') !== 'ID3' && audio[0] !== 0xff) {
  throw new Error('Intro audio is not an MP3')
}

console.log(`${spriteContracts.length} sprite sheets valid on normalized 256 x 256 cells`)
console.log(`${audioContract.durationSeconds.toFixed(3)}-second audio valid (${audioContract.bytes} bytes)`)
