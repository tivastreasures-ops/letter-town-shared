# Letter Town IWSDK — R8-16 integration

Source: `tivastreasures-ops/letter-town-shared`, commit `1a9f5cee5e87aab64e6dcf69b58477889231e5d7`, `builds/lettertown-chapter-one-r8/`.
Target: existing `lettertown-iwsdk-port` branch, `builds/lettertown-iwsdk-port/`, based on port commit `930ce8b451a85f25f733e12449180688ca009807`.

## Integrated

- Approved Seed Shop GLB, Kit beside the shop, Merry and her approved greenhouse, updated resident vignette buildings and town layout.
- Four cottage GLBs and original preview PNGs: Pink, White, Flower Box and Forest Green. Picker retains confirmation/cancel and saves the original source cottage keys. Older `rose`, `sky`, `honey` saves retain their keys and map to corresponding models.
- Player cottage appears beside the twelve-plot Player's Garden. Home travels to a fixed arrival position facing the selected cottage, while Lessons has a separate central arrival. New-game/state changes remove the previous house, cancel stale loads and dispose its GPU resources.
- Merry's map/greenhouse opens the existing tabletop garden and its seeds/can/Super Grow desk. Kit's shop and Phineas's workshop have near-hand and ray menu interactions. The workshop uses the approved `cottage_green.glb` assigned to Phineas by R8-16; no invented replacement art.
- Map-only travel; empty-ground pinches cannot initiate arbitrary teleporting. Destination movement is horizontal and leaves the SDK workspace height/position unchanged.
- R8-16's A–Z/QWERTY toggle with saved preference. Fixed the upstream QWERTY row overlap (130px-high keys were spaced 110px apart).
- Exact source asset/content/rules verification through `source-r8-16.json`. Only ten new assets are stored in `asset-overrides/` (about 5.8 MiB); protected source directories stay untouched. Asset staging verifies Git blob hashes against the specified source commit and produces fingerprinted release URLs.

## Bug investigation and fixes

The baseline browser reproduced `Cannot read properties of null (reading 'lesson')` when test/debug navigation opened the cottage screen without an initialized game. Normal startup had zero runtime errors. State-dependent navigation/drawing now refreshes the current save and returns safely to title if it is absent. Deferred lesson transitions verify that the same game and lesson are still active before running.

The baseline had twelve visible, untextured fallback planes in the garden before game initialization. These were the white cards. Fallback cards now start hidden; the approved plant models and mapped fallback art remain available. Personal bloom fallback planes also start hidden.

Player's Garden text now describes its twelve neighbor-tended plots, harvest rewards and slower growth relative to Merry's tabletop garden. It no longer calls them faster-growing home plots. The underlying shared-plot economy and growth rules are unchanged.

New model/network failures are recorded by the loading manager and reported to the console. Cottage failures also include the model name. Image and required story-content failures are explicit; failed required dialogue/story startup stops with the existing visible startup error. A deliberately missing Seed Shop model is tested as an expected fault.

## Preserved / deliberately not replaced

IWSDK still creates the renderer, camera, world, frame loop and XR session; required hand tracking, the port's pinch release and tracking-loss handling, approved gloves, near grabs, desktop fallback and recenter architecture remain in place. Upstream standalone renderer/session/frame-loop code was not imported, and upstream's shorter pinch timeout was not substituted for the port's working release logic.

No game-rule or dictionary changes were necessary: these files are identical at the requested source commit and are verified during staging. Round 7 and Round 8 were not edited. The approved original content, economy, save schema/key and migration remain authoritative.

No free walking, grabbable spelling-tile feature, new workspace-lock system, new cottage interior art or economy redesign was added. Home's interior/inventory graphic still follows R8-16's mappings; the four new images are exterior previews, not approved replacement interiors. Direct flower grabbing in the twelve-plot garden remains outside this integration; its existing screen controls work with hand ray/pinch. None of these omissions replaces a working port feature.

## Automated verification

Commands: `npm run build`, JavaScript syntax checks, `npm run test:assets`, `npm run test:browser`, `npm run test:gameplay`, `npm run test:r816`, `npm run test:xr`.

The browser regressions cover normal startup, null-state recovery, no white cards, all four confirmations/cancel selections and saved reloads, legacy cottage aliases, model removal, new model/preview loading, map/prop interactions, stable workspace height, no empty-ground travel, QWERTY hit regions and persistence, and cancellation of stale lesson callbacks. Existing tutorial, name, garden, inventory, spelling/dictionary, resident lessons, carts/orders, journal/fixture-assisted ending and save/resume regressions are retained.

Results and build SHA are recorded in ignored `test-results/` artifacts. The cottage picker is visually inspected from a real Chromium canvas capture. Render statistics are software-Chromium measurements, not Quest frame-rate claims. The SDK bundle remains large and physical Quest memory/startup/frame-rate measurements are required.

## Physical Quest review

Ready for the Director's Quest review when the automated release checks pass; **not certified submission-ready**. Physical Quest testing is **NOT TESTED** in this environment. Verify hands-only entry/menu selection, all four cottage appearances, comfortable arrivals/recenter, greenhouse desk reach, shop/workshop interactions, uninterrupted tutorial, planting/watering/harvest, letter selection and both layouts, carts/orders, book pages/journal, ending, and save/resume. Check floor alignment, natural pinch reliability, audio/video and frame rate. The ending automation uses discovery fixtures and is not an uninterrupted fresh-save hands-only playthrough.
