# Latest IWSDK update and hosting ZIP

Upstream game: R8-24, `961b34ee7f0aa57e027869c46e2620ea9d7f9020`.
Additional authored repair: `b66b2b86bd3577883e62840c6aeeb509ca2562ba` (closed gift bag fix).
The approved map-alignment changes are already present in main. Protected Round 7 and Round 8 directories were not edited.

Integrated: grabbable spelling tiles and wooden letter tray; direct hand/ray picking in the larger garden; single/five-seed packs; vowel-first packet lettering; corrected cottage facade Home artwork; real resident locations for lessons; new voices; blue/clay/glass vases and improved arranging placement; approved landscaping, river, hills, bridge, bulletin board and pink clouds; updated book/pages/shop artwork; table visibility button and tray handle; comfort limits and delayed recenter retries.

IWSDK continues to own the renderer, world update and XR session. Its existing pinch-release tolerance, tracking-loss cleanup, save compatibility, selected cottage placement and safe map-only travel remain intact. The latest gameplay rules and dictionary are target-local under `rules/`; `source-current.json` verifies the exact upstream assets/content/rules during staging.

Integration repairs: plain book pages no longer request `assets/null`; inactive neighbors stay hidden instead of appearing at the origin; held tiles reserve inventory and cannot be dropped into a word when no owned copy remains. The upstream gift bag repair is used as authored rather than inventing a new repair.

## Build and package

```
npm ci
npm run build
python3 scripts/package-release.py
```

The ZIP contains the complete static website, with index.html at its root, all JavaScript, GLBs, artwork, textures, dialogue, audio and videos. Extract and upload all contents to an HTTPS host. No npm setup or external account is needed by the hosted game. Keep browser storage to preserve saves. A different hostname cannot read another hostname's local save.

Automated checks: `test:assets`, `test:browser`, `test:gameplay`, `test:r816`, `test:latest`, `test:xr`. Browser tests use real Chromium; hand-motion simulation and IWER do not establish physical Quest completion. The ending regression uses discovered-word fixtures. Physical Quest comfort, performance and a full hands-only playthrough remain unverified.

Historical R8-16 reports describe the previous build. See the latest release evidence for current test results and exact build SHA.
