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
  /**
   * Every box below is FRAME-INCLUSIVE: the 1 px border is part of the box, so the
   * band and overlap tests measure what is actually drawn. The renderer insets by
   * `frame` to reach the trough.
   */
  frame: 1,
  portrait: {
    x: 2,
    y: 2,
    width: 24,
    height: 26,
    /**
     * Source top row: contract baseline 119 minus the 104 px standing height, less
     * two rows of headroom. Source columns are measured per fighter because the
     * profiles are not the same width — the booster's headset runs well past the
     * pivot column and a shared crop cut his face off.
     */
    sourceY: 14,
    sourceWidth: 22,
    sourceHeight: 24,
    sourceX: { booster: 54, oracle: 49, captain: 52 } as Record<string, number>,
  },
  /**
   * Health and guard share one frame, because they are both what is keeping this
   * fighter standing. As three separately framed strips they merged into one muddy
   * band and the guard read as a stray blue line.
   */
  vitals: {
    x: 28,
    y: 2,
    width: 110,
    height: 15,
    healthHeight: 9,
    dividerHeight: 1,
    guardHeight: 3,
  },
  /**
   * The inner end of the vitals bar is cut on a slant, so the pair leans into the
   * centre of the screen. Square on both ends is the difference between a cabinet
   * HUD and a progress bar.
   */
  skew: 5,
  /** Second row: the name plate outboard, next to the portrait; the meter inboard. */
  namePlate: { x: 28, y: 19, width: 72, height: 9 },
  /**
   * 36 wide is not arbitrary: it leaves 34 inside the frame, which is exactly five
   * 6 px chunks and four 1 px gaps. Change the segment count and this has to move.
   */
  meter: { x: 102, y: 19, width: 36, height: 9 },
  timer: { x: 140, y: 2, width: 40, height: 20, digitPixel: 2 },
  /**
   * The round card sits between the HUD band and the fighters' heads, never across
   * them. Row 34 puts the title at rows 34-54 and the winner line at 61-74, with a
   * standing fighter's head starting at row 84. The first version was centred at
   * row 70 and covered them, which the peer session had already corrected on its
   * own banner before this landed.
   */
  banner: { y: 34, pixel: 3, subtitleGap: 6, subtitlePixel: 2 },
} as const

/** How many chunks the super meter is divided into. */
export const MARS_ARCADE_METER_SEGMENTS = 5

/**
 * Fill fraction of each meter chunk, outermost first.
 *
 * Five chunks, so one full chunk is exactly the 20 the cheapest special costs — the
 * oracle's text bubble. The bar then answers "can I afford it yet" at a glance,
 * which a smooth bar cannot. Four chunks was the first guess and the test caught
 * it: that would have put the cheapest special at four fifths of a chunk.
 */
export function marsArcadeMeterSegments(meter: number): number[] {
  const step = MARS_ARCADE_METER_MAX / MARS_ARCADE_METER_SEGMENTS
  return Array.from({ length: MARS_ARCADE_METER_SEGMENTS }, (_, index) =>
    Math.max(0, Math.min(1, (meter - index * step) / step)),
  )
}

export const MARS_ARCADE_HUD_COLOURS = {
  frame: '#1a1016',
  /**
   * The lit top row on every panel. It has to be clearly lighter than `frame` or
   * the plates read as one dark smear under the health bar, which is exactly what
   * the first pass did.
   */
  frameLight: '#b08a80',
  trough: '#2a1a20',
  plate: '#31202c',
  /** Each fill is two tones plus a shadow line, so a bar has a surface, not a slab. */
  health: { light: '#ff8468', base: '#e04a38', shade: '#8f2a20' },
  healthLow: { light: '#ffc65a', base: '#e08a20', shade: '#8f5410' },
  /** The lagging trail behind a fresh hit: the bar that shows what was just taken. */
  chip: '#fff0d0',
  meter: { light: '#ffe77a', base: '#f0b81f', shade: '#946c08' },
  meterFull: { light: '#fffbe4', base: '#ffd95e', shade: '#b08a18' },
  meterEmpty: '#4a3242',
  guard: { light: '#7fa4ff', base: '#4a7bff', shade: '#243f8f' },
  guardLow: { light: '#ff8098', base: '#ff4a6e', shade: '#8f2038' },
  name: '#f4e6d2',
  timer: '#ffffff',
  timerLow: '#ff5f4d',
  banner: '#ffd23f',
  subtitle: '#f0dcc0',
} as const

/** A fill is a lit tone, a body tone and the shadow line under the lit part. */
export interface MarsArcadeFill {
  light: string
  base: string
  shade: string
}

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

export function marsArcadeHealthColour(fraction: number): MarsArcadeFill {
  return fraction <= MARS_ARCADE_HUD_LOW_HEALTH
    ? MARS_ARCADE_HUD_COLOURS.healthLow
    : MARS_ARCADE_HUD_COLOURS.health
}

export function marsArcadeGuardColour(fighter: MarsArcadeFighterState): MarsArcadeFill {
  const content = marsArcadeFighter(fighter.id)
  return fighter.guard / content.guardMax <= 0.3
    ? MARS_ARCADE_HUD_COLOURS.guardLow
    : MARS_ARCADE_HUD_COLOURS.guard
}

export function marsArcadeMeterColour(fighter: MarsArcadeFighterState): MarsArcadeFill {
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
  const { portrait, vitals, namePlate, meter, timer } = MARS_ARCADE_HUD
  const boxes: MarsArcadeHudBox[] = [
    { id: 'timer', x: timer.x, y: timer.y, width: timer.width, height: timer.height },
  ]
  for (const side of [0, 1] as const) {
    const suffix = side === 0 ? 'left' : 'right'
    for (const [id, source] of [
      ['portrait', portrait],
      ['vitals', vitals],
      ['name', namePlate],
      ['meter', meter],
    ] as const) {
      const x = side === 0 ? source.x : MARS_ARCADE_VIEW.width - source.x - source.width
      boxes.push({
        id: `${id}-${suffix}`,
        x,
        y: source.y,
        width: source.width,
        height: source.height,
      })
    }
  }
  return boxes
}
