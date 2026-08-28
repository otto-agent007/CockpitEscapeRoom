import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import {
  disposeMemphisClone,
  handleMemphisLoadFailure,
  publishMemphisDataset,
  stageMemphisClone,
} from './dc9MemphisEnvironmentSupport'

function fixtureScene(): {
  source: THREE.Group
  geometry: THREE.BufferGeometry
  material: THREE.MeshStandardMaterial
  secondaryMaterial: THREE.MeshStandardMaterial
  texture: THREE.Texture
} {
  const source = new THREE.Group()
  const root = new THREE.Group()
  root.name = 'KMEM_LEGACY_ROOT'
  source.add(root)

  const texture = new THREE.Texture()
  texture.name = 'KMEMterminal'
  const material = new THREE.MeshStandardMaterial({ map: texture, color: '#8d8878' })
  material.name = 'KMEM_TERMINAL'
  const secondaryMaterial = new THREE.MeshStandardMaterial({ map: texture, color: '#5f5b51' })
  secondaryMaterial.name = 'KMEM_RUNWAY'
  const geometry = new THREE.BoxGeometry(1, 1, 1)

  for (const name of ['KMEM_CONCOURSE_B', 'KMEM_RAMP', 'KMEM_TAXI_SURFACE', 'KMEM_RUNWAY_SURFACE']) {
    const mesh = new THREE.Mesh(geometry, name === 'KMEM_RUNWAY_SURFACE' ? secondaryMaterial : material)
    mesh.name = name
    mesh.userData.memory = { year: 1995 }
    root.add(mesh)
  }

  const anchors = [
    ['KMEM_RAMP_START', 'dc9.memphis.rampStart', [0, 0, 0]],
    ['KMEM_TAXI_TURN', 'dc9.memphis.taxiTurn', [-55, 0, -90]],
    ['KMEM_HOLD_SHORT', 'dc9.memphis.holdShort', [-120, 0, -210]],
    ['KMEM_RUNWAY_LINEUP', 'dc9.memphis.runwayLineup', [-120, 0, -245]],
    ['KMEM_INITIAL_CLIMB', 'dc9.memphis.initialClimb', [-120, 110, -700]],
  ] as const
  for (const [name, gameId, position] of anchors) {
    const anchor = new THREE.Object3D()
    anchor.name = name
    anchor.position.set(position[0], position[1], position[2])
    anchor.userData.game_id = gameId
    root.add(anchor)
  }
  return { source, geometry, material, secondaryMaterial, texture }
}

describe('DC-9 Memphis environment ownership', () => {
  it('clones shared render resources once for the staged scene and preserves hierarchy metadata', () => {
    const { source, geometry, material, texture } = fixtureScene()
    const staged = stageMemphisClone(source)
    const ramp = staged.scene.getObjectByName('KMEM_RAMP') as THREE.Mesh
    const taxi = staged.scene.getObjectByName('KMEM_TAXI_SURFACE') as THREE.Mesh
    const runway = staged.scene.getObjectByName('KMEM_RUNWAY_SURFACE') as THREE.Mesh
    const stagedMaterial = ramp.material as THREE.MeshStandardMaterial
    const stagedRunwayMaterial = runway.material as THREE.MeshStandardMaterial

    expect(ramp.geometry).not.toBe(geometry)
    expect(ramp.geometry).toBe(taxi.geometry)
    expect(stagedMaterial).not.toBe(material)
    expect(stagedMaterial).toBe(taxi.material)
    expect(stagedMaterial.map).not.toBe(texture)
    expect(stagedMaterial.map).toBe((taxi.material as THREE.MeshStandardMaterial).map)
    expect(stagedRunwayMaterial).not.toBe(stagedMaterial)
    expect(stagedRunwayMaterial.map).toBe(stagedMaterial.map)
    expect(stagedMaterial.color.getHex()).toBe(material.color.getHex())
    expect(stagedMaterial.map?.name).toBe(texture.name)
    expect(ramp.userData).toEqual({ memory: { year: 1995 } })
    expect(ramp.parent?.name).toBe('KMEM_LEGACY_ROOT')
  })

  it('disposes only owned clone resources and leaves cached source resources live', () => {
    const { source, geometry, material, secondaryMaterial, texture } = fixtureScene()
    const staged = stageMemphisClone(source)
    const ramp = staged.scene.getObjectByName('KMEM_RAMP') as THREE.Mesh
    const stagedMaterial = ramp.material as THREE.MeshStandardMaterial
    const sourceDisposed = vi.fn()
    const ownedDisposed = vi.fn()
    geometry.addEventListener('dispose', sourceDisposed)
    material.addEventListener('dispose', sourceDisposed)
    secondaryMaterial.addEventListener('dispose', sourceDisposed)
    texture.addEventListener('dispose', sourceDisposed)
    ramp.geometry.addEventListener('dispose', ownedDisposed)
    stagedMaterial.addEventListener('dispose', ownedDisposed)
    stagedMaterial.map?.addEventListener('dispose', ownedDisposed)

    disposeMemphisClone(staged.scene)

    expect(sourceDisposed).not.toHaveBeenCalled()
    expect(ownedDisposed).toHaveBeenCalledTimes(3)
  })
})

describe('DC-9 Memphis load lifecycle helpers', () => {
  it('does not let a request rejected after unmount clear or log over its replacement', async () => {
    const clearCache = vi.fn()
    const logError = vi.fn()
    let active = true
    let rejectLoad: (error: unknown) => void = () => undefined
    const pendingLoad = new Promise<void>((_resolve, reject) => {
      rejectLoad = reject
    }).catch((error) => {
      handleMemphisLoadFailure(active, error, { clearCache, logError })
    })

    active = false
    rejectLoad(new Error('stale'))
    await pendingLoad
    expect(clearCache).not.toHaveBeenCalled()
    expect(logError).not.toHaveBeenCalled()

    expect(handleMemphisLoadFailure(true, new Error('current'), { clearCache, logError })).toBe(true)
    expect(clearCache).toHaveBeenCalledTimes(1)
    expect(logError).toHaveBeenCalledTimes(1)
  })

  it('writes beat and pose datasets only when their values change', () => {
    let writes = 0
    const values: Record<string, string> = {}
    const dataset = new Proxy(values, {
      set(target, key, value: string) {
        writes += 1
        target[String(key)] = value
        return true
      },
    })
    const cache = new Map<string, string>()

    expect(publishMemphisDataset(dataset, cache, 'dc9MemphisBeat', 'taxi')).toBe(true)
    expect(publishMemphisDataset(dataset, cache, 'dc9MemphisBeat', 'taxi')).toBe(false)
    expect(publishMemphisDataset(dataset, cache, 'dc9MemphisBeat', 'holdShort')).toBe(true)
    expect(writes).toBe(2)
  })
})
