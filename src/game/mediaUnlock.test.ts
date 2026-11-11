import { describe, expect, it } from 'vitest'
import { createMediaUnlock } from './mediaUnlock'

class FakeMedia {
  tagName: string
  paused = true
  muted = true
  playsInline = false
  attributes = new Map<string, string>()
  calls: string[] = []
  constructor(tagName: string) { this.tagName = tagName }
  setAttribute(name: string, value: string) { this.attributes.set(name, value) }
  play() {
    this.calls.push(`play muted=${this.muted}`)
    return Promise.reject(new Error('no source yet'))
  }
  pause() { this.calls.push('pause') }
}

function unlockWithFakes() {
  const created: FakeMedia[] = []
  const unlock = createMediaUnlock({
    createElement: (tagName) => {
      const media = new FakeMedia(tagName)
      created.push(media)
      return media as unknown as HTMLMediaElement
    },
  })
  return { unlock, created }
}

describe('media unlock for iPhone sound', () => {
  it('blesses the film once with an unmuted play() that is paused in the same task', () => {
    const { unlock, created } = unlockWithFakes()
    unlock.bless()
    unlock.bless()
    expect(created.map((media) => media.tagName)).toEqual(['video'])
    expect(created[0]!.calls).toEqual(['play muted=false', 'pause'])
    expect(unlock.isBlessed('rewardFilm')).toBe(true)
  })

  it('hands components the same element it blessed, and makes the video play inline', () => {
    const { unlock } = unlockWithFakes()
    const before = unlock.element('rewardFilm')
    unlock.bless(['rewardFilm'])
    const film = unlock.element('rewardFilm') as unknown as FakeMedia
    expect(film).toBe(before)
    expect(film.playsInline).toBe(true)
    expect(film.attributes.get('playsinline')).toBe('')
  })

  it('leaves an element that is already playing alone', () => {
    const { unlock } = unlockWithFakes()
    const film = unlock.element('rewardFilm') as unknown as FakeMedia
    film.paused = false
    unlock.bless(['rewardFilm'])
    expect(film.calls).toEqual([])
  })

  it('survives a browser whose play() throws instead of rejecting', () => {
    const { unlock, created } = unlockWithFakes()
    unlock.element('rewardFilm')
    created[0]!.play = () => { throw new Error('refused') }
    expect(() => unlock.bless(['rewardFilm'])).not.toThrow()
  })
})
