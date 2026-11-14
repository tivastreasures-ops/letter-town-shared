# Letter Town — temporary game-ready artwork (PLACEHOLDERS)

These are individual **actual image files**, not concept contact sheets, copied for Agent Four and the Professor. Do not replace existing approved artwork with these without need. Each file is a temporary game visual; **not approved final art**.

- `title_unrestored_PLACEHOLDER.jpg`: 1279×720 title/menu background (no clickable controls; add title & buttons in UI).
- `town_pathway_day_PLACEHOLDER.jpg`: 1279×720 town street/path background.
- `town_night_PLACEHOLDER.jpg`: 1279×720 night environment background (not a pure isolated sky layer).
- `welcome_sign_broken_PLACEHOLDER.png`: 800×600 RGBA broken sign prop.
- `welcome_sign_restored_PLACEHOLDER.png`: 800×600 RGBA restored sign prop.
- `storybook_blank_PLACEHOLDER.png`: 800×600 RGBA open storybook, add game text in overlay.
- `journal_blank_PLACEHOLDER.png`: 800×600 RGBA open journal, add narration text in overlay.
- `ui_panel_buttons_sheet_PLACEHOLDER.png`: 800×600 RGBA combined panel and buttons; crop to separate assets before individual hit testing, or implement actual accessible UI controls over the imagery.
- `word_cart_PLACEHOLDER.png`: 800×600 RGBA cart illustration, not a working cart/shop.
- `quest_board_PLACEHOLDER.png`: 800×600 RGBA blank quest board; dynamic text in UI.

These PNG props retain a transparent alpha channel, but edge quality has NOT been verified in Quest. Images are optimized game-use copies; full-resolution originals are in the existing Letter Town Drive art folder.

IMPORTANT: Both signs have PLACEHOLDER text baked into the image, and are different illustrations with potentially different geometry; reposition/scale as appropriate. Resident identities are not represented in these assets. Keep all input, currency, quest, Word Cart, and project rules based on the Director-approved design, not on decoration.

### Notes for builds
- Use assets via a replaceable asset path map. Keep gameplay text separate from raster artwork.
- Do NOT infer that an image proves a mechanic implemented, tested, or approved.
- No gameplay code was changed in this commit.
