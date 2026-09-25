/**
 * Fighter playground — the tuning console beside the arcade harness.
 *
 * Dev-only. Binds the debug console's number fields to the tuning in force
 * (`setMarsArcadeTuning`), so a change is felt on the next frame, and saves the whole
 * tuning to `src/game/marsArcadeTuning.json` through the Vite endpoint so it survives
 * a reload and ships. The reference's rule: the feel loop is human and fast, and
 * the shipping game loads the same JSON.
 *
 * Also owns the bounds toggles the harness reads when it overlays the authored boxes
 * from the animation table on the sprites, and the two rule switches (`useBounds`,
 * `hitstop`), which are part of the tuning and save with it.
 */
import { MARS_ARCADE_METER_MAX, marsArcadeDefaultTuning, marsArcadeTuningInForce, setMarsArcadeTuning, type MarsArcadeButton, type MarsArcadeFighterId, type MarsArcadeTuning } from '../game/marsArcadeFighters'
import { MARS_ARCADE_FIGHTER_TUNING_FIELDS, MARS_ARCADE_MOVE_TUNING_FIELDS, applyShippedMarsArcadeTuning, parseMarsArcadeTuning } from '../game/marsArcadeTuning'
import type { MarsArcadeBoundKind } from '../game/marsArcadeBounds'
import type { MarsArcadeState } from '../game/marsArcade'

export interface PlaygroundBoxToggles {
  collision: boolean
  hurt: boolean
  attack: boolean
  guard: boolean
}

export interface ArcadePlayground {
  boxes: PlaygroundBoxToggles
  /** Re-read the fields from the tuning in force (after a reset or a fighter switch). */
  sync(): void
}

const FIGHTER_LABELS: Record<MarsArcadeFighterId, string> = { booster: 'Booster · Elon', oracle: 'Oracle · Sam', captain: 'Captain · Pop T' }
const FIELD_LABELS: Record<string, string> = {
  health: 'max hp', walkSpeed: 'walk speed', jumpVelocity: 'jump power', guardMax: 'guard max', guardRegenPerFrame: 'guard regen',
  damage: 'dmg', chipDamage: 'chip', guardDamage: 'guard dmg', knockback: 'kb', hitstunFrames: 'hitstun', blockstunFrames: 'blockstun',
  hitstopFrames: 'hitstop',
}
const STEP: Record<string, string> = { walkSpeed: '0.05', jumpVelocity: '0.1', guardRegenPerFrame: '0.01', gravity: '0.01' }

/**
 * Wire the console. `root` holds `#pg-fighter`, `#pg-gravity`, `#pg-fields`, `#pg-moves`,
 * `#pg-reset`, `#pg-save`, `#pg-fill-meter`, `#pg-status`, the `#pg-show-<kind>` toggles
 * and the `#pg-rule-<switch>` switches.
 */
export function startArcadePlayground(root: ParentNode, getState: () => MarsArcadeState): ArcadePlayground {
  const tuning: MarsArcadeTuning = structuredClone(applyShippedMarsArcadeTuning())
  const boxes: PlaygroundBoxToggles = { collision: false, hurt: true, attack: true, guard: false }
  const fighterSelect = root.querySelector<HTMLSelectElement>('#pg-fighter')
  const gravityField = root.querySelector<HTMLInputElement>('#pg-gravity')
  const fields = root.querySelector<HTMLElement>('#pg-fields')
  const moves = root.querySelector<HTMLElement>('#pg-moves')
  const status = root.querySelector<HTMLElement>('#pg-status')
  const say = (text: string): void => { if (status) status.textContent = text }
  let fighter: MarsArcadeFighterId = 'booster'

  for (const kind of ['collision', 'hurt', 'attack', 'guard'] as MarsArcadeBoundKind[]) {
    const toggle = root.querySelector<HTMLInputElement>(`#pg-show-${kind}`)
    if (!toggle) continue
    toggle.checked = boxes[kind]
    toggle.addEventListener('change', () => { boxes[kind] = toggle.checked })
  }

  if (fighterSelect) {
    for (const id of ['booster', 'oracle', 'captain'] as MarsArcadeFighterId[]) {
      const option = document.createElement('option')
      option.value = id
      option.textContent = FIGHTER_LABELS[id]
      fighterSelect.append(option)
    }
    fighterSelect.value = fighter
    fighterSelect.addEventListener('change', () => {
      fighter = fighterSelect.value as MarsArcadeFighterId
      sync()
    })
  }

  const apply = (): void => {
    try {
      setMarsArcadeTuning(parseMarsArcadeTuning(structuredClone(tuning)))
      say('tuning applied — felt on the next frame; Save to keep it')
    } catch (error) {
      say(`not applied — ${String(error)}`)
    }
  }

  const numberField = (id: string, label: string, value: number, step: string, onChange: (value: number) => void): HTMLElement => {
    const wrap = document.createElement('div')
    wrap.className = 'field narrow'
    const labelElement = document.createElement('label')
    labelElement.htmlFor = id
    labelElement.textContent = label
    const input = document.createElement('input')
    input.type = 'number'
    input.id = id
    input.step = step
    input.value = String(value)
    input.addEventListener('change', () => {
      const next = Number(input.value)
      if (!Number.isFinite(next)) return
      onChange(next)
      apply()
    })
    wrap.append(labelElement, input)
    return wrap
  }

  function sync(): void {
    const current = marsArcadeTuningInForce()
    Object.assign(tuning, structuredClone(current))
    if (gravityField) gravityField.value = String(tuning.stage.gravity)
    for (const { rule, toggle } of ruleToggles) if (toggle) toggle.checked = tuning.rules[rule]
    if (fields) {
      fields.replaceChildren()
      for (const key of MARS_ARCADE_FIGHTER_TUNING_FIELDS) {
        fields.append(numberField(`pg-${key}`, FIELD_LABELS[key] ?? key, tuning.fighters[fighter][key], STEP[key] ?? '1', (value) => {
          tuning.fighters[fighter][key] = value
        }))
      }
    }
    if (moves) {
      moves.replaceChildren()
      for (const button of ['light', 'heavy', 'special'] as MarsArcadeButton[]) {
        const row = document.createElement('div')
        row.className = 'row'
        const head = document.createElement('label')
        head.className = 'wide'
        head.textContent = button
        row.append(head)
        for (const key of MARS_ARCADE_MOVE_TUNING_FIELDS) {
          row.append(numberField(`pg-${button}-${key}`, FIELD_LABELS[key] ?? key, tuning.fighters[fighter].moves[button][key], '1', (value) => {
            tuning.fighters[fighter].moves[button][key] = value
          }))
        }
        moves.append(row)
      }
    }
  }

  const ruleToggles = (['useBounds', 'hitstop'] as const).map((rule) => {
    const toggle = root.querySelector<HTMLInputElement>(`#pg-rule-${rule}`)
    toggle?.addEventListener('change', () => {
      tuning.rules[rule] = toggle.checked
      apply()
    })
    return { rule, toggle }
  })

  gravityField?.addEventListener('change', () => {
    const next = Number(gravityField.value)
    if (!Number.isFinite(next)) return
    tuning.stage.gravity = next
    apply()
  })

  root.querySelector('#pg-reset')?.addEventListener('click', () => {
    setMarsArcadeTuning(marsArcadeDefaultTuning())
    sync()
    say('reset to the baked content — Save to make it the shipped tuning')
  })
  root.querySelector('#pg-fill-meter')?.addEventListener('click', () => {
    for (const side of getState().fighters) side.meter = MARS_ARCADE_METER_MAX
    say('both special bars filled')
  })
  root.querySelector('#pg-save')?.addEventListener('click', () => {
    void (async () => {
      let payload: MarsArcadeTuning
      try {
        payload = parseMarsArcadeTuning(structuredClone(tuning))
      } catch (error) {
        say(`not saved — ${String(error)}`)
        return
      }
      try {
        const response = await fetch('/__gym/tuning', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
        say(response.ok ? 'saved to src/game/marsArcadeTuning.json' : `save refused (${response.status}): ${await response.text()}`)
      } catch (error) {
        say(`save failed: ${String(error)}`)
      }
    })()
  })

  sync()
  return { boxes, sync }
}
