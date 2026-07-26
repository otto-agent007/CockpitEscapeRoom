import { expect, test } from 'vitest'

import { sanitizeTangents } from './tangent-safety.mjs'

test('preserves valid tangent vectors and flips their handedness', () => {
  const tangents = new Float32Array([1, 0, 0, 1])
  const normals = new Float32Array([0, 0, 1])

  sanitizeTangents(tangents, normals)

  expect([...tangents]).toEqual([1, 0, 0, -1])
})

test('replaces zero-length tangents with a unit vector orthogonal to the normal', () => {
  const tangents = new Float32Array([0, 0, 0, 1])
  const normals = new Float32Array([0, 0, 1])

  sanitizeTangents(tangents, normals)

  expect(Math.hypot(tangents[0], tangents[1], tangents[2])).toBe(1)
  expect(
    tangents[0] * normals[0] + tangents[1] * normals[1] + tangents[2] * normals[2],
  ).toBe(0)
  expect(tangents[3]).toBe(-1)
})
