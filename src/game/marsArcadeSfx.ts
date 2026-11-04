import type { MarsArcadeEvent, MarsArcadeState } from './marsArcade'
import { marsArcadeFighter } from './marsArcadeFighters'

const root = '/audio/mars-arcade-v1/'
export const MARS_ARCADE_SOUNDS = {
  jab: ['jab-1.wav', 'jab-2.wav', 'jab-3.wav'],
  heavy: ['heavy-1.wav', 'heavy-2.wav'],
  kick: ['kick-1.wav', 'kick-2.wav'],
  block: ['block-1.wav', 'block-2.wav'],
  whiff: ['whiff-1.wav'],
  guardBreak: ['break-1.wav'],
  down: ['down-1.wav'],
  laser: ['laser.wav'], caps: ['caps.wav'], flyby: ['flyby.wav'], text: ['text.wav'],
  round: ['round.wav'], fight: ['fight.wav'], win: ['win.wav'], combo: ['combo.wav'],
} as const
export type MarsArcadeSound = keyof typeof MARS_ARCADE_SOUNDS
export interface MarsArcadeSoundCue { sound: MarsArcadeSound; delay?: number }
export const marsArcadeSoundUrl = (file: string) => root + file
export const isArcadeVoice = (sound: MarsArcadeSound) => ['round', 'fight', 'win', 'combo'].includes(sound)

function specialSound(moveId: string): MarsArcadeSound | null {
  if (moveId === 'booster.spaceLaser') return 'laser'
  if (moveId === 'captain.flyby') return 'flyby'
  if (moveId === 'trump.capThrow') return 'caps'
  if (moveId.startsWith('oracle.') && ['textBubble', 'nonProfitPivot', 'nonProfitPivotShort'].some(name => moveId === `oracle.${name}`)) return 'text'
  return null
}

/** Pure presentation mapping: real contacts select impacts; a miss has only air. */
export function marsArcadeSoundCues(state: MarsArcadeState, events: readonly MarsArcadeEvent[], humanRight: boolean): MarsArcadeSoundCue[] {
  const cues: MarsArcadeSoundCue[] = []
  const crushed = new Set(events.flatMap(event => event.type === 'guardCrush' ? [event.defender] : []))
  for (const event of events) {
    switch (event.type) {
      case 'moveActive': {
        const special = specialSound(event.moveId)
        if (special) cues.push({ sound: special })
        else if (!events.some(contact => (contact.type === 'hit' || contact.type === 'blocked') && contact.attacker === event.attacker && contact.moveId === event.moveId)) cues.push({ sound: 'whiff' })
        break
      }
      case 'hit': {
        const fighter = marsArcadeFighter(state.fighters[event.attacker].id)
        const move = Object.values(fighter.moves).find(move => move.id === event.moveId)
        cues.push({ sound: move?.button === 'light' ? 'jab' : move?.button === 'heavy' && move.guardHeight === 'low' ? 'kick' : 'heavy' })
        break
      }
      case 'blocked': if (!crushed.has(event.attacker === 0 ? 1 : 0)) cues.push({ sound: 'block' }); break
      case 'guardCrush': cues.push({ sound: 'guardBreak' }); break
      case 'roundStart': cues.push({ sound: 'fight' }); break
      case 'ko':
        cues.push({ sound: 'down' })
        if (event.winner === 0 || humanRight) cues.push({ sound: 'win', delay: .75 })
        break
      case 'timeOver':
        if (event.winner === 0 || (humanRight && event.winner !== null)) cues.push({ sound: 'win' })
        break
    }
  }
  return cues
}

/** A short landed-hit streak earns one Combo call; guard/trade/gaps break it. */
export class MarsArcadeComboSound {
  private side = -1
  private frame = -100
  private hits = 0
  reset(): void { this.side = -1; this.frame = -100; this.hits = 0 }
  update(frame: number, events: readonly MarsArcadeEvent[]): boolean {
    if (events.some(event => event.type === 'ko' || event.type === 'timeOver' || event.type === 'roundStart')) { this.reset(); return false }
    let announce = false
    for (const event of events) {
      if (event.type === 'blocked') { this.reset(); continue }
      if (event.type !== 'hit') continue
      this.hits = this.side === event.attacker && frame - this.frame <= 60 ? this.hits + 1 : 1
      this.side = event.attacker
      this.frame = frame
      if (this.hits === 3) announce = true
    }
    return announce
  }
}

export interface ArcadeSoundSettings { version: 1; muted: boolean; volume: number }
export const ARCADE_SOUND_KEY = 'cockpit-escape-room-arcade-sound'
export const DEFAULT_ARCADE_SOUND: ArcadeSoundSettings = { version: 1, muted: false, volume: .55 }
export function loadArcadeSound(storage?: Pick<Storage, 'getItem'>): ArcadeSoundSettings {
  try {
    const setting: unknown = JSON.parse((storage ?? window.localStorage).getItem(ARCADE_SOUND_KEY) ?? 'null')
    if (typeof setting === 'object' && setting !== null && 'version' in setting && setting.version === 1
      && 'muted' in setting && typeof setting.muted === 'boolean' && 'volume' in setting
      && typeof setting.volume === 'number' && Number.isFinite(setting.volume) && setting.volume >= 0 && setting.volume <= 1) {
      return { version: 1, muted: setting.muted, volume: setting.volume }
    }
  } catch { /* Corrupt/denied local preferences must not interrupt the fight. */ }
  return { ...DEFAULT_ARCADE_SOUND }
}
export function saveArcadeSound(setting: ArcadeSoundSettings): void {
  try { window.localStorage.setItem(ARCADE_SOUND_KEY, JSON.stringify(setting)) } catch { /* Gameplay stays local and usable without preference writes. */ }
}
