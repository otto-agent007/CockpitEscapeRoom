# Scene contract summary

Required roots (authoritative list and hierarchy in `docs/ASSET_CONTRACT.md`):

- `DC9_ROOT`
- `KMEM_LEGACY_ROOT` (Memphis memory environment, kept separate from `DC9_ROOT`)
- `LOCKER_ROOT`
- `AIRBUS_ROOT`
- `TESLA_ROOT`

Interactive nodes require unique `game_id` and an `interaction` custom property. Origins belong at physical hinges or rotation centers. Keep interactive controls separate from static panels. Export custom properties as glTF extras and verify them through Three.js `userData`.
