import * as THREE from 'three'

/** The document-framing FOV the scan used on phones before; the zoom never goes wider. */
const DC9_SCAN_NARROW_MAX_FOV = 60

/**
 * Phones read the instrument scan on a portrait canvas, where the route camera's 60° view
 * left each gauge about 20 px across (owner, 2026-11-10: "zoom in close to the airspeed
 * indicator"). On narrow screens the scan centres on the first officer's five flight
 * instruments and fits their width to the canvas. The angles are measured from
 * CAM_DC9_FIRST_OFFICER_ROUTE_APPROVAL to the DC9_INSTRUMENTS faces, radii included:
 * airspeed's left edge at +0.109 yaw, vertical speed's right edge at -0.233, and pitch from
 * +0.040 (HSI bottom) to +0.254 (ADI top). The EPR gauges on the centre panel (+0.40 yaw)
 * stay one pan to the left.
 */
export const DC9_SCAN_NARROW_YAW = -0.062
export const DC9_SCAN_NARROW_PITCH = 0.147
const DC9_SCAN_NARROW_HALF_WIDTH = 0.171 * 1.25
const DC9_SCAN_NARROW_HALF_HEIGHT = 0.107 * 1.25
const DC9_SCAN_NARROW_MIN_FOV = 24

/** Vertical FOV, in degrees, that fits the flight-instrument group on a canvas of this aspect. */
export function dc9ScanNarrowFov(aspect: number): number {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1
  const fromWidth = 2 * Math.atan(Math.tan(DC9_SCAN_NARROW_HALF_WIDTH) / safeAspect)
  const fromHeight = 2 * DC9_SCAN_NARROW_HALF_HEIGHT
  return THREE.MathUtils.clamp(
    THREE.MathUtils.radToDeg(Math.max(fromWidth, fromHeight)),
    DC9_SCAN_NARROW_MIN_FOV,
    DC9_SCAN_NARROW_MAX_FOV,
  )
}
