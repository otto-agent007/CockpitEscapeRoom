export const AIRBUS_SIMULATOR_REQUIRED_NODES = [
  'AIRBUS_A320_DISPLAY_CAPTAIN_PFD_SURFACE',
  'AIRBUS_A320_DISPLAY_CAPTAIN_ND_SURFACE',
  'AIRBUS_A320_DISPLAY_UPPER_ECAM_SURFACE',
  'AIRBUS_A320_CONTROL_CAPTAIN_SIDESTICK_ROLL_PIVOT',
  'AIRBUS_A320_CONTROL_CAPTAIN_SIDESTICK_PITCH_PIVOT',
  'AIRBUS_A320_CONTROL_THRUST_PAIRED_PIVOT',
  'CAM_AIRBUS_CAPTAIN_STORM_FLIGHT',
]

const DISPLAY_CONTRACTS = new Map([
  ['AIRBUS_A320_DISPLAY_CAPTAIN_PFD_SURFACE', ['airbus.sim.display.pfd', 'pfd']],
  ['AIRBUS_A320_DISPLAY_CAPTAIN_ND_SURFACE', ['airbus.sim.display.nd', 'nd']],
  ['AIRBUS_A320_DISPLAY_UPPER_ECAM_SURFACE', ['airbus.sim.display.ecam', 'ecam']],
])

const CONTROL_CONTRACTS = new Map([
  [
    'AIRBUS_A320_CONTROL_CAPTAIN_SIDESTICK_ROLL_PIVOT',
    {
      gameId: 'airbus.sim.control.sidestick',
      interaction: 'analog',
      inputAxis: 'bank',
      rotationAxis: 'Y',
      minAngle: -12,
      maxAngle: 12,
    },
  ],
  [
    'AIRBUS_A320_CONTROL_CAPTAIN_SIDESTICK_PITCH_PIVOT',
    {
      gameId: 'airbus.sim.control.sidestick.pitch',
      interaction: 'analog-child',
      inputAxis: 'pitch',
      rotationAxis: 'X',
      minAngle: -10,
      maxAngle: 10,
    },
  ],
  [
    'AIRBUS_A320_CONTROL_THRUST_PAIRED_PIVOT',
    {
      gameId: 'airbus.sim.control.thrust',
      interaction: 'analog',
      inputAxis: 'thrust',
      rotationAxis: 'X',
      minAngle: -8,
      maxAngle: 14,
    },
  ],
])

const STORM_FLIGHT_CAMERA = 'CAM_AIRBUS_CAPTAIN_STORM_FLIGHT'

export function validateAirbusSimulatorContract({ nodes }) {
  const errors = []
  const nodeByName = new Map((nodes ?? []).map((node) => [node.name, node]))
  const missing = AIRBUS_SIMULATOR_REQUIRED_NODES.filter((name) => !nodeByName.has(name))
  if (missing.length > 0) {
    errors.push(`Airbus Storm Line GLB is missing required nodes: ${missing.join(', ')}.`)
  }

  for (const [name, [gameId, displayRole]] of DISPLAY_CONTRACTS) {
    const extras = nodeByName.get(name)?.extras
    if (extras?.game_id !== gameId
      || extras?.display_role !== displayRole
      || extras?.interaction !== 'instrument-display') {
      errors.push(`${name} must export the approved ${gameId} instrument-display contract.`)
    }
  }

  for (const [name, contract] of CONTROL_CONTRACTS) {
    const extras = nodeByName.get(name)?.extras
    if (extras?.game_id !== contract.gameId
      || extras?.interaction !== contract.interaction
      || extras?.input_axis !== contract.inputAxis
      || extras?.rotation_axis !== contract.rotationAxis
      || extras?.rest_angle !== 0
      || extras?.min_angle !== contract.minAngle
      || extras?.max_angle !== contract.maxAngle) {
      errors.push(`${name} must export the approved ${contract.gameId} ${contract.interaction} contract.`)
    }
  }

  const cameraExtras = nodeByName.get(STORM_FLIGHT_CAMERA)?.extras
  if (cameraExtras?.game_id !== 'airbus.a320.camera.captain_storm_flight'
    || cameraExtras?.purpose !== 'storm-flight'
    || cameraExtras?.seat_role !== 'captain'
    || cameraExtras?.aircraft !== 'Airbus A320'
    || cameraExtras?.vertical_fov_degrees !== 58) {
    errors.push(
      `${STORM_FLIGHT_CAMERA} must export the approved Airbus A320 storm-flight camera contract at 58 degrees vertical FOV.`,
    )
  }
  if (cameraExtras?.composition_vertical_shift_fraction !== 0.33) {
    errors.push(
      `${STORM_FLIGHT_CAMERA} must export the raised Storm Flight composition.`,
    )
  }

  return errors
}
