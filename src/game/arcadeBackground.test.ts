import { describe, expect, it } from 'vitest'
import { ARCADE_BACKGROUND_KEY, loadArcadeBackground, saveArcadeBackground, isArcadeBackground, moonbasePanoramaLeft } from './arcadeBackground'
import { marsArcadeCameraLimit, MARS_ARCADE_VIEW } from './marsArcadeStage'

describe('arcade background choice', () => {
  it('defaults to the original Mars background', () => {
    expect(loadArcadeBackground({ getItem: () => null })).toBe('mars')
  })
  it.each(['moonbase', 'mars'])('recovers a valid versioned %s setting', value => {
    expect(loadArcadeBackground({ getItem: () => JSON.stringify({ version: 1, background: value }) })).toBe(value)
  })
  it.each(['broken', '"moonbase"', '{}', '{"version":2,"background":"moonbase"}', '{"version":1,"background":"earth"}', '{"version":1,"background":true}'])('recovers safely from %s', raw => {
    expect(loadArcadeBackground({ getItem: () => raw })).toBe('mars')
  })
  it('stores only its own setting and leaves game progress and earned access alone', () => {
    const data = new Map([['chapter', 'progress'], ['achievement', 'earned']])
    expect(saveArcadeBackground('moonbase', { setItem: (key, value) => { data.set(key, value) } })).toBe(true)
    expect(JSON.parse(data.get(ARCADE_BACKGROUND_KEY)!)).toEqual({ version: 1, background: 'moonbase' })
    expect(data.get('chapter')).toBe('progress')
    expect(data.get('achievement')).toBe('earned')
  })
  it('recovers from denied reads and reports denied writes without throwing', () => {
    expect(loadArcadeBackground({ getItem: () => { throw new Error('denied') } })).toBe('mars')
    expect(saveArcadeBackground('moonbase', { setItem: () => { throw new Error('quota') } })).toBe(false)
  })
  it('accepts only the two registered backgrounds', () => {
    expect(['mars', 'moonbase', 'Moonbase', 'earth', null, 1].map(isArcadeBackground)).toEqual([true, true, false, false, false, false])
  })
})

describe('Moonbase panorama coverage', () => {
  it('covers the viewport at both real camera limits and every intermediate quarter pixel', () => {
    const limit = marsArcadeCameraLimit()
    for (let camera = -limit; camera <= limit; camera += 0.25) {
      const left = moonbasePanoramaLeft(camera)
      expect(Number.isInteger(left)).toBe(true)
      expect(left).toBeLessThanOrEqual(0)
      expect(left + 480).toBeGreaterThanOrEqual(MARS_ARCADE_VIEW.width)
    }
  })
  it('keeps the panorama centered and handles corrupt camera values', () => {
    expect(moonbasePanoramaLeft(0)).toBe(-80)
    expect(moonbasePanoramaLeft(Number.NaN)).toBe(-80)
  })
})
