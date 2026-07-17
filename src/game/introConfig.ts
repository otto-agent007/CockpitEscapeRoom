export const INTRO_DURATION_SECONDS = 53

export type IntroCue = {
  id: 'boot' | 'dc9' | 'key' | 'hat' | 'airbus' | 'title'
  startSeconds: number
  image: string | null
  caption: string
  treatment: 'boot' | 'push' | 'wipe' | 'poster' | 'panel' | 'title'
  objectPosition: string
}

export const introCues = [
  {
    id: 'boot',
    startSeconds: 0,
    image: null,
    caption: 'A FAMILY CREW PRODUCTION',
    treatment: 'boot',
    objectPosition: 'center',
  },
  {
    id: 'dc9',
    startSeconds: 4,
    image: 'images/dc9-game-ready-first-officer.png',
    caption: 'THE FINAL FLIGHT LOG',
    treatment: 'push',
    objectPosition: '74% center',
  },
  {
    id: 'key',
    startSeconds: 16,
    image: 'images/captains-key-celebration.png',
    caption: 'LEGACY UNLOCKED',
    treatment: 'wipe',
    objectPosition: 'center',
  },
  {
    id: 'hat',
    startSeconds: 27,
    image: 'images/captains-hat-celebration.png',
    caption: 'THE JOURNEY CONTINUES',
    treatment: 'poster',
    objectPosition: 'center',
  },
  {
    id: 'airbus',
    startSeconds: 38,
    image: 'images/a320-game-ready-captain.png',
    caption: 'FROM FIRST OFFICER TO CAPTAIN',
    treatment: 'panel',
    objectPosition: 'center',
  },
  {
    id: 'title',
    startSeconds: 49,
    image: null,
    caption: 'MISSION READY',
    treatment: 'title',
    objectPosition: 'center',
  },
] as const satisfies readonly IntroCue[]

export function getIntroCue(timeSeconds: number): IntroCue {
  const safeTime = Number.isFinite(timeSeconds) ? Math.max(0, timeSeconds) : 0
  let activeCue: IntroCue = introCues[0]

  for (const cue of introCues) {
    if (safeTime < cue.startSeconds) break
    activeCue = cue
  }

  return activeCue
}
