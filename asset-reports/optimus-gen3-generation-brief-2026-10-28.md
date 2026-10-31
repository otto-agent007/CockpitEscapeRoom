# Optimus Gen 3-based replacement brief — 2026-10-28

## Owner direction

The first Tripo robot and its bounded Blender wave were rejected on appearance. The replacement should be based on Optimus Gen 3 and have a reusable rig for gestures, turns and movement, not only one baked wave. The rejected source and proof remain preserved. No new model has been generated or approved yet.

## Reference authority

Use the exact Optimus Gen 3 image the owner wants to match as the visual reference. Tesla's 2026 investor material confirms a Gen 3 design with updated hands, but the inspected official sources did not establish a complete public orthographic Gen 3 design sheet. Record the actual reference image and source before claiming a specific likeness. Do not infer unseen rear, side or joint details as Tesla production fact.

## Tripo image prompt

> Use the attached Tesla Optimus Gen 3 reference as the design authority. Make a clean full-body front orthographic 3D character reference of the same robot, preserving the reference's head silhouette, torso shape, limb proportions, panel lines, hand design, and exact material colors. Neutral T-pose, arms straight and level with clear space from the torso, hands open with five distinct fingers each, legs hip-width and feet flat. Show separate mechanical shoulder, elbow, wrist, hip, knee, and ankle assemblies with enough clearance to bend; rigid armor shells over flexible dark joints. Symmetric premium industrial design, realistic seams, no exposed wires. Soft even studio lighting, plain light-gray background, sharp focus, entire robot visible with generous margin. No vehicle, props, extra limbs, fused fingers, text, or logos.

Use the same front image as input for consistent side and back views, asking for an orthographic view of the **same robot** with the **same T-pose, scale, materials and lighting**.

## Recommended Tripo settings and order

1. In Image Generation, use **Nano Banana Pro** for the owner-selected image and consistent view edits; it is Tripo's high-quality multi-image fusion option. For text-only concepting, GPT Image 2.5 Sunburst is Tripo's precision option. Choose square 1:1, 4K reference if available, and generate 2–4 front candidates before spending credits on 3D.
2. Keep one coherent design. Create front, left, back and right views in the same neutral T-pose and lighting; compare hands, joints, head and panels across views. Use Tripo's T Pose template if the source pose differs.
3. In 3D Workspace, choose **Clean Topology / Smart Topology Mesh P2.0**, **Multi-view**, **Quad**, and approximately **20,000 quads** for the initial hero candidate. Preserve this unrigged result as a separate version. P2.0 is already low-poly; do not send it through Retopo simply because the old high-density source was unsuitable.
4. **Skip Tripo Segmentation for the P2.0 quad source.** The current Tripo Studio Segmentation screen explicitly marks quad models unavailable, despite generic workflow prose suggesting otherwise. Keep the quad source intact. If independent rigid armor panels are needed, separate and bind them in Blender after source intake; inspect shoulder/upper-arm, forearm/hand, torso, thigh and shin boundaries there.
5. Run Smart UV only after geometry is selected. Generate **4K PBR BaseColor, Normal, Roughness and Metallic** maps with **Remove Lighting** on. Save/download the maps as source, not just a preview JPEG.
6. Rig a copy as **Humanoid/Biped, v3.0, Mixamo-compatible**. Test a 90-degree shoulder lift, elbow bend, wrist turn, hip/knee bend, and small body turn in the viewer. Reject chest tearing, armor stretching, fused fingers and foot sliding. The v3 rig's preset library is limited; specific gestures and locomotion can be authored or retargeted in Blender from the reusable skeleton.
7. Export and retain **unrigged FBX or GLB**, **rigged FBX**, **rigged GLB**, the original reference images, and separate 4K maps. FBX is the Blender working source for skeleton and weights; the eventual browser GLB will be built and validated from Blender, not copied directly from Tripo.

## Next intake check

When the replacement export arrives, inspect exact source hash, texture resolution/wiring, triangle count, part names, pivots, skeleton/finger bones and shoulder/chest deformation before any runtime integration. The owner chooses the visual anchor before a complete animation set.
