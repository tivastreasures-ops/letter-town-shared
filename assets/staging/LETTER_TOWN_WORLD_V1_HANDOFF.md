# Letter Town world-edge kit v1 — Professor handoff

**Pack is uploaded to the Director's Google Drive:** https://drive.google.com/file/d/1RzmjGnkkuI8R6KzRLU8CI_7yv6jRFcp-/view?usp=drivesdk

Download `lettertown_world_v1.zip` (7.32 MB). It contains 8 GLB assets, two original art panoramas, scenery-only textures, a coordinate-driven town layout JSON, a rendered top-down map PNG, and detailed README.

**Integration:** Work on Round 8 only; do not overwrite R8-17c or Round 7. Existing gameplay positions and teleports stay unchanged. New GLBs are decorative scenery, staged for review, not yet integrated. Keep existing time-of-day sky/clouds. Keep river ring (radii 31–35) and replace primitive distant mountain geometry only after verifying new panorama panels. Use `town` as parent for scenery positions; prevent foliage within 2m of NPCs and 3m of roads. Inspect panel seams: supplied art is panoramic, not a seamless 360° skybox. Headless render from four viewpoints; Director alone confirms Quest view.

**Map:** `previews/letter_town_map_v1.png` derives from `layout/town_layout_v1.json`; use that JSON as the single source of truth. Existing town core is preserved until Director approves moves.

**Status:** Pack built and delivered to Google Drive. No live game files changed; Quest validation pending.
