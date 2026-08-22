import { expect, test, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'

import { createInitialState, type GameState } from '../src/game/state'
import { STORAGE_KEY } from '../src/game/storage'

const evidenceDirectory = 'preview-renders/model-y-reward'

// Budget for assertions that must survive a viewport change under CI load.
const expectResize = expect.configure({ timeout: 30_000 })

async function captureEvidence(page: Page, name: string) {
  if (process.env.CAPTURE_REWARD_EVIDENCE !== '1') return
  mkdirSync(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: `${evidenceDirectory}/${name}.png`, fullPage: true })
}

function rewardState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(),
    phase: 'reward',
    completedPuzzles: ['dc9', 'locker', 'airbus'],
    rewardUnlocked: true,
    statusMessage: 'Ground transport upgrade authorized.',
    ...overrides,
  }
}

/**
 * Records what the reveal looked like at every pose or stage change, from the
 * first frame the canvas exists.
 *
 * The cinematic advances on wall time, so sampling these attributes whenever the
 * test happens to look asserts how fast the machine is. On a CI runner the clip
 * had already reached 10.955s and the pose had left `stowed` for `deployed`, so
 * the test failed for being slow rather than for being wrong — reproduced
 * locally at 20x CPU throttling, where the pose leaves `stowed` at clip time
 * 9.7s. Reading the sequence back tests the actual contract, that the reveal
 * begins stowed, at any machine speed.
 */
type RewardSample = { pose: string, stage: string | null, clip: number }

async function recordRewardPoses(page: Page) {
  await page.addInitScript(() => {
    const samples: { pose: string, stage: string | null, clip: number }[] = []
    Object.defineProperty(window, '__rewardSamples', { configurable: true, get: () => samples })
    Object.defineProperty(window, '__resetRewardSamples', {
      configurable: true,
      get: () => () => { samples.length = 0 },
    })
    const record = () => {
      // Query by the attribute, not by tag: another canvas can be in the DOM
      // first, and `querySelector('canvas')` then returns one that never
      // carries a pose, so nothing is ever recorded.
      const canvas = document.querySelector('canvas[data-reward-pose]')
      const pose = canvas?.getAttribute('data-reward-pose')
      if (!pose) return
      const stage = document.querySelector('[data-reward-stage]')?.getAttribute('data-reward-stage') ?? null
      const previous = samples[samples.length - 1]
      if (previous && previous.pose === pose && previous.stage === stage) return
      samples.push({ pose, stage, clip: Number(canvas?.getAttribute('data-reward-clip-time') ?? Number.NaN) })
    }
    // Init scripts run before the document exists, so observing
    // documentElement here throws and the recorder is silently never
    // installed. Wait for a root to attach to.
    const install = () => {
      if (!document.documentElement) {
        setTimeout(install, 0)
        return
      }
      new MutationObserver(record).observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['data-reward-pose', 'data-reward-stage'],
      })
      record()
    }
    install()
  })
}

async function observedSamples(page: Page): Promise<RewardSample[]> {
  return page.evaluate(() => (window as unknown as { __rewardSamples: RewardSample[] }).__rewardSamples ?? [])
}

async function observedPoses(page: Page): Promise<string[]> {
  return (await observedSamples(page)).map((sample) => sample.pose)
}

async function resetRewardSamples(page: Page) {
  await page.evaluate(() => (window as unknown as { __resetRewardSamples: () => void }).__resetRewardSamples?.())
}

async function seed(page: Page, state: GameState) {
  await page.evaluate(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value))
  }, { key: STORAGE_KEY, value: state })
  await page.reload()
}

test('protects the Model Y request until the reward phase', async ({ page }) => {
  let rewardRequests = 0
  page.on('request', (request) => {
    if (request.url().includes('/models/model-y-reward.glb')) rewardRequests += 1
  })

  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible()
  expect(rewardRequests).toBe(0)

  await seed(page, rewardState())
  await expect.poll(() => rewardRequests).toBe(1)
  const rewardCanvas = page.locator('canvas[data-reward-model-state="ready"]')
  await expect(rewardCanvas).toBeVisible({ timeout: 15_000 })
  await expect(rewardCanvas).toHaveAttribute('data-reward-pose', 'stowed')
})

test('plays the authored reward and provides Skip and Replay', async ({ page }) => {
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await recordRewardPoses(page)
  await page.goto('/')
  await seed(page, rewardState())

  // `Skip cinematic` is rendered only while `stage !== 'complete'`, so it exists
  // for one 11.5s clip and is then replaced by Replay. Wait for the BUTTON, not
  // for the canvas followed by a run of polls: on CI those polls spent the
  // window and the button was already gone by the time the test looked for it
  // (three retries, same failure). Everything that is true regardless of stage
  // is asserted after the interaction instead of before it.
  const skipButton = page.getByRole('button', { name: 'Skip cinematic' })
  await expect(skipButton).toBeVisible({ timeout: 60_000 })
  await page.keyboard.press('Tab')
  await expect(skipButton).toBeFocused()
  if (process.env.CAPTURE_REWARD_EVIDENCE === '1') {
    // Only spend the window settling the reveal when a screenshot is actually
    // being taken; captureEvidence is a no-op otherwise.
    await page.waitForTimeout(1_250)
    await captureEvidence(page, '1440-static-reveal')
  }
  await page.keyboard.press('Enter')

  await expect(page.locator('canvas[data-reward-model-state="ready"]')).toBeVisible({ timeout: 15_000 })
  await expect.poll(
    async () => (await page.locator('canvas').boundingBox())?.width,
    { timeout: 15_000 },
  ).toBe(1440)
  await expect(page.locator('canvas')).toHaveAttribute('data-reward-camera', 'game')
  // The reveal must BEGIN stowed. Asserting the attribute here would instead
  // assert how fast this machine is — see recordRewardPoses.
  await expect.poll(async () => (await observedPoses(page))[0], { timeout: 15_000 }).toBe('stowed')

  await expect(page.locator('[data-reward-stage="complete"]')).toBeVisible()
  await expect(page.locator('canvas')).toHaveAttribute('data-reward-clip-time', '11.500')
  await expect(page.locator('canvas')).toHaveAttribute('data-reward-pose', 'deployed')
  await expect(page.getByText('Ground Transport Upgrade Authorized', { exact: true })).toBeVisible()
  await expect(page.getByText('The red Tesla Model Y is unlocked.', { exact: true })).toBeVisible()
  await expect(page.getByText(/From the baseball field to the captain’s seat/)).toBeVisible()
  await expect(page.getByText(/Your crew loves you/)).toBeVisible()
  await expect(page.getByText(/mars/i)).toHaveCount(0)
  await page.waitForTimeout(300)
  await captureEvidence(page, '1440-flight-mode-final')

  for (const viewport of [
    { width: 768, height: 900 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport)
    // A resize has to reach React, re-render the scene and swap in the narrow
    // still. Under load that is slower than the 5s default — same assertions,
    // just given time to be answered rather than answered by a fast machine.
    await expectResize(page.locator('canvas')).toHaveAttribute('data-reward-camera', 'narrow')
    await expectResize(page.locator('img.reward-narrow-presentation')).toBeVisible()
    await expectResize(page.locator('img.reward-narrow-presentation')).toHaveAttribute(
      'src',
      /model-y-reward-narrow-final\.png$/,
    )
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    await captureEvidence(page, `${viewport.width}-flight-mode-final`)
  }

  await page.setViewportSize({ width: 1440, height: 900 })
  await resetRewardSamples(page)
  await page.getByRole('button', { name: 'Replay Flight Mode' }).press('Enter')
  // Skip comes back for the whole replay, so this one can be asserted live.
  await expect(page.getByRole('button', { name: 'Skip cinematic' })).toBeVisible()
  await expect(page.locator('[data-reward-stage="complete"]')).toBeVisible({ timeout: 30_000 })
  // The replay's opening state is read back from the recorder rather than
  // sampled live: `clip < 5`, `stage !== complete` and `pose stowed` are true
  // only for the first seconds of an 11.5s clip, which is the same window that
  // broke the first half of this test. Same assertions, taken when they are
  // supposed to hold instead of whenever the runner got there.
  const replaySamples = await observedSamples(page)
  // Require the three facts together at one real moment, rather than sampling
  // them one at a time while the clip runs. Note the stage attribute lands a
  // mutation batch before `data-reward-clip-time` catches up, so the first
  // post-complete sample still carries the old 11.5 — the restart shows up on
  // the next one (measured: 11.5 -> 0.837 -> 3.42).
  const restarted = replaySamples.some(
    (sample) => sample.pose === 'stowed' && sample.stage !== 'complete' && sample.clip < 5,
  )
  expect(restarted, `replay never restarted from the top: ${JSON.stringify(replaySamples)}`).toBe(true)
  await expect(page.locator('canvas')).toHaveAttribute('data-reward-clip-time', '11.500')
  await expect(page.locator('canvas')).toHaveAttribute('data-reward-pose', 'deployed')
})

test('reduced motion starts at the exact final pose and survives reload', async ({ page }) => {
  test.setTimeout(45_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await seed(page, rewardState())

  await expect(page.locator('canvas[data-reward-model-state="ready"]')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('[data-reward-stage="complete"]')).toBeVisible()
  await expect(page.locator('canvas')).toHaveAttribute('data-reward-clip-time', '11.500')
  await expect(page.getByText(/Reduced motion is on/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Skip cinematic' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Replay Flight Mode' })).toHaveCount(0)

  await page.reload()
  await expect(page.locator('canvas[data-reward-model-state="ready"]')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('[data-reward-stage="complete"]')).toBeVisible()
})

test('failed reward loading preserves the tribute and offers retry or accessible fallback', async ({ page }) => {
  let requests = 0
  await page.route('**/models/model-y-reward.glb*', (route) => {
    requests += 1
    return route.fulfill({ status: 503, body: 'offline' })
  })
  await page.goto('/')
  await seed(page, rewardState())

  // The tribute alert renders only once the loader gives up on the GLB, measured
  // at ~6s under CPU throttling against the 5s default.
  await expect(page.getByRole('alert')).toContainText('Your completed journey is safe.', {
    timeout: 30_000,
  })
  await expect(page.getByText(/Your crew loves you/)).toBeVisible()
  await page.getByRole('button', { name: 'Retry 3D' }).click()
  await expect.poll(() => requests).toBe(2)
  await page.getByRole('button', { name: 'Continue with accessible reward' }).click()
  await expect(page.locator('[data-reward-stage="complete"]')).toBeVisible()
  await expect(page.getByLabel('Accessible Model Y reward')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Retry 3D' })).toHaveCount(0)
})

test('accessible reward and legacy Mars saves return to the protected hangar', async ({ page }) => {
  let rewardRequests = 0
  page.on('request', (request) => {
    if (request.url().includes('/models/model-y-reward.glb')) rewardRequests += 1
  })
  await page.goto('/?skip3d=1')
  await seed(page, rewardState({
    phase: 'mars',
    marsUnlocked: true,
  }))

  await expect(page.locator('[data-reward-stage="complete"]')).toBeVisible()
  await expect(page.getByText('Ground Transport Upgrade Authorized', { exact: true })).toBeVisible()
  await expect(page.getByText(/mars/i)).toHaveCount(0)
  expect(rewardRequests).toBe(0)
})

test('accessible reward has no horizontal overflow at owner-review widths', async ({ page }) => {
  await page.goto('/?skip3d=1')
  await seed(page, rewardState())

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 768, height: 900 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport)
    await expect(page.locator('[data-reward-stage="complete"]')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    await captureEvidence(page, `${viewport.width}-accessible-final`)
  }
})
