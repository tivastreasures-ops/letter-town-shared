# APPROVED LETTER TOWN MAP — IMPLEMENTATION HANDOFF (Nov 18)

**Director approved the illustrated town map with the Welcome to Letter Town sign over the south entrance bridge.** The map is the visual authority. This is not a claim of Quest verification.

**Safe code work already completed:** branch `lettertown-approved-map-alignment`, commit `723386c275d07dc51b6fc0909b0c1a8234b101ac`, updates Round 8 `app/main.js` to remove the random shrub scatter and fountain bush ring, and use deterministic planting with exclusion radii around the Mayor, Snowy, Merry, Kit and Phineas. **This branch is not merged; Professor must review against latest R8 build.** Round 7 untouched.

## Approved top-down layout, +Z = south/front, -Z = north/back

| Feature | X | Z | Notes |
|---|---:|---:|---|
| Town Hall | 0 | -12.5 | North terminus, preserve current building |
| Mayor Ren | 1.1 | -10.3 | On steps, ground base aligned |
| Snowy | -1.1 | -10.3 | On steps, ground base aligned |
| Fountain | 0 | -7.0 | Clear circular plaza; no bush ring |
| Community garden | -4.2 | -2.8 | West of center, no scenery in plot access |
| Merry's greenhouse | -7.0 | -2.9 | West side |
| Merry | -5.6 | -1.5 | Unobstructed from garden path |
| Seed shop | 6.6 | -0.8 | East side |
| Kit | 5.3 | -2.1 | Keep clear of bushes |
| Phineas | 5.0 | -3.9 | By workshop/carts, leave clear working space |
| Cottage | -2.6 | 2.6 | Southwest of community board |
| Community board | 0 | 1.8 | Proposed: verify game interactions and line of sight before moving |
| South welcome bridge | 0 | 31–35 | River-ring crossing; ensure walkway extends to bridge |
| Welcome sign | 0 | 29.5 | Arch over southern path, facing arriving player (+Z) |

## World boundary and backdrop

- Preserve approved day/sunset/night sky and fluffy cloud art. Do not replace clouds.
- River ring currently spans radii 31–35; use the new river model **instead** of, not on top of, the primitive ring after visual review.
- Use `lettertown_world_v1_FINAL_with_maps.zip` from https://drive.google.com/file/d/1ssiFv_rVJ8lbgNJk7Q56B7J7BCZUdcH9/view?usp=drivesdk . It contains actual GLBs, texture panels, roads and layout data.
- The south bridge is **not connected** to the current central cobblestone network: build a continuous cobblestone approach from the cottage/board path to the bridge. The approved illustrated map implies this road; existing code does not yet implement it.
- Do not interpret panoramic scenery panels as seamless skyboxes; place panels beyond river, conceal joins with near trees, and test four views.
- Existing world contains extra cottages and scattered trees that may conflict with approved plan; remove or reposition only after headless comparison with approved map.

## Required Professor integration sequence

1. Review branch diff; cherry-pick or manually apply deterministic foliage change to latest R8 without overwriting other fixes.
2. Place entrance bridge, welcome sign, continuous road and background panels from supplied pack. **Do not substitute code primitives for approved artwork without Director approval.**
3. Align community board and workshop against map, preserving functional interactions; reposition excess cottages outside focal paths.
4. Check all resident models against ground plane and ensure 2m clear radius from foliage and at least 1m from road edges.
5. Produce headless screenshots from south entrance, fountain, Town Hall and cottage, plus an overhead layout. Send these to Director before claiming town alignment complete.
6. Director validates on Quest; no Quest test claimed by Librarian or Professor.

**Status:** Approved visual map, delivered asset kit, and a real Round 8 code branch for foliage clearance. Full world alignment and VR rendering remain pending integration. Do not mark the town finished until screenshots and Quest approval.
