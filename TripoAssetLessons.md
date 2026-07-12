# Tripo asset lessons

## Durable decision

CockpitEscapeRoom accepts a Tripo prop for runtime consideration only when the preserved source contains a complete 4096×4096 BaseColor, Normal, and metallic-roughness texture set actually wired into the imported material. A filename containing `4k` is not proof; the importer must inspect the material graph and embedded images and pass the 4K source gate.

This is a source-quality rule, not a requirement to upload uncompressed 4K textures to the browser. Runtime texture size is chosen per prop after same-camera browser comparison. The source stays untouched so a later 1K or 2K runtime bake can be regenerated without compounding quality loss.

## What the locker investigation proved

| Asset | Original source maps | Source triangles | Important result |
|---|---:|---:|---|
| Pilot watch | 3 × 4096 | 488,677 | Looks good after 4K source maps are staged to 1K and 71,999 triangles. |
| Captain's hat | 3 × 4096 | 488,608 | Currently uses 1K runtime staging; that choice remains specific to this prop. |
| Old Wings | 3 × 1024 | 492,226 | Fine feather islands and glossy PBR response alias at locker scale. |
| Old Charging Bull | 3 × 1024 | 498,476 | Base color contains muddy baked lighting; PBR channels describe glossy dielectric material rather than bronze. |
| Replacement baseball | 3 × 2048 | 494,248 | Higher resolution alone did not remove faceted lighting baked into the atlas. |
| First baseball | 3 × 1024 | 1,971,968 | A very large mesh did not compensate for weak texture/material quality. |

The successful watch is not evidence that every prop should ship with 1K maps. It proves only that a clean 4K source can downsample successfully for that particular UV layout, material, camera distance, and silhouette.

## Current approved 4K locker candidates

| Asset | Download | SHA-256 | Verified source maps |
|---|---|---|---|
| Baseball | `/mnt/2TBHDD/Downloads/baseball 3d model4kInterior.glb` | `e77bd1ef4f85705edb2f6ff5bfc5d91d17f5243c9cd77d9c147b204b58617725` | 3 × 4096 |
| Charging Bull | `/mnt/2TBHDD/Downloads/bull 3d model4kNight.glb` | `a5ca94020d9a0de950666d7e8ab8da1eff861a42f48bfb06e29a6f83dcd3d1f1` | 3 × 4096 |
| Airline Wings | `/mnt/2TBHDD/Downloads/gold winged emblem 3d model4k.glb` | `27d2a4731419d1f7a44873b7aeb69869d6d33f23dc82f32657268db9fa85b36b` | 3 × 4096 |

All three match the higher-quality Tripo export family used by the watch and hat. Their neutral Blender source renders must remain part of the intake evidence under `.cache/assets/intake/locker-*-4k/`.

## Required intake sequence

1. Preserve the exact download under `.cache/cockpit-pipeline/sources/<scene>/<asset>/original/`; never overwrite an earlier source.
2. Record the download path, byte size, SHA-256, generator, triangle count, materials, recursive bounds, and embedded texture dimensions.
3. Reject the source if any required PBR map is below 4096×4096.
4. Render the untouched source under neutral lighting before changing transforms, geometry, or materials.
5. Import through the deterministic Blender script, establish the stable contract parent/collider, then decimate only the visible mesh.
6. Compare geometry-only, BaseColor-only, authored PBR, and tuned-PBR variants when a defect appears. Change one material layer at a time.
7. Capture the actual locker camera in the browser. Blender source beauty renders are diagnostic evidence, not runtime approval.
8. Keep the lowest runtime texture resolution that passes the same-camera comparison. Do not call a runtime budget universal based on one prop.

`npm run asset:locker` is the supported path. It prepares the configured sources, enforces immutable hashes and 4K source maps, updates the Blender master/report, validates the scene, renders approval cameras, exports the GLB, and validates the deployable result.

## Material lessons

- Diagnose BaseColor, Normal, roughness, metallic response, and geometry separately. Grain is a symptom, not a material category.
- A higher-resolution atlas can preserve a bad bake more sharply. Regenerate or retexture when lighting, facets, seams, or material identity are baked incorrectly.
- Dense glossy details such as feathers can sparkle at small screen sizes even with adequate texture resolution. Test roughness, normal strength, mipmaps, and actual on-screen scale.
- PBR channels must describe the object. A bronze statue should not arrive as a near-zero-metallic, near-zero-roughness dielectric.
- Preserve recognizable identity. Do not replace a real baseball, Bull, or set of Wings with a generic primitive or flat color merely to remove noise.
- Treat generated UV-atlas edits as untrusted until they are mapped on the real mesh. Reject shifted islands, rectangular filler blocks, and changed seam placement.
- Do not add emissive lift to an untextured material; it can wash leather or bronze toward white.

## Optimization lessons

- Keep source-quality and runtime-budget decisions separate: 4K source is mandatory, runtime maps remain evidence-driven.
- Scope decimation changes to the affected prop. A one-prop repair must not alter a shared ratio and silently over-reduce the watch, hat, or other props.
- Compare source and optimized triangle counts after every build. More triangles do not guarantee better art, but excessive reduction can destroy a good source.
- Do not run hierarchy-flattening or destructive GLB optimization while node names, colliders, and `game_id` metadata are runtime contracts.

## Browser acceptance checklist

- Runtime GLB bytes match disk with a no-cache fetch.
- The manual model URL version changes whenever the accepted GLB changes.
- Real exported nodes and colliders are present; no visible stand-in duplicates them.
- Locked silhouettes reveal back to the authored material correctly.
- Baseball seams, Bull silhouette, and Wings feather structure remain recognizable.
- No sparkle, grain, white atlas blocks, floating placement, intersections, console errors, or horizontal overflow at the required viewports.
- The original source, optimized prop, Blender master, deployable GLB, intake report, ExecPlan, and `TEST_REPORT.md` agree.

## Reporting correction

An early locker report said every first-generation prop had native 1K maps. Direct GLB inspection and the detailed intake records proved that statement stale: watch and hat were 4K, while Wings and Bull were 1K. When prose and machine inspection disagree, the preserved source GLB and generated intake report are authoritative.
