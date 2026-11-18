"""Optimize staged Letter Town GLBs with Blender (run: blender -b --python this_file).
Only staged originals are read. Round 7 and game sources are never modified.
"""
import bpy
import bmesh
import math
import os
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
STAGE = ROOT / "assets" / "staging"
ORIGINALS = STAGE / "originals"

# Caps are ceilings, not guarantees of acceptable appearance: inspect before integration.
JOBS = [
    ("cozy_bulletin_board", 5000),
    ("cozy_cottage", 10000),
    ("wooden_shelf", 5000),
    ("wooden_chair", 5000),
    ("flower_teacup", 5000),
    ("grocery_bag", 5000),
    ("blue_gift_bag", 5000),
    ("pink_cloud", 5000),
]

def tris(mesh):
    mesh.calc_loop_triangles()
    return len(mesh.loop_triangles)

def bounds(objects):
    pts = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    lo = [min(p[i] for p in pts) for i in range(3)]
    hi = [max(p[i] for p in pts) for i in range(3)]
    return lo, hi

def audit_mesh(objects):
    count = 0
    manifold = True
    for obj in objects:
        count += tris(obj.data)
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bm.edges.ensure_lookup_table()
        manifold = manifold and all(edge.is_manifold for edge in bm.edges)
        bm.free()
    return count, manifold

def process(name, cap):
    src = ORIGINALS / (name + "_orig.glb")
    if not src.is_file():
        raise FileNotFoundError(src)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(src))
    objects = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not objects:
        raise RuntimeError(f"{name}: no mesh objects")

    # Apply scale for consistent decimation, while preserving relative positions.
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        if obj.data.users > 1:
            obj.data = obj.data.copy()
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        obj.select_set(False)

    before, before_manifold = audit_mesh(objects)
    total = before
    if name != "pink_cloud" and total > cap:
        # Collapse-degenerate topology only as needed; preserve source and UV/materials.
        ratio = min(1.0, cap / total * 0.95)
        for obj in objects:
            if tris(obj.data) < 20:
                continue
            bpy.ops.object.select_all(action="DESELECT")
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            modifier = obj.modifiers.new("LetterTown_triangle_budget", "DECIMATE")
            modifier.decimate_type = "COLLAPSE"
            modifier.ratio = ratio
            modifier.use_collapse_triangulate = True
            bpy.ops.object.modifier_apply(modifier=modifier.name)
            obj.select_set(False)

    # Models are grounded by moving their top-level scene roots, not individual vertices.
    bpy.context.view_layer.update()
    lo, hi = bounds(objects)
    for obj in bpy.context.scene.objects:
        if obj.parent is None:
            obj.location.y -= lo[1]
    bpy.context.view_layer.update()

    images_changed = 0
    textures = []
    for img in bpy.data.images:
        if img.source != "FILE" or not img.has_data:
            continue
        if max(img.size) > 1024:
            width, height = img.size
            factor = 1024 / max(width, height)
            img.scale(max(1, round(width * factor)), max(1, round(height * factor)))
            images_changed += 1
        try:
            img.pack()
        except RuntimeError:
            pass
        textures.append(f"{img.name} {img.size[0]}x{img.size[1]}")

    after, after_manifold = audit_mesh(objects)
    lo, hi = bounds(objects)
    out = STAGE / (name + "_v1.glb")
    report = STAGE / (name + "_v1.txt")
    bpy.ops.export_scene.gltf(filepath=str(out), export_format="GLB",
        export_yup=False, export_apply=False, export_texcoords=True,
        export_normals=True, export_materials="EXPORT", export_image_format="AUTO")
    dims = [hi[i] - lo[i] for i in range(3)]
    # Watertight is not required for open furniture/surfaces, but always reported.
    report.write_text("\n".join([
        f"asset: {name}_v1.glb",
        f"source: assets/staging/originals/{name}_orig.glb",
        "units: Blender imported scene units (typically metres for glTF)",
        f"bounding box X x Y x Z: {dims[0]:.5f} x {dims[1]:.5f} x {dims[2]:.5f}",
        f"base min y: {lo[1]:.5f}",
        f"target height: {dims[1]:.5f} scene units",
        f"triangle count: {after}",
        f"original triangle count: {before}",
        f"watertight: {'yes' if after_manifold else 'no'}",
        f"original watertight: {'yes' if before_manifold else 'no'}",
        "texture format: embedded glTF/GLB (source format preserved or Blender re-encoded)",
        f"textures: {'; '.join(textures) or 'none detected'}",
        f"textures resized to max 1024: {images_changed}",
        "changes: mesh decimation where over budget; packed textures; scene base translated to y=0",
        "review: AUTOMATED PASS ONLY. Visual appearance/UV fidelity and gameplay scale require review before integration.",
    ]) + "\n", encoding="utf-8")
    if after > cap:
        raise RuntimeError(f"{name}: {after} triangles exceeds cap {cap}; inspect manually")
    print(f"SUCCESS {name}: {before} -> {after} triangles; {out.stat().st_size} bytes", flush=True)

def main():
    import sys
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    names = set(args) if args else {name for name, _ in JOBS}
    failures = []
    for name, cap in JOBS:
        if name not in names:
            continue
        try:
            process(name, cap)
        except Exception as exc:
            print(f"FAILED {name}: {exc}", flush=True)
            failures.append(name)
    if failures:
        raise RuntimeError("Unprocessed or over-budget assets: " + ", ".join(failures))

if __name__ == "__main__":
    main()
