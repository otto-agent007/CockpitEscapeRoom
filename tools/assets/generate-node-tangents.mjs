import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { unweldPrimitive, weldPrimitive } from '@gltf-transform/functions'
import { generateTangents } from 'mikktspace'

const [input, output, meshName] = process.argv.slice(2)
if (!input || !output || !meshName) {
  console.error('Usage: node tools/assets/generate-node-tangents.mjs <input.glb> <output.glb> <mesh-name>')
  process.exit(2)
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const document = await io.read(input)
const mesh = document.getRoot().listMeshes().find((candidate) => candidate.getName() === meshName)
if (!mesh) {
  console.error(`Missing tangent target mesh: ${meshName}`)
  process.exit(1)
}

let generated = 0
for (const primitive of mesh.listPrimitives()) {
  unweldPrimitive(primitive)
  const position = primitive.getAttribute('POSITION')
  const normal = primitive.getAttribute('NORMAL')
  const texcoord = primitive.getAttribute('TEXCOORD_0')
  if (!position?.getArray() || !normal?.getArray() || !texcoord?.getArray()) {
    console.error(`${meshName} requires POSITION, NORMAL, and TEXCOORD_0 attributes for tangent generation.`)
    process.exit(1)
  }
  const tangentArray = generateTangents(
    new Float32Array(position.getArray()),
    new Float32Array(normal.getArray()),
    new Float32Array(texcoord.getArray()),
  )
  for (let index = 3; index < tangentArray.length; index += 4) tangentArray[index] *= -1
  const tangent = document
    .createAccessor(`${meshName}_TANGENT`)
    .setBuffer(position.getBuffer())
    .setArray(tangentArray)
    .setType('VEC4')
  primitive.setAttribute('TANGENT', tangent)
  weldPrimitive(primitive)
  generated += 1
}

await io.write(output, document)
console.log(`Generated MikkTSpace tangents for ${generated} primitive(s) on ${meshName}.`)
