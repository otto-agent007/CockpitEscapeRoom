# Phone instrument scan, Captain's Key reach, Engine-Out phone controls — 2026-11-10

Captured with Playwright in local production builds of this branch, using touch emulation for phones. "Before" is `main` at `67cda3d`.

## Instrument scan (DC-9)
- `before-scan-390.png`: the route camera's 60° view leaves each gauge about 20 px across on a 390×844 phone.
- `after-scan-390.png`: on narrow screens the scan centres on the first officer's five flight instruments (yaw -0.062, pitch +0.147 from `CAM_DC9_FIRST_OFFICER_ROUTE_APPROVAL`) and fits their width to the canvas aspect: about 31° on this canvas. A unit test (`src/scenes/dc9ScanFraming.test.ts`) proves all five gauges, radii included, fit for canvas aspects 0.46-2.4, and that airspeed is at least 1.9× wider than before. EPR is one pan left.
- `scan-1440-unchanged.png` is byte-identical to the before capture, with the same camera state and the same gauge target positions.

## Captain's Key
Measured projection of the key collider (`key-390.json`, `key-1440.json`):

| Viewport | At old right stop (0.72) | New: full right (1.0) | New: then full down (0.30) |
| --- | --- | --- | --- |
| 390×844 | (406, 750), past the right edge, under the status bar, cue "down" | (247, 736) on screen, cue "down" | **(241, 545)**, cue cleared |
| 1440×900 | (1003, 889), on the bottom edge | (790, 869), cue "down" | **(781, 614)**, cue cleared |

Geometry: the key is 0.95 m from the first-officer seat. Centring it needs 1.10 rad of right yaw and 0.52 rad of down pitch, and the new stops are 1.0 and 0.30. The up stop is unchanged at 0.18.

## Engine-Out on a phone
`engine-out-phone-390.png` shows two groups: the sidestick arrows, and Increase/Decrease. Those two buttons do what D/A do on desktop (owner's choice), and the guidance reads "hold Increase". Desktop keeps arrows, paired thrust and the Directional balance group.
