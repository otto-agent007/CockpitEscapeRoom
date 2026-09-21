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
import { loadArcadeSprites, selectArcadeSprite } from './arcadeHarnessSprites'
import { advanceExchange, EXCHANGE_END_FRAME } from './arcadeHarnessExchange'
import {
  MARS_ARCADE_BACKDROP,
  MARS_ARCADE_BANDS,
  MARS_ARCADE_CAMERA,
  MARS_ARCADE_VIEW,
  marsArcadeBackdropTiles,
  marsArcadeCameraTarget,
  marsArcadeScreenX,
  type MarsArcadeBackdropShape,
} from '../game/marsArcadeStage'

const STAGE_WIDTH = MARS_ARCADE_VIEW.width
const STAGE_HEIGHT = MARS_ARCADE_VIEW.height
const FLOOR_ROW = MARS_ARCADE_VIEW.floorRow
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
  showSprites: boolean
  reducedMotion: boolean
  outcomeFrames: number
  exchange: boolean
  /** Camera centre in stage pixels. Whole numbers only; see drawBackdrop. */
  cameraX: number
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
  harness.outcomeFrames = 0
  harness.exchange = false
  harness.stepRequested = false
  held.clear()
  pending.clear()
  harness.state = createMarsArcadeRound(harness.leftId, harness.rightId)
  harness.seed += 1
  harness.opponent = createMarsArcadeOpponent(1, harness.difficulty, harness.seed)
  harness.cameraX = marsArcadeCameraTarget(harness.state)
  harness.log = []
}

/**
 * Stage x to canvas x, through the camera.
 *
 * The stage is 480 px wide and the screen is 320, so this is no longer a fixed
 * offset: everything drawn in stage space has to go through the same camera or it
 * slides against the fighters. The camera is threaded in as an argument rather
 * than read from module state so a stale value cannot silently be drawn with.
 */
function stageX(x: number, camera: number): number {
  return marsArcadeScreenX(x, camera) * SCALE
}

function stageY(y: number): number {
  return (FLOOR_ROW - y) * SCALE
}

function drawFighter(
  ctx: CanvasRenderingContext2D,
  fighter: MarsArcadeFighterState,
  id: MarsArcadeFighterId,
  camera: number,
): void {
  const half = (MARS_ARCADE_STAGE.pushboxWidth / 2) * SCALE
  const left = stageX(fighter.x, camera) - half
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
  ctx.strokeRect(stageX(fighter.x, camera) - spriteHalf, feet - height, spriteHalf * 2, height)
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
  camera: number,
): void {
  if (!showHitboxes) return
  const active = marsArcadeActiveMove(fighter)
  if (!active || active.move.reach <= 0 || active.move.damage <= 0) return
  if (active.phase === 'recovery') return

  // The engine hits when the opponent is within `reach` horizontally and its feet
  // sit at or below `maxHeight`. Draw exactly that region, nothing prettier.
  const reachPx = Math.min(active.move.reach, STAGE_WIDTH) * SCALE
  const originX = stageX(fighter.x, camera)
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
  const capX = stageX(fighter.x + fighter.facing * active.move.reach, camera)
  ctx.strokeStyle = active.phase === 'active' ? '#ff3b30' : 'rgba(255, 210, 63, 0.85)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(capX, top - 10)
  ctx.lineTo(capX, bottom + 10)
  ctx.stroke()
}

/** Each fighter's centre — the point the reach test actually measures to. */
function drawCentreLine(
  ctx: CanvasRenderingContext2D,
  fighter: MarsArcadeFighterState,
  camera: number,
): void {
  const x = stageX(fighter.x, camera)
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 4])
  ctx.beginPath()
  ctx.moveTo(x, stageY(0) - FIGHTER_HEIGHT * SCALE - 14)
  ctx.lineTo(x, stageY(0) + 10)
  ctx.stroke()
  ctx.setLineDash([])
}

/**
 * One backdrop shape, in the tile at `offset`.
 *
 * Every kind is flat fill and straight edges on purpose: the stage is pixel art at
 * an integer scale, and anything smoothly shaded would crawl as the camera scrolls.
 */
function drawShape(ctx: CanvasRenderingContext2D, shape: MarsArcadeBackdropShape, offset: number): void {
  const x = (offset + shape.x) * SCALE
  const y = shape.y * SCALE
  const w = shape.width * SCALE
  const h = shape.height * SCALE
  ctx.fillStyle = shape.colour

  switch (shape.kind) {
    case 'rect':
      ctx.fillRect(x, y, w, h)
      return

    case 'ridge':
      ctx.beginPath()
      ctx.moveTo(x, y + h)
      ctx.lineTo(x + w / 2, y)
      ctx.lineTo(x + w, y + h)
      ctx.closePath()
      ctx.fill()
      return

    case 'dome':
      ctx.beginPath()
      ctx.ellipse(x + w / 2, y + h, w / 2, h, 0, Math.PI, Math.PI * 2)
      ctx.closePath()
      ctx.fill()
      if (shape.accent) {
        // Lit rim on the side the horizon glow comes from.
        ctx.strokeStyle = shape.accent
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(x + w / 2, y + h, w / 2, h, 0, Math.PI * 1.05, Math.PI * 1.5)
        ctx.stroke()
      }
      return

    case 'disc':
      ctx.beginPath()
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      if (shape.accent) {
        ctx.fillStyle = shape.accent
        ctx.beginPath()
        ctx.ellipse(x + w * 0.66, y + h * 0.56, w / 2.6, h / 2.6, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      return

    case 'mast':
      ctx.fillRect(x, y, w, h)
      ctx.fillRect(x - w * 2, y + h * 0.2, w * 5, Math.max(SCALE, h * 0.04))
      if (shape.accent) {
        ctx.fillStyle = shape.accent
        ctx.fillRect(x - SCALE, y - 2 * SCALE, w + 2 * SCALE, 2 * SCALE)
      }
      return

    case 'aircraft': {
      // A DC-9 in side profile, nose right, sitting on its gear.
      //
      // Four things carry the identity at this size, and the first pass had none
      // of them right: the tail cone sweeps UP to the fin instead of ending in a
      // spike at mid-height, the stabiliser sits ON TOP of the fin (the T-tail),
      // the engines hang on the REAR fuselage rather than under the wings, and a
      // row of lit cabin windows says airliner faster than any outline can.
      const top = y + h * 0.46
      const bottom = y + h * 0.64
      const ground = y + h

      // Fuselage and the upswept tail cone behind it.
      ctx.fillRect(x + w * 0.1, top, w * 0.78, bottom - top)
      ctx.beginPath()
      ctx.moveTo(x + w * 0.12, top)
      ctx.lineTo(x + w * 0.12, bottom)
      ctx.lineTo(x + w * 0.02, top + h * 0.01)
      ctx.closePath()
      ctx.fill()
      // Nose: tapers, and keeps a flatter underside.
      ctx.beginPath()
      ctx.moveTo(x + w * 0.86, top)
      ctx.lineTo(x + w * 0.98, top + h * 0.07)
      ctx.lineTo(x + w * 0.98, bottom)
      ctx.lineTo(x + w * 0.86, bottom)
      ctx.closePath()
      ctx.fill()
      // Fin, swept back — aft is to the left, so the top edge sits left of the base.
      ctx.beginPath()
      ctx.moveTo(x + w * 0.21, top)
      ctx.lineTo(x + w * 0.18, y + h * 0.17)
      ctx.lineTo(x + w * 0.08, y + h * 0.17)
      ctx.lineTo(x + w * 0.04, top)
      ctx.closePath()
      ctx.fill()
      // Rear-fuselage engine nacelle, overlapping the fuselage so it reads attached.
      ctx.fillRect(x + w * 0.23, top - h * 0.12, w * 0.18, h * 0.16)
      // Wing: a shallow swept blade, not a hanging fin.
      ctx.beginPath()
      ctx.moveTo(x + w * 0.44, bottom - h * 0.02)
      ctx.lineTo(x + w * 0.68, bottom - h * 0.02)
      ctx.lineTo(x + w * 0.52, bottom + h * 0.12)
      ctx.lineTo(x + w * 0.38, bottom + h * 0.12)
      ctx.closePath()
      ctx.fill()
      // Gear: nose and main, with wheels on the pad.
      for (const [legX, legWidth] of [
        [0.8, 0.015],
        [0.47, 0.02],
      ] as const) {
        ctx.fillRect(x + w * legX, bottom, Math.max(1, w * legWidth), ground - bottom)
        ctx.fillRect(x + w * legX - SCALE, ground - 2 * SCALE, Math.max(2, w * 0.04), 2 * SCALE)
      }

      if (shape.accent) {
        ctx.fillStyle = shape.accent
        // The T-tail plane, sitting across the top of the fin.
        ctx.fillRect(x + w * 0.03, y + h * 0.13, w * 0.2, Math.max(2, h * 0.05))
        // Sunlit spine.
        ctx.fillRect(x + w * 0.1, top, w * 0.78, Math.max(1, h * 0.04))
      }

      // Lit cabin windows and the flight deck. At this scale this is what actually
      // says "airliner"; without it the silhouette reads as a structure.
      ctx.fillStyle = '#ffd58a'
      const windowY = top + h * 0.06
      const windowSize = Math.max(1, Math.round(SCALE * 0.7))
      for (let column = 0.22; column < 0.83; column += 0.055) {
        ctx.fillRect(x + w * column, windowY, windowSize, windowSize)
      }
      ctx.fillRect(x + w * 0.88, top + h * 0.04, Math.max(2, w * 0.035), Math.max(2, h * 0.05))
      return
    }
  }
}

/**
 * Sky bands, then the parallax layers far to near.
 *
 * The bands are screen-space; the layers slide against the camera, each at its own
 * rate. The nearest layer is at parallax 1 with a short span, which is the one that
 * actually tells the player the stage moved — the retired flat floor could not.
 */
function drawBackdrop(ctx: CanvasRenderingContext2D, camera: number): void {
  for (const band of MARS_ARCADE_BANDS) {
    ctx.fillStyle = band.colour
    ctx.fillRect(0, band.y * SCALE, STAGE_WIDTH * SCALE, band.height * SCALE)
  }
  for (const layer of MARS_ARCADE_BACKDROP) {
    for (const offset of marsArcadeBackdropTiles(layer, camera)) {
      for (const shape of layer.shapes) drawShape(ctx, shape, offset)
    }
  }
}

/**
 * The blob that puts a fighter on the ground rather than in front of it.
 *
 * It stays on the floor and shrinks as the fighter rises, so a jump reads as height
 * instead of as the whole sprite sliding upward.
 */
function drawContactShadow(
  ctx: CanvasRenderingContext2D,
  fighter: MarsArcadeFighterState,
  camera: number,
): void {
  const lift = Math.min(1, fighter.y / 60)
  ctx.save()
  ctx.globalAlpha = 0.45 * (1 - lift * 0.65)
  ctx.fillStyle = '#2a1410'
  ctx.beginPath()
  ctx.ellipse(
    stageX(fighter.x, camera),
    stageY(0),
    (SPRITE_STANDING_WIDTH / 2) * SCALE * (1 - lift * 0.45),
    3 * SCALE * (1 - lift * 0.3),
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()
  ctx.restore()
}

function drawProjectiles(
  ctx: CanvasRenderingContext2D,
  state: MarsArcadeState,
  camera: number,
): void {
  const size = MARS_ARCADE_STAGE.projectileRadius * 2 * SCALE
  for (const projectile of state.projectiles) {
    ctx.fillStyle = 'rgba(57, 199, 216, 0.75)'
    ctx.fillRect(stageX(projectile.x, camera) - size / 2, stageY(projectile.y) - size / 2, size, size)
    ctx.strokeStyle = '#39c7d8'
    ctx.lineWidth = 2
    ctx.strokeRect(stageX(projectile.x, camera) - size / 2, stageY(projectile.y) - size / 2, size, size)
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
    ctx.fillText(banner, width / 2, 36 * SCALE)
    ctx.font = '500 15px ui-monospace, monospace'
    ctx.fillStyle = '#c9c9d6'
    ctx.fillText('R to run it again', width / 2, 46 * SCALE)
  }
  ctx.textAlign = 'left'
}

function draw(ctx: CanvasRenderingContext2D, harness: Harness, sprites: ReturnType<typeof loadArcadeSprites>): void {
  const width = STAGE_WIDTH * SCALE
  const camera = harness.cameraX

  drawBackdrop(ctx, camera)

  ctx.strokeStyle = '#a5714f'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, stageY(0))
  ctx.lineTo(width, stageY(0))
  ctx.stroke()

  // Stage walls: the clamp the fight loop actually enforces. They sit inside the
  // screen now, which is the point of the corner margin — a cornered fighter is
  // still drawn whole.
  ctx.strokeStyle = 'rgba(255,233,200,0.22)'
  ctx.lineWidth = 1
  for (const wall of [-MARS_ARCADE_STAGE.halfWidth, MARS_ARCADE_STAGE.halfWidth]) {
    ctx.beginPath()
    ctx.moveTo(stageX(wall, camera), 0)
    ctx.lineTo(stageX(wall, camera), stageY(0))
    ctx.stroke()
  }

  drawProjectiles(ctx, harness.state, camera)
  for (const side of [0, 1] as const) drawContactShadow(ctx, harness.state.fighters[side], camera)
  for (const side of [0, 1] as const) {
    const fighter = harness.state.fighters[side]
    const selection = selectArcadeSprite(harness.state, side, harness.reducedMotion, harness.outcomeFrames)
    const renderY = selection.renderY ?? fighter.y
    const image = harness.showSprites ? sprites.get(selection.src) : undefined
    if (image) {
      ctx.save()
      ctx.imageSmoothingEnabled = false
      ctx.translate(stageX(fighter.x, camera), stageY(renderY))
      ctx.scale(fighter.facing * SCALE, SCALE)
      ctx.drawImage(image, -64, -120, 128, 128)
      ctx.restore()
      // Color/state feedback remains diagnostic while combat pose art is incomplete.
      ctx.fillStyle = fighter.blocking ? '#8ab4ff' : STATE_TINT[fighter.activity] ?? COLOURS[fighter.id]
      ctx.fillRect(stageX(fighter.x, camera) - 18, stageY(renderY) + 4, 36, 3)
    } else {
      drawFighter(ctx, fighter, fighter.id, camera)
    }
  }
  for (const side of [0, 1] as const) {
    drawMoveRegion(ctx, harness.state.fighters[side], harness.showHitboxes, camera)
    if (harness.showHitboxes) drawCentreLine(ctx, harness.state.fighters[side], camera)
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
    `outcome frame ${Math.floor(harness.outcomeFrames)}`,
    `camera x ${harness.cameraX}   view ${STAGE_WIDTH}px of a ` +
      `${MARS_ARCADE_STAGE.halfWidth * 2}px stage   ` +
      `walls ${-MARS_ARCADE_STAGE.halfWidth} / ${MARS_ARCADE_STAGE.halfWidth}`,
    harness.exchange
      ? (state.frame >= EXCHANGE_END_FRAME ? 'Exchange complete — replay or choose Free play' : 'Exchange review — recorded inputs, real fight rules')
      : 'Free play',
    '',
    describeFighter(state.fighters[0]),
    `  artwork    ${harness.showSprites ? selectArcadeSprite(state, 0, harness.reducedMotion, harness.outcomeFrames).label : 'boxes'}`,
    '',
    describeFighter(state.fighters[1]),
    `  artwork    ${harness.showSprites ? selectArcadeSprite(state, 1, harness.reducedMotion, harness.outcomeFrames).label : 'boxes'}`,
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
  const assetStatus = document.querySelector<HTMLParagraphElement>('#asset-status')
  if (!canvas || !readout || !logPanel || !assetStatus) throw new Error('harness markup missing')
  const sprites = loadArcadeSprites()
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')

  canvas.width = STAGE_WIDTH * SCALE
  canvas.height = STAGE_HEIGHT * SCALE
  const resize = () => {
    const available = canvas.parentElement?.clientWidth ?? STAGE_WIDTH * SCALE
    canvas.style.width = `${STAGE_WIDTH * Math.max(1, Math.min(SCALE, Math.floor(available / STAGE_WIDTH)))}px`
  }
  resize()
  if (canvas.parentElement) new ResizeObserver(resize).observe(canvas.parentElement)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')

  const harness: Harness = {
    state: createMarsArcadeRound('booster', 'oracle'),
    opponent: createMarsArcadeOpponent(1, 'veteran', 1),
    leftId: 'booster',
    rightId: 'oracle',
    cameraX: 0,
    difficulty: 'veteran',
    humanRight: false,
    speedIndex: 0,
    paused: false,
    stepRequested: false,
    showHitboxes: true,
    showSprites: true,
    reducedMotion: motion.matches,
    outcomeFrames: 0,
    exchange: false,
    log: [],
    seed: 1,
  }

  motion.addEventListener('change', event => { harness.reducedMotion = event.matches })

  function command(code: string): boolean {
    switch (code) {
      case 'Space':
        if (harness.exchange && harness.state.frame >= EXCHANGE_END_FRAME) return true
        harness.paused = !harness.paused
        return true
      case 'KeyN':
        harness.paused = true
        harness.stepRequested = true
        return true
      case 'KeyR':
        newRound(harness)
        return true
      case 'KeyT':
        harness.exchange = false
        harness.humanRight = !harness.humanRight
        return true
      case 'exchange':
        harness.leftId = 'booster'
        harness.rightId = 'oracle'
        harness.humanRight = true
        newRound(harness)
        harness.exchange = true
        harness.paused = false
        harness.showSprites = true
        harness.showHitboxes = false
        harness.speedIndex = 1
        return true
      case 'freeplay':
        newRound(harness)
        harness.paused = false
        harness.humanRight = false
        harness.speedIndex = 0
        return true
      case 'KeyS':
        harness.speedIndex = (harness.speedIndex + 1) % SPEEDS.length
        return true
      case 'KeyH':
        harness.showHitboxes = !harness.showHitboxes
        return true
      case 'KeyV':
        harness.showSprites = !harness.showSprites
        return true
      case 'KeyG':
        harness.difficulty = harness.difficulty === 'veteran' ? 'rookie' : 'veteran'
        newRound(harness)
        return true
      case 'mirror':
        harness.leftId = 'booster'
        harness.rightId = 'booster'
        newRound(harness)
        return true
      default:
        return false
    }
  }

  const combatKeys = new Set([...Object.values(PLAYER_ONE_BINDINGS), ...Object.values(PLAYER_TWO_BINDINGS)])
  window.addEventListener('keydown', (event) => {
    // Native fields own navigation; buttons own activation, but not game letter keys.
    if (event.target instanceof HTMLElement) {
      if (event.target.closest('select, input, textarea')) return
      if (event.target.closest('button') && ['Space', 'Enter'].includes(event.code)) return
    }
    if (combatKeys.has(event.code) || event.code === 'Space') event.preventDefault()
    if (event.repeat) return
    if (command(event.code)) return
    const digit = ['Digit1', 'Digit2', 'Digit3'].indexOf(event.code)
    const chosen = digit >= 0 ? FIGHTER_ORDER[digit] : undefined
    if (chosen) {
      if (event.shiftKey) harness.rightId = chosen
      else harness.leftId = chosen
      newRound(harness)
      return
    }
    if (combatKeys.has(event.code)) {
      cancelExchange()
      held.add(event.code)
      pending.add(event.code)
    }
  })
  window.addEventListener('keyup', (event) => held.delete(event.code))
  const clearInput = () => { held.clear(); pending.clear() }
  function cancelExchange(): void {
    if (!harness.exchange) return
    harness.exchange = false
    clearInput()
    // Keep a deliberately paused inspection paused; the completed recording
    // can be taken over immediately without a hidden Resume requirement.
    if (harness.state.frame >= EXCHANGE_END_FRAME) harness.paused = false
  }
  window.addEventListener('blur', clearInput)
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearInput() })

  document.querySelectorAll<HTMLButtonElement>('[data-command]').forEach(button => {
    button.addEventListener('click', () => command(button.dataset.command ?? ''))
  })
  document.querySelectorAll<HTMLSelectElement>('[data-fighter]').forEach(select => {
    select.addEventListener('change', () => {
      const id = FIGHTER_ORDER.find(id => id === select.value)
      if (!id) return
      if (select.dataset.fighter === '0') harness.leftId = id
      else harness.rightId = id
      newRound(harness)
    })
  })
  document.querySelectorAll<HTMLButtonElement>('[data-combat]').forEach(button => {
    const code = button.dataset.combat ?? ''
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0) return
      cancelExchange()
      button.setPointerCapture(event.pointerId)
      held.add(code)
      pending.add(code)
    })
    button.addEventListener('lostpointercapture', () => held.delete(code))
    button.addEventListener('pointerup', () => held.delete(code))
    button.addEventListener('pointercancel', () => { held.delete(code); pending.delete(code) })
    // Keyboard or assistive-technology activation is a one-frame tap, never a stuck hold.
    button.addEventListener('click', event => {
      if (event.detail === 0) { cancelExchange(); pending.add(code) }
    })
  })

  let previous = performance.now()

  const frame = (now: number) => {
    const deltaSeconds = Math.max(0, (now - previous) / 1000)
    previous = now

    const stepping = harness.stepRequested
    harness.stepRequested = false
    if (!harness.paused || stepping) {
      // Sampled only when the world is about to move, so a long pause does not burn
      // the opponent's intent timer against a frozen fight.
      const sampled = new Set([...held, ...pending])
      const playerOne = inputFromKeys(sampled, PLAYER_ONE_BINDINGS)
      let playerTwo: MarsArcadeInput
      if (harness.humanRight || harness.exchange) {
        playerTwo = inputFromKeys(sampled, PLAYER_TWO_BINDINGS)
      } else {
        const decision = advanceMarsArcadeOpponent(harness.opponent, harness.state)
        harness.opponent = decision.opponent
        playerTwo = decision.input
      }
      const elapsed = stepping
        ? MARS_ARCADE_TIMING.frameSeconds
        : deltaSeconds * (SPEEDS[harness.speedIndex] ?? 1)
      const source = stepping ? { ...harness.state, carrySeconds: 0 } : harness.state
      const transition = harness.exchange
        ? advanceExchange(source, elapsed)
        : advanceMarsArcade(source, [playerOne, playerTwo], elapsed)
      // A quick tap must survive a render tick that did not advance the fixed-step world.
      if (transition.state.frame !== harness.state.frame) pending.clear()
      // The fight intentionally freezes at KO/timeOver. Only this presentation clock advances.
      const terminal = harness.state.phase === 'ko' || harness.state.phase === 'timeOver'
      harness.outcomeFrames = terminal
        ? Math.min(24, harness.outcomeFrames + Math.min(elapsed, MARS_ARCADE_TIMING.maxFrameDeltaSeconds) / MARS_ARCADE_TIMING.frameSeconds)
        : 0
      harness.state = transition.state
      if (harness.exchange && harness.state.frame >= EXCHANGE_END_FRAME) harness.paused = true

      // Ease toward the target, but always by at least one whole pixel. A plain
      // rounded lerp stalls: once the gap is under ~4 px the eased step rounds to
      // zero and the camera parks permanently short of where it should be.
      const cameraTarget = marsArcadeCameraTarget(harness.state)
      const cameraGap = cameraTarget - harness.cameraX
      harness.cameraX =
        Math.abs(cameraGap) <= 1
          ? cameraTarget
          : harness.cameraX +
            Math.sign(cameraGap) *
              Math.max(1, Math.round(Math.abs(cameraGap) * MARS_ARCADE_CAMERA.followPerFrame))
      for (const event of transition.events) {
        const line = formatEvent(event, harness.state.frame)
        if (line) harness.log.push(line)
      }
      if (harness.log.length > 14) harness.log = harness.log.slice(-14)
    }

    draw(ctx, harness, sprites)
    readout.textContent = describe(harness)
    const status = sprites.status() + (harness.reducedMotion ? '; reduced motion: static idle' : '')
    if (assetStatus.textContent !== status) assetStatus.textContent = status
    const events = harness.log.join('\n') || '(no events yet)'
    if (logPanel.textContent !== events) logPanel.textContent = events
    const pause = document.querySelector<HTMLButtonElement>('[data-command="Space"]')
    if (pause) {
      pause.disabled = harness.exchange && harness.state.frame >= EXCHANGE_END_FRAME
      pause.textContent = pause.disabled ? 'Exchange complete' : harness.paused ? 'Resume' : 'Pause'
    }
    for (const select of document.querySelectorAll<HTMLSelectElement>('[data-fighter]')) {
      select.value = select.dataset.fighter === '0' ? harness.leftId : harness.rightId
    }
    window.requestAnimationFrame(frame)
  }

  window.requestAnimationFrame(frame)
}

mount()
