export const INTRO_DURATION_SECONDS = 53

export type IntroCue = {
  id: 'boot' | 'duffel' | 'runway' | 'ballpark' | 'finance' | 'clouds' | 'catch' | 'title'
  startSeconds: number
  background: string | null
  caption: string
  summary: string
  treatment: 'boot' | 'duffel' | 'runway' | 'ballpark' | 'finance' | 'clouds' | 'catch' | 'title'
  poptClip: string | null
  keyClip: string | null
  fallbackImage: string | null
  objectPosition: string
}

const packagePath = (path: string) => `images/intro/tmb2/${path}`

export const introCues = [
  {
    id: 'boot',
    startSeconds: 0,
    background: null,
    caption: 'TMB2',
    summary: 'The TMB2 chase powers up in a field of electric-blue pixels.',
    treatment: 'boot',
    poptClip: null,
    keyClip: null,
    fallbackImage: null,
    objectPosition: 'center',
  },
  {
    id: 'duffel',
    startSeconds: 4,
    background: packagePath('backgrounds/duffel-terminal.png'),
    caption: 'THE OVERSIZED DUFFEL',
    summary: 'Pop T pulls an oversized pilot duffel as a lively brass key appears.',
    treatment: 'duffel',
    poptClip: packagePath('popt/duffel-pull/duffel-pull.webp'),
    keyClip: packagePath('key/key-mascot-poses-10.png'),
    fallbackImage: packagePath('backgrounds/duffel-terminal.png'),
    objectPosition: 'center',
  },
  {
    id: 'runway',
    startSeconds: 11,
    background: packagePath('backgrounds/runway-night.png'),
    caption: 'RUNWAY CHASE',
    summary: 'Pop T follows the brass key across a safely parked airport runway at night.',
    treatment: 'runway',
    poptClip: packagePath('popt/startle-stumble/startle-stumble.webp'),
    keyClip: packagePath('key/key-mascot-poses-01.png'),
    fallbackImage: packagePath('backgrounds/runway-night.png'),
    objectPosition: 'center',
  },
  {
    id: 'ballpark',
    startSeconds: 19,
    background: packagePath('backgrounds/ballpark-night.png'),
    caption: 'BALLPARK DETOUR',
    summary: 'The chase takes a playful field-level detour through a night ballpark.',
    treatment: 'ballpark',
    poptClip: packagePath('popt/baseball-slide/baseball-slide.webp'),
    keyClip: packagePath('key/key-mascot-poses-08.png'),
    fallbackImage: packagePath('backgrounds/ballpark-night.png'),
    objectPosition: 'center',
  },
  {
    id: 'finance',
    startSeconds: 27,
    background: packagePath('backgrounds/finance-city.png'),
    caption: 'BULL MARKET LAUNCH',
    summary: 'Pop T and the brass key race past a bright fictional finance skyline and bronze bull.',
    treatment: 'finance',
    poptClip: packagePath('popt/bull-spin/bull-spin.webp'),
    keyClip: packagePath('key/key-mascot-poses-09.png'),
    fallbackImage: packagePath('backgrounds/finance-city.png'),
    objectPosition: 'center',
  },
  {
    id: 'clouds',
    startSeconds: 35,
    background: packagePath('backgrounds/cloud-chase.png'),
    caption: 'CLOUD CHASE',
    summary: 'The joyful chase glides through bright cobalt clouds and sparkling blue trails.',
    treatment: 'clouds',
    poptClip: packagePath('popt/pilot-glide/pilot-glide.webp'),
    keyClip: packagePath('key/key-mascot-poses-13.png'),
    fallbackImage: packagePath('backgrounds/cloud-chase.png'),
    objectPosition: 'center',
  },
  {
    id: 'catch',
    startSeconds: 43,
    background: packagePath('backgrounds/cloud-chase.png'),
    caption: 'THE CATCH',
    summary: 'Pop T reaches the brass key and recovers with a triumphant pilot salute.',
    treatment: 'catch',
    poptClip: packagePath('popt/victory-recovery/victory-recovery.webp'),
    keyClip: packagePath('key/key-mascot-poses-03.png'),
    fallbackImage: packagePath('backgrounds/cloud-chase.png'),
    objectPosition: 'center',
  },
  {
    id: 'title',
    startSeconds: 49,
    background: null,
    caption: 'MISSION READY',
    summary: 'The CockpitEscapeRoom title appears before the DC-9 First-Officer Final Flight Log.',
    treatment: 'title',
    poptClip: null,
    keyClip: null,
    fallbackImage: null,
    objectPosition: 'center',
  },
] as const satisfies readonly IntroCue[]

export const INTRO_PRELOAD_PATHS = [...new Set(
  introCues.flatMap((cue) => [cue.background, cue.poptClip, cue.keyClip, cue.fallbackImage])
    .filter((path): path is string => Boolean(path)),
)]

export function getIntroCue(timeSeconds: number): IntroCue {
  const safeTime = Number.isFinite(timeSeconds) ? Math.max(0, timeSeconds) : 0
  let activeCue: IntroCue = introCues[0]

  for (const cue of introCues) {
    if (safeTime < cue.startSeconds) break
    activeCue = cue
  }

  return activeCue
}
