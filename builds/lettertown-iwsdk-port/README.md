# Letter Town IWSDK port

Isolated port on `lettertown-iwsdk-port`. Round 7 and Round 8 are protected and unchanged.

Updated to R8-24 (`961b34ee7f0aa57e027869c46e2620ea9d7f9020`) plus the authored gift-bag repair. See [LATEST-UPDATE.md](LATEST-UPDATE.md) for the current integration and complete hosting ZIP instructions.

## Run

Node 22+ and npm are required. From this directory:

```
npm ci
npm run build
npm run preview -- --port 4173
```

For development: `npm run dev`. The non-destructive bootstrap script installs the lockfile and builds; it does not run a project generator over this source tree.

IWSDK `@iwsdk/core@1.1.0` creates the renderer, camera, scene and XR session. `LetterTownSystem` runs the adapted Round 8 game on the SDK's frame loop. The original hand interactions and canvas screens remain integrated; this port does not replace them with SDK stock interactions. Approved gloves remain the hand visuals.

`src/index.js`, `src/screens.js` and `src/intro.js` derive from Round 8. Rules/dictionary are pinned to the latest upstream snapshot under `rules/`. `npm run stage` verifies the pinned source manifest and copies baseline plus target-local R8-16 assets into a content-fingerprinted release directory. Vite fingerprints JavaScript. No service worker or deployment storage reset is used.

## Controls and saves

Use the original opening flow and Enter VR in Quest Browser over HTTPS. Hand tracking is required in the SDK session request. Point and pinch/release to select board buttons; pinch near a tool to grab it; release seeds over an empty plot; tilt the can to water; pull a finished bloom. The board also offers point-and-pinch garden controls. Hide reveals the town; MENU restores the board. Settings has recenter, screen distance/size/height, garden reach, pinch sensitivity and tray-side controls. The tray can also be grabbed and slid.

The save key remains `lettertown_ch1_v1`, using the original migration and schema. Existing saves on the same origin remain compatible. Browsers keep saves separately for each hostname: a new HTTPS test origin cannot automatically read a save on the public Round 8 origin. Deployment does not clear either origin's storage.

## Verification

```
npm run test:browser
npm run test:gameplay
npm run test:xr
npm run test:r816
npm run test:latest
npm run test:assets
```

Tests use real Chromium via Playwright (`CHROMIUM_PATH` can select a compatible executable). Browser artifacts are written under `test-results/`. Gameplay uses scripted screen actions, accelerated time and simulated pointers. The ending test seeds discovered words to isolate ending behavior from random harvesting. The XR test injects IWER only into the test browser; it is never shipped to players. Emulator checks are not physical Quest results.

## Release gate

**NOT SUBMISSION READY until a physical Quest 3/3S hands-only run passes.** Physical reach, pinch reliability, comfort, performance, recenter and controller-free completion require headset validation. See `TEST_REPORT.md` for the acceptance matrix and known limits. No competition submission or public Round 8 replacement is authorized by this port.
