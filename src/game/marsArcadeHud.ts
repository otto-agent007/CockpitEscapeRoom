/**
 * Mars arcade cabinet — HUD layout, presentation state and banner text.
 *
 * Content and pure logic only, like `marsArcadeStage.ts`: no canvas, no DOM. The
 * numbers are stage rows and columns on the 320x224 screen, so the HUD lands on the
 * same pixel grid as the sprites and the backdrop.
 *
 * The retired HUD was three hairlines and browser-font text: a flat rectangle for
 * health, a one-pixel guard line, and no portraits, frames, round presentation or
 * damage feedback at all. Everything here exists to make a hit legible.
 */

import {
  MARS_ARCADE_TIMING,
  type MarsArcadeFighterState,
  type MarsArcadeState,
} from './marsArcade'
import { MARS_ARCADE_METER_MAX, marsArcadeFighter } from './marsArcadeFighters'
import { MARS_ARCADE_VIEW } from './marsArcadeStage'

/**
 * The HUD owns rows 2 to 27 and nothing below.
 *
 * Row 28 is where the backdrop's star layer starts, which is the agreement that
 * keeps a moon from being drawn behind a health bar. `fits inside the band the
 * backdrop reserves for it` holds both sides of that.
 */
export const MARS_ARCADE_HUD_BAND = { topRow: 2, bottomRow: 28 } as const

export const MARS_ARCADE_HUD = {
  /** Head crop taken from the 128x128 sprite cell, per fighter. */
  portrait: {
    width: 22,
    height: 24,
    x: 2,
    y: 2,
    /**
     * Source top row: contract baseline 119 minus the 104 px standing height, less
     * two rows of headroom. Source columns are measured per fighter because the
     * profiles are not the same width — the booster's headset runs well past the
     * pivot column and a shared crop cut his face off.
     */
    sourceY: 14,
    sourceX: { booster: 54, oracle: 49, captain: 52 } as Record<string, number>,
  },
  bars: {
    x: 28,
    width: 108,
    healthY: 2,
    healthHeight: 10,
    meterY: 13,
    meterHeight: 4,
    guardY: 18,
    guardHeight: 3,
  },
  /** The name field is one bar wide and one glyph tall; the text is right-aligned
   * into it on the right-hand side. Its height is the font's, checked against the
   * real glyphs in arcadePixelFont.test.ts. */
  name: { y: 21, height: 7, pixel: 1 },
  timer: { x: 140, width: 40, y: 2, height: 20, digitPixel: 2 },
  banner: { y: 70, pixel: 3, subtitleGap: 10, subtitlePixel: 2 },
} as const

export const MARS_ARCADE_HUD_COLOURS = {
  frame: '#1a1016',
  frameLight: '#7d5f63',
  trough: '#2a1a20',
  health: '#ff5f4d',
  healthLow: '#ffb03a',
  /** The lagging trail behind a fresh hit: the bar that shows what was just taken. */
  chip: '#fff0d0',
  meter: '#ffd23f',
  meterFull: '#fff6c8',
  guard: '#4a7bff',
  guardLow: '#ff4a6e',
  name: '#f4e6d2',
  timer: '#ffffff',
  timerLow: '#ff5f4d',
  banner: '#ffd23f',
  subtitle: '#f0dcc0',
} as const

/** Health fraction below which the bar turns amber. */
export const MARS_ARCADE_HUD_LOW_HEALTH = 0.25

export const MARS_ARCADE_CHIP = {
  /** Frames the trail sits still after a hit, so the damage is readable. */
  holdFrames: 24,
  /** Health points the trail gives up per frame once it starts draining. */
  drainPerFrame: 0.6,
} as const

export interface MarsArcadeChipBar {
  value: number
  hold: number
  lastHealth: number
}

export function createChipBar(health: number): MarsArcadeChipBar {
  return { value: health, hold: 0, lastHealth: health }
}

/**
 * Advance the lagging damage trail by one frame.
 *
 * A fresh drop restarts the hold, so consecutive hits in a combo each get their own
 * readable pause instead of the trail quietly sliding under the second one. The
 * trail can never sit below current health, and a round restart snaps it back up.
 */
export function advanceChipBar(bar: MarsArcadeChipBar, health: number): MarsArcadeChipBar {
  if (health > bar.lastHealth) return createChipBar(health)

  const struck = health < bar.lastHealth
  let hold = struck ? MARS_ARCADE_CHIP.holdFrames : bar.hold
  let value = Math.max(bar.value, health)
  if (hold > 0) hold -= 1
  else value = Math.max(health, value - MARS_ARCADE_CHIP.drainPerFrame)

  return { value, hold, lastHealth: health }
}

export function marsArcadeHealthColour(fraction: number): string {
  return fraction <= MARS_ARCADE_HUD_LOW_HEALTH
    ? MARS_ARCADE_HUD_COLOURS.healthLow
    : MARS_ARCADE_HUD_COLOURS.health
}

export function marsArcadeGuardColour(fighter: MarsArcadeFighterState): string {
  const content = marsArcadeFighter(fighter.id)
  return fighter.guard / content.guardMax <= 0.3
    ? MARS_ARCADE_HUD_COLOURS.guardLow
    : MARS_ARCADE_HUD_COLOURS.guard
}

export function marsArcadeMeterColour(fighter: MarsArcadeFighterState): string {
  return fighter.meter >= MARS_ARCADE_METER_MAX
    ? MARS_ARCADE_HUD_COLOURS.meterFull
    : MARS_ARCADE_HUD_COLOURS.meter
}

export interface MarsArcadeBanner {
  text: string
  subtitle: string | null
}

/** Frames the FIGHT! call stays up after the intro hands over. */
const FIGHT_CALL_FRAMES = 36
/** Frames of the intro spent on the round card before the FIGHT! call. */
const ROUND_CARD_FRAMES = 54

/**
 * The big type across the middle of the screen, or null when the fight should be
 * left alone. Pure, so the whole presentation sequence is testable without a canvas.
 */
export function marsArcadeBanner(state: MarsArcadeState): MarsArcadeBanner | null {
  if (state.phase === 'intro') {
    return state.frame < ROUND_CARD_FRAMES
      ? { text: 'ROUND 1', subtitle: null }
      : { text: 'FIGHT!', subtitle: null }
  }

  if (state.phase === 'fight') {
    const sinceStart = state.frame - MARS_ARCADE_TIMING.introFrames
    return sinceStart >= 0 && sinceStart < FIGHT_CALL_FRAMES
      ? { text: 'FIGHT!', subtitle: null }
      : null
  }

  if (state.winner === null) return { text: 'DRAW', subtitle: 'R TO RUN IT AGAIN' }

  const winner = marsArcadeFighter(state.fighters[state.winner].id).label
  return {
    text: state.phase === 'ko' ? 'K.O.' : 'TIME UP',
    subtitle: `${winner} WINS`,
  }
}

/** Every character the HUD can put on screen, for the font's coverage test. */
export function marsArcadeHudAlphabet(): string {
  const labels = (['booster', 'oracle', 'captain'] as const)
    .map((id) => marsArcadeFighter(id).label)
    .join('')
  return `${labels}ROUND 1FIGHT!K.O.TIME UPDRAWWINSR TO RUN IT AGAIN0123456789`
}

/** Boxes the HUD occupies, for the overlap and band tests. */
export interface MarsArcadeHudBox {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export function marsArcadeHudBoxes(): MarsArcadeHudBox[] {
  const { portrait, bars, timer } = MARS_ARCADE_HUD
  const boxes: MarsArcadeHudBox[] = [
    {
      id: 'timer',
      x: timer.x,
      y: timer.y,
      width: timer.width,
      height: timer.height,
    },
  ]
  for (const side of [0, 1] as const) {
    const suffix = side === 0 ? 'left' : 'right'
    const portraitX =
      side === 0 ? portrait.x : MARS_ARCADE_VIEW.width - portrait.x - portrait.width
    const barsX = side === 0 ? bars.x : MARS_ARCADE_VIEW.width - bars.x - bars.width
    boxes.push(
      { id: `portrait-${suffix}`, x: portraitX, y: portrait.y, width: portrait.width, height: portrait.height },
      { id: `health-${suffix}`, x: barsX, y: bars.healthY, width: bars.width, height: bars.healthHeight },
      { id: `meter-${suffix}`, x: barsX, y: bars.meterY, width: bars.width, height: bars.meterHeight },
      { id: `guard-${suffix}`, x: barsX, y: bars.guardY, width: bars.width, height: bars.guardHeight },
      { id: `name-${suffix}`, x: barsX, y: MARS_ARCADE_HUD.name.y, width: bars.width, height: MARS_ARCADE_HUD.name.height },
    )
  }
  return boxes
}
