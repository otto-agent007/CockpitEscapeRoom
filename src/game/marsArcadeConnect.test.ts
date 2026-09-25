import { afterEach, describe, expect, it } from 'vitest'

import { MARS_ARCADE_FIGHTERS, marsArcadeDefaultTuning, marsArcadeRules, setMarsArcadeTuning } from './marsArcadeFighters'
import { formatMarsArcadeConnectTable, marsArcadeConnectTable } from './marsArcadeConnect'

afterEach(() => setMarsArcadeTuning(null))

describe('connect-distance table', () => {
  const table = marsArcadeConnectTable()

  it('matches every move\'s reach with the bounds rule off', () => {
    expect(table.length).toBeGreaterThan(0)
    for (const row of table) {
      const move = Object.values(MARS_ARCADE_FIGHTERS[row.attacker].moves).find((candidate) => candidate.id === row.moveId)
      expect(row.off, `${row.moveId} vs ${row.defender}`).toBe(move?.reach)
    }
  })

  it('is pinned with the bounds rule on: a box edit in the gym is a balance edit and shows up here', () => {
    // Regenerate with `node tools/assets/arcade-anim.mjs connect` after an intended
    // box change, and say in the PR why the spacing moved.
    const pinned = table.map(({ moveId, defender, on, resolvedBy }) => `${moveId} vs ${defender}: ${on} (${resolvedBy})`)
    expect(pinned).toEqual([
      'booster.padJab vs oracle: 59 (boxes)',
      'booster.padJab vs captain: 55 (boxes)',
      'booster.staticFire vs oracle: 53 (boxes)',
      'booster.staticFire vs captain: 49 (boxes)',
      'oracle.prompt vs booster: 62 (boxes)',
      'oracle.prompt vs captain: 55 (boxes)',
      'oracle.hardCutoff vs booster: 61 (boxes)',
      'oracle.hardCutoff vs captain: 54 (boxes)',
      'captain.runTheChecklist vs booster: 36 (reach)',
      'captain.runTheChecklist vs oracle: 36 (reach)',
      'captain.flyby vs booster: 480 (reach)',
      'captain.flyby vs oracle: 480 (reach)',
    ])
  })

  it('leaves the rules in force as it found them', () => {
    setMarsArcadeTuning({ ...marsArcadeDefaultTuning(), rules: { useBounds: true, hitstop: true } })
    expect(marsArcadeConnectTable()).toEqual(table)
    expect(marsArcadeRules()).toEqual({ useBounds: true, hitstop: true })
    expect(formatMarsArcadeConnectTable(table).split('\n')).toHaveLength(table.length + 2)
  })
})
