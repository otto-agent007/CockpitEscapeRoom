import { describe, expect, it, vi } from 'vitest'
import { attachDc9MemphisEnvironmentState } from './dc9MemphisLoadState'

describe('DC-9 cockpit and Memphis environment load state', () => {
  it('keeps a cockpit error primary when the environment is ready', () => {
    const combined = attachDc9MemphisEnvironmentState(
      { status: 'error', message: 'Cockpit contract failed.', loadedBytes: 10 },
      { status: 'ready', loadedBytes: 20, percentage: 100 },
      vi.fn(),
    )

    expect(combined.status).toBe('error')
    expect(combined.message).toBe('Cockpit contract failed.')
    expect(combined.memphisEnvironment).toEqual({ status: 'ready', loadedBytes: 20, percentage: 100 })
  })

  it('nests an environment error without replacing a ready cockpit', () => {
    const retry = vi.fn()
    const combined = attachDc9MemphisEnvironmentState(
      { status: 'ready', loadedBytes: 100, percentage: 100 },
      { status: 'error', loadedBytes: 20, message: 'Environment contract failed.' },
      retry,
    )

    expect(combined.status).toBe('ready')
    expect(combined.loadedBytes).toBe(100)
    expect(combined.memphisEnvironment).toEqual({
      status: 'error',
      loadedBytes: 20,
      message: 'Environment contract failed.',
      retry,
    })
  })

  it('retains both simultaneous failures and scopes retry to the environment', () => {
    const retry = vi.fn()
    const combined = attachDc9MemphisEnvironmentState(
      { status: 'error', message: 'Cockpit failed.' },
      { status: 'error', loadedBytes: 0, message: 'Environment failed.' },
      retry,
    )

    expect(combined.status).toBe('error')
    expect(combined.message).toBe('Cockpit failed.')
    combined.memphisEnvironment?.retry?.()
    expect(retry).toHaveBeenCalledOnce()
  })
})
