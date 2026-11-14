# Letter Town — November 14 Build Reconciliation Addendum
**For:** Professor (Quest 3/WebXR), Agent Four (2D Web/Mobile)
**Status:** Build handoff / Director decisions with draft and placeholder flags. This document is not independent authorization to start coding or deploy.

## 1. Ownership and collaboration
Professor retains responsibility for the existing Three.js/WebXR Letter Town implementation, hands-first physical mechanics, and Quest headset testing. Agent Four owns a separate desktop/mobile 2D presentation. Both use the SAME source gameplay rules, progression events, dialogue IDs, inventory transactions, currencies, and asset identifiers. The Arcade is separate. Do not overwrite the Professor's earlier playable version.

## 2. Most important mechanical correction
- Watering is a CAN TILT AND POUR in VR; accessible select-and-apply for 2D and VR fallback. Water doubles growth speed.
- Super Grow is the ONLY plant-food item, applied by SHAKING over the plant in VR; select-and-apply in 2D and VR accessibility fallback.
- The separate growth-speed Plant Food from earlier handoffs is CANCELLED. There is no second fertilizer.
- Super Grow gives exactly TWO letters on ONE NEXT harvest instead of one, with a single pending dose/no stacking or queueing, and no duplicate spend.
- Normal harvest grants ONE letter plus ONE cut flower. Seeds yield FIVE harvests each and regrow; eight plots, four random starter plants, 100 real starting coins, offline growth.
- Director accepted initial MVP/headset-test price figures of 5/7/10 coins per common/uncommon/rare seed, packs at 20/30/45, Super Grow at 4. Make these CONFIGURABLE. Dean's other earning formulas/letter exchange ratio and anti-softlock pity-seed remain proposals until approved.
- Meta ProjectFlowerbed is a mechanics reference for grab/pour/shake if its actual implementation proves practical to reuse; do not discard useful existing code just to rebuild. No Meta visual assets, unapproved IWSDK migration or unjustified clone. Professor decides feasibility after source review.

## 3. Chapter One story — NEW DRAFT
- The original three-blank 'The Day the Welcome Went Missing' is superseded as a target by a longer working MAD LIB with TWELVE blanks. Exact wording and final parts-of-speech distribution are NOT YET APPROVED; keep story content data-driven and changeable.
- The player can see the unfinished Mad Lib and grammatical prompts from early in the game to know what they're collecting. It is not a mandatory immediate task.
- A discovered-word collection is DISTINCT from consumable letter tiles and crafted Word Inventory: words already spent/sold should remain known for future storytelling. The Mayor gently nudges when enough suitable words are discovered; the player chooses when to finish. Optional 'Surprise Me' uses known, category-compatible words rather than granting letters.
- Confirming the completed Welcome Day Mad Lib restores the physical Welcome Sign in town and changes the previously broken/unrestored state. Preserve the exact selected words in the saved story and offer reread/retell.
- Completed stories live in the Player Storybook. The separate chapter-closing Journal contains Cat Girl's narrated recap: arrival, six original residents, garden/home, restored sign, and future possibilities. Journal script is a draft, not a finished audio asset; preserve captions and a text-only fallback.
- Do NOT require completion of Cat Girl's optional side quest to finish Chapter One.

## 4. Cat Girl — additional character / optional quest, NOT replacing guided cast
Cat Girl is a mischievous new resident and the 'hurricane bringer' whose literal word misunderstandings generate OPTIONAL side quests. Example: she requests HURRICANE after another resident actually said 'HURRY! I NEED A CANE!' Player gives her HURRICANE, a harmless magical letter storm blows through town, Mayor Ren reacts, the misunderstanding is revealed, and Letter Chase unlocks as a replayable mini-game. Narrative design only for now; side quest, exact reward and mini-game mechanics are not required to block the Chapter One MVP. Her new turnaround is PLACEHOLDER pending revisions to character design:
https://drive.google.com/file/d/1LoX3702m1JdEph0eTtmTbwHY6Imub4cu/view

Keep existing tutorial residents and cast exactly: Hudson dog, Snowy cat, Merry bird, Kit mint frog, Phineas blue fox, Mayor Ren blue magical honey badger. Do not substitute inaccurate people/animals depicted on concept boards.

## 5. New visual asset slots / source of truth
- Before-restoration title/home screen should appear charming but visibly incomplete (crooked/missing Welcome Sign, unfinished town path/flower beds). Completion restores the sign. Build visual state is a gameplay flag, not merely decorative art.
- Town street/pathway, night sky, before/after Welcome Sign, blank storybook, journal, dialogue UI and placeholders may be used by both builds. All unapproved art should be labeled PLACEHOLDER and easy to swap by filename/asset ID; concept boards are NOT sprite sheets.
- Approved older assets and cutouts remain canonical. Shared repository: https://github.com/tivastreasures-ops/letter-town-shared
- Asset/reference source folder: https://drive.google.com/drive/folders/1Y3qpGFltRT8HfZovgFuKODuqwFeLCfOW

## 6. Audio — IMPORTANT STATUS CORRECTION
The Director reports the Professor has now DOWNLOADED ALL Chapter One voices. The shared-repo README inspected Nov 14 lists 85 committed MP3s and identifies 20 missing from that snapshot, so reconcile the actual 105-cue recording master with the Professor's current local downloads rather than assuming the repo is already complete. Do NOT regenerate or repurchase audio already downloaded. Agent Four and Professor should use identical stable cue IDs/filenames; captions, replay, skip, mute and volume apply to both builds.
The new Cat Girl chapter-journal voiceover is NOT confirmed as recorded, and should default to readable text until an approved recording exists.

## 7. Platform-specific differences
**Professor Quest WebXR:** hand-tracking pinch/grab, plant placement, physical watering-can orientation/tilt/pour, Super Grow shake, grab-and-pull harvest with petal poof, seated reach/recenter, controller/accessibility fallback, physical book/letter selections. Verify physically on Quest 3 before claiming success.

**Agent Four 2D web/mobile:** pointer/tap/drag/type and optional speech confirmation, click/tap gardening and select-and-apply food/water, responsive storybook UI, navigation and menu, layered 2D world and illustrated transitions, real phone/browser testing. No hand tracking or 3D locomotion.

**Both:** exact same business logic and action outcomes; practice FLOWER/MILK currency must remain isolated from real funds; cart distinctions (word cashbox vs bouquet automatic wallet deposits), 8 plots, seed lifetimes, offline growth, inventories, dictionary/grammar validation, town restoration, Storybook, Journal, persistent saves.

## 8. Proposed cross-build acceptance scenarios
A. Player sees unfinished Mad Lib and missing Welcome Sign before restoring it.
B. Players may accumulate enough discovered eligible words without being forced to submit.
C. Player selects or 'Surprise Me' fills only category-compatible discovered words; story saves exact submitted words and remains readable on return.
D. Completion event swaps to restored Welcome Sign ONCE and creates Chapter One journal entry ONCE; save/reload preserves both.
E. Cat Girl side quest is not needed to finish the Chapter One main story.
F. Practice coins/letters separate from real inventory. Harvest and Super Grow awards consume exactly once. Old Plant Food speed boost absent.
G. Narration uses available recorded lines; missing journal audio does not block on-screen text.
H. 2D and VR achieve equivalent content outcomes with each platform's intended inputs.

## 9. Approval boundaries
DIRECTOR-APPROVED: revised watering/Super Grow one-item semantics, 100 coins/8 plots/five harvests and key core garden mechanics; optional Mad Lib availability/nudge and completed story triggered Welcome Sign; Cat Girl intended chaos side quest design; placeholder use for builders.
DIRECTOR-ACCEPTED MVP TEST FIGURES: seed/pack/Super Grow prices, configurable.
DRAFT: 12-blank Mad Lib wording/category distribution, Cat Girl journal prose, specific presentation and animation.
OPTIONAL / NOT REQUIRED FOR MAIN MVP: Cat Girl's storm and Letter Chase implementation.
UNVERIFIED: repo availability of ALL 105 MP3s despite Professor's reported successful downloads; new art's Quest appearance and alpha edge quality.
No new GO, deployment, paid audio, or game-source changes are authorized by publishing this document alone.

Google Doc: https://docs.google.com/document/d/1gO_9yEI6f8nKW0YqSCGPOT8Jf4K_1CZdKyhPuFepeEE/edit
