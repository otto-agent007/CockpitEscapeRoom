import { describe, expect, it } from 'vitest'
import { preferPlaybackAudioSession } from './audioSession'

describe('iOS playback audio session', () => {
  it('asks WebKit to treat the page as media playback, so the silent switch does not mute Web Audio', () => {
    const nav = { audioSession: { type: 'auto' } }
    expect(preferPlaybackAudioSession(nav)).toBe(true)
    expect(nav.audioSession.type).toBe('playback')
    expect(preferPlaybackAudioSession(nav)).toBe(true)
  })

  it('does nothing in browsers without the Audio Session API', () => {
    expect(preferPlaybackAudioSession({})).toBe(false)
  })

  it('survives a session that refuses the change', () => {
    const nav = { audioSession: { get type() { return 'auto' }, set type(_value: string) { throw new Error('refused') } } }
    expect(preferPlaybackAudioSession(nav)).toBe(false)
  })
})
