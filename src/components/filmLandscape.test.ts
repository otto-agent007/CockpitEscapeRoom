import { describe, expect, it } from 'vitest'

import { createFilmLandscapeController } from './filmLandscape'

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => { resolve = done })
  return { promise, resolve }
}

function browser() {
  const effects: string[] = []
  const listeners = new Set<() => void>()
  const document = {
    fullscreenEnabled: true,
    fullscreenElement: null as object | null,
    async exitFullscreen() { effects.push('exit'); document.fullscreenElement = null },
    addEventListener(_name: string, callback: () => void) { listeners.add(callback) },
    removeEventListener(_name: string, callback: () => void) { listeners.delete(callback) },
  }
  const target = {
    async requestFullscreen() { effects.push('fullscreen'); document.fullscreenElement = target },
  }
  const video = {
    webkitDisplayingFullscreen: false,
    webkitEnterFullscreen() { effects.push('native'); video.webkitDisplayingFullscreen = true },
    webkitExitFullscreen() { effects.push('native-exit'); video.webkitDisplayingFullscreen = false },
  }
  const orientation = {
    async lock(value: 'landscape') { effects.push(value) },
    unlock() { effects.push('unlock') },
  }
  return { effects, document, target, video, orientation, fullscreenChanged: () => listeners.forEach((callback) => callback()) }
}

describe('film landscape lifecycle', () => {
  it('requests fullscreen before landscape and releases its own presentation', async () => {
    const env = browser()
    const film = createFilmLandscapeController(env)
    expect(env.effects).toEqual([])
    expect(await film.request()).toBe('landscape')
    expect(env.effects).toEqual(['fullscreen', 'landscape'])
    film.dispose()
    expect(env.effects).toEqual(['fullscreen', 'landscape', 'unlock', 'exit'])
    film.dispose()
    expect(env.effects).toEqual(['fullscreen', 'landscape', 'unlock', 'exit'])
  })

  it('uses existing fullscreen without taking ownership of it', async () => {
    const env = browser()
    const ancestor = {}
    env.document.fullscreenElement = ancestor
    const film = createFilmLandscapeController(env)
    expect(await film.request()).toBe('landscape')
    film.dispose()
    expect(env.effects).toEqual(['landscape', 'unlock'])
    expect(env.document.fullscreenElement).toBe(ancestor)
  })

  it('uses native iOS video fullscreen in the gesture when generic fullscreen is unavailable', async () => {
    const env = browser()
    const film = createFilmLandscapeController({ ...env, target: {} })
    const result = film.request()
    expect(env.effects).toEqual(['native'])
    expect(await result).toBe('native')
    film.dispose()
    expect(env.effects).toEqual(['native', 'native-exit'])
  })

  it('uses native video fullscreen when the browser explicitly disables generic fullscreen', async () => {
    const env = browser()
    env.document.fullscreenEnabled = false
    const film = createFilmLandscapeController(env)
    const result = film.request()
    expect(env.effects).toEqual(['native'])
    expect(await result).toBe('native')
    film.dispose()
    expect(env.effects).toEqual(['native', 'native-exit'])
  })

  it('returns rotation guidance when all fullscreen APIs are missing', async () => {
    const env = browser()
    const film = createFilmLandscapeController({ ...env, target: {}, video: {}, orientation: undefined })
    expect(await film.request()).toBe('rotate')
    film.dispose()
    expect(env.effects).toEqual([])
  })

  it.each(['missing', 'rejected', 'throws'] as const)('keeps fullscreen usable with a %s orientation API', async (mode) => {
    const env = browser()
    const orientation = mode === 'missing' ? undefined : {
      lock() {
        if (mode === 'throws') throw new Error('blocked')
        return Promise.reject(new Error('blocked'))
      },
      unlock: env.orientation.unlock,
    }
    const film = createFilmLandscapeController({ ...env, orientation })
    expect(await film.request()).toBe('rotate')
    film.dispose()
    expect(env.effects).toEqual(['fullscreen', 'exit'])
  })

  it.each(['rejected', 'throws'] as const)('recovers from %s fullscreen without requesting an orientation lock', async (mode) => {
    const env = browser()
    const target = {
      requestFullscreen() {
        if (mode === 'throws') throw new Error('blocked')
        return Promise.reject(new Error('blocked'))
      },
    }
    const film = createFilmLandscapeController({ ...env, target })
    expect(await film.request()).toBe('rotate')
    film.dispose()
    expect(env.effects).toEqual([])
  })

  it('recovers when native Safari fullscreen throws', async () => {
    const env = browser()
    const film = createFilmLandscapeController({ ...env, target: {}, video: { webkitEnterFullscreen() { throw new Error('unavailable') } } })
    expect(await film.request()).toBe('rotate')
    film.dispose()
    expect(env.effects).toEqual([])
  })

  it('does not lock landscape if fullscreen arrives after skip or unmount', async () => {
    const env = browser()
    const fullscreen = deferred()
    env.target.requestFullscreen = async () => {
      await fullscreen.promise
      env.document.fullscreenElement = env.target
      env.effects.push('fullscreen')
    }
    const film = createFilmLandscapeController(env)
    const result = film.request()
    film.dispose()
    fullscreen.resolve()
    expect(await result).toBe('cancelled')
    expect(env.effects).toEqual(['fullscreen', 'exit'])
  })

  it('releases a landscape lock that resolves after skip or unmount', async () => {
    const env = browser()
    const lock = deferred()
    env.orientation.lock = async () => {
      await lock.promise
      env.effects.push('landscape')
    }
    const film = createFilmLandscapeController(env)
    const result = film.request()
    await Promise.resolve()
    film.dispose()
    lock.resolve()
    expect(await result).toBe('cancelled')
    expect(env.effects).toEqual(['fullscreen', 'exit', 'landscape', 'unlock'])
  })

  it('releases only its lock when the player leaves fullscreen', async () => {
    const env = browser()
    const film = createFilmLandscapeController(env)
    expect(await film.request()).toBe('landscape')
    env.document.fullscreenElement = null
    env.fullscreenChanged()
    film.dispose()
    expect(env.effects).toEqual(['fullscreen', 'landscape', 'unlock'])
  })

  it('does not exit unrelated fullscreen if the player changed fullscreen targets', async () => {
    const env = browser()
    const film = createFilmLandscapeController(env)
    expect(await film.request()).toBe('landscape')
    const elsewhere = {}
    env.document.fullscreenElement = elsewhere
    env.fullscreenChanged()
    film.dispose()
    expect(env.effects).toEqual(['fullscreen', 'landscape', 'unlock'])
    expect(env.document.fullscreenElement).toBe(elsewhere)
  })
})
