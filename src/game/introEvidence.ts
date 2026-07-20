export const INTRO_EVIDENCE_TIMES = [0, 3, 6, 12, 16, 22, 28, 35, 42, 48, 51, 53] as const

export function createIntroEvidenceFileName(index: number, sceneId: string): string {
  const time = INTRO_EVIDENCE_TIMES[index]
  if (time === undefined) throw new Error(`Unknown intro evidence index: ${index}`)
  const safeSceneId = sceneId.replace(/[^a-z0-9-]/g, '-')
  return `${String(index).padStart(2, '0')}-${time.toFixed(2).padStart(5, '0')}-${safeSceneId}.png`
}
