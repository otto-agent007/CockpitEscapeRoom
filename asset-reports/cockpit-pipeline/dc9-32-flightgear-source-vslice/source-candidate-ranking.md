# DC-9 Source Candidate Ranking

## Branch And Scope

- Branch: `asset/dc9-source-quality-ranking`
- Job: `dc9-32-flightgear-source-vslice`
- Source repository: `https://github.com/FGMEMBERS-NONGPL/DC-9-32.git`
- Resolved revision: `d79e1476ce452a96126cc569a9c8a5d9fe705c8f`
- Source variant: `DC-9-32`
- Target variant: `unresolved`
- Variant scope: `unknown`

This is an Agent 1 source-quality pass over the existing source extraction. It does not approve sources for production, does not finalize the DC-9 variant, does not create new GLBs, and does not modify Blender scene files.

## Fresh Source State

Inspected:

- `art-source/cockpit-pipeline/jobs/dc9-32-flightgear-source-vslice/job.json`
- `art-source/cockpit-pipeline/stages/source/output/dc9-32-flightgear-source-vslice/component-catalog.json`
- `asset-reports/cockpit-pipeline/dc9-32-flightgear-source-vslice/source-inventory.json`
- `asset-reports/cockpit-pipeline/dc9-32-flightgear-source-vslice/xml-reference-report.json`
- `asset-reports/cockpit-pipeline/dc9-32-flightgear-source-vslice/extraction-report.json`
- `.cache/cockpit-pipeline/sources/DC-9-32/Models/Flightdeck/Flightdeck.xml`
- `.cache/cockpit-pipeline/sources/DC-9-32/Models/Flightdeck/flightdeck.ac`
- `.cache/cockpit-pipeline/sources/DC-9-32/Models/Flightdeck/Instruments/**`

The existing source job generated one selected candidate per requested category. This ranking records alternatives inspected and downstream assembly warnings before any future source approval is reused.

## Selected Candidates

| Rank | Candidate | Category | Confidence | Source path | Intended use | Selection reason | Limitations |
|---|---|---|---|---|---|---|---|
| 1 | `dc9-src-yoke-assembly-001` | `yoke_assembly` | High | `Models/Flightdeck/flightdeck.ac`; `Models/Flightdeck/Flightdeck.xml` | Captain-side yoke source package for neutral assembly | Direct captain-side object names `YokeBase`, `YokeColL`, `YokeL`, and `YokeTrimL`; XML animation references exist for the yoke column, yoke, and trim | DC-9-51 applicability unapproved; source pivots still need Agent 2 review |
| 1 | `dc9-src-throttle-assembly-001` | `throttle_assembly` | High | `Models/Flightdeck/flightdeck.ac`; `Models/Flightdeck/Flightdeck.xml` | Throttle/pedestal source package for neutral assembly | Contains throttle, reverser, fuel cutoff, crossfeed, speedbrake, flap, drum, and pedestal context; XML animation references exist for multiple levers | Includes neighboring pedestal controls, so Agent 2 must preserve or narrow boundaries intentionally |
| 1 | `dc9-src-large-gauge-001` | `large_cockpit_gauge` | Medium | `Models/Flightdeck/Instruments/ALT/altimeter.ac`; `Models/Flightdeck/Instruments/ALT/alt.xml` | Complete analog gauge source package for neutral assembly | Complete altimeter with face, bezel, needle, digits, knob, screws, and XML animation; placed twice by the flight deck XML | It is an altimeter candidate, not a final production instrument choice; RGB texture alternatives were not converted |
| 1 | `dc9-src-switch-cluster-001` | `switch_cluster` | Low | `Models/Flightdeck/flightdeck.ac`; `Models/Flightdeck/Flightdeck.xml` | Minimal switch/knob/lamp source package for neutral assembly | ABS-named switch, knob, and lamp objects are the clearest switch-like cluster found in the primary cockpit model | No explicit XML animation for `SwABS`; no guard object found; preview is spatially sparse; variant scope unknown |

## Alternatives And Rejections

| Category | Alternative inspected | Source path | Confidence | Decision | Reason |
|---|---|---|---|---|---|
| `yoke_assembly` | FO/copilot yoke objects `YokeColR`, `YokeR`, `YokeTrimR` | `Models/Flightdeck/flightdeck.ac`; `Models/Flightdeck/Flightdeck.xml` | Medium | Rejected for this handoff | Valid yoke-like source, but the requested vertical slice needed a captain-side yoke. Keep as an alternate if a future FO-side or mirrored-yoke batch is requested. |
| `throttle_assembly` | Individual nearby levers `LGLever`, `FlapLever`, `XfeedLever`, `SpdBrakeLever`, `PneuLeverL`, `PneuLeverR` | `Models/Flightdeck/flightdeck.ac`; `Models/Flightdeck/Flightdeck.xml` | Low to medium | Rejected as standalone throttle alternatives | These are useful cockpit controls but not complete throttle assemblies. Some are already included as context in the selected pedestal package. No viable better throttle assembly was found in the inspected source. |
| `large_cockpit_gauge` | `AI`, `ASI`, `HSI`, `Clock`, `RMI`, `VSI`, `EPR`, `N1`, and `N2` instrument model/XML pairs | `Models/Flightdeck/Instruments/**` | Medium | Rejected for this handoff | Several are viable future gauge candidates. The altimeter was kept because it is complete, compact, has needle/knob XML evidence, and already generated a valid GLB and preview. |
| `switch_cluster` | Instrument knobs such as HSI, RMI, clock, and dimmer knobs | `Models/Flightdeck/Instruments/**` | Low | Rejected | These are instrument knobs, not a cockpit switch cluster. They do not satisfy the requested switch/knob/lamp cluster category. |
| `switch_cluster` | Gear, pneumatic, and miscellaneous cockpit levers | `Models/Flightdeck/flightdeck.ac`; `Models/Flightdeck/Flightdeck.xml` | Low | Rejected | They are lever controls rather than a switch cluster, and would shift the category away from the requested handoff. No viable stronger switch-cluster alternative was found in the inspected source. |

## Downstream Assembly Warnings

- Do not treat any selected source as production-correct DC-9 geometry; these are simulator-source candidates only.
- Preserve `sourceVariant: DC-9-32`, `targetVariant: unresolved`, and `variantScope` in downstream manifests.
- For the yoke, Agent 2 should verify runtime pivot empties against XML center evidence instead of assuming mesh origins are usable.
- For the throttle package, Agent 2 must decide whether neighboring pedestal controls stay grouped or get split into a later batch.
- For the altimeter, Agent 2 should preserve the full gauge package but avoid treating it as the final production instrument choice.
- For the switch cluster, Agent 2 should treat the package as low-confidence and visually weak; it is acceptable for a pipeline proof but should not drive production switch placement.

## Source Handoff Decision

Outcome: `approval-required`.

The current selected candidates remain suitable for a pipeline proof source handoff, with confidence and limitations now recorded. The switch cluster is the weakest candidate and should be the first source category revisited in a future Agent 1 batch.

Next trigger: before Agent 1 publishes any new or replacement DC-9 source component batch.
