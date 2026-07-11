# Deployable models

Only tested deployable GLB files belong here. Blender master files and raw temporary exports do not.

Expected production files:

```text
dc9-cockpit.glb
airbus-first-officer.glb
model-y-reward.glb
locker-room.glb
```

Every GLB must pass `npm run assets:check`.

`locker-room.glb` currently includes the environment plus Blender-owned watch, Wings, Charging Bull, and captain's-hat candidates under stable `game_id` contract parents. The Wings, Bull, and hat remain locked silhouettes until reducer state makes them available. Baseball remains a runtime placeholder pending source intake.

This is a private, personal build, so owner-supplied or self-made models may be used freely.
