import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import * as THREE from 'three'

export const AIRBUS_MODEL_URL = `${import.meta.env.BASE_URL}models/airbus-captain.glb?v=storm-flight-0a6c8aeb`
export const DC9_MODEL_URL = `${import.meta.env.BASE_URL}models/dc9-cockpit.glb?v=dc9-golden-key-v8-20260715`
export const LOCKER_MODEL_URL = `${import.meta.env.BASE_URL}models/locker-room.glb?v=locker-shelf-0ab00624`

export interface CockpitModelProgress {
  loadedBytes: number
  totalBytes?: number
}

type ProgressListener = (progress: CockpitModelProgress) => void

// Fetch and parse each cockpit GLB once per session, even across scene remounts.
const cockpitModelCache = new Map<string, Promise<THREE.Group>>()
// The DC-9 is preloaded from the opening screen, so the chapter's loading page usually
// subscribes to a download that is already running. Keep the last reported byte count so
// a late subscriber starts from the real position instead of zero.
const cockpitModelProgress = new Map<string, CockpitModelProgress>()
const cockpitModelProgressListeners = new Map<string, Set<ProgressListener>>()

export function observeCockpitModelProgress(url: string, listener: ProgressListener): () => void {
  let listeners = cockpitModelProgressListeners.get(url)
  if (!listeners) {
    listeners = new Set()
    cockpitModelProgressListeners.set(url, listeners)
  }
  listeners.add(listener)
  const current = cockpitModelProgress.get(url)
  if (current) listener(current)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) cockpitModelProgressListeners.delete(url)
  }
}

export function loadCockpitModel(url: string): Promise<THREE.Group> {
  let promise = cockpitModelCache.get(url)
  if (!promise) {
    promise = new GLTFLoader()
      .loadAsync(url, (event) => {
        const progress: CockpitModelProgress = { loadedBytes: event.loaded, totalBytes: event.total || undefined }
        cockpitModelProgress.set(url, progress)
        for (const listener of cockpitModelProgressListeners.get(url) ?? []) listener(progress)
      })
      .then((gltf) => gltf.scene)
    cockpitModelCache.set(url, promise)
  }
  return promise
}

export function clearCockpitModel(url: string): void {
  cockpitModelCache.delete(url)
  cockpitModelProgress.delete(url)
}

export function preloadDc9Cockpit(): Promise<void> {
  return loadCockpitModel(DC9_MODEL_URL).then(() => undefined)
}
