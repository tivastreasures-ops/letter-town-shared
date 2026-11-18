"""Render material-aware visual previews of staged Letter Town GLBs with Blender.
No gameplay or source-model files are modified.
"""
import bpy
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
STAGE = ROOT / "assets" / "staging"
OUT = STAGE / "previews"
NAMES = [
    "cozy_bulletin_board", "cozy_cottage", "wooden_shelf", "wooden_chair",
    "flower_teacup", "grocery_bag", "blue_gift_bag", "pink_cloud"
]

def setup_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 12
    scene.cycles.use_denoising = False
    for layer in scene.view_layers:
        layer.cycles.use_denoising = False
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    world = bpy.data.worlds.new("Warm studio")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes.get("Background").inputs["Color"].default_value = (0.55, 0.58, 0.62, 1)
    world.node_tree.nodes.get("Background").inputs["Strength"].default_value = 0.85

def add_light(location, energy, size):
    data = bpy.data.lights.new("Studio softbox", "AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new("Studio softbox", data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location

def make_camera(target, location, ortho_scale):
    data = bpy.data.cameras.new("Preview Camera")
    camera = bpy.data.objects.new("Preview Camera", data)
    bpy.context.scene.collection.objects.link(camera)
    camera.location = location
    direction = target - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    data.type = "ORTHO"
    data.ortho_scale = ortho_scale
    bpy.context.scene.camera = camera
    return camera

def render_one(name):
    src = STAGE / (name + "_v1.glb")
    if not src.is_file():
        raise FileNotFoundError(src)
    setup_scene()
    bpy.ops.import_scene.gltf(filepath=str(src))
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not meshes:
        raise ValueError(name + ": no mesh objects")
    bpy.context.view_layer.update()
    pts = [obj.matrix_world @ Vector(v) for obj in meshes for v in obj.bound_box]
    lows = Vector([min(p[i] for p in pts) for i in range(3)])
    highs = Vector([max(p[i] for p in pts) for i in range(3)])
    center = (lows + highs) / 2
    size = highs - lows
    diameter = max(size.x, size.y, size.z, 0.15)
    scale = diameter * 1.6
    light_distance = diameter * 2.8
    add_light(center + Vector((light_distance, -light_distance, light_distance * 1.3)), 750, max(1.0, diameter * 2.2))
    add_light(center + Vector((-light_distance, light_distance, light_distance)), 450, max(1.0, diameter * 2.4))
    angles = {"three_quarter": (1, -1, 0.68), "front": (0, -1, 0.35)}
    for label, direction in angles.items():
        cam = make_camera(center, center + Vector(direction).normalized() * diameter * 3.5, scale)
        filename = OUT / (name + "_" + label + ".png")
        bpy.context.scene.render.filepath = str(filename)
        bpy.ops.render.render(write_still=True)
        bpy.data.objects.remove(cam, do_unlink=True)
        print("RENDERED " + str(filename.relative_to(ROOT)), flush=True)

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    failures = []
    for name in NAMES:
        try:
            render_one(name)
        except Exception as ex:
            failures.append((name, str(ex)))
            print(f"FAILED {name}: {ex}", flush=True)
    if failures:
        raise RuntimeError("Preview failures: " + repr(failures))

if __name__ == "__main__":
    main()
