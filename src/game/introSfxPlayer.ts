/**
 * Turns an IntroSfxSound descriptor into actual sound with WebAudio.
 *
 * Deliberately thin and story-free: the schedule lives in introSfx.ts, which
 * stays pure and testable. This file owns the AudioContext, nothing else.
 */

import type { IntroSfxCue, IntroSfxSound } from './introSfx'

type AudioContextConstructor = new () => AudioContext

function resolveAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') return null
  const scoped = window as typeof window & { webkitAudioContext?: AudioContextConstructor }
  return scoped.AudioContext ?? scoped.webkitAudioContext ?? null
}

/** One second of mono white noise, built once and reused by every noise cue. */
function createNoiseBuffer(context: AudioContext): AudioBuffer {
  const frameCount = Math.floor(context.sampleRate)
  const buffer = context.createBuffer(1, frameCount, context.sampleRate)
  const channel = buffer.getChannelData(0)
  for (let index = 0; index < frameCount; index += 1) {
    channel[index] = Math.random() * 2 - 1
  }
  return buffer
}

export class IntroSfxPlayer {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private noiseBuffer: AudioBuffer | null = null
  private failed = false

  /** Creates the context on first use; a blocked context leaves the intro playable without SFX. */
  private ensureContext(): AudioContext | null {
    if (this.failed) return null
    if (this.context) return this.context
    try {
      const Constructor = resolveAudioContextConstructor()
      if (!Constructor) {
        this.failed = true
        return null
      }
      const context = new Constructor()
      const master = context.createGain()
      master.gain.value = 0
      master.connect(context.destination)
      this.context = context
      this.master = master
      this.noiseBuffer = createNoiseBuffer(context)
      return context
    } catch {
      // No WebAudio, or the browser refused the context. The intro is fully
      // playable without effects, so this stays silent rather than throwing.
      this.failed = true
      return null
    }
  }

  /** Mirrors the intro's own mute and volume controls. */
  setVolume(volume: number, muted: boolean): void {
    if (!this.context || !this.master) return
    const level = muted ? 0 : Math.max(0, Math.min(1, volume))
    this.master.gain.setTargetAtTime(level, this.context.currentTime, 0.01)
  }

  play(cue: IntroSfxCue, volume: number, muted: boolean): void {
    if (muted || volume <= 0) return
    const context = this.ensureContext()
    if (!context || !this.master) return
    if (context.state === 'suspended') void context.resume().catch(() => undefined)
    this.setVolume(volume, muted)
    for (const sound of cue.sounds) this.playSound(context, this.master, sound)
  }

  private playSound(context: AudioContext, master: GainNode, sound: IntroSfxSound): void {
    const now = context.currentTime
    const end = now + sound.durationSeconds
    const gain = context.createGain()
    // Fast attack, exponential-ish decay: the shape a PSG envelope makes.
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(sound.gain, now + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    gain.connect(master)

    if (sound.voice === 'noise') {
      if (!this.noiseBuffer) return
      const source = context.createBufferSource()
      source.buffer = this.noiseBuffer
      const filter = context.createBiquadFilter()
      filter.type = 'bandpass'
      filter.Q.value = 0.8
      filter.frequency.setValueAtTime(sound.frequency, now)
      filter.frequency.linearRampToValueAtTime(Math.max(40, sound.endFrequency), end)
      source.connect(filter)
      filter.connect(gain)
      source.start(now)
      source.stop(end)
      return
    }

    const oscillator = context.createOscillator()
    oscillator.type = sound.voice
    oscillator.frequency.setValueAtTime(sound.frequency, now)
    if (sound.endFrequency !== sound.frequency) {
      oscillator.frequency.linearRampToValueAtTime(Math.max(20, sound.endFrequency), end)
    }
    oscillator.connect(gain)
    oscillator.start(now)
    oscillator.stop(end)
  }

  dispose(): void {
    const context = this.context
    this.context = null
    this.master = null
    this.noiseBuffer = null
    if (context) void context.close().catch(() => undefined)
  }
}
