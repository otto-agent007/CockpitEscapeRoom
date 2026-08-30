import { describe, expect, it } from 'vitest'
import {
  canonicalDc9DepartureFrame,
  createInitialDc9DepartureProgress,
  dc9DepartureGuidance,
  type Dc9DepartureFrame,
  type Dc9DepartureProgress,
} from './dc9MemphisDeparture'
import {
  createDc9DepartureHtmlPublicationScheduler,
  createDc9DepartureCompletionGate,
  dispatchDc9DepartureDurableEvent,
  type Dc9DepartureHtmlPublication,
} from './useDc9MemphisDeparture'

function createTimers() {
  let now = 0
  let nextId = 0
  const tasks = new Map<number, { due: number; callback: () => void }>()
  return {
    schedule(callback: () => void, delay: number) {
      const id = nextId += 1
      tasks.set(id, { due: now + delay, callback })
      return id
    },
    cancel(id: unknown) {
      tasks.delete(id as number)
    },
    advance(milliseconds: number) {
      now += milliseconds
      for (const [id, task] of [...tasks]) {
        if (task.due > now) continue
        tasks.delete(id)
        task.callback()
      }
    },
  }
}

function publication(frame: Dc9DepartureFrame): Dc9DepartureHtmlPublication {
  return {
    frame,
    guidance: dc9DepartureGuidance(frame),
  }
}

describe('DC-9 Memphis departure HTML publication', () => {
  it('waits for the committed initial-climb checkpoint before completing once', () => {
    const calls: string[] = []
    const gate = createDc9DepartureCompletionGate()

    gate.request('runwayLineup', () => calls.push('complete'))
    gate.request('runwayLineup', () => calls.push('complete'))
    expect(calls).toEqual([])

    gate.commit('initialClimb', () => calls.push('complete'))
    gate.commit('initialClimb', () => calls.push('complete'))
    expect(calls).toEqual(['complete'])
  })

  it('clears a pending completion on restore or inactive exit', () => {
    const calls: string[] = []
    const gate = createDc9DepartureCompletionGate()

    gate.request('runwayLineup', () => calls.push('complete'))
    gate.clear()
    gate.commit('initialClimb', () => calls.push('complete'))
    expect(calls).toEqual([])

    gate.request('runwayLineup', () => calls.push('complete'))
    gate.clear()
    gate.commit('initialClimb', () => calls.push('complete'))
    expect(calls).toEqual([])
  })

  it('coalesces rAF, event, and restore requests into one latest publication per 80 ms window', () => {
    const timers = createTimers()
    const published: Dc9DepartureHtmlPublication[] = []
    const scheduler = createDc9DepartureHtmlPublicationScheduler({
      schedule: timers.schedule,
      cancel: timers.cancel,
      publish: (next) => published.push(next),
    })
    const ramp = canonicalDc9DepartureFrame('rampStart')
    const taxi = canonicalDc9DepartureFrame('taxiTurn')
    const hold = canonicalDc9DepartureFrame('holdShort')

    scheduler.request(publication(ramp))
    scheduler.request(publication(taxi))
    scheduler.request(publication(hold))
    timers.advance(79)
    expect(published).toEqual([])

    timers.advance(1)
    expect(published).toEqual([publication(hold)])
  })

  it('keeps durable checkpoint, mistake, and completion callbacks immediate', () => {
    const timers = createTimers()
    const published: Dc9DepartureHtmlPublication[] = []
    const scheduler = createDc9DepartureHtmlPublicationScheduler({
      schedule: timers.schedule,
      cancel: timers.cancel,
      publish: (next) => published.push(next),
    })
    const callbacks: string[] = []
    const emitted = new Set<string>()
    const callbacksByEvent = {
      onCheckpoint: (checkpoint: string) => callbacks.push(`checkpoint:${checkpoint}`),
      onMistake: (beat: string) => callbacks.push(`mistake:${beat}`),
      onComplete: () => callbacks.push('complete'),
    }
    let progress = createInitialDc9DepartureProgress()

    scheduler.request(publication(canonicalDc9DepartureFrame('rampStart')))
    progress = dispatchDc9DepartureDurableEvent(
      { type: 'checkpoint', checkpoint: 'taxiTurn' }, progress, emitted, callbacksByEvent,
    ) ?? progress
    progress = dispatchDc9DepartureDurableEvent(
      { type: 'mistake', beat: 'taxi', reason: 'pathDeviation' }, progress, emitted, callbacksByEvent,
    ) ?? progress
    dispatchDc9DepartureDurableEvent({ type: 'complete' }, progress, emitted, callbacksByEvent)

    expect(callbacks).toEqual(['checkpoint:taxiTurn', 'mistake:taxi', 'complete'])
    expect(published).toEqual([])
  })

  it('uses the incremented mistake progress for paused guidance', () => {
    const timers = createTimers()
    const published: Dc9DepartureHtmlPublication[] = []
    const scheduler = createDc9DepartureHtmlPublicationScheduler({
      schedule: timers.schedule,
      cancel: timers.cancel,
      publish: (next) => published.push(next),
    })
    const progress: Dc9DepartureProgress = {
      ...createInitialDc9DepartureProgress(),
      checkpoint: 'holdShort' as const,
      completedBeats: ['rampRelease', 'taxi'],
      attempts: { holdShort: 2 },
      hintLevel: 2 as const,
    }
    const next = dispatchDc9DepartureDurableEvent(
      { type: 'mistake', beat: 'holdShort', reason: 'unsafeHold' },
      progress,
      new Set(),
      { onCheckpoint: () => undefined, onMistake: () => undefined, onComplete: () => undefined },
    )
    const frame = canonicalDc9DepartureFrame('holdShort')

    scheduler.request({ frame, guidance: dc9DepartureGuidance(frame, next?.hintLevel) })
    timers.advance(80)
    expect(published[0]?.guidance.correctiveText).toBe('Settle fully at the marked hold before confirming.')
  })

  it('cannot publish a pending frame after clear or disposal', () => {
    const timers = createTimers()
    const published: Dc9DepartureHtmlPublication[] = []
    const scheduler = createDc9DepartureHtmlPublicationScheduler({
      schedule: timers.schedule,
      cancel: timers.cancel,
      publish: (next) => published.push(next),
    })

    scheduler.request(publication(canonicalDc9DepartureFrame('rampStart')))
    scheduler.clear()
    timers.advance(80)
    scheduler.request(publication(canonicalDc9DepartureFrame('taxiTurn')))
    scheduler.dispose()
    timers.advance(80)

    expect(published).toEqual([])
  })
})
