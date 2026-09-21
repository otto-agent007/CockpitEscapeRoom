import { describe, expect, it } from 'vitest'
import { MARS_ARCADE_TIMING, createMarsArcadeRound, type MarsArcadeState } from './marsArcade'
import { MARS_ARCADE_FIGHTERS } from './marsArcadeFighters'
import {
  MARS_ARCADE_CHIP,
  MARS_ARCADE_HUD,
  MARS_ARCADE_HUD_BAND,
  MARS_ARCADE_METER_SEGMENTS,
  advanceChipBar,
  createChipBar,
  marsArcadeBanner,
  marsArcadeHudBoxes,
  marsArcadeMeterSegments,
} from './marsArcadeHud'
import { MARS_ARCADE_VIEW } from './marsArcadeStage'

function phased(phase: MarsArcadeState['phase'], frame: number, winner: 0 | 1 | null = null) {
  const state = createMarsArcadeRound('booster', 'oracle')
  return { ...state, phase, frame, winner }
}

describe('mars arcade hud layout', () => {
  it('fits inside the band the backdrop reserves for it', () => {
    for (const box of marsArcadeHudBoxes()) {
      expect(box.y, `${box.id} starts above the band`).toBeGreaterThanOrEqual(
        MARS_ARCADE_HUD_BAND.topRow,
      )
      expect(box.y + box.height, `${box.id} runs past the band`).toBeLessThanOrEqual(
        MARS_ARCADE_HUD_BAND.bottomRow,
      )
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(MARS_ARCADE_VIEW.width)
    }
  })

  it('never lets two elements overlap', () => {
    const boxes = marsArcadeHudBoxes()
    for (let a = 0; a < boxes.length; a += 1) {
      for (let b = a + 1; b < boxes.length; b += 1) {
        const one = boxes[a]
        const other = boxes[b]
        if (!one || !other) continue
        const apart =
          one.x + one.width <= other.x ||
          other.x + other.width <= one.x ||
          one.y + one.height <= other.y ||
          other.y + other.height <= one.y
        expect(apart, `${one.id} overlaps ${other.id}`).toBe(true)
      }
    }
  })

  it('mirrors the two sides exactly', () => {
    const boxes = marsArcadeHudBoxes()
    for (const left of boxes.filter((box) => box.id.endsWith('-left'))) {
      const right = boxes.find((box) => box.id === left.id.replace('-left', '-right'))
      expect(right, `no right-hand twin for ${left.id}`).toBeDefined()
      if (!right) continue
      expect(right.width).toBe(left.width)
      expect(right.y).toBe(left.y)
      expect(right.x).toBe(MARS_ARCADE_VIEW.width - left.x - left.width)
    }
  })

  it('crops a portrait that is inside the sprite cell', () => {
    const { portrait, frame } = MARS_ARCADE_HUD
    for (const id of Object.keys(MARS_ARCADE_FIGHTERS)) {
      const sourceX = portrait.sourceX[id]
      expect(sourceX, `no portrait crop for ${id}`).toBeDefined()
      if (sourceX === undefined) continue
      expect(sourceX).toBeGreaterThanOrEqual(0)
      expect(sourceX + portrait.sourceWidth).toBeLessThanOrEqual(128)
    }
    expect(portrait.sourceY + portrait.sourceHeight).toBeLessThanOrEqual(128)
    // The crop has to fit inside the frame that is drawn around it.
    expect(portrait.sourceWidth).toBe(portrait.width - frame * 2)
    expect(portrait.sourceHeight).toBe(portrait.height - frame * 2)
  })

  it('sizes the meter to hold whole chunks with whole gaps', () => {
    const { meter, frame } = MARS_ARCADE_HUD
    const inner = meter.width - frame * 2
    const gaps = MARS_ARCADE_METER_SEGMENTS - 1
    expect((inner - gaps) % MARS_ARCADE_METER_SEGMENTS).toBe(0)
  })

  it('leaves no gap or overlap across the second row', () => {
    const { vitals, namePlate, meter } = MARS_ARCADE_HUD
    expect(namePlate.x).toBe(vitals.x)
    expect(meter.x + meter.width).toBe(vitals.x + vitals.width)
    expect(meter.x).toBeGreaterThan(namePlate.x + namePlate.width)
    expect(namePlate.y).toBe(meter.y)
    expect(namePlate.height).toBe(meter.height)
  })

  it('keeps the slant inside the bar it cuts', () => {
    expect(MARS_ARCADE_HUD.skew).toBeGreaterThan(0)
    expect(MARS_ARCADE_HUD.skew).toBeLessThan(MARS_ARCADE_HUD.vitals.width / 4)
  })

  it('stacks health, divider and guard to exactly fill the vitals frame', () => {
    const { vitals, frame } = MARS_ARCADE_HUD
    const stacked = vitals.healthHeight + vitals.dividerHeight + vitals.guardHeight
    expect(stacked).toBe(vitals.height - frame * 2)
  })
})

describe('mars arcade meter segments', () => {
  it('divides the meter into chunks of one cheapest special', () => {
    // If a move is re-costed, the meter has to be re-divided; this is what says so.
    const step = 100 / MARS_ARCADE_METER_SEGMENTS
    const cheapest = Math.min(
      ...Object.values(MARS_ARCADE_FIGHTERS).flatMap((fighter) =>
        Object.values(fighter.moves)
          .map((move) => move.meterCost)
          .filter((cost) => cost > 0),
      ),
    )
    expect(step).toBe(cheapest)
  })

  it('is empty at zero and full at maximum', () => {
    expect(marsArcadeMeterSegments(0)).toEqual([0, 0, 0, 0, 0])
    expect(marsArcadeMeterSegments(100)).toEqual([1, 1, 1, 1, 1])
  })

  it('fills one chunk at a time, outermost first', () => {
    expect(marsArcadeMeterSegments(20)).toEqual([1, 0, 0, 0, 0])
    expect(marsArcadeMeterSegments(40)).toEqual([1, 1, 0, 0, 0])
    const partial = marsArcadeMeterSegments(30)
    expect(partial[0]).toBe(1)
    expect(partial[1]).toBeCloseTo(0.5)
    expect(partial[2]).toBe(0)
  })

  it('never reports a chunk outside its own bounds', () => {
    for (let meter = -20; meter <= 140; meter += 1) {
      for (const amount of marsArcadeMeterSegments(meter)) {
        expect(amount).toBeGreaterThanOrEqual(0)
        expect(amount).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('mars arcade damage trail', () => {
  it('holds still after a hit, then drains to the new health', () => {
    let bar = createChipBar(100)
    bar = advanceChipBar(bar, 70)
    expect(bar.value).toBe(100)

    for (let frame = 0; frame < MARS_ARCADE_CHIP.holdFrames - 1; frame += 1) {
      bar = advanceChipBar(bar, 70)
    }
    expect(bar.value, 'the trail moved during the hold').toBe(100)

    bar = advanceChipBar(bar, 70)
    expect(bar.value).toBeLessThan(100)
  })

  it('always converges on health, and never sits below it', () => {
    let bar = createChipBar(100)
    bar = advanceChipBar(bar, 55)
    const budget = MARS_ARCADE_CHIP.holdFrames + Math.ceil(45 / MARS_ARCADE_CHIP.drainPerFrame) + 2
    for (let frame = 0; frame < budget; frame += 1) {
      bar = advanceChipBar(bar, 55)
      expect(bar.value).toBeGreaterThanOrEqual(55)
    }
    expect(bar.value).toBe(55)
  })

  it('gives a second hit its own hold instead of sliding under it', () => {
    let bar = createChipBar(100)
    bar = advanceChipBar(bar, 80)
    for (let frame = 0; frame < MARS_ARCADE_CHIP.holdFrames + 6; frame += 1) {
      bar = advanceChipBar(bar, 80)
    }
    const drained = bar.value
    expect(drained).toBeLessThan(100)

    bar = advanceChipBar(bar, 60)
    expect(bar.hold).toBe(MARS_ARCADE_CHIP.holdFrames - 1)
    expect(bar.value).toBe(drained)
  })

  it('snaps back up when the round restarts', () => {
    let bar = createChipBar(100)
    bar = advanceChipBar(bar, 40)
    bar = advanceChipBar(bar, 100)
    expect(bar.value).toBe(100)
    expect(bar.hold).toBe(0)
  })
})

describe('mars arcade banner', () => {
  it('shows the round card, then the call to fight', () => {
    expect(marsArcadeBanner(phased('intro', 0))?.text).toBe('ROUND 1')
    expect(marsArcadeBanner(phased('intro', 53))?.text).toBe('ROUND 1')
    expect(marsArcadeBanner(phased('intro', 54))?.text).toBe('FIGHT!')
    expect(marsArcadeBanner(phased('intro', 89))?.text).toBe('FIGHT!')
  })

  it('holds the call briefly into the fight, then clears the screen', () => {
    const start = MARS_ARCADE_TIMING.introFrames
    expect(marsArcadeBanner(phased('fight', start))?.text).toBe('FIGHT!')
    expect(marsArcadeBanner(phased('fight', start + 35))?.text).toBe('FIGHT!')
    expect(marsArcadeBanner(phased('fight', start + 36))).toBeNull()
    expect(marsArcadeBanner(phased('fight', start + 900))).toBeNull()
  })

  it('names the winner on a knockout and on time over', () => {
    const ko = marsArcadeBanner(phased('ko', 1200, 0))
    expect(ko?.text).toBe('K.O.')
    expect(ko?.subtitle).toBe(`${MARS_ARCADE_FIGHTERS.booster.label} WINS`)

    const time = marsArcadeBanner(phased('timeOver', 3690, 1))
    expect(time?.text).toBe('TIME UP')
    expect(time?.subtitle).toBe(`${MARS_ARCADE_FIGHTERS.oracle.label} WINS`)
  })

  it('calls a draw a draw', () => {
    expect(marsArcadeBanner(phased('timeOver', 3690, null))?.text).toBe('DRAW')
  })
})
