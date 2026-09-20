/**
 * Mars arcade box harness — a disposable tuning rig.
 *
 * Renders the committed fight loop as coloured boxes so the feel can be judged,
 * and the frame data tuned, before a single sprite is generated. Every number on
 * screen comes from `src/game/marsArcade.ts` and `src/game/marsArcadeFighters.ts`;
 * this file draws and nothing else, so what you feel here is what the game does.
 *
 * Dev-only, served at /dev/arcade.html by `npm run dev`. It is not an entry in the
 * production build and nothing in the application imports it.
 *
 * Deliberately vanilla: no React, so there is no StrictMode double-mount to reason
 * about in a tool whose whole job is a stable animation loop.
 */

import {
  MARS_ARCADE_STAGE,
  MARS_ARCADE_TIMING,
  advanceMarsArcade,
  createMarsArcadeRound,
  marsArcadeActiveMove,
  marsArcadeTimerSeconds,
  type MarsArcadeEvent,
  type MarsArcadeFighterState,
  type MarsArcadeInput,
  type MarsArcadeState,
} from '../game/marsArcade'
import {
  MARS_ARCADE_METER_MAX,
  marsArcadeFighter,
  type MarsArcadeFighterId,
} from '../game/marsArcadeFighters'
import {
  advanceMarsArcadeOpponent,
  createMarsArcadeOpponent,
  type MarsArcadeDifficulty,
  type MarsArcadeOpponent,
} from '../game/marsArcadeOpponent'
import {
  PLAYER_ONE_BINDINGS,
  PLAYER_TWO_BINDINGS,
  inputFromKeys,
} from './arcadeHarnessInput'

const STAGE_WIDTH = 320
const STAGE_HEIGHT = 224
const FLOOR_ROW = 188
const SCALE = 3
const FIGHTER_HEIGHT = 104
/**
 * The pushbox is 24 px and is rules; the drawn character is 44 px and is art.
 * Both are on screen because a fighter that reads far wider than it collides is
 * the commonest way a boxed prototype lies about its own spacing.
 * Source: asset-reports/mars-arcade-sprite-contract.json character.standingWidthPx.
 */
const SPRITE_STANDING_WIDTH = 44

const SPEEDS = [1, 0.5, 0.25] as const
const FIGHTER_ORDER: MarsArcadeFighterId[] = ['booster', 'oracle', 'captain']

const COLOURS: Record<MarsArcadeFighterId, string> = {
  booster: '#ff7a2f',
  oracle: '#39c7d8',
  captain: '#3a5ba8',
}

const STATE_TINT: Record<string, string> = {
  hitstun: '#ff3b30',
  blockstun: '#4a7bff',
  attack: '#ffd23f',
  airborne: '#ffffff',
}

interface Harness {
  state: MarsArcadeState
  opponent: MarsArcadeOpponent
  leftId: MarsArcadeFighterId
  rightId: MarsArcadeFighterId
  difficulty: MarsArcadeDifficulty
  humanRight: boolean
  speedIndex: number
  paused: boolean
  stepRequested: boolean
  showHitboxes: boolean
  log: string[]
  seed: number
}

const held = new Set<string>()
/**
 * Buttons pressed while paused, delivered on the next stepped frame.
 *
 * Without this, stepping is useless for reading frame data: a tap is released long
 * before the next step samples the held set, so the move never starts.
 */
const pending = new Set<string>()

function newRound(harness: Harness): void {
  harness.state = createMarsArcadeRound(harness.leftId, harness.rightId)
  harness.seed += 1
  harness.opponent = createMarsArcadeOpponent(1, harness.difficulty, harness.seed)
  harness.log = []
}

function stageX(x: number): number {
  return (STAGE_WIDTH / 2 + x) * SCALE
}

function stageY(y: number): number {
  return (FLOOR_ROW - y) * SCALE
}

function drawFighter(
  ctx: CanvasRenderingContext2D,
  fighter: MarsArcadeFighterState,
  id: MarsArcadeFighterId,
): void {
  const half = (MARS_ARCADE_STAGE.pushboxWidth / 2) * SCALE
  const left = stageX(fighter.x) - half
  const feet = stageY(fighter.y)
  const height = FIGHTER_HEIGHT * SCALE

  ctx.fillStyle = COLOURS[id]
  ctx.fillRect(left, feet - height, half * 2, height)

  const tint = STATE_TINT[fighter.activity]
  if (tint) {
    ctx.globalAlpha = fighter.activity === 'airborne' ? 0.18 : 0.42
    ctx.fillStyle = tint
    ctx.fillRect(left, feet - height, half * 2, height)
    ctx.globalAlpha = 1
  }

  // The silhouette the finished sprite will occupy, around the collision box.
  const spriteHalf = (SPRITE_STANDING_WIDTH / 2) * SCALE
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.strokeRect(stageX(fighter.x) - spriteHalf, feet - height, spriteHalf * 2, height)
  ctx.setLineDash([])

  if (fighter.blocking) {
    ctx.strokeStyle = '#8ab4ff'
    ctx.lineWidth = 3
    ctx.strokeRect(left - 3, feet - height - 3, half * 2 + 6, height + 6)
  }

  // Facing nub: which way the fighter's hitboxes will come out.
  ctx.fillStyle = '#ffffff'
  const nubWidth = 5 * SCALE
  const nubX = fighter.facing === 1 ? left + half * 2 : left - nubWidth
  ctx.fillRect(nubX, feet - height * 0.72, nubWidth, 6 * SCALE)
}

function drawMoveRegion(
  ctx: CanvasRenderingContext2D,
  fighter: MarsArcadeFighterState,
  showHitboxes: boolean,
): void {
  if (!showHitboxes) return
  const active = marsArcadeActiveMove(fighter)
  if (!active || active.move.reach <= 0 || active.move.damage <= 0) return
  if (active.phase === 'recovery') return

  // The engine hits when the opponent is within `reach` horizontally and its feet
  // sit at or below `maxHeight`. Draw exactly that region, nothing prettier.
  const reachPx = Math.min(active.move.reach, STAGE_WIDTH) * SCALE
  const originX = stageX(fighter.x)
  const left = fighter.facing === 1 ? originX : originX - reachPx
  const top = stageY(fighter.y + active.move.maxHeight)
  const bottom = stageY(fighter.y)

  if (active.phase === 'active') {
    ctx.fillStyle = 'rgba(255, 59, 48, 0.28)'
    ctx.fillRect(left, top, reachPx, bottom - top)
    ctx.strokeStyle = '#ff3b30'
    ctx.setLineDash([])
  } else {
    ctx.strokeStyle = 'rgba(255, 210, 63, 0.85)'
    ctx.setLineDash([6, 5])
  }
  ctx.lineWidth = 2
  ctx.strokeRect(left, top, reachPx, bottom - top)
  ctx.setLineDash([])

  // The engine compares fighter CENTRES against reach; it is not a box overlap test.
  // Drawn without this cap the region looks like it touches an opponent it misses.
  const capX = stageX(fighter.x + fighter.facing * active.move.reach)
  ctx.strokeStyle = active.phase === 'active' ? '#ff3b30' : 'rgba(255, 210, 63, 0.85)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(capX, top - 10)
  ctx.lineTo(capX, bottom + 10)
  ctx.stroke()
}

/** Each fighter's centre — the point the reach test actually measures to. */
function drawCentreLine(ctx: CanvasRenderingContext2D, fighter: MarsArcadeFighterState): void {
  const x = stageX(fighter.x)
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 4])
  ctx.beginPath()
  ctx.moveTo(x, stageY(0) - FIGHTER_HEIGHT * SCALE - 14)
  ctx.lineTo(x, stageY(0) + 10)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawProjectiles(ctx: CanvasRenderingContext2D, state: MarsArcadeState): void {
  const size = MARS_ARCADE_STAGE.projectileRadius * 2 * SCALE
  for (const projectile of state.projectiles) {
    ctx.fillStyle = 'rgba(57, 199, 216, 0.75)'
    ctx.fillRect(stageX(projectile.x) - size / 2, stageY(projectile.y) - size / 2, size, size)
    ctx.strokeStyle = '#39c7d8'
    ctx.lineWidth = 2
    ctx.strokeRect(stageX(projectile.x) - size / 2, stageY(projectile.y) - size / 2, size, size)
  }
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fraction: number,
  colour: string,
  rightToLeft: boolean,
): void {
  ctx.fillStyle = '#1b1b22'
  ctx.fillRect(x, y, width, height)
  const filled = Math.max(0, Math.min(1, fraction)) * width
  ctx.fillStyle = colour
  ctx.fillRect(rightToLeft ? x + width - filled : x, y, filled, height)
  ctx.strokeStyle = '#55555f'
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1)
}

function drawHud(ctx: CanvasRenderingContext2D, harness: Harness): void {
  const { state } = harness
  const width = STAGE_WIDTH * SCALE
  const barWidth = width * 0.38

  for (const side of [0, 1] as const) {
    const fighter = state.fighters[side]
    const content = marsArcadeFighter(fighter.id)
    const x = side === 0 ? 16 : width - 16 - barWidth
    drawBar(ctx, x, 16, barWidth, 18, fighter.health / content.health, '#ff5f4d', side === 1)
    drawBar(ctx, x, 38, barWidth, 7, fighter.meter / MARS_ARCADE_METER_MAX, '#ffd23f', side === 1)
    drawBar(ctx, x, 49, barWidth, 5, fighter.guard / content.guardMax, '#4a7bff', side === 1)

    ctx.fillStyle = '#e9e9f2'
    ctx.font = '600 13px ui-monospace, monospace'
    ctx.textAlign = side === 0 ? 'left' : 'right'
    ctx.fillText(content.label, side === 0 ? x : x + barWidth, 70)
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 26px ui-monospace, monospace'
  ctx.fillText(String(marsArcadeTimerSeconds(state)), width / 2, 40)

  if (state.phase === 'intro') {
    ctx.font = '700 30px ui-monospace, monospace'
    ctx.fillText('READY', width / 2, STAGE_HEIGHT * SCALE * 0.45)
  } else if (state.phase === 'ko' || state.phase === 'timeOver') {
    const banner =
      state.winner === null
        ? 'DRAW'
        : `${state.phase === 'ko' ? 'K.O.' : 'TIME'} — ${marsArcadeFighter(state.fighters[state.winner].id).label}`
    ctx.font = '700 28px ui-monospace, monospace'
    ctx.fillStyle = '#ffd23f'
    ctx.fillText(banner, width / 2, STAGE_HEIGHT * SCALE * 0.45)
    ctx.font = '500 15px ui-monospace, monospace'
    ctx.fillStyle = '#c9c9d6'
    ctx.fillText('R to run it again', width / 2, STAGE_HEIGHT * SCALE * 0.45 + 30)
  }
  ctx.textAlign = 'left'
}

function draw(ctx: CanvasRenderingContext2D, harness: Harness): void {
  const width = STAGE_WIDTH * SCALE
  const height = STAGE_HEIGHT * SCALE

  ctx.fillStyle = '#14101a'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#2b1d20'
  ctx.fillRect(0, stageY(0), width, height - stageY(0))
  ctx.strokeStyle = '#6b4a44'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, stageY(0))
  ctx.lineTo(width, stageY(0))
  ctx.stroke()

  // Stage walls: the clamp the fight loop actually enforces.
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 1
  for (const wall of [-MARS_ARCADE_STAGE.halfWidth, MARS_ARCADE_STAGE.halfWidth]) {
    ctx.beginPath()
    ctx.moveTo(stageX(wall), 0)
    ctx.lineTo(stageX(wall), stageY(0))
    ctx.stroke()
  }

  drawProjectiles(ctx, harness.state)
  for (const side of [0, 1] as const) {
    const fighter = harness.state.fighters[side]
    drawFighter(ctx, fighter, fighter.id)
  }
  for (const side of [0, 1] as const) {
    drawMoveRegion(ctx, harness.state.fighters[side], harness.showHitboxes)
    if (harness.showHitboxes) drawCentreLine(ctx, harness.state.fighters[side])
  }
  drawHud(ctx, harness)
}

function describeFighter(fighter: MarsArcadeFighterState): string {
  const active = marsArcadeActiveMove(fighter)
  const content = marsArcadeFighter(fighter.id)
  const lines = [
    `${content.label}`,
    `  activity   ${fighter.activity}${fighter.blocking ? ' (blocking)' : ''}`,
    `  health     ${fighter.health.toFixed(0)} / ${content.health}`,
    `  meter      ${fighter.meter.toFixed(0)} / ${MARS_ARCADE_METER_MAX}`,
    `  guard      ${fighter.guard.toFixed(0)} / ${content.guardMax}`,
    `  stun       ${fighter.stunFrames}f`,
    `  position   x ${fighter.x.toFixed(1)}  y ${fighter.y.toFixed(1)}  facing ${fighter.facing > 0 ? '>' : '<'}`,
  ]
  if (active) {
    lines.push(
      `  move       ${active.move.id}`,
      `  phase      ${active.phase.toUpperCase()}  frame ${active.frame}/${active.totalFrames}  ${active.framesRemaining}f left`,
      `  frame data ${active.move.startupFrames}s / ${active.move.activeFrames}a / ${active.move.recoveryFrames}r` +
        `   reach ${active.move.reach}  maxHeight ${active.move.maxHeight}`,
    )
  } else {
    lines.push('  move       —', '  phase      —', '  frame data —')
  }
  return lines.join('\n')
}

function describe(harness: Harness): string {
  const { state } = harness
  const separation = Math.abs(state.fighters[1].x - state.fighters[0].x)
  const speed = SPEEDS[harness.speedIndex] ?? 1
  return [
    `phase ${state.phase}   frame ${state.frame}   separation ${separation.toFixed(1)}px   ` +
      `speed ${speed}x${harness.paused ? '   PAUSED' : ''}`,
    `P2 ${harness.humanRight ? 'human' : `CPU (${harness.difficulty})`}   ` +
      `hitboxes ${harness.showHitboxes ? 'on' : 'off'}`,
    '',
    describeFighter(state.fighters[0]),
    '',
    describeFighter(state.fighters[1]),
  ].join('\n')
}

function formatEvent(event: MarsArcadeEvent, frame: number): string | null {
  const stamp = String(frame).padStart(5)
  switch (event.type) {
    case 'hit':
      return `${stamp}  HIT      ${event.moveId}  -${event.damage}`
    case 'blocked':
      return `${stamp}  block    ${event.moveId}  -${event.chipDamage}`
    case 'guardCrush':
      return `${stamp}  GUARD CRUSH on P${event.defender + 1}`
    case 'stuckLanding':
      return `${stamp}  P${event.fighter + 1} stuck the landing`
    case 'tippedOver':
      return `${stamp}  P${event.fighter + 1} tipped over`
    case 'projectileFired':
      return `${stamp}  P${event.attacker + 1} fired`
    case 'composure':
      return `${stamp}  P${event.fighter + 1} composure`
    case 'ko':
      return `${stamp}  K.O.  winner P${event.winner + 1}`
    case 'timeOver':
      return `${stamp}  TIME  ${event.winner === null ? 'draw' : `winner P${event.winner + 1}`}`
    default:
      return null
  }
}

function mount(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#stage')
  const readout = document.querySelector<HTMLPreElement>('#readout')
  const logPanel = document.querySelector<HTMLPreElement>('#log')
  if (!canvas || !readout || !logPanel) throw new Error('harness markup missing')

  canvas.width = STAGE_WIDTH * SCALE
  canvas.height = STAGE_HEIGHT * SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')

  const harness: Harness = {
    state: createMarsArcadeRound('booster', 'oracle'),
    opponent: createMarsArcadeOpponent(1, 'veteran', 1),
    leftId: 'booster',
    rightId: 'oracle',
    difficulty: 'veteran',
    humanRight: false,
    speedIndex: 0,
    paused: false,
    stepRequested: false,
    showHitboxes: true,
    log: [],
    seed: 1,
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return
    switch (event.code) {
      case 'Space':
        harness.paused = !harness.paused
        event.preventDefault()
        return
      case 'KeyN':
        harness.stepRequested = true
        return
      case 'KeyR':
        newRound(harness)
        return
      case 'KeyT':
        harness.humanRight = !harness.humanRight
        return
      case 'KeyS':
        harness.speedIndex = (harness.speedIndex + 1) % SPEEDS.length
        return
      case 'KeyH':
        harness.showHitboxes = !harness.showHitboxes
        return
      case 'KeyG':
        harness.difficulty = harness.difficulty === 'veteran' ? 'rookie' : 'veteran'
        newRound(harness)
        return
      default:
        break
    }
    const digit = ['Digit1', 'Digit2', 'Digit3'].indexOf(event.code)
    const chosen = digit >= 0 ? FIGHTER_ORDER[digit] : undefined
    if (chosen) {
      if (event.shiftKey) harness.rightId = chosen
      else harness.leftId = chosen
      newRound(harness)
      return
    }
    held.add(event.code)
    if (harness.paused) pending.add(event.code)
  })
  window.addEventListener('keyup', (event) => held.delete(event.code))
  window.addEventListener('blur', () => held.clear())

  let previous = performance.now()

  const frame = (now: number) => {
    const deltaSeconds = Math.max(0, (now - previous) / 1000)
    previous = now

    const stepping = harness.stepRequested
    harness.stepRequested = false
    if (!harness.paused || stepping) {
      // Sampled only when the world is about to move, so a long pause does not burn
      // the opponent's intent timer against a frozen fight.
      const sampled = stepping ? new Set([...held, ...pending]) : held
      const playerOne = inputFromKeys(sampled, PLAYER_ONE_BINDINGS)
      let playerTwo: MarsArcadeInput
      if (harness.humanRight) {
        playerTwo = inputFromKeys(sampled, PLAYER_TWO_BINDINGS)
      } else {
        const decision = advanceMarsArcadeOpponent(harness.opponent, harness.state)
        harness.opponent = decision.opponent
        playerTwo = decision.input
      }
      pending.clear()

      const elapsed = stepping
        ? MARS_ARCADE_TIMING.frameSeconds
        : deltaSeconds * (SPEEDS[harness.speedIndex] ?? 1)
      const source = stepping ? { ...harness.state, carrySeconds: 0 } : harness.state
      const transition = advanceMarsArcade(source, [playerOne, playerTwo], elapsed)
      harness.state = transition.state
      for (const event of transition.events) {
        const line = formatEvent(event, harness.state.frame)
        if (line) harness.log.push(line)
      }
      if (harness.log.length > 14) harness.log = harness.log.slice(-14)
    }

    draw(ctx, harness)
    readout.textContent = describe(harness)
    logPanel.textContent = harness.log.join('\n') || '(no events yet)'
    window.requestAnimationFrame(frame)
  }

  window.requestAnimationFrame(frame)
}

mount()
