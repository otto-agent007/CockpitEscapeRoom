# DC-9-50 Web Reference Source Ranking

> **Seat-role supersession notice (2026-07-15):** This historical record preserves the then-current DC-9 captain / A320 first-officer assignment. The active production contract now uses DC-9 first-officer/right-seat and Airbus A320 Pop T captain/left-seat roles. Historical evidence below is unchanged.


## Summary

Agent 1 ran a bounded source-discovery pass for the DC-9 Pop T Captain cockpit, using the current **DC-9-50** production target and the existing repo reference pack as authority.

No images, source repositories, GLBs, Blender files, or generated assets were downloaded or produced in this pass.

## Source authority consumed

- `art-source/cockpit-pipeline/gates/agent0-dc9-web-reference-authority.json`
- `art-source/cockpit-pipeline/source-discovery-seeds/dc9-web-reference-source-discovery.seed.json`
- `art-source/references/reference-manifest.yaml`

## Ranked candidates

| Rank | Candidate | Authority | Use | Decision |
| --- | --- | --- | --- | --- |
| 1 | Wikimedia Commons `Category:Cockpits of Douglas DC-9` | Primary index | Find license-screened real cockpit file pages by variant and viewpoint | Selected as the main discovery index |
| 2 | `McDonnell Douglas DC-9-51 cockpit (2586378690).jpg` | High compatibility | Captain-eye shell, gauge density, yokes, windshield, and glareshield relationships | Selected as the strongest current compatibility photo |
| 3 | `FGMEMBERS-NONGPL/DC-9-32` | Buildable compatibility source | Extractable yokes, throttle, gauge, and switch candidates | Selected as the strongest current buildable source |
| 4 | `DC-9 Cockpit.jpg` | Secondary compatibility | Northwest family panel density, material family, and yoke comparison | Selected as a labeled compatibility photo |
| 5 | `SAS DC-9, Interior, cockpit.jpg` | Secondary compatibility | Fill wide-layout and overhead-density gaps | Selected for gap coverage review |
| 6 | Sketchfab `McDonnell Douglas DC-9-50` by OUTPISTON | Proxy only | Possible coarse shell/proportion reference | Selected as proxy-only, not cockpit authority |
| 7 | Sketchfab generic `mcdonnell douglas dc-9` by 1883 | Rejected | Generic exterior model | Rejected for cockpit sourcing |

## Coverage by requested section

- Captain-eye cockpit shell and main-panel silhouette: strongest current coverage comes from the DC-9-51 N775NC cockpit photo.
- Yoke family and placement: best combined coverage comes from the DC-9-51 photo plus the FlightGear DC-9-32 extractable yoke package.
- Pedestal and throttle relationships: the FlightGear DC-9-32 source is the only current buildable candidate; exact DC-9-50 photo authority is still missing.
- Gauge density and analog depth: strongest current real-photo coverage comes from the DC-9-51 and DC-9-40 cockpit photos; the FlightGear altimeter remains the best buildable gauge candidate.
- Overhead panel density and location: only partial wide-photo coverage exists; no exact close-up authority was found in this pass.
- Windshield and sidewall framing: the DC-9-51 compatibility photo remains the strongest current lead.

## Downstream warnings

- Do not treat the current DC-9-51 or DC-9-40 photos as exact DC-9-50 geometry authority.
- Do not treat the FlightGear DC-9-32 package as target-correct geometry; keep `sourceVariant`, `targetVariant`, and compatibility limits explicit.
- Do not use Sketchfab exterior models for cockpit geometry.
- This handoff is `sourcing_complete`, not `source-approved`; Agent 2 must not assemble from these leads without human review.

## Stop outcome

`approval-required`: source discovery produced a ranked DC-9 candidate handoff, but owner/source review is required before downloads, new manifest entries, source approval, or Agent 2 assembly.
