# Letter Town IWSDK acceptance report

The protected Round 7 and Round 8 directories are unchanged. Tests run in real Chromium. Scripted actions, accelerated time, fixture data and XR emulation are identified below and never count as physical Quest results.

| Check | Status | Evidence / limit |
| --- | --- | --- |
| Production build | PASS | Pinned IWSDK 1.1.0, Vite, npm lockfile |
| Desktop startup and actual rendering | PASS | Original town and garden; one SDK canvas; advancing render frames |
| Browser runtime and asset errors | PASS | Latest startup and gameplay runs: zero console errors or failed responses |
| XR entry and exit | PASS | IWER emulator only; SDK session, two tracked hand sources |
| Quest 3 / 3S hand tracking | NOT TESTED | No physical headset connected |
| Complete tutorial | PASS | Scripted screen actions; all seven lessons, book/map, shop/orders, cottage/gift |
| Garden loop | PASS | Simulated grab/release seeds, tilt can, grow and pull bloom; authoritative four-letter common harvest |
| Movable tray / tracking loss | PASS | Simulated tray drag; lost tracking cancels held seed without planting |
| Crafting / dictionary | PASS | FLOWER crafted through screen buttons; invalid word rejected |
| Word Cart / Flower Cart | PASS | Word cashbox sale, bouquet arrangement, blue vase, flower sale |
| Storybook / chapter ending | PASS | Fixture discoveries; original ending restores sign and saves story/journal |
| Save / resume | PASS | Actual reload; name, cottage and restoration survive |
| Hosted HTTPS accessibility | NOT TESTED | Separate test-site publication pending; public Round 8 untouched |
| Fresh-save hands-only completion | NOT TESTED | Requires a complete physical Quest run |

## Implemented inventory

- SDK renderer, camera, scene, frame loop and XR launch; hand tracking required at session entry.
- Original town/residents, personal and community gardens, approved artwork and GLBs.
- Fourteen flower varieties, configured colors, individual seed packets/shop and original growth-stage mapping. All 68 required seed/bloom/stage/tool paths pass the asset audit.
- Original tutorial/dialogue flow, point-and-pinch and fingertip board interactions, near grabs, planting, can watering, harvesting, movable tray, comfort controls and recenter.
- Dictionary/crafting, bouquets, both vase choices, Word Cart and Flower Cart.
- Town map/navigation, cottage selection, original home inventory, journal, Storybook/Mad Lib, Welcome Sign restoration and ending films.
- Original rules/economy, dictionary, save key/schema/migration and offline progression. No deployment storage clearing.
- Fingerprinted JavaScript and content-addressed original assets/content. Build SHA on the desktop banner and in-world screen footer.

The source remains the original game on IWSDK. Its established canvas screens and gesture gameplay run in a registered SDK system; they are not replaced with stock SDK gameplay components.

## Known limits and unfinished acceptance

Physical reach, pinch reliability, page turning, tool accessibility, recenter comfort, audio/video behavior and headset frame rate remain unverified. The prior reach/pinch complaints cannot be declared resolved by simulation. Exhaustive physical review of all varieties/colors/stages has not been performed. The world-initializer JavaScript bundle is large; Quest startup, memory and frame rate need measurement.

The ending regression uses discovered-word fixtures and accelerated time; it does not prove an uninterrupted fresh-save playthrough. The original Home screen retains its existing “Decorating is coming soon” limitation.

Saves are browser-origin scoped. A new test hostname cannot automatically read the public Round 8 hostname's save. Neither deployment nor tests clear the user's live site storage. The separate Sites test origin starts owner-only, so public/judge access is not established.

## Quest verification

Open the delivered HTTPS test URL in Quest Browser and sign in if required. Compare `Letter Town IWSDK — Build <SHA>` with the delivered commit. Reload normally or open a fresh tab with `?build=<SHA>` if the identifier differs; do not clear storage. Set controllers aside, enable hand tracking, enter VR, complete the comfort setup and test reach, recenter, all lessons, gardening, crafting/carts, book pages and ending. Exit/reopen and verify progress resumes.

**Hands-only completion: NOT VERIFIED on physical Quest. Final verdict: NOT SUBMISSION READY.** No competition entry has been submitted and no public game has been replaced.
