import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'

export const REWARD_MODEL_URL = `${import.meta.env.BASE_URL}models/model-y-reward.glb?v=legacy-hangar-53b51f9a`

let cachedRewardModel: Promise<GLTF> | null = null

export function loadRewardModel(
  onProgress?: (loadedBytes: number, totalBytes?: number) => void,
): Promise<GLTF> {
  if (!cachedRewardModel) {
    cachedRewardModel = new Promise((resolve, reject) => {
      new GLTFLoader().load(
        REWARD_MODEL_URL,
        resolve,
        (event) => onProgress?.(event.loaded, event.lengthComputable ? event.total : undefined),
        reject,
      )
    })
  }
  return cachedRewardModel
}

export function clearRewardModel(): void {
  cachedRewardModel = null
}
