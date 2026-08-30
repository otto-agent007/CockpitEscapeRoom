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
  fixedStepRemainderSeconds: number
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
// Softened on owner request (2026-08-28): a wider corridor, a longer grace
// window, a strong-pull-only early-rotation mistake, a gentle-pull rotation,
// and roomier climb bands make the celebratory memory easier to finish while
// keeping every teaching beat.
const PATH_WARNING_ERROR = 0.4
const PATH_RESTORE_ERROR = 0.6
const PATH_RESTORE_SECONDS = 1.1
const INITIAL_CLIMB_INSTABILITY_SECONDS = 1.5
const EARLY_ROTATION_PITCH = 0.48
const ROTATION_PITCH_MIN = 0.25
const CLIMB_PITCH_ABS_MAX = 0.45
const CLIMB_ROLL_ABS_MAX = 0.4
// Brakeless energy model (owner request 2026-08-29): fictional energy chases the
// lever position, so closed levers always coast the memory to a calm stop — the
// lever is the whole interface. Spool-up is slower than coast-down so the
// takeoff roll reads as a build while a closed-lever stop never feels stuck.
const PATH_RATE = 0.24
const ENERGY_SPOOL_RATE = 0.32
const ENERGY_COAST_RATE = 0.55
const TAXI_ENERGY_CAP = 0.45
const CREEP_ENERGY = 0.16
const THRUST_IDLE = 0.05
const CLOSE_LEVERS_CUE = 0.3
const ROLL_SPEED_ALIVE = 0.6
const ROTATION_HOLD_SECONDS = 0.5
const ROTATION_LIFT_PROGRESS = 0.15
const CLIMB_RATE_BASE = 0.28
const CLIMB_RATE_ENERGY = 0.32

const FIXED_STEP_SECONDS = 1 / 60
const MAX_DELTA_SECONDS = 0.1
const STOPPED_ENERGY = 0.02
const HOLD_SHORT_APPROACH = 0.1
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
    fixedStepRemainderSeconds: Math.min(
      FIXED_STEP_SECONDS - EPSILON,
      clampNonNegative(frame.fixedStepRemainderSeconds),
    ),
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
    fixedStepRemainderSeconds: 0,
  }
}

/** Return the stopped, transient frame for the latest durable departure checkpoint. */
export function canonicalDc9DepartureFrame(checkpoint: Dc9DepartureCheckpoint): Dc9DepartureFrame {
  switch (checkpoint) {
    case 'rampStart': return frameFor('rampRelease', 0, 0, true)
    case 'taxiTurn': return frameFor('taxi', RAMP_RELEASE_END, 0, false)
    case 'holdShort': return frameFor('holdShort', HOLD_SHORT_START, 0, true)
    case 'runwayLineup': return frameFor('lineup', RUNWAY_LINEUP_START, 0, true)
    // The climb checkpoint keeps the nose-up lift the rotation earned. Every
    // checkpoint commit snaps the live frame to its canonical form, so without
    // this the world would drop back to the runway one frame after liftoff —
    // and a restore here would put the aircraft back on its wheels mid-climb.
    case 'initialClimb': return frameFor('initialClimb', INITIAL_CLIMB_START, 0, false, ROTATION_LIFT_PROGRESS)
    case 'complete': return frameFor('complete', 1, 0, false, 1)
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

/** Chase a target linearly; step-invariant because both cadences clamp at the target. */
function approachValue(current: number, target: number, rate: number, delta: number): number {
  const step = rate * delta
  const difference = target - current
  if (Math.abs(difference) <= step) return target
  return current + Math.sign(difference) * step
}

function movingFrame(
  frame: Dc9DepartureFrame,
  input: Dc9DepartureInput,
  delta: number,
  energyCap = 1,
): Dc9DepartureFrame {
  const energy = Math.min(energyCap, clamp01(approachValue(
    frame.energy,
    input.thrust,
    input.thrust > frame.energy ? ENERGY_SPOOL_RATE : ENERGY_COAST_RATE,
    delta,
  )))
  const headingError = clampAxis(frame.headingError + (input.rudder * 0.65 - frame.headingError) * Math.min(1, delta * 5))
  const lateralError = clampAxis(frame.lateralError + input.rudder * energy * 0.45 * delta)
  const pathProgress = clamp01(frame.pathProgress + energy * PATH_RATE * delta)
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
  // Ground movement before the runway stays at calm taxi speeds, so a
  // closed-lever coast always stops within the hold-short approach.
  const taxiing = frame.beat === 'rampRelease' || frame.beat === 'taxi' || frame.beat === 'holdShort'
  const moving = movingFrame(frame, input, delta, taxiing ? TAXI_ENERGY_CAP : 1)

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

    case 'taxi': {
      // Closing the levers is the entire stopping procedure. Pulling them
      // back below the fictional energy counts as stopping intent, so an
      // in-progress lever close near the line never reads as a violation.
      const decelerating = input.thrust <= THRUST_IDLE || input.thrust < moving.energy - 0.02
      if (moving.pathProgress >= HOLD_SHORT_START - HOLD_SHORT_APPROACH && decelerating) {
        if (moving.pathProgress < HOLD_SHORT_START) {
          // A short stop idles gently forward to the painted boundary, like a
          // parked-lever creep, so the settle always lands exactly at the hold.
          return {
            frame: {
              ...moving,
              energy: Math.max(moving.energy, CREEP_ENERGY),
              pathProgress: Math.min(
                clamp01(frame.pathProgress + Math.max(moving.energy, CREEP_ENERGY) * PATH_RATE * delta),
                HOLD_SHORT_START,
              ),
              safeHold: false,
            },
          }
        }
        if (moving.energy <= STOPPED_ENERGY) {
          return {
            frame: canonicalDc9DepartureFrame('holdShort'),
            event: { type: 'checkpoint', checkpoint: 'holdShort' },
          }
        }
        return {
          frame: {
            ...moving,
            pathProgress: HOLD_SHORT_START,
            safeHold: false,
          },
        }
      }
      // An open-lever crossing rewinds to the taxi checkpoint like every other
      // mistake. It must NOT hand out the hold-short frame: the durable
      // checkpoint would stay behind and silently reject every later
      // checkpoint, dead-ending the completion dispatch.
      if (moving.pathProgress >= HOLD_SHORT_START) {
        return mistake(frame, 'unsafeHold')
      }
      return {
        frame: {
          ...moving,
          pathProgress: Math.min(moving.pathProgress, HOLD_SHORT_START - EPSILON),
          safeHold: false,
        },
      }
    }

    case 'holdShort': {
      const safeHold = moving.energy <= STOPPED_ENERGY && input.thrust <= THRUST_IDLE
      if (safeHold && input.lineupConfirmed) {
        return {
          frame: canonicalDc9DepartureFrame('runwayLineup'),
          event: { type: 'checkpoint', checkpoint: 'runwayLineup' },
        }
      }
      return { frame: { ...moving, pathProgress: HOLD_SHORT_START, safeHold } }
    }

    case 'lineup':
      if (moving.energy > TAXI_ENERGY_LIMIT) {
        return { frame: { ...moving, beat: 'takeoffRoll', pathProgress: RUNWAY_LINEUP_START, safeHold: false } }
      }
      return {
        frame: {
          ...moving,
          pathProgress: RUNWAY_LINEUP_START,
          safeHold: moving.energy <= STOPPED_ENERGY,
        },
      }

    case 'takeoffRoll':
      // A closed-lever coast to a stop calmly returns to the lineup marker —
      // an abandoned roll is a quiet reset, never a recorded mistake.
      if (moving.energy <= STOPPED_ENERGY && input.thrust <= THRUST_IDLE) {
        return { frame: canonicalDc9DepartureFrame('runwayLineup') }
      }
      if (moving.pitch >= EARLY_ROTATION_PITCH && moving.pathProgress < ROTATION_CUE_START) {
        return mistake(frame, 'earlyRotation')
      }
      if (moving.pathProgress >= ROTATION_CUE_START) {
        return { frame: { ...moving, beat: 'rotation', pathProgress: ROTATION_CUE_START, safeHold: false } }
      }
      return { frame: { ...moving, safeHold: false } }

    case 'rotation': {
      // Rotation is a held, progressive pull: the nose rises over
      // ROTATION_HOLD_SECONDS while the roll continues to the climb marker.
      // altitudeProgress carries the lift (scaled to ROTATION_LIFT_PROGRESS)
      // so the world starts rising with the held column.
      if (moving.energy <= STOPPED_ENERGY && input.thrust <= THRUST_IDLE) {
        return { frame: canonicalDc9DepartureFrame('runwayLineup') }
      }
      const pulling = moving.pitch >= ROTATION_PITCH_MIN
      const holdProgress = clamp01(
        frame.altitudeProgress / ROTATION_LIFT_PROGRESS
          + (pulling ? delta : -2 * delta) / ROTATION_HOLD_SECONDS,
      )
      if (holdProgress >= 1) {
        return {
          frame: {
            ...moving,
            beat: 'initialClimb',
            pathProgress: INITIAL_CLIMB_START,
            altitudeProgress: ROTATION_LIFT_PROGRESS,
            safeHold: false,
            deviationSeconds: 0,
          },
          event: { type: 'checkpoint', checkpoint: 'initialClimb' },
        }
      }
      return {
        frame: {
          ...moving,
          pathProgress: Math.min(moving.pathProgress, INITIAL_CLIMB_START),
          altitudeProgress: holdProgress * ROTATION_LIFT_PROGRESS,
          safeHold: false,
        },
      }
    }

    case 'initialClimb': {
      if (Math.abs(moving.pitch) > CLIMB_PITCH_ABS_MAX || Math.abs(moving.roll) > CLIMB_ROLL_ABS_MAX) {
        const instabilitySeconds = frame.deviationSeconds + delta
        if (instabilitySeconds >= INITIAL_CLIMB_INSTABILITY_SECONDS) return mistake(frame, 'unstableClimb')
        return {
          frame: {
            ...moving,
            altitudeProgress: frame.altitudeProgress,
            deviationSeconds: instabilitySeconds,
            safeHold: false,
          },
        }
      }
      const instabilitySeconds = Math.max(0, frame.deviationSeconds - delta * 2)
      const climbRate = CLIMB_RATE_BASE + moving.energy * CLIMB_RATE_ENERGY
      if (moving.altitudeProgress + climbRate * delta >= 1) {
        return { frame: canonicalDc9DepartureFrame('complete'), event: { type: 'complete' } }
      }
      return {
        frame: {
          ...moving,
          altitudeProgress: clamp01(moving.altitudeProgress + climbRate * delta),
          safeHold: false,
          deviationSeconds: instabilitySeconds,
        },
      }
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

  const accumulatedDelta = frame.fixedStepRemainderSeconds + delta
  const fixedSteps = Math.floor(accumulatedDelta / FIXED_STEP_SECONDS + EPSILON)
  const remainder = Math.max(0, accumulatedDelta - fixedSteps * FIXED_STEP_SECONDS)
  let next: Dc9DepartureStep = { frame: { ...frame, fixedStepRemainderSeconds: 0 } }
  for (let index = 0; index < fixedSteps; index += 1) {
    next = advanceFixedStep(next.frame, input, FIXED_STEP_SECONDS)
    if (next.event) return next
  }
  return {
    ...next,
    frame: {
      ...next.frame,
      fixedStepRemainderSeconds: remainder > EPSILON ? remainder : 0,
    },
  }
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
      return { alignment, energy, intent: 'Ease the levers forward along the lead-out path.', correctiveText: correction }
    case 'taxi':
      return {
        alignment,
        energy,
        intent: normalized.pathProgress >= CLOSE_LEVERS_CUE
          ? 'Close the levers and coast to the marked hold.'
          : 'Follow the curved path toward the marked hold.',
        correctiveText: correction,
      }
    case 'holdShort':
      return {
        alignment,
        energy,
        intent: normalized.safeHold ? 'Stopped safely. Confirm when ready to line up.' : 'Close the fictional thrust and let it settle.',
        correctiveText: hintLevel >= 2 ? 'Settle fully at the marked hold before confirming.' : correction,
      }
    case 'lineup':
      return { alignment, energy, intent: 'Advance the levers to departure thrust when ready.', correctiveText: correction }
    case 'takeoffRoll':
      return {
        alignment,
        energy,
        intent: normalized.energy >= ROLL_SPEED_ALIVE
          ? 'Speed is alive. Hold the centerline — rotation is coming.'
          : 'Rolling. Let the energy build down the runway.',
        correctiveText: correction,
      }
    case 'rotation':
      return { alignment, energy, intent: 'Rotate — ease the column aft and hold it.', correctiveText: 'Keep a smooth, steady aft hold.' }
    case 'initialClimb':
      return { alignment, energy, intent: 'Relax toward neutral and keep the horizon steady.', correctiveText: 'Use small, calm corrections.' }
    case 'complete':
      return { alignment, energy, intent: 'Memphis legacy departure complete.', correctiveText: 'The Home Operations Log is ready.' }
  }
}
