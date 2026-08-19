/**
 * The parked "flight controls — free and correct" sweep.
 *
 * The player walks every right-seat control to its stops. There is no failure state
 * and no timer: items latch as they are reached, in any order, and a latched item is
 * never taken away.
 */

import type { Dc9ControlState } from './dc9Input'

export const DC9_CONTROL_CHECK_ITEM_IDS = [
  'yokeAft',
  'yokeForward',
  'wheelLeft',
  'wheelRight',
  'rudderLeft',
  'rudderRight',
  'thrustAdvance',
  'thrustClosed',
] as const

export type Dc9ControlCheckItemId = (typeof DC9_CONTROL_CHECK_ITEM_IDS)[number]

export type Dc9ControlCheckGroupId = 'yoke' | 'rudder' | 'thrust'

interface Dc9ControlCheckItem {
  readonly id: Dc9ControlCheckItemId
  readonly group: Dc9ControlCheckGroupId
  /** Latches when the control reaches this deflection. */
  readonly reached: (state: Dc9ControlState) => boolean
  /** Latches only once this item has already latched. */
  readonly requires?: Dc9ControlCheckItemId
}

/** Full deflection, with a little tolerance so a held key always registers. */
const FULL = 0.95
/** Levers count as closed only when they are genuinely back against the stop. */
const CLOSED = 0.02

const ITEMS: readonly Dc9ControlCheckItem[] = [
  { id: 'yokeAft', group: 'yoke', reached: (state) => state.pitch >= FULL },
  { id: 'yokeForward', group: 'yoke', reached: (state) => state.pitch <= -FULL },
  { id: 'wheelLeft', group: 'yoke', reached: (state) => state.roll <= -FULL },
  { id: 'wheelRight', group: 'yoke', reached: (state) => state.roll >= FULL },
  { id: 'rudderLeft', group: 'rudder', reached: (state) => state.rudder <= -FULL },
  { id: 'rudderRight', group: 'rudder', reached: (state) => state.rudder >= FULL },
  { id: 'thrustAdvance', group: 'thrust', reached: (state) => state.thrust >= FULL },
  {
    id: 'thrustClosed',
    group: 'thrust',
    reached: (state) => state.thrust <= CLOSED,
    requires: 'thrustAdvance',
  },
]

export const DC9_CONTROL_CHECK_ITEMS = ITEMS

export const DC9_CONTROL_CHECK_GROUP_IDS = ['yoke', 'rudder', 'thrust'] as const

export function dc9ControlCheckItemsInGroup(group: Dc9ControlCheckGroupId): Dc9ControlCheckItemId[] {
  return ITEMS.filter((item) => item.group === group).map((item) => item.id)
}

/**
 * Items newly satisfied by the current control positions. Returns an empty array when
 * nothing changed so a caller can skip dispatching.
 */
export function dc9ControlCheckReached(
  state: Dc9ControlState,
  completed: readonly Dc9ControlCheckItemId[],
): Dc9ControlCheckItemId[] {
  const done = new Set(completed)
  const reached: Dc9ControlCheckItemId[] = []
  for (const item of ITEMS) {
    if (done.has(item.id)) continue
    if (item.requires && !done.has(item.requires)) continue
    if (!item.reached(state)) continue
    reached.push(item.id)
    done.add(item.id)
  }
  return reached
}

export function dc9ControlCheckComplete(completed: readonly Dc9ControlCheckItemId[]): boolean {
  const done = new Set(completed)
  return DC9_CONTROL_CHECK_ITEM_IDS.every((id) => done.has(id))
}

export function dc9ControlCheckRemaining(
  completed: readonly Dc9ControlCheckItemId[],
): Dc9ControlCheckItemId[] {
  const done = new Set(completed)
  return DC9_CONTROL_CHECK_ITEM_IDS.filter((id) => !done.has(id))
}

/**
 * The next item worth coaching. `thrustClosed` is held back until the levers have been
 * advanced, so the prompt never asks for something the player cannot do yet.
 */
export function dc9ControlCheckNextItem(
  completed: readonly Dc9ControlCheckItemId[],
): Dc9ControlCheckItemId | null {
  const done = new Set(completed)
  for (const item of ITEMS) {
    if (done.has(item.id)) continue
    if (item.requires && !done.has(item.requires)) continue
    return item.id
  }
  return null
}

/** Filters a persisted list back down to ids this build still recognises. */
export function normalizeDc9ControlCheckProgress(value: unknown): Dc9ControlCheckItemId[] {
  if (!Array.isArray(value)) return []
  const known = new Set<string>(DC9_CONTROL_CHECK_ITEM_IDS)
  const kept = new Set<Dc9ControlCheckItemId>()
  for (const entry of value) {
    if (typeof entry === 'string' && known.has(entry)) kept.add(entry as Dc9ControlCheckItemId)
  }
  // A dependent item cannot outlive the item it depends on.
  for (const item of ITEMS) {
    if (item.requires && kept.has(item.id) && !kept.has(item.requires)) kept.delete(item.id)
  }
  return DC9_CONTROL_CHECK_ITEM_IDS.filter((id) => kept.has(id))
}
