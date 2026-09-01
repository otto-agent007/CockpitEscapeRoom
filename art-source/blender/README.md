# Blender source files

Place editable source files here:

```text
web_asset_template.blend
dc9_master.blend
dc9-memphis-legacy-departure.blend
locker_room_master.blend
tesla_reward.blend
```

Install Git LFS before committing them. Machine-specific Blender paths do not belong in the repository.

The original DC-9 proof asset in `plans/0001-dc9-pipeline-proof.md` is historical. Current production work must preserve the validated roots, cameras, pivots, hierarchy, animations, and `game_id` contracts documented in `docs/ASSET_CONTRACT.md`.

`dc9-memphis-legacy-departure.blend` is the approved separate outside-memory environment; do not merge it into `dc9_master.blend`. Rebuild it with `npm run asset:dc9-memphis` only after its source, assembly, and shading approvals match.

The authoritative Airbus A320 source is the shaded pipeline master at `../cockpit-pipeline/builds/shaded/a320-cockpit-2-shading/a320-cockpit-2-shaded.blend`; do not introduce a separate `airbus_master.blend`. Airbus source references are organized in `../references/a320`.

`tesla_reward.blend` is generated deterministically by
`tools/blender/build_tesla_reward.py` from the hash-pinned, owner-supplied Tripo
source preserved in the local pipeline cache. Rebuild it with
`BLENDER_BIN=/path/to/blender BLENDER_EXPECTED_VERSION=5.1 npm run asset:tesla`;
do not hand-edit the deployable GLB or replace the source candidate without
updating its intake report and approval evidence.
