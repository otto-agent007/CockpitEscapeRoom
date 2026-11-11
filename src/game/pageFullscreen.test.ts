import { describe, expect, it } from 'vitest'
import {
  pageFullscreenAvailable,
  requestPageFullscreen,
  runningFromHomeScreen,
  togglePageFullscreen,
  type FullscreenDocument,
  type FullscreenTarget,
} from './pageFullscreen'

describe('page fullscreen across browsers', () => {
  it('uses the standard API where the browser enables it (desktop, Android)', async () => {
    const calls: string[] = []
    const target: FullscreenTarget = { requestFullscreen: async () => { calls.push('standard') } }
    const doc: FullscreenDocument = { fullscreenEnabled: true }
    expect(pageFullscreenAvailable(target, doc)).toBe(true)
    expect(await togglePageFullscreen(target, doc)).toBe('entered')
    expect(calls).toEqual(['standard'])
  })

  it('falls back to the webkit-prefixed call (older iPad Safari)', async () => {
    const calls: string[] = []
    const target: FullscreenTarget = { webkitRequestFullscreen: () => { calls.push('webkit') } }
    expect(await requestPageFullscreen(target, {})).toBe('entered')
    expect(calls).toEqual(['webkit'])
  })

  it('reports unavailable on an iPhone browser, where only video can go fullscreen', async () => {
    // iPhone WebKit may expose requestFullscreen but reports fullscreenEnabled false.
    const target: FullscreenTarget = { requestFullscreen: async () => { throw new Error('not allowed') } }
    const doc: FullscreenDocument = { fullscreenEnabled: false }
    expect(pageFullscreenAvailable(target, doc)).toBe(false)
    expect(await togglePageFullscreen(target, doc)).toBe('unavailable')
    expect(pageFullscreenAvailable({}, {})).toBe(false)
    expect(pageFullscreenAvailable(null, {})).toBe(false)
  })

  it('exits whichever fullscreen is active and never throws on a refused request', async () => {
    const calls: string[] = []
    const doc: FullscreenDocument = {
      fullscreenEnabled: true,
      fullscreenElement: {} as Element,
      exitFullscreen: async () => { calls.push('exit') },
    }
    expect(await togglePageFullscreen({ requestFullscreen: async () => undefined }, doc)).toBe('exited')
    expect(calls).toEqual(['exit'])
    const refusing: FullscreenTarget = { requestFullscreen: async () => { throw new Error('denied') } }
    expect(await requestPageFullscreen(refusing, { fullscreenEnabled: true })).toBe('unavailable')
  })

  it('knows when the game was opened from a Home Screen icon', () => {
    const media = (standalone: boolean) => ({ matchMedia: (query: string) => ({ matches: standalone && query === '(display-mode: standalone)' }) })
    expect(runningFromHomeScreen(media(true))).toBe(true)
    expect(runningFromHomeScreen(media(false))).toBe(false)
    expect(runningFromHomeScreen({ navigator: { standalone: true } })).toBe(true)
    expect(runningFromHomeScreen({})).toBe(false)
  })
})
