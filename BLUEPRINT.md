# CockpitEscapeRoom Blueprint

## Core thesis

CockpitEscapeRoom is a personalized Father’s Day tribute flow:

Airbus A320 First-Officer onboarding → locker memory reveal → Pop T Captain Mode in the DC-9-50 → red Model Y reward reveal → Model Y Flight Mode reward beat → Father’s Day final message.

The optional Mars Easter egg remains separate after the main ending.

## Production targets

- Opening aircraft: Airbus A320.
- Legacy aircraft: McDonnell Douglas DC-9-50.
- Reward vehicle: red Tesla Model Y.

Do not treat DC-9-51 as the production target. Existing DC-9-51 material may be kept as labeled compatibility reference only.

## Player loop

**Observe → inspect → decide → feedback → retry or hint → unlock next layer → reveal personal reward → advance**

Wrong answers must never erase completed stages.

## Delivery priorities

1. Stable Airbus A320 First-Officer matcher and clock gate.
2. Locker memory interaction and hat-reveal gate.
3. DC-9-50 checklist and route sequence.
4. Red Model Y reward reveal and Flight Mode copy.
5. Father’s Day final message.
6. Optional Mars trigger.

## Asset groups

```text
art-source/blender/dc9_master.blend      → public/models/dc9-cockpit.glb
art-source/blender/airbus_master.blend   → public/models/airbus-first-officer.glb
art-source/blender/tesla_reward.blend    → public/models/model-y-reward.glb
```

The asset filenames may be renamed in a dedicated asset-pipeline PR after root names, loader code, and reports are updated together.

## Definition of done

A release candidate is done only when the Airbus A320 and DC-9-50 pass owner visual approval, every required 3D action has an HTML equivalent, reduced-motion and sound controls are present, source/license records are complete, and the real checks pass.
