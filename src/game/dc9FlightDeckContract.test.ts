import { describe, expect, it } from 'vitest'
import {
  DC9_FLIGHT_DECK_INSTRUMENTS,
  DC9_FLIGHT_DECK_REQUIRED_NODES,
} from '../../tools/assets/dc9-flight-deck-contract.mjs'
import {
  DC9_FLIGHT_DECK_NODES,
  DC9_INSTRUMENTS,
  DC9_INSTRUMENT_IDS,
} from './dc9FlightDeck'

/**
 * The runtime module and the asset check hold the same measurements in two places,
 * because `check-models.mjs` runs under plain node and cannot import TypeScript. These
 * tests are what stop the two copies drifting apart.
 */
describe('runtime flight deck contract matches the asset check', () => {
  it('guards exactly the nodes the runtime animates', () => {
    expect([...DC9_FLIGHT_DECK_REQUIRED_NODES].sort()).toEqual([...DC9_FLIGHT_DECK_NODES].sort())
  })

  it('guards exactly the instruments the runtime offers', () => {
    expect(DC9_FLIGHT_DECK_INSTRUMENTS.map((instrument) => instrument.id).sort())
      .toEqual([...DC9_INSTRUMENT_IDS].sort())
  })

  it('uses identical centres and radii on both sides', () => {
    for (const guarded of DC9_FLIGHT_DECK_INSTRUMENTS) {
      const runtime = DC9_INSTRUMENTS[guarded.id as keyof typeof DC9_INSTRUMENTS]
      expect(runtime, `runtime instrument ${guarded.id}`).toBeDefined()
      expect([...runtime.center], `${guarded.id} centre`).toEqual([...guarded.center])
      expect(runtime.radius, `${guarded.id} radius`).toBe(guarded.radius)
    }
  })
})
