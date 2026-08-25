/**
 * What the Storm Line sounds like.
 *
 * The engine bed underneath it is a 56–72 Hz rumble, which is most of why the simulator
 * reads as silent on a laptop: those speakers reproduce almost nothing below ~150 Hz. Rain
 * is broadband hiss and thunder is a wide sweep from a crack down to a rumble, so both are
 * audible on hardware that cannot move enough air for an engine.
 *
 * Pure descriptors, no WebAudio: `useAirbusSimulator` renders them into nodes. Everything
 * is derived from the weather field the scene already draws, so what you hear is what you
 * are flying through rather than a loop running behind it.
 */

import { lightningStrikeJitter } from './airbusLightning'

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/** The steady bed: rain on the windshield and airflow over the airframe. */
export interface StormAudioBed {
  /** Level of the rain hiss. */
  rainGain: number
  /** Rain is what is left of white noise above this. Heavier rain keeps more body. */
  rainHighpassHz: number
  /** Level of the wind band. */
  windGain: number
  /** Centre of the wind band. Rises as the air gets rougher. */
  windBandHz: number
}

/**
 * Rain tracks precipitation, wind tracks turbulence — the two are separate in the weather
 * field and separate here, so the quiet-but-bumpy clear-air leg still sounds like flying
 * while the storm core is the part that roars.
 *
 * `clearAir` sits at precipitation 0.2 and the core at 0.72–0.97, so this spans an audible
 * drizzle to a wall of water rather than fading one loop up and down.
 */
export function stormAudioBed(precipitation: number, turbulence: number): StormAudioBed {
  const rain = clamp01(precipitation)
  const rough = clamp01(turbulence)
  return {
    rainGain: 0.05 + rain * 0.17,
    // Light rain is thin and high; heavy rain drops into the mids and gains weight.
    rainHighpassHz: 1_450 - rain * 700,
    windGain: 0.035 + rough * 0.075,
    windBandHz: 340 + rough * 260,
  }
}

/**
 * Engine-Out flies in fair weather, and the hub sits on the ground: no rain, just the
 * airflow bed. It is here because the engine rumble alone is what "I can't hear anything"
 * sounded like — a laptop reproduces this band and does not reproduce 56 Hz.
 */
export const CLEAR_AIR_BED: StormAudioBed = {
  rainGain: 0,
  rainHighpassHz: 1_200,
  windGain: 0.045,
  windBandHz: 380,
}

/** One thunderclap: the crack, then the rumble rolling away behind it. */
export interface ThunderClap {
  /**
   * Seconds between the flash and the sound. Sound is slow, so this is what makes a strike
   * read as near or far — the classic count between the flash and the bang.
   */
  delaySeconds: number
  /** Peak level of the rumble. */
  rumbleLevel: number
  /** Rumble lowpass. A near strike keeps its edge; a distant one is all bass. */
  rumbleCutoffHz: number
  /** How long the rumble takes to fall away. */
  rumbleSeconds: number
  /** The initial crack. Zero beyond a couple of kilometres, which arrives as rumble only. */
  crackLevel: number
}

/** Beyond this the crack has been absorbed and only the rumble reaches the aircraft. */
const CRACK_DISTANCE_LIMIT = 0.42

/**
 * Deterministic per strike, drawn from the same jitter as the flash, so a given bolt always
 * lands the same distance away however often the checkpoint is retried.
 *
 * `precipitation` only scales level: a strike in the core is the same strike, heard through
 * more weather.
 */
export function thunderForStrike(strikeIndex: number, precipitation: number): ThunderClap {
  const distance = lightningStrikeJitter(Math.max(0, Math.floor(strikeIndex)), 5)
  const weather = 0.55 + clamp01(precipitation) * 0.45
  return {
    // The furthest clap has to finish rolling before the next bolt lands 8.5 s later, or
    // the line turns to mush: 4.0 s out plus 4.2 s of rumble is the ceiling that leaves.
    delaySeconds: 0.4 + distance * 3.6,
    // Loud, and deliberately so. A first pass sat at 0.16 and measured as no change at all
    // in the 90-420 Hz band against the rain bed: the claps were scheduled, played, and
    // inaudible. Thunder has to dominate for its two seconds or it is not thunder.
    rumbleLevel: (0.85 - distance * 0.46) * weather,
    rumbleCutoffHz: 900 - distance * 690,
    rumbleSeconds: 1.6 + distance * 2.6,
    crackLevel: distance >= CRACK_DISTANCE_LIMIT
      ? 0
      : (1 - distance / CRACK_DISTANCE_LIMIT) * 0.3 * weather,
  }
}
