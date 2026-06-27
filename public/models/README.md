# Deployable models

Only tested deployable GLB files belong here. Blender master files and raw temporary exports do not.

Expected production files:

```text
airbus-a320-first-officer.glb
dc9-50-cockpit.glb
model-y-flight-mode-reward.glb
```

Every GLB must pass `npm run assets:check` and have a corresponding source/license entry in `LICENSES/ASSET_MANIFEST.md`.

Private, personalized noncommercial scope is allowed when the asset path is explicitly marked as owner-supplied or privately licensed in the manifest with clear scope/consent, and the resulting GLB is used only for that scope.
