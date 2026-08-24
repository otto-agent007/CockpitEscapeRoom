// Evidence-capture spec for plans/0039-airbus-storm-usability.md.
// Skipped unless AIRBUS_USABILITY_EVIDENCE_DIR is set; writes the qualification
// instruction-box and storm Route-guidance screenshots at 1440/768/375.
import { test, expect, type Page } from '@playwright/test'
import { airbusCaptainFlow, dc9LegacyFlow, lockerFlow } from '../src/game/config'
import { createInitialAirbusWorkloadProgress } from '../src/game/airbusWorkload'
import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

const evidenceDirectory = process.env.AIRBUS_USABILITY_EVIDENCE_DIR

function completedJourneyBase(): GameState {
  const initial = createInitialState()
  return {
    ...initial,
    phase: 'airbus',
    dc9: {
      stage: 'complete',
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
    lockerCompleted: [...lockerFlow.memoryIds],
    lockerIntroCompleted: true,
    lockerHatRevealed: true,
    airbusCaptainModeUnlocked: true,
    completedPuzzles: ['dc9', 'locker'],
  }
}

function qualificationState(): GameState {
  return {
    ...completedJourneyBase(),
    statusMessage:
      'The family legacy continues in Airbus A320 Pop T Captain Mode. First up: a drag-and-drop cockpit check.',
  }
}

function stormState(checkpoint: 'stormEntry' | 'stormCore'): GameState {
  const base = completedJourneyBase()
  return {
    ...base,
    airbusAssignments: { ...airbusCaptainFlow.controlMatch },
    airbusSimulator: {
      familiarization: 'completed',
      cameraPhase: 'storm',
      location: 'stormLine',
      stormLine: {
        status: 'in_progress',
        checkpoint,
        attempts: { stormEntry: 0, stormCore: 0, clearAir: 0 },
        bestTraits: [],
      },
      engineOut: {
        status: 'locked',
        checkpoint: 'recognition',
        attempts: { recognition: 0, stabilization: 0, diversion: 0 },
        bestTraits: [],
      },
      workload: checkpoint === 'stormCore'
        ? {
            ...createInitialAirbusWorkloadProgress(),
            scanRange: 'mid' as const,
            completedTasks: ['stormScanRange' as const],
          }
        : createInitialAirbusWorkloadProgress(),
    },
    statusMessage: 'Airbus captain workload ready.',
  }
}

function engineOutState(checkpoint: 'stabilization' | 'diversion'): GameState {
  const base = stormState('stormCore')
  return {
    ...base,
    airbusSimulator: {
      ...base.airbusSimulator,
      location: 'engineOut',
      stormLine: {
        status: 'completed',
        checkpoint: 'clearAir',
        attempts: { stormEntry: 0, stormCore: 0, clearAir: 0 },
        bestTraits: ['weatherJudgment'],
      },
      engineOut: {
        status: 'in_progress',
        checkpoint,
        attempts: { recognition: 0, stabilization: 0, diversion: 0 },
        bestTraits: [],
      },
      workload: {
        ...createInitialAirbusWorkloadProgress(),
        scanRange: 'mid' as const,
        selectedWeatherSector: 'west' as const,
        completedTasks: [
          'stormScanRange' as const,
          'stormGapSelection' as const,
          ...(checkpoint === 'diversion' ? ['engineEventAcknowledgement' as const] : []),
        ],
      },
    },
  }
}

async function seed(page: Page, state: GameState) {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: STORAGE_KEY, value: state },
  )
  await page.reload()
}

const viewports = [
  { width: 1440, height: 900 },
  { width: 768, height: 900 },
  { width: 375, height: 812 },
]

test('capture qualification instruction box and storm guidance', async ({ page }) => {
  test.skip(!evidenceDirectory, 'AIRBUS_USABILITY_EVIDENCE_DIR is not set')
  test.setTimeout(180_000)
  await page.goto('/?skip3d=1')
  await page.emulateMedia({ reducedMotion: 'reduce' })

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)

    await seed(page, qualificationState())
    const instructionBox = page.locator('[data-airbus-instruction]')
    await expect(instructionBox).toContainText('dragging each label card')
    await page.screenshot({
      path: `${evidenceDirectory}/01-qualification-instruction-${viewport.width}.png`,
      fullPage: true,
    })

    await seed(page, stormState('stormEntry'))
    const guidance = page.locator('.storm-route-guidance')
    await expect(guidance).toHaveAttribute('data-storm-guidance-tone', 'action')
    await page.screenshot({
      path: `${evidenceDirectory}/02-storm-entry-guidance-${viewport.width}.png`,
      fullPage: true,
    })

    await seed(page, stormState('stormCore'))
    await expect(guidance).toHaveAttribute('data-storm-guidance-tone', 'hold')
    await page.screenshot({
      path: `${evidenceDirectory}/03-storm-core-corridor-${viewport.width}.png`,
      fullPage: true,
    })

    await seed(page, engineOutState('stabilization'))
    await expect(guidance).toBeVisible()
    await page.screenshot({
      path: `${evidenceDirectory}/04-engine-stabilization-balance-${viewport.width}.png`,
      fullPage: true,
    })

    await seed(page, engineOutState('diversion'))
    await expect(guidance).toBeVisible()
    await page.screenshot({
      path: `${evidenceDirectory}/05-engine-diversion-bank-${viewport.width}.png`,
      fullPage: true,
    })
  }
})
