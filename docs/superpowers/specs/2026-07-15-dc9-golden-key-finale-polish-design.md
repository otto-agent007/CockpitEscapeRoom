# DC-9 Golden Key Finale Polish Design

## Goal

Make the Captain's Key a tangible reward in the DC-9 cockpit, give its discovery and celebration the same premium finish as the Captain's Hat, remove the visible scene-swap glitch before the locker, and tighten the yoke route card and Home Operations Log.

## Player experience

- During `keyReveal`, a cleaned golden key rests on the green ledge to the right of the first-officer seat. The default view does not reveal it immediately.
- Passive `>>>` chevrons ask the player to scan right without moving the camera. They disappear as soon as the key enters the camera frustum.
- Clicking the real key, its projected HTML equivalent, or its accessible fallback opens a dark green night-cockpit celebration with a rendered key and restrained gold/teal confetti.
- The celebration reads `Final Flight Log complete`, `THE CAPTAIN'S KEY`, `Legacy flight secured. The Captain's Locker is ready.`, and `Take the Captain's Key`. It contains no Momma Cheryl or engraving copy.
- Taking the key fades the still-mounted DC-9 fully to black. Only at full black does the persisted phase change to `locker`; the locker loads behind the opaque transition and then follows the existing title/reveal sequence.

## Asset and interaction contract

- Preserve `/mnt/2TBHDD/Downloads/golden key 3d model.glb` by hash under `.cache/cockpit-pipeline/sources/dc9/golden-key/original/`.
- Deterministically import it into `art-source/blender/dc9_master.blend`, reduce it to no more than 72,000 triangles, use one material with 1024px base-color, normal, and metallic-roughness maps, generate tangents, and normalize the longest dimension to approximately 0.18 scene units.
- Export `DC9_PROP_CAPTAINS_KEY`, `DC9_PROP_CAPTAINS_KEY_MESH`, and `DC9_HITBOX_CAPTAINS_KEY`; the root owns `game_id=dc9.key.open` and the invisible collider targets that ID.
- Keep the key outside the opening frustum but within the existing rightward head-look limit. Rest it flat and centered on the right-side green ledge without visible intersection.
- Required 3D actions retain native HTML equivalents. Reduced motion removes pulsing/confetti but does not change progression or transition ordering.

## Cockpit UI polish

- Route card option A is authoritative: board dimensions become `(0.10, 0.012, 0.15)` at center `(0.4973, -2.775, 0.27)`. Its rows, submit plate, physical colliders, and projected HTML hit area are reflowed inside the shortened board and mounted symmetrically to the first-officer yoke.
- Home Operations retains all five pages, title, copy, and progression. At 1440x900 it renders at content height between 360px and 430px instead of filling the right side vertically.
- Home Operations uses a compact deep-green glass surface, restrained teal/gold accents, a structured header/folio, a readable page panel, and aligned navigation. Narrow layouts may scroll without covering the status bar.

## Compatibility and validation

- Keep persistence schema v8 and existing `OPEN_CAPTAINS_KEY` / `CLAIM_CAPTAINS_KEY` action semantics.
- Add no production dependency.
- Validate Blender names, metadata, hierarchy, texture and triangle budgets, browser projection/click behavior, keyboard fallback, reduced motion, reload before/after claim, exact black-frame phase ordering, and responsive layouts at approximately 375, 768, and 1440 pixels.
- Record generated GLB size/hash, validator results, inspected screenshots, asset provenance, and remaining owner-review delta in the active ExecPlan, asset report, manifest, and `TEST_REPORT.md`.
