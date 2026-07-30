export interface AirbusEngineOutVisualPose {
  horizonRollRadians: number
  pitchOffsetMeters: number
  headingDriftRadians: number
  directionalCue: number
  safeReturnProgress: number
  leftEnginePower: number
  rightEnginePower: number
}

export interface AirbusEngineOutVisualState {
  pitchDegrees: number
  bankDegrees: number
  headingErrorDegrees: number
  directionalError: number
  corridorProgress: number
  leftEnginePower: number
  rightEnginePower: number
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

export function deriveAirbusEngineOutVisualPose(
  state: AirbusEngineOutVisualState,
  reducedMotion: boolean,
): AirbusEngineOutVisualPose {
  const motionScale = reducedMotion ? 0.35 : 1
  return {
    horizonRollRadians: clamp(state.bankDegrees * 1.2, -45, 45) * Math.PI / 180 * motionScale,
    pitchOffsetMeters: clamp(state.pitchDegrees * 0.012, -0.22, 0.22) * motionScale,
    headingDriftRadians: clamp(state.headingErrorDegrees * 0.9, -18, 18) * Math.PI / 180 * motionScale,
    directionalCue: clamp(state.directionalError, -1, 1),
    safeReturnProgress: clamp(state.corridorProgress, 0, 1),
    leftEnginePower: clamp(state.leftEnginePower, 0, 1),
    rightEnginePower: clamp(state.rightEnginePower, 0, 1),
  }
}
