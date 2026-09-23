import { describe, expect, it } from 'vitest'
import { MARS_ARCADE_HUD, marsArcadeBanner, marsArcadeHudAlphabet } from '../game/marsArcadeHud'
import { MARS_ARCADE_FIGHTERS } from '../game/marsArcadeFighters'
import { MARS_ARCADE_VIEW } from '../game/marsArcadeStage'
import { createMarsArcadeRound } from '../game/marsArcade'
import {
  GLYPH_HEIGHT,
  GLYPH_WIDTH,
  PIXEL_GLYPHS,
  hasGlyph,
  measureText,
} from './arcadePixelFont'

/**
 * A missing glyph draws nothing at all, so the HUD would simply lose a letter and
 * nobody would notice until a fighter was renamed. These tests are the reason the
 * font can be trusted without looking at it.
 */

describe('arcade pixel font', () => {
  it('has a glyph for every character the HUD can emit', () => {
    for (const character of marsArcadeHudAlphabet().toUpperCase()) {
      expect(hasGlyph(character), `no glyph for ${JSON.stringify(character)}`).toBe(true)
    }
  })

  it('is built on a rectangular grid', () => {
    for (const [character, rows] of Object.entries(PIXEL_GLYPHS)) {
      expect(rows, `${character} is the wrong height`).toHaveLength(GLYPH_HEIGHT)
      for (const row of rows) {
        expect(row, `${character} has a row of the wrong width`).toHaveLength(GLYPH_WIDTH)
        expect(row, `${character} has a stray character`).toMatch(/^[.#]+$/)
      }
    }
  })

  it('draws every glyph as something other than blank, except the space', () => {
    for (const [character, rows] of Object.entries(PIXEL_GLYPHS)) {
      if (character === ' ') continue
      expect(rows.join('').includes('#'), `${character} is blank`).toBe(true)
    }
  })
})

describe('the HUD text actually fits its boxes', () => {
  it('keeps every fighter name inside the name plate', () => {
    const { namePlate, frame } = MARS_ARCADE_HUD
    // The plate insets by its frame, then one more pixel of padding either side.
    const usable = namePlate.width - frame * 2 - 2
    for (const fighter of Object.values(MARS_ARCADE_FIGHTERS)) {
      expect(
        measureText(fighter.label),
        `${fighter.label} overflows the name plate`,
      ).toBeLessThanOrEqual(usable)
      expect(GLYPH_HEIGHT).toBeLessThanOrEqual(namePlate.height - frame * 2)
    }
  })

  it('keeps the clock inside the timer box', () => {
    const width = measureText('60') * MARS_ARCADE_HUD.timer.digitPixel
    expect(width).toBeLessThanOrEqual(MARS_ARCADE_HUD.timer.width)
    const height = GLYPH_HEIGHT * MARS_ARCADE_HUD.timer.digitPixel
    expect(height).toBeLessThanOrEqual(MARS_ARCADE_HUD.timer.height)
  })

  it('keeps every banner and subtitle inside the screen', () => {
    const base = createMarsArcadeRound('booster', 'oracle')
    const cases = [
      { ...base, phase: 'intro' as const, frame: 0 },
      { ...base, phase: 'intro' as const, frame: 60 },
      { ...base, phase: 'ko' as const, frame: 900, winner: 0 as const },
      { ...base, phase: 'ko' as const, frame: 900, winner: 1 as const },
      { ...base, phase: 'timeOver' as const, frame: 3690, winner: 0 as const },
      { ...base, phase: 'timeOver' as const, frame: 3690, winner: null },
    ]
    for (const state of cases) {
      const banner = marsArcadeBanner(state)
      expect(banner).not.toBeNull()
      if (!banner) continue
      const width = measureText(banner.text) * MARS_ARCADE_HUD.banner.pixel
      expect(width, `${banner.text} overflows the screen`).toBeLessThanOrEqual(
        MARS_ARCADE_VIEW.width,
      )
      if (banner.subtitle) {
        const subtitle = measureText(banner.subtitle) * MARS_ARCADE_HUD.banner.subtitlePixel
        expect(subtitle, `${banner.subtitle} overflows the screen`).toBeLessThanOrEqual(
          MARS_ARCADE_VIEW.width,
        )
      }
    }
  })
})
