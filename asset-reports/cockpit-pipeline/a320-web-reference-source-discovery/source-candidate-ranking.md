# Airbus A320 Web Reference Source Ranking

## Summary

Agent 1 ran a bounded web-reference sourcing pass for the **Airbus A320 First-Officer cockpit**. No images, source repositories, GLBs, Blender files, or generated assets were downloaded or produced.

The goal was to rank candidate web references, identify license/provenance requirements, and prevent simulator or presentation material from becoming production geometry authority.

## Source authority consumed

- `art-source/cockpit-pipeline/gates/agent0-airbus-a320-web-reference-authority.json`
- `art-source/cockpit-pipeline/source-discovery-seeds/a320-web-reference-source-discovery.seed.json`

## Ranked candidates

| Rank | Candidate | Authority | Use | Decision |
| --- | --- | --- | --- | --- |
| 1 | Airbus official cockpits page | Primary context | A320-family cockpit commonality and official model context | Selected as context authority, not a downloadable modeling board |
| 2 | Wikimedia Commons `Cockpits of Airbus A320` category | Secondary index | Locate real A320 cockpit image pages with individual licenses | Selected as source index; every file still requires per-file review |
| 3 | `EasyJet airbus A320 cockpit.jpg` | Secondary candidate | Real A320 cockpit photo candidate, CC BY 4.0 lead | Selected for future manifest/download review |
| 4 | `Airbus A320 Glass Cockpit.jpg` | Presentation only | Simulator/glass-cockpit mood reference, CC BY 2.0 lead | Rejected for geometry authority |
| 5 | FlyByWire A32NX flight deck overview | Presentation/orientation only | Panel naming and triage orientation | Selected only as non-authoritative orientation aid |

## Coverage by requested section

- First-officer side-stick and seat relationship: not yet sufficiently covered by a high-confidence real A320 source.
- Main display arrangement: partially covered by Airbus official context and Commons A320 category candidates.
- FCU and glareshield geometry: partially covered; needs specific file-page review.
- Pedestal and thrust lever quadrant: candidate category entries exist, but no source is approved yet.
- Overhead panel density and lighting: candidate category entries exist, but no source is approved yet.
- Cockpit volume and window proportions: EasyJet A320 cockpit candidate may help after manifest/license review.

## Downstream warnings

- Do not download or commit any A320 image until it has an explicit `reference-manifest.yaml` entry with source page, creator, license, aircraft metadata, local file path, and intended use.
- Do not use simulator references as geometry authority.
- Do not mix DC-9, Model Y, or generic modern-cockpit details into the Airbus scene group.
- This source handoff is `sourcing_complete`, not `source-approved`; Agent 2 must not assemble from it.

## Stop outcome

`approval-required`: source discovery produced a ranked web-reference handoff, but owner/source review is required before downloads, reference board approval, Blender blockout, or assembly.
