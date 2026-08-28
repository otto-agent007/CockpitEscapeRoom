import type { Dc9ControlState } from './dc9Input'

export type Dc9DepartureCheckpoint =
  | 'rampStart'
  | 'taxiTurn'
  | 'holdShort'
  | 'runwayLineup'
  | 'initialClimb'
  | 'complete'

export type Dc9DepartureBeat =
  | 'rampRelease'
  | 'taxi'
  | 'holdShort'
  | 'lineup'
  | 'takeoffRoll'
  | 'rotation'
  | 'initialClimb'
  | 'complete'

export interface Dc9DepartureInput extends Dc9ControlState {
  brake: number
  lineupConfirmed: boolean
}

export interface Dc9DepartureProgress {
  checkpoint: Dc9DepartureCheckpoint
  completedBeats: Dc9DepartureBeat[]
  attempts: Partial<Record<Dc9DepartureBeat, number>>
  hintLevel: 0 | 1 | 2 | 3
  completed: boolean
}

export interface Dc9DepartureFrame {
  beat: Dc9DepartureBeat
  pathProgress: number
  lateralError: number
  headingError: number
  energy: number
  altitudeProgress: number
  pitch: number
  roll: number
  safeHold: boolean
  deviationSeconds: number
}

export interface Dc9DepartureGuidance {
  alignment: 'centered' | 'left' | 'right'
  energy: 'stopped' | 'rolling' | 'departure-thrust'
  intent: string
  correctiveText: string
}

export type Dc9DepartureEvent =
  | { type: 'checkpoint'; checkpoint: Dc9DepartureCheckpoint }
  | {
    type: 'mistake'
    beat: Dc9DepartureBeat
    reason: 'pathDeviation' | 'unsafeHold' | 'earlyRotation' | 'unstableClimb'
  }
  | { type: 'complete' }

export interface Dc9DepartureStep {
  frame: Dc9DepartureFrame
  event?: Dc9DepartureEvent
}

export const DC9_DEPARTURE_CHECKPOINTS = Object.freeze([
  'rampStart',
  'taxiTurn',
  'holdShort',
  'runwayLineup',
  'initialClimb',
  'complete',
] as const)

export const DC9_DEPARTURE_BEATS = Object.freeze([
  'rampRelease',
  'taxi',
  'holdShort',
  'lineup',
  'takeoffRoll',
  'rotation',
  'initialClimb',
  'complete',
] as const)

const RAMP_RELEASE_END = 0.12
const HOLD_SHORT_START = 0.42
const RUNWAY_LINEUP_START = 0.52
const ROTATION_CUE_START = 0.78
const INITIAL_CLIMB_START = 0.84
const TAXI_ENERGY_LIMIT = 0.28
const PATH_WARNING_ERROR = 0.32
const PATH_RESTORE_ERROR = 0.55
const PATH_RESTORE_SECONDS = 0.75
const ROTATION_PITCH_MIN = 0.35
const CLIMB_PITCH_ABS_MAX = 0.3
const CLIMB_ROLL_ABS_MAX = 0.28

const FIXED_STEP_SECONDS = 1 / 60
const MAX_DELTA_SECONDS = 0.1
const STOPPED_ENERGY = 0.02
const HOLD_SHORT_APPROACH = 0.01
const EPSILON = 1e-9

const COMPLETED_BEATS_AT_CHECKPOINT: Readonly<Record<Dc9DepartureCheckpoint, readonly Dc9DepartureBeat[]>> = {
  rampStart: [],
  taxiTurn: ['rampRelease'],
  holdShort: ['rampRelease', 'taxi'],
  runwayLineup: ['rampRelease', 'taxi', 'holdShort'],
  initialClimb: ['rampRelease', 'taxi', 'holdShort', 'lineup', 'takeoffRoll', 'rotation'],
  complete: [...DC9_DEPARTURE_BEATS],
}

function clampAxis(value: number): number {
  return Math.max(-1, Math.min(1, Number.isFinite(value) ? value : 0))
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
}

function clampNonNegative(value: number): number {
  return Math.max(0, Number.isFinite(value) ? value : 0)
}

function isCheckpoint(value: unknown): value is Dc9DepartureCheckpoint {
  return typeof value === 'string' && (DC9_DEPARTURE_CHECKPOINTS as readonly string[]).includes(value)
}

function isBeat(value: unknown): value is Dc9DepartureBeat {
  return typeof value === 'string' && (DC9_DEPARTURE_BEATS as readonly string[]).includes(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function checkpointForBeat(beat: Dc9DepartureBeat): Dc9DepartureCheckpoint {
  switch (beat) {
    case 'rampRelease': return 'rampStart'
    case 'taxi': return 'taxiTurn'
    case 'holdShort': return 'holdShort'
    case 'lineup':
    case 'takeoffRoll':
    case 'rotation': return 'runwayLineup'
    case 'initialClimb': return 'initialClimb'
    case 'complete': return 'complete'
  }
}

function checkpointIndex(checkpoint: Dc9DepartureCheckpoint): number {
  return DC9_DEPARTURE_CHECKPOINTS.indexOf(checkpoint)
}

function normalizeInput(input: Dc9DepartureInput): Dc9DepartureInput {
  return {
    pitch: clampAxis(input.pitch),
    roll: clampAxis(input.roll),
    rudder: clampAxis(input.rudder),
    thrust: clamp01(input.thrust),
    brake: clamp01(input.brake),
    lineupConfirmed: input.lineupConfirmed === true,
  }
}

function normalizeFrame(frame: Dc9DepartureFrame): Dc9DepartureFrame {
  if (!isBeat(frame.beat)) return canonicalDc9DepartureFrame('rampStart')
  return {
    beat: frame.beat,
    pathProgress: clamp01(frame.pathProgress),
    lateralError: clampAxis(frame.lateralError),
    headingError: clampAxis(frame.headingError),
    energy: clamp01(frame.energy),
    altitudeProgress: clamp01(frame.altitudeProgress),
    pitch: clampAxis(frame.pitch),
    roll: clampAxis(frame.roll),
    safeHold: frame.safeHold === true,
    deviationSeconds: clampNonNegative(frame.deviationSeconds),
  }
}

function frameFor(
  beat: Dc9DepartureBeat,
  pathProgress: number,
  energy: number,
  safeHold: boolean,
  altitudeProgress = 0,
): Dc9DepartureFrame {
  return {
    beat,
    pathProgress,
    lateralError: 0,
    headingError: 0,
    energy,
    altitudeProgress,
    pitch: 0,
    roll: 0,
    safeHold,
    deviationSeconds: 0,
  }
}

/** Return the stopped, transient frame for the latest durable departure checkpoint. */
export function canonicalDc9DepartureFrame(checkpoint: Dc9DepartureCheckpoint): Dc9DepartureFrame {
  switch (checkpoint) {
    case 'rampStart': return frameFor('rampRelease', 0, 0, true)
    case 'taxiTurn': return frameFor('taxi', RAMP_RELEASE_END, 0, false)
    case 'holdShort': return frameFor('holdShort', HOLD_SHORT_START, 0, true)
    case 'runwayLineup': return frameFor('lineup', RUNWAY_LINEUP_START, 0, true)
    case 'initialClimb': return frameFor('initialClimb', INITIAL_CLIMB_START, 0, false)
    case 'complete': return frameFor('complete', 1, 0.7, false, 1)
  }
}

export function createInitialDc9DepartureProgress(): Dc9DepartureProgress {
  return {
    checkpoint: 'rampStart',
    completedBeats: [],
    attempts: {},
    hintLevel: 0,
    completed: false,
  }
}

function hasExpectedCompletedBeats(value: unknown, checkpoint: Dc9DepartureCheckpoint): value is Dc9DepartureBeat[] {
  const expected = COMPLETED_BEATS_AT_CHECKPOINT[checkpoint]
  return Array.isArray(value)
    && value.length === expected.length
    && value.every((beat, index) => beat === expected[index])
}

function normalizeAttempts(value: unknown): Partial<Record<Dc9DepartureBeat, number>> | null {
  if (!isRecord(value)) return null
  const attempts: Partial<Record<Dc9DepartureBeat, number>> = {}
  for (const [beat, count] of Object.entries(value)) {
    if (!isBeat(beat) || typeof count !== 'number' || !Number.isInteger(count) || count < 0) return null
    attempts[beat] = count
  }
  return attempts
}

/** Fail closed to the earliest trustworthy state when persisted departure data is malformed. */
export function normalizeDc9DepartureProgress(value: unknown): Dc9DepartureProgress {
  if (!isRecord(value) || !isCheckpoint(value.checkpoint)) return createInitialDc9DepartureProgress()
  if (!hasExpectedCompletedBeats(value.completedBeats, value.checkpoint)) return createInitialDc9DepartureProgress()
  const attempts = normalizeAttempts(value.attempts)
  if (
    !attempts
    || typeof value.hintLevel !== 'number'
    || !Number.isInteger(value.hintLevel)
    || value.hintLevel < 0
    || value.hintLevel > 3
  ) {
    return createInitialDc9DepartureProgress()
  }
  if (typeof value.completed !== 'boolean' || value.completed !== (value.checkpoint === 'complete')) {
    return createInitialDc9DepartureProgress()
  }

  const highestAttempt = Math.max(0, ...Object.values(attempts))
  return {
    checkpoint: value.checkpoint,
    completedBeats: [...COMPLETED_BEATS_AT_CHECKPOINT[value.checkpoint]],
    attempts,
    hintLevel: Math.max(value.hintLevel, Math.min(3, highestAttempt)) as 0 | 1 | 2 | 3,
    completed: value.completed,
  }
}

function progressAt(checkpoint: Dc9DepartureCheckpoint, progress: Dc9DepartureProgress): Dc9DepartureProgress {
  return {
    ...progress,
    checkpoint,
    completedBeats: [...COMPLETED_BEATS_AT_CHECKPOINT[checkpoint]],
    completed: checkpoint === 'complete',
  }
}

/** Apply one durable event without retaining any transient frame-level state. */
export function advanceDc9DepartureProgress(
  progress: Dc9DepartureProgress,
  event: Dc9DepartureEvent,
): Dc9DepartureProgress {
  const current = normalizeDc9DepartureProgress(progress)
  if (event.type === 'mistake') return recordDc9DepartureMistake(current, event.beat)
  if (event.type === 'complete') return progressAt('complete', current)
  if (checkpointIndex(event.checkpoint) <= checkpointIndex(current.checkpoint)) return current
  return progressAt(event.checkpoint, current)
}

/** Increment only the active beat's retry history, retaining all earned departure beats. */
export function recordDc9DepartureMistake(
  progress: Dc9DepartureProgress,
  beat: Dc9DepartureBeat,
): Dc9DepartureProgress {
  const current = normalizeDc9DepartureProgress(progress)
  const attempt = (current.attempts[beat] ?? 0) + 1
  return {
    ...current,
    attempts: { ...current.attempts, [beat]: attempt },
    hintLevel: Math.max(current.hintLevel, Math.min(3, attempt)) as 0 | 1 | 2 | 3,
  }
}

function pathError(frame: Dc9DepartureFrame): number {
  return Math.max(Math.abs(frame.lateralError), Math.abs(frame.headingError))
}

function movingFrame(frame: Dc9DepartureFrame, input: Dc9DepartureInput, delta: number): Dc9DepartureFrame {
  const energy = clamp01(frame.energy + (input.thrust * 0.9 - input.brake * 1.8) * delta)
  const headingError = clampAxis(frame.headingError + (input.rudder * 0.65 - frame.headingError) * Math.min(1, delta * 5))
  const lateralError = clampAxis(frame.lateralError + input.rudder * energy * 0.45 * delta)
  const pathProgress = clamp01(frame.pathProgress + energy * 0.3 * delta)
  const provisional = {
    ...frame,
    pathProgress,
    lateralError,
    headingError,
    energy,
    pitch: input.pitch,
    roll: input.roll,
  }
  const deviationSeconds = pathError(provisional) > PATH_WARNING_ERROR
    ? frame.deviationSeconds + delta
    : Math.max(0, frame.deviationSeconds - delta * 2)
  return { ...provisional, deviationSeconds }
}

function mistake(frame: Dc9DepartureFrame, reason: Extract<Dc9DepartureEvent, { type: 'mistake' }>['reason']): Dc9DepartureStep {
  return {
    frame: canonicalDc9DepartureFrame(checkpointForBeat(frame.beat)),
    event: { type: 'mistake', beat: frame.beat, reason },
  }
}

function restoreForPathDeviation(frame: Dc9DepartureFrame): Dc9DepartureStep | null {
  if (pathError(frame) < PATH_RESTORE_ERROR || frame.deviationSeconds < PATH_RESTORE_SECONDS) return null
  return mistake(frame, 'pathDeviation')
}

function advanceFixedStep(frame: Dc9DepartureFrame, input: Dc9DepartureInput, delta: number): Dc9DepartureStep {
  if (frame.beat === 'complete') return { frame }
  const moving = movingFrame(frame, input, delta)

  if (frame.beat !== 'holdShort' && frame.beat !== 'initialClimb') {
    const deviation = restoreForPathDeviation(moving)
    if (deviation) return deviation
  }

  switch (frame.beat) {
    case 'rampRelease':
      if (moving.pathProgress >= RAMP_RELEASE_END) {
        return {
          frame: { ...moving, beat: 'taxi', pathProgress: RAMP_RELEASE_END, safeHold: false, deviationSeconds: 0 },
          event: { type: 'checkpoint', checkpoint: 'taxiTurn' },
        }
      }
      return { frame: { ...moving, safeHold: moving.energy <= STOPPED_ENERGY } }

    case 'taxi':
      if (
        moving.pathProgress >= HOLD_SHORT_START - HOLD_SHORT_APPROACH
        && input.thrust <= 0.05
        && input.brake > 0
        && moving.energy <= STOPPED_ENERGY
      ) {
        return {
          frame: canonicalDc9DepartureFrame('holdShort'),
          event: { type: 'checkpoint', checkpoint: 'holdShort' },
        }
      }
      if (
        moving.pathProgress >= HOLD_SHORT_START - HOLD_SHORT_APPROACH
        && moving.energy > TAXI_ENERGY_LIMIT
      ) {
        return mistake(frame, 'unsafeHold')
      }
      return {
        frame: {
          ...moving,
          pathProgress: Math.min(moving.pathProgress, HOLD_SHORT_START - EPSILON),
          safeHold: false,
        },
      }

    case 'holdShort': {
      const stopped = moving.energy <= STOPPED_ENERGY && input.thrust <= 0.05
      const safeHold = stopped && (frame.safeHold || input.brake > 0.5)
      if (safeHold && input.lineupConfirmed) {
        return {
          frame: canonicalDc9DepartureFrame('runwayLineup'),
          event: { type: 'checkpoint', checkpoint: 'runwayLineup' },
        }
      }
      return { frame: { ...moving, pathProgress: HOLD_SHORT_START, safeHold } }
    }

    case 'lineup':
      if (input.brake > 0) return { frame: { ...moving, pathProgress: RUNWAY_LINEUP_START, safeHold: true } }
      if (moving.energy > TAXI_ENERGY_LIMIT) {
        return { frame: { ...moving, beat: 'takeoffRoll', pathProgress: RUNWAY_LINEUP_START, safeHold: false } }
      }
      return { frame: { ...moving, pathProgress: RUNWAY_LINEUP_START, safeHold: false } }

    case 'takeoffRoll':
      if (moving.pitch >= ROTATION_PITCH_MIN && moving.pathProgress < ROTATION_CUE_START) {
        return mistake(frame, 'earlyRotation')
      }
      if (moving.pathProgress >= ROTATION_CUE_START) {
        return { frame: { ...moving, beat: 'rotation', pathProgress: ROTATION_CUE_START, safeHold: false } }
      }
      return { frame: { ...moving, safeHold: false } }

    case 'rotation':
      if (moving.pathProgress < ROTATION_CUE_START || moving.pitch < ROTATION_PITCH_MIN) {
        return mistake(frame, 'earlyRotation')
      }
      return {
        frame: {
          ...moving,
          beat: 'initialClimb',
          pathProgress: INITIAL_CLIMB_START,
          altitudeProgress: 0,
          safeHold: false,
          deviationSeconds: 0,
        },
        event: { type: 'checkpoint', checkpoint: 'initialClimb' },
      }

    case 'initialClimb':
      if (Math.abs(moving.pitch) > CLIMB_PITCH_ABS_MAX || Math.abs(moving.roll) > CLIMB_ROLL_ABS_MAX) {
        return mistake(frame, 'unstableClimb')
      }
      if (moving.altitudeProgress + (0.4 + moving.energy * 0.4) * delta >= 1) {
        return { frame: canonicalDc9DepartureFrame('complete'), event: { type: 'complete' } }
      }
      return {
        frame: {
          ...moving,
          altitudeProgress: clamp01(moving.altitudeProgress + (0.4 + moving.energy * 0.4) * delta),
          safeHold: false,
        },
      }

  }
}

/**
 * Advance the pure frame in fixed normalized steps. Invalid or negative time does
 * nothing; valid time is capped so a suspended browser frame cannot skip a beat.
 */
export function advanceDc9DepartureFrame(
  rawFrame: Dc9DepartureFrame,
  rawInput: Dc9DepartureInput,
  deltaSeconds: number,
): Dc9DepartureStep {
  const frame = normalizeFrame(rawFrame)
  const input = normalizeInput(rawInput)
  const delta = Number.isFinite(deltaSeconds) && deltaSeconds > 0
    ? Math.min(MAX_DELTA_SECONDS, deltaSeconds)
    : 0
  if (delta === 0 || frame.beat === 'complete') return { frame }

  const fixedSteps = Math.floor(delta / FIXED_STEP_SECONDS + EPSILON)
  let next: Dc9DepartureStep = { frame }
  for (let index = 0; index < fixedSteps; index += 1) {
    next = advanceFixedStep(next.frame, input, FIXED_STEP_SECONDS)
    if (next.event) return next
  }
  const remainder = delta - fixedSteps * FIXED_STEP_SECONDS
  if (remainder > EPSILON) next = advanceFixedStep(next.frame, input, remainder)
  return next
}

/** Derive player-facing, qualitative guidance without exposing operational values. */
export function dc9DepartureGuidance(
  frame: Dc9DepartureFrame,
  hintLevel: 0 | 1 | 2 | 3 = 0,
): Dc9DepartureGuidance {
  const normalized = normalizeFrame(frame)
  const alignment = normalized.lateralError < -0.08
    ? 'left'
    : normalized.lateralError > 0.08
      ? 'right'
      : 'centered'
  const energy = normalized.energy <= STOPPED_ENERGY
    ? 'stopped'
    : normalized.energy <= TAXI_ENERGY_LIMIT
      ? 'rolling'
      : 'departure-thrust'
  const correction = alignment === 'centered'
    ? 'Keep the highlighted path centered.'
    : alignment === 'left'
      ? 'You are left of path; ease back toward the centerline.'
      : 'You are right of path; ease back toward the centerline.'

  switch (normalized.beat) {
    case 'rampRelease':
      return { alignment, energy, intent: 'Ease forward along the lead-out path.', correctiveText: correction }
    case 'taxi':
      return { alignment, energy, intent: 'Follow the curved path toward the marked hold.', correctiveText: correction }
    case 'holdShort':
      return {
        alignment,
        energy,
        intent: normalized.safeHold ? 'Stopped safely. Confirm when ready to line up.' : 'Close the fictional thrust and hold the brake.',
        correctiveText: hintLevel >= 2 ? 'Settle fully at the marked hold before confirming.' : correction,
      }
    case 'lineup':
      return { alignment, energy, intent: 'Release the brake and settle on the centerline.', correctiveText: correction }
    case 'takeoffRoll':
      return { alignment, energy, intent: 'Keep the centerline steady as energy builds.', correctiveText: correction }
    case 'rotation':
      return { alignment, energy, intent: 'Ease the column aft now.', correctiveText: 'Use a smooth, broad aft input.' }
    case 'initialClimb':
      return { alignment, energy, intent: 'Relax toward neutral and keep the horizon steady.', correctiveText: 'Use small, calm corrections.' }
    case 'complete':
      return { alignment, energy, intent: 'Memphis legacy departure complete.', correctiveText: 'The memory returns to the Final Flight Log.' }
  }
}
