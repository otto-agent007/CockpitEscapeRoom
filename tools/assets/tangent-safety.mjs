const EPSILON = 1e-8

export function sanitizeTangents(tangents, normals) {
  for (let index = 0; index < tangents.length; index += 4) {
    let x = tangents[index]
    let y = tangents[index + 1]
    let z = tangents[index + 2]
    const length = Math.hypot(x, y, z)

    if (!Number.isFinite(length) || length < EPSILON) {
      const normalIndex = (index / 4) * 3
      const nx = normals[normalIndex]
      const ny = normals[normalIndex + 1]
      const nz = normals[normalIndex + 2]
      const useXAxis = Math.abs(nx) < 0.9
      x = useXAxis ? 0 : -nz
      y = useXAxis ? nz : 0
      z = useXAxis ? -ny : nx
      const fallbackLength = Math.hypot(x, y, z)
      if (!Number.isFinite(fallbackLength) || fallbackLength < EPSILON) {
        x = 1
        y = 0
        z = 0
      } else {
        x /= fallbackLength
        y /= fallbackLength
        z /= fallbackLength
      }
      tangents[index] = x
      tangents[index + 1] = y
      tangents[index + 2] = z
    }

    tangents[index + 3] *= -1
  }

  return tangents
}
