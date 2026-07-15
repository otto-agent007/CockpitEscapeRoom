# Deployable models

Only tested deployable GLB files belong here. Blender master files and raw temporary exports do not.

Expected production files:

```text
dc9-cockpit.glb
airbus-captain.glb
model-y-reward.glb
locker-room.glb
```

Every GLB must pass `npm run assets:check`.

`dc9-cockpit.glb` uses the first-officer/right-seat camera family and keeps deprecated captain cameras only as compatibility nodes. `airbus-captain.glb` uses the exported captain/left-seat camera and captain-side sidestick contract; the former `airbus-first-officer.glb` deployable path is explicitly deprecated and removed.

`locker-room.glb` currently includes the environment plus Blender-owned watch, Wings, Charging Bull, and captain's-hat candidates under stable `game_id` contract parents. The Wings, Bull, and hat remain locked silhouettes until reducer state makes them available. Baseball remains a runtime placeholder pending source intake.

This is a private, personal build, so owner-supplied or self-made models may be used freely.
