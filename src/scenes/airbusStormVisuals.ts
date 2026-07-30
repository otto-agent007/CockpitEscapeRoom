const degreesToRadians = Math.PI / 180

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

export interface AirbusStormVisualPose {
  horizonRollRadians: number
  pitchOffsetMeters: number
  corridorProgress: number
}

export function deriveAirbusStormVisualPose({
  bankDegrees,
  pitchDegrees,
  lateralPosition,
}: {
  bankDegrees: number
  pitchDegrees: number
  lateralPosition: number
}): AirbusStormVisualPose {
  const visualBankDegrees = clamp(-bankDegrees * 2.6, -55, 55)
  return {
    horizonRollRadians: visualBankDegrees * degreesToRadians,
    pitchOffsetMeters: -Math.tan(pitchDegrees * degreesToRadians) * 55,
    corridorProgress: clamp(-lateralPosition / 0.7, 0, 1),
  }
}
