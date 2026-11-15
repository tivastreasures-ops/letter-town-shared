# Letter Town shared assets

Uploaded by the Professor (Claude) on 2026-11-14 at the Director's request. Assets only. No game code. No build has been authorized.

| Folder | Contents | Count |
| --- | --- | --- |
| `assets/cutouts/storybook_items` | Cleaned transparent PNGs: 29 storybook items + golden arched frame | 30 |
| `assets/cutouts/blooms` | Nine bloom cutouts, soft edges (`_superseded_tests` holds 2 early tests, do not use) | 9 + 2 |
| `assets/cutouts/props_ui` | Nine prop and UI cutouts | 9 |
| `assets/cutouts/residents_houses_carts` | Residents, house pieces, facades, carts | 16 |
| `assets/audio/<Character>` | Chapter One voice lines (mp3): Hudson 23, Kit 11, Mayor 22, Merry 4, Phineas 13, Snowy 12. All 85 lines marked COMPLETE in the audio manifest sheet | 85 |
| `assets/reference` | Reference art and screenshots. Not game assets | 7 |
| `docs` | Work's asset manifest (tsv), Mad Lib templates | 3 |

Notes
- All cutouts are RGBA PNG with transparency (checked). Edges were reviewed at thumbnail scale only, not at full zoom. Everything is assumed approved until the Director's headset review.
- Audio: file names follow the manifest sheet's Suggested Filename column. Every mp3 opens (duration checked); none were listened to. 20 lines are NOT here because the sheet marks them 'VERIFY IN ELEVENLABS' with no link: Hudson H08 to H11, Merry M01 to M12, Kit K01 to K04.
- Not included: Work's original key-color masters and zips (about 188 MB, on the Director's computer in `Downloads\LetterTown_Organized\02_Work_Original_Drops`), old build zips and videos.
- The combined 186-row manifest is a Sheet in the Director's Claude account; `docs/asset_manifest.tsv` is Work's 150-row version and does not list the storybook items.

## Added Nov 14 (afternoon) by the Professor
- `assets/clean/professor/ui` and `assets/clean/professor/scene`: the Nov 14 images with status tags removed, as used in the Quest build (signs, books, quest board, word cart, a panel and three buttons sliced from the sheet, three town backgrounds cropped). Status belongs in filenames and this README only, never in visible art.
- `builds/quest-chapter-one`: source of the Quest 3 / WebXR Chapter One game (plain JavaScript + Three.js). Voice files are not duplicated there: copy `assets/audio/*/*.mp3` flat into `builds/quest-chapter-one/assets/audio/` to run it. Rules and test values are in `rules/game.js` (CFG at the top).
