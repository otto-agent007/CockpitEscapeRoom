import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSecretArcadeHold, SECRET_ARCADE_HOLD_MS } from './secretArcadeHold'

describe('earned arcade title hold', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('opens only after the complete three-second hold and fires once', () => {
    const open = vi.fn()
    const hold = createSecretArcadeHold(open)
    expect(SECRET_ARCADE_HOLD_MS).toBe(3000)
    hold.start()
    vi.advanceTimersByTime(2999)
    expect(open).not.toHaveBeenCalled()
    hold.start()
    vi.advanceTimersByTime(1)
    expect(open).toHaveBeenCalledTimes(1)
    hold.start()
    vi.advanceTimersByTime(6000)
    expect(open).toHaveBeenCalledTimes(1)
  })

  it('cancels an interrupted hold without carrying time into the next attempt', () => {
    const open = vi.fn()
    const hold = createSecretArcadeHold(open)
    hold.start()
    vi.advanceTimersByTime(2900)
    hold.cancel()
    vi.advanceTimersByTime(3000)
    expect(open).not.toHaveBeenCalled()
    hold.start()
    vi.advanceTimersByTime(2999)
    expect(open).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(open).toHaveBeenCalledTimes(1)
  })

  it('releases a completed hold so a later independent hold can open again', () => {
    const open = vi.fn()
    const hold = createSecretArcadeHold(open)
    hold.start()
    vi.advanceTimersByTime(3000)
    hold.cancel()
    hold.start()
    vi.advanceTimersByTime(3000)
    expect(open).toHaveBeenCalledTimes(2)
  })
})
