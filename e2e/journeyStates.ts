/**
 * Saved-progress states for each chapter of the journey, shared by the e2e specs.
 *
 * Moved out of smoke.spec.ts unchanged so the review-evidence and accessibility
 * specs seed exactly the states the smoke suite already proves are valid.
 */
import { airbusCaptainFlow, dc9LegacyFlow, lockerFlow } from '../src/game/config'
import { createInitialState, type GameState } from '../src/game/state'
import { DC9_CONTROL_CHECK_ITEM_IDS } from '../src/game/dc9ControlCheck'
import { DC9_INSTRUMENT_SCAN_ORDER } from '../src/game/dc9InstrumentScan'

export function createLockerState(): GameState {
  return {
    ...createInitialState(),
    phase: 'locker',
    dc9: {
      stage: 'complete',
      controlCheck: [...DC9_CONTROL_CHECK_ITEM_IDS],
      instrumentScan: { identified: [...DC9_INSTRUMENT_SCAN_ORDER], attempts: 0 },
      departure: {
        checkpoint: 'complete',
        completedBeats: ['rampRelease', 'taxi', 'holdShort', 'lineup', 'takeoffRoll', 'rotation', 'initialClimb', 'complete'],
        attempts: {},
        hintLevel: 0,
        completed: true,
      },
      routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
      routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
      routeAttempts: 0,
      homePage: dc9LegacyFlow.homeOperationsPages.length - 1,
      homeOperationsCompleted: true,
      secureSequence: [...dc9LegacyFlow.secureSequence],
      secureAttempts: 0,
      keyRevealed: true,
      keyClaimed: true,
    },
    completedPuzzles: ['dc9'],
    lockerIntroCompleted: true,
    statusMessage: 'The Captain’s Key opened the locker.',
  }
}

export function createDc9State(): GameState {
  return {
    ...createInitialState(),
    phase: 'dc9',
    statusMessage: 'The parked DC-9 is ready. Walk every right-seat control to its stops.',
  }
}

const COMPLETED_DC9_DEPARTURE = {
  checkpoint: 'complete',
  completedBeats: ['rampRelease', 'taxi', 'holdShort', 'lineup', 'takeoffRoll', 'rotation', 'initialClimb', 'complete'],
  attempts: {},
  hintLevel: 0,
  completed: true,
} as const

/** The chapter as it stands once the opening flight-control sweep is complete. */
export function createDc9InstrumentScanState(): GameState {
  const state = createDc9State()
  return {
    ...state,
    dc9: { ...state.dc9, stage: 'instrumentScan', controlCheck: [...DC9_CONTROL_CHECK_ITEM_IDS] },
  }
}

/**
 * The Legacy Route Record is the chapter's last puzzle since the 2026-08-30 swap, so
 * reaching it means the scan, the Memphis departure and Home Operations are all behind it.
 * `intro` is the beat where the route card is on the pedestal but not yet opened.
 */
export function createDc9RouteRecordState(): GameState {
  const state = createDc9State()
  return {
    ...state,
    dc9: {
      ...state.dc9,
      stage: 'intro',
      controlCheck: [...DC9_CONTROL_CHECK_ITEM_IDS],
      instrumentScan: { identified: [...DC9_INSTRUMENT_SCAN_ORDER], attempts: 0 },
      departure: { ...COMPLETED_DC9_DEPARTURE, completedBeats: [...COMPLETED_DC9_DEPARTURE.completedBeats] },
      homePage: dc9LegacyFlow.homeOperationsPages.length - 1,
      homeOperationsCompleted: true,
    },
  }
}

export function createDc9QualificationState(): GameState {
  return {
    ...createDc9State(),
    dc9: {
      stage: 'qualification',
      controlCheck: [...DC9_CONTROL_CHECK_ITEM_IDS],
      instrumentScan: { identified: [...DC9_INSTRUMENT_SCAN_ORDER], attempts: 0 },
      departure: {
        checkpoint: 'complete',
        completedBeats: ['rampRelease', 'taxi', 'holdShort', 'lineup', 'takeoffRoll', 'rotation', 'initialClimb', 'complete'],
        attempts: {},
        hintLevel: 0,
        completed: true,
      },
      routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
      routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
      routeAttempts: 0,
      homePage: dc9LegacyFlow.homeOperationsPages.length - 1,
      homeOperationsCompleted: true,
      secureSequence: [...dc9LegacyFlow.secureSequence],
      secureAttempts: 0,
      keyRevealed: false,
      keyClaimed: false,
    },
    statusMessage: 'Aircraft secured. Complete the Airline Transport Pilot milestone to close the Final Flight Log.',
  }
}

export function createAirbusState(): GameState {
  return {
    ...createLockerState(),
    phase: 'airbus',
    cockpitOrientationSeen: { dc9: true, airbus: true },
    lockerCompleted: [...lockerFlow.memoryIds],
    lockerHatRevealed: true,
    airbusCaptainModeUnlocked: true,
    completedPuzzles: ['dc9', 'locker'],
    statusMessage: 'Airbus Pop T Captain experience ready.',
  }
}

export function createCompletedAirbusState(): GameState {
  const state = createAirbusState()
  return {
    ...state,
    airbusAssignments: { ...airbusCaptainFlow.controlMatch },
    airbusSimulator: {
      ...state.airbusSimulator,
      familiarization: 'completed',
      cameraPhase: 'qualified',
      location: 'hub',
      stormLine: {
        status: 'completed',
        checkpoint: 'clearAir',
        attempts: { stormEntry: 0, stormCore: 0, clearAir: 0 },
        bestTraits: ['calmControl', 'weatherJudgment', 'energyManagement'],
      },
      engineOut: {
        status: 'completed',
        checkpoint: 'diversion',
        attempts: { recognition: 0, stabilization: 0, diversion: 0 },
        bestTraits: ['directionalControl', 'energyDiscipline', 'calmDiversion'],
      },
      workload: {
        scanRange: 'mid',
        selectedWeatherSector: 'west',
        selectedSafeReturnSide: 'right',
        completedTasks: [
          'stormScanRange',
          'stormGapSelection',
          'engineEventAcknowledgement',
          'engineSafeReturnSelection',
        ],
        attempts: {
          stormScanRange: 0,
          stormGapSelection: 0,
          engineEventAcknowledgement: 0,
          engineSafeReturnSelection: 0,
        },
      },
    },
    completedPuzzles: ['dc9', 'locker', 'airbus'],
    statusMessage: 'POP T CAPTAIN MODE COMPLETE. Engine-Out Handling complete.',
  }
}
