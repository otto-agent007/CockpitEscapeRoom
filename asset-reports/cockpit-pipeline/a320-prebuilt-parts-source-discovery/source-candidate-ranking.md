# Airbus A320 Prebuilt Parts Source Ranking

## Summary

Agent 1 ran a free/open-first prebuilt-parts sourcing pass for the **Airbus A320 First-Officer cockpit**. No models, repositories, STLs, textures, Blender files, or GLBs were downloaded or produced.

The goal was to identify reusable cockpit component candidates and clearly separate them from visual/reference authority.

## Source authority consumed

- `art-source/cockpit-pipeline/gates/agent0-airbus-a320-prebuilt-parts-authority.json`
- `art-source/cockpit-pipeline/source-discovery-seeds/a320-prebuilt-parts-source-discovery.seed.json`

## Ranked candidates

| Rank | Candidate | Coverage | Authority | Decision |
| --- | --- | --- | --- | --- |
| 1 | Sketchfab `A320 Cockpit 2` | Broad cockpit shell, main panel, glareshield, pedestal layout; 537.6k triangle lead | Prebuilt mesh candidate | Selected for license/download review |
| 2 | Sketchfab `A320-200 Cockpit` | Broad cockpit shell and A320-200 label; 50.7k triangle lead | Prebuilt mesh candidate | Alternate broad mesh candidate |
| 3 | Sketchfab `A320 - Airbus Pilot Chair` | Pilot chair; 13.1k triangle lead | Prebuilt mesh candidate | Selected as standalone chair candidate |
| 4 | GitHub `FGDATA/IDG-A32X` | Simulator source package and possible cockpit hierarchy | Open-source simulator package | Selected for safe repository inspection planning |
| 5 | Printables A320 FCU/EFIS search pool | FCU, EFIS, knobs/buttons | Home-cockpit printable parts | Selected search pool; individual pages still needed |
| 6 | Printables A320 pedestal/RMP/transponder search pool | Pedestal controls and small parts | Home-cockpit printable parts | Selected search pool; individual pages still needed |
| 7 | Thingiverse A320 sidestick search pool | Sidestick mount/side cabinet proxy | Home-cockpit printable parts | Fallback search pool |
| 8 | Sketchfab `A320 Part Cockpit` | Partial cockpit/main panel; 197.9k triangle lead | Prebuilt partial mesh | Alternate only if broader meshes fail |

## Coverage by cockpit section

- Cockpit shell/main panel: plausible Sketchfab broad-mesh candidates exist.
- Pilot/first-officer chair: plausible standalone Sketchfab candidate exists.
- FCU/glareshield: likely covered by Printables/home-cockpit pools, but specific model pages still need selection.
- Side-stick area: weak coverage; current leads are mostly simulator mounts, not real cockpit geometry.
- Pedestal controls: likely covered by Printables/home-cockpit pools, but specific model pages still need selection.

## Downstream warnings

- Do not download any candidate before adding or approving source records.
- Do not execute any code from simulator repositories.
- Do not treat Sketchfab, FlightGear, Printables, or Thingiverse candidates as Airbus geometry authority.
- Compare every selected mesh against real A320 references before Blender assembly.
- Agent 2 remains blocked until source approval exists.

## Stop outcome

`approval-required`: prebuilt source discovery produced a ranked candidate handoff, but owner/source review is required before downloads, Blender import, source approval, or assembly.
