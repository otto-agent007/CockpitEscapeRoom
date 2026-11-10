import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { DC9_INSTRUMENTS } from '../game/dc9FlightDeck'
import { DC9_SCAN_NARROW_PITCH, DC9_SCAN_NARROW_YAW, dc9ScanNarrowFov } from './dc9ScanFraming'

// CAM_DC9_FIRST_OFFICER_ROUTE_APPROVAL as shipped in public/models/dc9-cockpit.glb.
const ROUTE_CAMERA_POSITION = new THREE.Vector3(0.45, 0.82, 3.34)
const ROUTE_CAMERA_QUATERNION = new THREE.Quaternion(-0.30150312185287476, 0, 0, 0.9534652233123779)
const FLIGHT_INSTRUMENTS = ['airspeed', 'attitude', 'altimeter', 'heading', 'verticalSpeed'] as const

/** The same composition Dc9SeatLookControls uses: base, then yaw about local Y, then pitch about local X. */
function scanCamera(aspect: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(dc9ScanNarrowFov(aspect), aspect, 0.05, 10)
  camera.position.copy(ROUTE_CAMERA_POSITION)
  camera.quaternion.copy(ROUTE_CAMERA_QUATERNION)
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), DC9_SCAN_NARROW_YAW))
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), DC9_SCAN_NARROW_PITCH))
  camera.updateMatrixWorld(true)
  camera.updateProjectionMatrix()
  return camera
}

describe('phone instrument-scan framing', () => {
  // Canvas aspects measured in the browser: 375x462 and 390x494 phone canvases above the
  // tray, a full-height portrait, the 768x674 tablet canvas, and a landscape phone.
  it.each([0.46, 0.79, 0.81, 1.14, 2.4])('fits every flight instrument inside a %s aspect canvas', (aspect) => {
    const camera = scanCamera(aspect)
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion)
    for (const id of FLIGHT_INSTRUMENTS) {
      const instrument = DC9_INSTRUMENTS[id]
      const centre = new THREE.Vector3(...instrument.center)
      for (const offset of [right, right.clone().negate(), up, up.clone().negate()]) {
        const edge = centre.clone().addScaledVector(offset, instrument.radius).project(camera)
        expect(Math.abs(edge.x), `${id} at aspect ${aspect}`).toBeLessThan(0.98)
        expect(Math.abs(edge.y), `${id} at aspect ${aspect}`).toBeLessThan(0.98)
      }
    }
  })

  it('zooms well in on a portrait phone, never wider than the old 60° view, never past 24°', () => {
    expect(dc9ScanNarrowFov(390 / 494)).toBeLessThan(35)
    expect(dc9ScanNarrowFov(0.2)).toBe(60)
    expect(dc9ScanNarrowFov(4)).toBe(24)
    expect(dc9ScanNarrowFov(Number.NaN)).toBeGreaterThanOrEqual(24)
  })

  it('makes the airspeed indicator at least twice as large on a 390-wide phone canvas', () => {
    const aspect = 390 / 494
    const zoomed = scanCamera(aspect)
    const before = new THREE.PerspectiveCamera(60, aspect, 0.05, 10)
    before.position.copy(ROUTE_CAMERA_POSITION)
    before.quaternion.copy(ROUTE_CAMERA_QUATERNION)
      .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -0.1))
    before.updateMatrixWorld(true)
    before.updateProjectionMatrix()
    const airspeed = DC9_INSTRUMENTS.airspeed
    const widthPx = (camera: THREE.PerspectiveCamera) => {
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
      const centre = new THREE.Vector3(...airspeed.center)
      const a = centre.clone().addScaledVector(right, airspeed.radius).project(camera)
      const b = centre.clone().addScaledVector(right, -airspeed.radius).project(camera)
      return Math.abs(a.x - b.x) / 2 * 390
    }
    expect(widthPx(zoomed)).toBeGreaterThan(widthPx(before) * 1.9)
  })
})
