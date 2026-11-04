"""Export the existing reward hangar without the vehicle or reward animation.

Run with factory startup, auto-execution disabled and tesla_reward.blend open.
The original master is never saved or modified on disk.
"""
import hashlib
import json
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / ".cache/assets/roboptimus-hangar"

hangar = bpy.data.objects["TESLA_HANGAR"]
selected = [hangar, *hangar.children_recursive]
assert not any("VEHICLE" in obj.name or "MODEL_Y" in obj.name for obj in selected)
bpy.context.scene.frame_set(1)

# The source facade depicts a closed roller door on a continuous wall. Cut only
# that doorway in this derivative; retain/interpolate its surrounding atlas UVs.
shell = bpy.data.objects["TESLA_HANGAR_SOURCE_SHELL"]
shell.data = shell.data.copy()
bm = bmesh.new()
bm.from_mesh(shell.data)
for point, normal in [((-2.6, 0, 0), (1, 0, 0)), ((2.6, 0, 0), (1, 0, 0)), ((0, -13, 0), (0, 1, 0)), ((0, 0, 5.6), (0, 0, 1))]:
    bmesh.ops.bisect_plane(bm, geom=[*bm.verts, *bm.edges, *bm.faces], dist=0.0001, plane_co=point, plane_no=normal)
doorway = [face for face in bm.faces if abs(face.calc_center_median().x) < 2.599 and face.calc_center_median().y < -13.001 and 0.03 < face.calc_center_median().z < 5.599]
assert doorway, "Expected the source's closed front doorway"
removed = len(doorway)
bmesh.ops.delete(bm, geom=doorway, context="FACES")
bm.to_mesh(shell.data)
bm.free()
for name, side in [("TESLA_HANGAR_DOOR_LEFT", -1), ("TESLA_HANGAR_DOOR_RIGHT", 1)]:
    door = bpy.data.objects[name]
    door.animation_data_clear()
    door.location = (side * 1.3, -14.0, 2.8)
    door.dimensions = (2.6, 0.2, 5.6)
bpy.context.view_layer.update()
bpy.ops.object.select_all(action="DESELECT")
for obj in selected:
    obj.animation_data_clear()
    obj.select_set(True)
bpy.context.view_layer.objects.active = hangar
OUTPUT.mkdir(parents=True, exist_ok=True)
path = OUTPUT / "roboptimus-hangar.glb"
bpy.ops.export_scene.gltf(
    filepath=str(path), export_format="GLB", use_selection=True,
    export_extras=True, export_animations=False,
    export_cameras=False, export_lights=False,
)
meshes = [obj for obj in selected if obj.type == "MESH"]
for obj in meshes:
    obj.data.calc_loop_triangles()
points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
report = {
    "source": "art-source/blender/tesla_reward.blend",
    "blender": bpy.app.version_string,
    "selected": [obj.name for obj in selected],
    "doorwayFacesRemoved": removed,
    "triangles": sum(len(obj.data.loop_triangles) for obj in meshes),
    "materials": sorted({m.name for obj in meshes for m in obj.data.materials if m}),
    "boundsBlender": [[min(p[i] for p in points) for i in range(3)], [max(p[i] for p in points) for i in range(3)]],
    "doors": {obj.name: list(obj.location) for obj in selected if "DOOR" in obj.name},
    "byteLength": path.stat().st_size,
    "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    "sourceAttribution": "Hangar by nermin, CC BY 4.0; see asset-reports/model-y-hangar-source-intake.json",
}
(OUTPUT / "export-report.json").write_text(json.dumps(report, indent=2) + "\n")
print("ROBOPTIMUS_HANGAR", json.dumps(report))
