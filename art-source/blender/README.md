# Blender source files

Place editable source files here:

```text
web_asset_template.blend
dc9_master.blend
airbus_master.blend
tesla_reward.blend
```

Install Git LFS before committing them. Machine-specific Blender paths do not belong in the repository.

Start with the DC-9 proof asset described in `plans/0001-dc9-pipeline-proof.md`. Do not create the Airbus production file until the exact model is confirmed.

Airbus source references are organized separately in `../references/a320`; pull A320 cockpit, panel, and system references from that folder when preparing `airbus_master.blend`.
