# Sam: The Non-Profit Pivot

Status: owner approved prototype implementation (“looks good lets get it done”). Playable review candidate implemented in plan0057. Final generated poses and authored boxes await owner review.

## Player outcome

Sam (the existing `oracle` fighter) distracts a nearby opponent with an altruistic promise, slips behind them, and strikes with a corporate restructuring pen. A comic CAPPED PROFIT stamp marks the conversion. The attack bypasses guard, transfers half the opponent's meter, and applies the requested extra penalty to tagged tech-founder/billionaire fighters.

Keep the current TEXT BUBBLE move and all approved Sam artwork as recoverable references while building this as a separate dev candidate. Captain's accepted changes and unrelated work remain intact. No production cabinet integration, commit, publication, new dependency, accounts or paid API is included.

## Animation and effects

Sam points skyward with exaggerated awe. A speech bubble reads: "Look! Open-source AGI for the good of all humanity!" After a successful close-range capture, the opponent pauses and turns toward the glowing open-source halo. Sam's expression changes; he slides behind them, draws the pen, and makes a comic pen strike followed by the CAPPED PROFIT stamp. Tagged opponents receive a glowing LAWSUIT PENDING marker.

The full line remains readable independently of the short pose holds. Reduced motion retains the speech, halo, strike cue and status label using static art. The animation and opponent distraction drawings require owner visual review. Captain keeps his cup in the correct hand in any new distraction pose.

## Approved prototype values

- Cost: 60 of the existing 100 meter points, paid once on activation.
- Capture: grounded target within 60 stage pixels; 24 ticks of interruptible windup before capture. Jumping or retreating during that windup can evade it. A miss spends meter and has recovery.
- Sequence: 24 windup ticks, 18 distraction/slide ticks, 3 pen-strike ticks, 21 recovery ticks. Total 66 ticks at 60Hz. Strike damage occurs only during the final 3 strike ticks; the first 18 captured ticks are presentation/control, not repeated damage.
- Damage: 18 health, bypassing guard/shield. The captured opponent cannot move until the strike releases them.
- Asset seizure: on the single successful strike, transfer exactly 50% of the opponent's meter measured immediately before impact. This special replaces the ordinary defender meter gain from damage, so the displayed remaining meter is exactly halved. No theft on a miss or interruption before capture.
- Co-founder tags: Booster and Oracle qualify; Captain does not. Qualifying targets take 36 strike damage and 1 additional health per second for 3 seconds. Refresh the same marker on another application; do not stack duplicate ticking effects.
- Example: Sam starts at100, pays60, and strikes an opponent with80meter. The opponent ends at40meter; Sam ends at80meter.

These values are approved for the separate prototype; production adoption remains pending art/box review. Physical pen reach is49px, measured from pivot64 to exclusive drawn edge113; grounded capture radius remains60px.

## Controls and integration

Recognize forward → down → down-forward + Heavy relative to facing. Add a short directional history (proposed 18-tick window); current inputs have no down direction or motion buffer. Keep the current L / native Special button as an accessible equivalent. Preserve other fighters' existing controls; resolve the P1 S/down conflict with the existing speed shortcut explicitly in the implementation plan.

Use pure combat state for capture, stage-safe reversal placement, meter transfer and timed damage. Keep halos, stamps, dialogue and marker rendering separate from rules. Fit the reversal within stage walls and pushboxes, support either facing, clear capture and status state appropriately on knockout/restart, and never depend on a loaded drawing for damage.

## Acceptance and next step

Implementation and evidence: plans/0057 and asset-reports/mars-arcade-sam-nonprofit-pivot-2026-10-06.md. Review URLs use `?sam=pivot`; standard URLs retain Text Bubble. Motion/native inputs, success/misses/interruption, guard bypass, exact transfer, three status pulses, reset/reload, reduced motion and375/768/1440layouts are proved. Mirrored walls, refresh, jump-at-capture, simultaneous captures and deaths before capture/strike are covered in engine tests. Final art and boxes remain the owner gate before adopting the candidate.
