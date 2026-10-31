/** Data shared by the renderer and the production asset packager. No DOM work here. */
export const MOONBASE_PANORAMA = {
  src: '/art-source/arcade/generated/moonbase-v1/moonbase-panorama.png',
  width: 480,
  height: 224,
  sourceWidth: 1836,
  sourceHeight: 857,
} as const
const LASER_ROOT = '/art-source/arcade/generated/fx-space-laser-v1/normalised'
export const LASER_EFFECT_LAYOUT = {
  satellite: { width: 80, height: 10, topRow: 30 },
  lensColumn: 65.5,
  beam: { topRow: 40, height: 148 },
  impact: { width: 64, height: 28 },
} as const
export const LASER_EFFECT_ART = {
  satellite: { src: `${LASER_ROOT}/satellite-01.png`, width: 80, height: 10 },
  'beam-14': { src: `${LASER_ROOT}/beam-w14.png`, width: 14, height: 148 },
  'beam-10': { src: `${LASER_ROOT}/beam-w10.png`, width: 10, height: 148 },
  'beam-6': { src: `${LASER_ROOT}/beam-w6.png`, width: 6, height: 148 },
  'impact-0': { src: `${LASER_ROOT}/impact-00.png`, width: 64, height: 28 },
  'impact-1': { src: `${LASER_ROOT}/impact-01.png`, width: 64, height: 28 },
  'impact-2': { src: `${LASER_ROOT}/impact-02.png`, width: 64, height: 28 },
  'impact-3': { src: `${LASER_ROOT}/impact-03.png`, width: 64, height: 28 },
} as const
export const CAPTAIN_FLYBY_ART = [0, 1, 2, 3].map(frame => `/art-source/arcade/generated/fx-flyby-v2/normalised/flyby-0${frame}.png`)
const CAP_ROOT = '/art-source/arcade/trump/normalised-cap-effects-v1'
export const CAP_EFFECT_ART = {
  cap: { src: `${CAP_ROOT}/red-cap.png`, width: 30, height: 18 },
  box: { src: `${CAP_ROOT}/hat-box.png`, width: 36, height: 25 },
} as const
