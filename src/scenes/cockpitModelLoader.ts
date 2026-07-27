import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import * as THREE from 'three'

export const AIRBUS_MODEL_URL = `${import.meta.env.BASE_URL}models/airbus-captain.glb`
export const DC9_MODEL_URL = `${import.meta.env.BASE_URL}models/dc9-cockpit.glb?v=dc9-golden-key-v8-20260715`
export const LOCKER_MODEL_URL = `${import.meta.env.BASE_URL}models/locker-room.glb?v=locker-shelf-0ab00624`

// Fetch and parse each cockpit GLB once per session, even across scene remounts.
const cockpitModelCache = new Map<string, Promise<THREE.Group>>()

export function loadCockpitModel(url: string): Promise<THREE.Group> {
  let promise = cockpitModelCache.get(url)
  if (!promise) {
    promise = new GLTFLoader().loadAsync(url).then((gltf) => gltf.scene)
    cockpitModelCache.set(url, promise)
  }
  return promise
}

export function clearCockpitModel(url: string): void {
  cockpitModelCache.delete(url)
}

export function preloadDc9Cockpit(): Promise<void> {
  return loadCockpitModel(DC9_MODEL_URL).then(() => undefined)
}
