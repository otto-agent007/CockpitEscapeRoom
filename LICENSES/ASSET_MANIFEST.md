# Asset source manifest

No external production assets are included in the current prototype flow.

Add one row for every reference-derived texture, model, sound, font, photograph, logo-like graphic, or other external asset.

| Asset | Project path | Source/creator | Modifications | Notes |
|---|---|---|---|---|
| Greybox geometry | Generated in source code | CockpitEscapeRoom project | Yes | Not production aircraft art |
| A320 Cockpit 2 integration proof | `public/models/airbus-first-officer.glb` | Owner-provided/downloaded Sketchfab source package recorded in `asset-reports/cockpit-pipeline/a320-prebuilt-parts-source-discovery/a320-cockpit-2-intake-report.md` | Imported, assembled, semantically renamed, shaded, validated, and promoted through the cockpit pipeline | Browser integration proof only; owner visual approval and final license review still required before production/distribution use |
| A320 cockpit browser proof backdrop | `public/images/a320-cockpit-integration-proof.png` | Source-review capture from the owner-provided/downloaded A320 Cockpit 2 package, recorded under `preview-renders/cockpit-pipeline/a320-cockpit-2-assembly/sketchfab-360-interior/` | Copied into `public/images` for the Airbus First-Officer browser integration proof | Temporary visual backdrop until the GLB cockpit camera/mesh split is production-ready; owner visual approval and final license review still required before production/distribution use |

Keep rows complete enough for future agents to understand source, path, transformation, and intended use.
