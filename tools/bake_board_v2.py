"""Bake high-poly appearance to a separate low-poly UV atlas.
Experimental versioned bulletin board output; original and v1 remain untouched.
"""
import bpy
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "assets" / "staging"
SRC = BASE / "originals" / "cozy_bulletin_board_orig.glb"
OUT = BASE / "cozy_bulletin_board_v2.glb"
ATLAS = BASE / "cozy_bulletin_board_v2_baked.png"
REPORT = BASE / "cozy_bulletin_board_v2.txt"
PREVIEW = BASE / "previews" / "cozy_bulletin_board_v2_preview.png"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SRC))
highs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
assert highs
bpy.ops.object.select_all(action="DESELECT")
for ob in highs:
    ob.select_set(True)
bpy.context.view_layer.objects.active = highs[0]
if len(highs) > 1:
    bpy.ops.object.join()
high = bpy.context.view_layer.objects.active
high.name = "Source high poly"
before = len(high.data.polygons)
high.data.calc_loop_triangles()
before_tris = len(high.data.loop_triangles)

bpy.ops.object.duplicate()
low = bpy.context.view_layer.objects.active
low.name = "Cozy board baked low"
low.data = high.data.copy()
low.select_set(True)
high.select_set(False)

ratio = min(1.0, 0.95 * 5000 / before_tris)
mod = low.modifiers.new("Decimate", "DECIMATE")
mod.ratio = ratio
mod.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier=mod.name)
low.data.calc_loop_triangles()
triangles = len(low.data.loop_triangles)
if triangles > 5000:
    raise RuntimeError(f"triangle count {triangles} > 5000")

# Establish a NEW UV atlas on the simplified mesh, rather than stretching the original UVs.
bpy.ops.object.select_all(action="DESELECT")
low.select_set(True)
bpy.context.view_layer.objects.active = low
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(island_margin=0.015)
bpy.ops.object.mode_set(mode="OBJECT")

image = bpy.data.images.new("Cozy Board Baked Color", width=1024, height=1024, alpha=False)
material = bpy.data.materials.new("Cozy Board Baked Material")
material.use_nodes = True
nodes = material.node_tree.nodes
bsdf = nodes.get("Principled BSDF")
tex = nodes.new("ShaderNodeTexImage")
tex.image = image
nodes.active = tex
material.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
low.data.materials.clear()
low.data.materials.append(material)

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 8
scene.cycles.use_denoising = False
for layer in scene.view_layers:
    layer.cycles.use_denoising = False
scene.render.bake.use_selected_to_active = True
scene.render.bake.use_pass_direct = False
scene.render.bake.use_pass_indirect = False
scene.render.bake.use_pass_color = True
scene.render.bake.margin = 8
scene.render.bake.cage_extrusion = 0.04
scene.render.bake.max_ray_distance = 0.07

bpy.ops.object.select_all(action="DESELECT")
high.select_set(True)
low.select_set(True)
bpy.context.view_layer.objects.active = low
print("BAKE START", flush=True)
bpy.ops.object.bake(type="DIFFUSE")
print("BAKE FINISHED", flush=True)
image.filepath_raw = str(ATLAS)
image.file_format = "PNG"
image.save()
image.pack()

# Source only used to bake; excluded from export and preview.
high.hide_render = True
high.hide_set(True)
bpy.data.objects.remove(high, do_unlink=True)

bpy.context.view_layer.update()
points = [low.matrix_world @ Vector(v) for v in low.bound_box]
min_z = min(p.z for p in points)
low.location.z -= min_z
bpy.context.view_layer.update()
points = [low.matrix_world @ Vector(v) for v in low.bound_box]
mins = Vector([min(p[i] for p in points) for i in range(3)])
maxs = Vector([max(p[i] for p in points) for i in range(3)])
dims = maxs - mins
bpy.ops.export_scene.gltf(filepath=str(OUT), export_format="GLB", export_yup=True,
    export_texcoords=True, export_materials="EXPORT", export_image_format="AUTO",
    use_selection=True)
REPORT.write_text(
    f"source: {SRC.name}\noutput: {OUT.name}\ntriangles before: {before_tris}\n"
    f"triangles after: {triangles}\n"
    f"glTF Y-up dimensions X x Y x Z: {dims.x:.5f} x {dims.z:.5f} x {dims.y:.5f}\n"
    f"base y: {mins.z:.5f}\ntexture: 1024x1024 color atlas baked from high-poly source\n"
    "UV: new smart-project atlas\n"
    "status: visual review REQUIRED; source and v1 preserved\n",
    encoding="utf-8")

# Render low-poly textured model for comparison.
scene.render.resolution_x = 640
scene.render.resolution_y = 640
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
world = bpy.data.worlds.new("Studio preview")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.58, 0.6, 0.64, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.85
center = (mins + maxs) / 2
diameter = max(dims.x, dims.y, dims.z)
def light(loc, power):
    data = bpy.data.lights.new("Soft light", "AREA")
    data.energy = power
    data.size = max(1.0, diameter*2)
    ob = bpy.data.objects.new("Soft light",data)
    scene.collection.objects.link(ob)
    ob.location = loc
light(center + Vector((diameter*2, -diameter*2, diameter*2)), 700)
light(center + Vector((-diameter*2, diameter, diameter*2)), 400)
camera_data = bpy.data.cameras.new("Camera")
cam = bpy.data.objects.new("Camera", camera_data)
scene.collection.objects.link(cam)
cam.location = center + Vector((0, -3*diameter, 0.3*diameter))
cam.rotation_euler = (center-cam.location).to_track_quat("-Z","Y").to_euler()
camera_data.type = "ORTHO"
camera_data.ortho_scale = diameter*1.55
scene.camera = cam
scene.render.filepath = str(PREVIEW)
bpy.ops.render.render(write_still=True)
print(f"SUCCESS baked {triangles} triangles; {OUT.stat().st_size} bytes; preview={PREVIEW.name}",flush=True)
