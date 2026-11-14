# The Day the Welcome Went Missing — Letter Town Chapter One Mad Lib (12-Blank Draft)
**Status: DRAFT story text / PLACEHOLDER content for first build. Not Director-approved final prose.**
**Source:** Twelve-blank text drafted in the Letter Town design conversation, Nov 14, 2026.
**Purpose:** Actual player-facing story template. Not a summary or build addendum.

## Fillable story
On Welcome Day, Mayor Ren discovered a **[1. adjective]** **[2. singular noun]** beside the garden gate, exactly where the town's welcome sign was supposed to be.

Before anyone could explain it, the whole town began to **[3. base-form verb]**.

Hudson was the first to investigate. He searched beneath benches, behind flowerpots, and inside an old **[4. singular noun]**. He found three lost buttons, a ribbon, and something suspiciously sticky, but absolutely no welcome sign.

Snowy opened her notebook and announced that this was a very **[5. adjective]** mystery. She carefully recorded everyone's observations, although she had to remind Hudson twice that guessing was not the same as finding evidence.

Meanwhile, Merry gathered flowers for the celebration. Unfortunately, someone had filled her favorite watering can with **[6. plural noun]**. She decided not to ask questions.

At Kit's seed shop, customers were arriving with increasingly unusual suggestions. One insisted that the new welcome sign should feature a **[7. singular noun]**. Another wanted every visitor to **[8. base-form verb]** before entering town.

Phineas examined the empty signposts, measured the wooden frame, and declared that the replacement would have to be especially **[9. adjective]**.

Mayor Ren listened to everyone's ideas while attempting to maintain his dignity. Unfortunately, just as he began his official speech, a **[10. singular noun]** appeared in the middle of the town square.

Nobody could agree whether this was a disaster, a decoration, or an unexpected guest.

By afternoon, the square was filled with petals, paint, ribbons, and laughter. Everyone contributed something, even if some contributions were a little **[11. adjective]**.

Finally, the new welcome sign was ready. Mayor Ren climbed onto the platform, lifted his ceremonial ribbon, and invited the entire town to **[12. base-form verb]**.

For a moment, everyone fell silent.

Then the celebration began.

The path was lined with flowers, the windows glowed warmly, and the newly restored sign stood proudly above the garden gate.

The townspeople agreed that nobody would ever forget this Welcome Day.

They weren't entirely sure what had happened.

But they were delighted to have been there.

## Slot contract
1. adjective (adjective)
2. singular noun (noun)
3. base-form verb (verb)
4. singular noun (noun)
5. adjective (adjective)
6. plural noun (plural_noun)
7. singular noun (noun)
8. base-form verb (verb)
9. adjective (adjective)
10. singular noun (noun)
11. adjective (adjective)
12. base-form verb (verb)

## Implementation notes
- Render actual story with explicit numbered blank placeholders before completion.
- Allow users to read/preview the whole unfinished story early; Mayor Ren may gently nudge when enough suitable discovered words exist; do not auto-complete.
- Eligible words come from the player's discovered-word collection (not necessarily unspent Letter Bank tiles). When requested, optional 'Surprise Me' randomly chooses known words matching each grammatical category.
- On player confirmation, store every chosen word and exact filled story; unlock restored Welcome Sign and player's completed Storybook entry once. Retelling makes a new story variant without repeating the sign reward.
- Separate the Chapter One Cat Girl Journal narration from the completed Mad Lib.
- This story and the specific 12-word distribution remain DRAFT and editable until Director sign-off.
- Keep dialogue and game logic out of the prose: data-driven fields and idempotent completion event.

Drive document: https://docs.google.com/document/d/1Rq_znuBf1D-ZeLx72-p0TNMzMg57Zfd53sZ9eL746ek/edit
