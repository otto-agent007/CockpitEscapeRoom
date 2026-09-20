/**
 * Mars arcade cabinet — computer opponent.
 *
 * Deliberately simple and deliberately readable: pick an intent, hold it for a
 * short while, act on it. All randomness comes from a seeded generator carried
 * in the opponent's own state, so a seed plus a run of player inputs replays
 * exactly. The engine itself stays free of randomness.
 */

import {
  NEUTRAL_MARS_ARCADE_INPUT,
  type MarsArcadeInput,
  type MarsArcadeSide,
  type MarsArcadeState,
} from './marsArcade'
import { marsArcadeFighter } from './marsArcadeFighters'

export type MarsArcadeDifficulty = 'rookie' | 'veteran'
export type MarsArcadeIntent = 'approach' | 'retreat' | 'attack' | 'block' | 'wait'

export interface MarsArcadeOpponent {
  side: MarsArcadeSide
  difficulty: MarsArcadeDifficulty
  seed: number
  intent: MarsArcadeIntent
  intentFrames: number
  /** Frames left before the opponent may press a button again. */
  pressCooldownFrames: number
  pendingButton: 'light' | 'heavy' | 'special' | null
}

const DIFFICULTY = {
  rookie: { intentFrames: 26, blockChance: 0.3, specialChance: 0.18, pressCooldownFrames: 16 },
  veteran: { intentFrames: 14, blockChance: 0.62, specialChance: 0.4, pressCooldownFrames: 8 },
} as const

const CLOSE_RANGE = 34
const MID_RANGE = 70

function mulberry32(seed: number): { value: number; seed: number } {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: t | 0 }
}

export function createMarsArcadeOpponent(
  side: MarsArcadeSide,
  difficulty: MarsArcadeDifficulty,
  seed: number,
): MarsArcadeOpponent {
  return {
    side,
    difficulty,
    seed: seed | 0,
    intent: 'wait',
    intentFrames: 0,
    pressCooldownFrames: 0,
    pendingButton: null,
  }
}

function chooseIntent(
  random: number,
  distance: number,
  meter: number,
  specialCost: number,
  tuning: (typeof DIFFICULTY)[MarsArcadeDifficulty],
): MarsArcadeIntent {
  if (distance > MID_RANGE) {
    return meter >= specialCost && random < tuning.specialChance ? 'attack' : 'approach'
  }
  if (distance > CLOSE_RANGE) {
    if (random < tuning.blockChance * 0.4) return 'block'
    return random < 0.85 ? 'approach' : 'wait'
  }
  if (random < tuning.blockChance) return 'block'
  if (random < tuning.blockChance + 0.35) return 'attack'
  return 'retreat'
}

function chooseButton(
  random: number,
  distance: number,
  meter: number,
  specialCost: number,
  tuning: (typeof DIFFICULTY)[MarsArcadeDifficulty],
): 'light' | 'heavy' | 'special' {
  if (meter >= specialCost && random < tuning.specialChance) return 'special'
  if (distance > CLOSE_RANGE) return 'heavy'
  return random < 0.65 ? 'light' : 'heavy'
}

export function advanceMarsArcadeOpponent(
  opponent: MarsArcadeOpponent,
  state: MarsArcadeState,
): { opponent: MarsArcadeOpponent; input: MarsArcadeInput } {
  const self = state.fighters[opponent.side]
  const player = state.fighters[opponent.side === 0 ? 1 : 0]
  const tuning = DIFFICULTY[opponent.difficulty]
  const specialCost = marsArcadeFighter(self.id).moves.special.meterCost
  const distance = Math.abs(player.x - self.x)

  const next: MarsArcadeOpponent = { ...opponent }
  if (state.phase !== 'fight') {
    return { opponent: next, input: { ...NEUTRAL_MARS_ARCADE_INPUT } }
  }

  next.intentFrames -= 1
  next.pressCooldownFrames = Math.max(0, next.pressCooldownFrames - 1)

  if (next.intentFrames <= 0) {
    const roll = mulberry32(next.seed)
    next.seed = roll.seed
    next.intent = chooseIntent(roll.value, distance, self.meter, specialCost, tuning)
    next.intentFrames = tuning.intentFrames
    next.pendingButton = null
  }

  const towardPlayer = player.x >= self.x ? 1 : -1
  const input: MarsArcadeInput = { ...NEUTRAL_MARS_ARCADE_INPUT }

  switch (next.intent) {
    case 'approach':
      input.move = towardPlayer
      break
    case 'retreat':
    case 'block':
      input.move = -towardPlayer
      break
    case 'attack': {
      if (next.pressCooldownFrames === 0 && self.stunFrames === 0 && self.activity !== 'attack') {
        const roll = mulberry32(next.seed)
        next.seed = roll.seed
        const button = chooseButton(roll.value, distance, self.meter, specialCost, tuning)
        input[button] = true
        next.pressCooldownFrames = tuning.pressCooldownFrames
        next.pendingButton = button
      } else if (distance > CLOSE_RANGE) {
        input.move = towardPlayer
      }
      break
    }
    case 'wait':
    default:
      break
  }

  // Answer the booster's landing window rather than tipping over every time.
  if (self.activity === 'attack' && self.activeButton === 'special' && !self.landingResolved) {
    const move = marsArcadeFighter(self.id).moves.special
    const window = move.landingWindow
    if (window) {
      const recoveryElapsed = self.moveFrame - (move.startupFrames + move.activeFrames)
      const roll = mulberry32(next.seed)
      next.seed = roll.seed
      const answers = roll.value < (opponent.difficulty === 'veteran' ? 0.85 : 0.4)
      if (answers && recoveryElapsed >= window.openFrame && recoveryElapsed <= window.closeFrame) {
        input.special = true
      }
    }
  }

  return { opponent: next, input }
}
