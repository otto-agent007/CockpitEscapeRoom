import { describe, expect, it } from 'vitest'
import {
  AIRBUS_SIMULATOR_REQUIRED_NODES,
  validateAirbusSimulatorContract,
} from './airbus-simulator-contract.mjs'

function validFixture() {
  const nodes = [
    ...AIRBUS_SIMULATOR_REQUIRED_NODES.map((name) => ({ name })),
  ]
  const extras = {
    AIRBUS_A320_DISPLAY_CAPTAIN_PFD_SURFACE: {
      game_id: 'airbus.sim.display.pfd',
      display_role: 'pfd',
      interaction: 'instrument-display',
    },
    AIRBUS_A320_DISPLAY_CAPTAIN_ND_SURFACE: {
      game_id: 'airbus.sim.display.nd',
      display_role: 'nd',
      interaction: 'instrument-display',
    },
    AIRBUS_A320_DISPLAY_UPPER_ECAM_SURFACE: {
      game_id: 'airbus.sim.display.ecam',
      display_role: 'ecam',
      interaction: 'instrument-display',
    },
    AIRBUS_A320_CONTROL_CAPTAIN_SIDESTICK_ROLL_PIVOT: {
      game_id: 'airbus.sim.control.sidestick',
      interaction: 'analog',
      input_axis: 'bank',
      rotation_axis: 'Y',
      rest_angle: 0,
      min_angle: -12,
      max_angle: 12,
    },
    AIRBUS_A320_CONTROL_CAPTAIN_SIDESTICK_PITCH_PIVOT: {
      game_id: 'airbus.sim.control.sidestick.pitch',
      interaction: 'analog-child',
      input_axis: 'pitch',
      rotation_axis: 'X',
      rest_angle: 0,
      min_angle: -10,
      max_angle: 10,
    },
    AIRBUS_A320_CONTROL_THRUST_PAIRED_PIVOT: {
      game_id: 'airbus.sim.control.thrust',
      interaction: 'analog',
      input_axis: 'thrust',
      rotation_axis: 'X',
      rest_angle: 0,
      min_angle: -8,
      max_angle: 14,
    },
    CAM_AIRBUS_CAPTAIN_STORM_FLIGHT: {
      game_id: 'airbus.a320.camera.captain_storm_flight',
      purpose: 'storm-flight',
      seat_role: 'captain',
      aircraft: 'Airbus A320',
      vertical_fov_degrees: 58,
      composition_vertical_shift_fraction: 0.33,
    },
  }
  for (const node of nodes) node.extras = extras[node.name]

  return { nodes }
}

describe('Airbus Storm Line deployable contract', () => {
  it('accepts semantic displays and the nested physical-control pivots', () => {
    expect(validateAirbusSimulatorContract(validFixture())).toEqual([])
  })

  it('rejects missing or incorrectly described simulator nodes', () => {
    const fixture = validFixture()
    fixture.nodes = fixture.nodes.filter((node) => node.name !== 'AIRBUS_A320_DISPLAY_CAPTAIN_ND_SURFACE')
    fixture.nodes.find(
      (node) => node.name === 'AIRBUS_A320_CONTROL_THRUST_PAIRED_PIVOT',
    ).extras.rotation_axis = 'Z'

    expect(validateAirbusSimulatorContract({ nodes: fixture.nodes })).toEqual(expect.arrayContaining([
      'Airbus Storm Line GLB is missing required nodes: AIRBUS_A320_DISPLAY_CAPTAIN_ND_SURFACE.',
      'AIRBUS_A320_CONTROL_THRUST_PAIRED_PIVOT must export the approved airbus.sim.control.thrust analog contract.',
    ]))
  })

  it('requires the focused Blender-authored Storm Flight camera contract', () => {
    const missingCamera = validFixture()
    missingCamera.nodes = missingCamera.nodes.filter(
      (node) => node.name !== 'CAM_AIRBUS_CAPTAIN_STORM_FLIGHT',
    )

    const wrongFov = validFixture()
    wrongFov.nodes.find(
      (node) => node.name === 'CAM_AIRBUS_CAPTAIN_STORM_FLIGHT',
    ).extras.vertical_fov_degrees = 68

    expect(validateAirbusSimulatorContract(missingCamera)).toContain(
      'Airbus Storm Line GLB is missing required nodes: CAM_AIRBUS_CAPTAIN_STORM_FLIGHT.',
    )
    expect(validateAirbusSimulatorContract(wrongFov)).toContain(
      'CAM_AIRBUS_CAPTAIN_STORM_FLIGHT must export the approved Airbus A320 storm-flight camera contract at 58 degrees vertical FOV.',
    )
  })

  it('requires the raised Storm Flight composition that excludes the rudder pedals', () => {
    const lowComposition = validFixture()
    lowComposition.nodes.find(
      (node) => node.name === 'CAM_AIRBUS_CAPTAIN_STORM_FLIGHT',
    ).extras.composition_vertical_shift_fraction = 0

    expect(validateAirbusSimulatorContract(lowComposition)).toContain(
      'CAM_AIRBUS_CAPTAIN_STORM_FLIGHT must export the raised Storm Flight composition.',
    )
  })
})
