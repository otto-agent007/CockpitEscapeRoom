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
    // Plan 0049 splits idle hurtboxes into head/body/legs and tightens the torso.
    // Bounds-on mid strikes lose 2-3 px; sweep vs Captain loses 1 px. Strike boxes,
    // move reach and the shipped bounds-off behavior remain the same.
    const pinned = table.map(({ moveId, defender, on, resolvedBy }) => `${moveId} vs ${defender}: ${on} (${resolvedBy})`)
    expect(pinned).toEqual([
      'booster.padJab vs oracle: 56 (boxes)',
      'booster.padJab vs captain: 53 (boxes)',
      'booster.staticFire vs oracle: 50 (boxes)',
      'booster.staticFire vs captain: 47 (boxes)',
      'oracle.prompt vs booster: 60 (boxes)',
      'oracle.prompt vs captain: 53 (boxes)',
      'oracle.hardCutoff vs booster: 61 (boxes)',
      'oracle.hardCutoff vs captain: 53 (boxes)',
      'captain.palmJab vs booster: 53 (boxes)',
      'captain.palmJab vs oracle: 49 (boxes)',
      'captain.runTheChecklist vs booster: 55 (boxes)',
      'captain.runTheChecklist vs oracle: 51 (boxes)',
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
