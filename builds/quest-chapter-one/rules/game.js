// Letter Town Chapter One — game rules. No drawing code. Every action changes the save exactly once.
// Numbers marked TEST VALUE are stand-ins the Director can change in CFG without touching anything else.
import WORDS from './words.js';

export const CFG = {
  startCoins: 100, plots: 8, starters: 4, harvestsPerSeed: 5,
  growSecs: 240,                 // seed to bloom without water (approved range 3 to 5 minutes)
  waterBoost: 2,
  practiceGrowSecs: 16,          // lessons use a quick garden so nobody waits four minutes
  flowerCap: 10,                 // cut flowers kept per flower type before overflow to the basket
  prices: { seed: { common: 5, uncommon: 7, rare: 10 }, pack: { common: 20, uncommon: 30, rare: 45 }, supergrow: 4 },   // Director-accepted test prices
  minWordLen: 3,                 // TEST VALUE (dictionary rules are still open)
  letterValue: { common: 1, uncommon: 2, rare: 3 },   // TEST VALUE (Dean's proposal)
  pay: { repeat: 1, fresh: 2, cart: 2, request: 3, bouquet: 2 },   // multipliers, TEST VALUE (Dean's proposal)
  // TEST VALUE: which letters count as common / uncommon / rare, and what each seed tends to grow. Not canon.
  letters: { common: 'EAIONRTLSU', uncommon: 'DGBCMPFHVWY', rare: 'KJXQZ' },
  seedLetterOdds: { common: { common: 0.8, uncommon: 0.2, rare: 0 }, uncommon: { common: 0.35, uncommon: 0.6, rare: 0.05 }, rare: { common: 0.15, uncommon: 0.45, rare: 0.4 } },
  species: ['buttercup', 'chrysanthemum', 'foxglove', 'marigold', 'red_begonia_cluster', 'sunflower', 'white_star_flower', 'yarrow', 'zinnia_dahlia'],
  wordSaleSecs: 75, flowerSaleSecs: 110, tutorialSaleSecs: 6, cartShown: 6, flowerSlots: 6,
  practiceCoins: 20,
  requestWords: ['tea', 'hat', 'sun', 'rose', 'nest', 'lamp', 'bell', 'seed', 'rain', 'star', 'tree', 'bird', 'cake', 'door', 'moon', 'leaf'],
  // words that become things for the home when crafted (matches the approved storybook item art)
  items: ['bed', 'book', 'bread', 'cabinet', 'chair', 'clothes', 'coffee', 'cup', 'curtain', 'desk', 'egg', 'floor', 'game', 'lamp', 'mug', 'oven', 'pan', 'pasta', 'pen', 'pencil', 'pillow', 'plate', 'rack', 'refrigerator', 'shelf', 'sink', 'stove', 'table', 'window'],
  homeSlots: { big: 6, small: 3 },
};
const EXTRA = { refrigerator: 'n', milk: 'nv', flower: 'nv' };
const ok = (msg, more) => Object.assign({ ok: true, msg }, more || {});
const no = (msg, code) => ({ ok: false, msg, code });
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];

/* ---------- words ---------- */
export function pluralOf(w) { if (/(s|x|z|ch|sh)$/.test(w)) return w + 'es'; if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ies'; if (/(f)$/.test(w) && ['shelf', 'leaf', 'loaf', 'wolf', 'calf', 'half'].includes(w)) return w.slice(0, -1) + 'ves'; return w + 's'; }
function singularOf(w) { if (/ies$/.test(w)) return w.slice(0, -3) + 'y'; if (/ves$/.test(w)) return w.slice(0, -3) + 'f'; if (/(ses|xes|zes|ches|shes)$/.test(w)) return w.slice(0, -2); if (/s$/.test(w)) return w.slice(0, -1); return null; }
// returns the kinds of word this is: n noun, v verb, a adjective, r adverb, p plural noun. Empty = not a known word.
export function kinds(word) {
  const w = String(word || '').toLowerCase(); if (!/^[a-z]+$/.test(w)) return '';
  let k = WORDS[w] || EXTRA[w] || '';
  const s = singularOf(w); if (s && s !== w) { const b = WORDS[s] || EXTRA[s] || ''; if (b.includes('n') && pluralOf(s) === w && !k.includes('p')) k += 'p'; }
  return k;
}
export function letterTier(ch) { const c = ch.toUpperCase(); return CFG.letters.rare.includes(c) ? 'rare' : CFG.letters.uncommon.includes(c) ? 'uncommon' : 'common'; }
export function wordValue(w) { return [...w].reduce((s, c) => s + CFG.letterValue[letterTier(c)], 0); }
export function suggest(word, bank) {
  const w = word.toLowerCase(), out = [];
  for (const c of Object.keys(WORDS)) { if (Math.abs(c.length - w.length) > 1 || c[0] !== w[0] || c.length < CFG.minWordLen) continue; let d = 0; const L = Math.max(c.length, w.length); for (let i = 0; i < L; i++) if (c[i] !== w[i]) d++; if (d <= 2 && (!bank || canSpell(bank, c))) out.push(c); if (out.length >= 4) break; }
  return out;
}
export function canSpell(bank, word) { const need = {}; for (const c of word.toUpperCase()) need[c] = (need[c] || 0) + 1; return Object.keys(need).every((c) => (bank[c] || 0) >= need[c]); }
export function missing(bank, word) { const need = {}; for (const c of word.toUpperCase()) need[c] = (need[c] || 0) + 1; return Object.keys(need).filter((c) => (bank[c] || 0) < need[c]).map((c) => c + (need[c] - (bank[c] || 0) > 1 ? '×' + (need[c] - (bank[c] || 0)) : '')); }

/* ---------- a new save ---------- */
function newPlant(tier, stage) { return { species: pick(CFG.species), tier, stage, progress: 0, watered: false, boost: false, left: CFG.harvestsPerSeed }; }
function newPouch(coins, now) {
  return { coins, seeds: { common: 0, uncommon: 0, rare: 0 }, doses: 0, plots: [], bank: {}, flowers: {}, basket: {}, words: [], bouquets: [],
    wordCart: { items: [], cashbox: 0, nextAt: 0 }, flowerCart: { items: [], nextAt: 0, earned: 0 }, sold: {}, lastAt: now };
}
function addLetters(bank, s) { for (const c of s.toUpperCase()) bank[c] = (bank[c] || 0) + 1; }
export function bankCount(bank) { return Object.values(bank).reduce((a, b) => a + b, 0); }
export function newPractice(now) {
  const p = newPouch(CFG.practiceCoins, now); p.practice = true;
  for (let i = 0; i < CFG.plots; i++) p.plots.push({ plant: null });
  p.plots[2].plant = newPlant('common', 1); p.plots[5].plant = newPlant('common', 2);
  p.seeds.common = 2; p.doses = 1; addLetters(p.bank, 'FLOWERMILKEAST'); return p;
}
export function newGame(now) {
  const r = newPouch(CFG.startCoins, now);
  const idx = [...Array(CFG.plots).keys()].sort(() => Math.random() - 0.5).slice(0, CFG.starters);
  for (let i = 0; i < CFG.plots; i++) r.plots.push({ plant: idx.includes(i) ? newPlant('common', rnd(2)) : null });
  // 25 tiles: the ten needed for FLOWER then MILK (two Ls) plus 15 balanced extras
  addLetters(r.bank, 'FLOWERMILK'); const bag = 'EEEEAAAAIIOOUNNRRTTLSSDGBCMPHY';
  for (let i = 0; i < 15; i++) addLetters(r.bank, bag[rnd(bag.length)]);
  return { v: 1, name: '', createdAt: now, lastSeen: now, real: r, practice: newPractice(now), usePractice: false,
    discovered: {}, lessons: {}, tutorialDone: false, lessonStep: 0, lesson: null,
    home: { cottage: null, gift: null, storage: [], placed: {}, wall: { big: null, small: null }, floor: { big: null, small: null } },
    madlib: { picks: {}, stories: [], restored: false, nudged: false }, journal: [], requests: [], nextId: 1, done: {},
    settings: { text: 1, volume: 0.9, mute: false, tableDrop: 0.45, reach: 0.5, auto: false }, away: null };
}
export function migrate(s, now) { if (!s || s.v !== 1) return null; const f = newGame(now); for (const k of Object.keys(f)) if (s[k] === undefined) s[k] = f[k]; for (const k of Object.keys(f.settings)) if (s.settings[k] === undefined) s.settings[k] = f.settings[k]; return s; }
export const pouch = (S) => (S.usePractice ? S.practice : S.real);

/* ---------- time: plants and carts move forward to "now", also after the game was closed ---------- */
export function advance(S, now) {
  const ev = { bloomed: 0, wordSales: [], flowerSales: [] };
  for (const g of [S.real, S.practice]) {
    let dt = (now - (g.lastAt == null ? now : g.lastAt)) / 1000; if (!(dt > 0)) dt = 0; if (dt > 60 * 60 * 24 * 30) dt = 60 * 60 * 24 * 30;   // clock went backwards or absurdly far: stay safe
    g.lastAt = now; const total = g.practice ? CFG.practiceGrowSecs : CFG.growSecs;
    for (const p of g.plots) { const pl = p.plant; if (!pl || pl.stage >= 2) continue; if (g.practice && !pl.watered) continue;   // practice plants wait for their drink so a lesson can never get ahead of you
      let t = dt * (pl.watered ? CFG.waterBoost : 1) / (total / 2); while (t > 0 && pl.stage < 2) { const need = 1 - pl.progress; if (t >= need) { t -= need; pl.stage++; pl.progress = 0; if (pl.stage === 2 && !g.practice) ev.bloomed++; } else { pl.progress += t; t = 0; } } }
    const wc = g.wordCart; while (wc.items.length && wc.nextAt && now >= wc.nextAt) { const it = wc.items.shift(); wc.cashbox += it.value; if (!g.practice) ev.wordSales.push(it); else ev.practiceSale = it; wc.nextAt = wc.items.length ? wc.nextAt + CFG.wordSaleSecs * 1000 : 0; }
    const fc = g.flowerCart; while (fc.items.length && fc.nextAt && now >= fc.nextAt) { const it = fc.items.shift(); g.coins += it.value; fc.earned += it.value; if (!g.practice) ev.flowerSales.push(it); fc.nextAt = fc.items.length ? fc.nextAt + CFG.flowerSaleSecs * 1000 : 0; }
  }
  S.lastSeen = now; return ev;
}

/* ---------- garden ---------- */
export function plant(S, i, tier) {
  const g = pouch(S), p = g.plots[i]; if (!p) return no('No such plot.');
  if (p.plant) return no('That plot already has a plant.', 'occupied');
  if (!(g.seeds[tier] > 0)) return no(`You have no ${tier} seeds. Kit's seed shop sells them.`, 'noseed');
  g.seeds[tier]--; p.plant = newPlant(tier, 0); return ok('Planted! A tiny beginning.');
}
export function water(S, i) {
  const p = pouch(S).plots[i]; if (!p || !p.plant) return no('Nothing is planted there.');
  if (p.plant.stage >= 2) return no('That one is ready to pick. No water needed.');
  if (p.plant.watered) return no('Already watered. It is growing twice as fast.', 'watered');
  p.plant.watered = true; return ok('Watered! It will grow twice as fast.');
}
export function superGrow(S, i) {
  const g = pouch(S), p = g.plots[i]; if (!p || !p.plant) return no('Nothing is planted there.');
  if (p.plant.boost) return no('This plant already has Super Grow. Nothing was used.', 'blocked');
  if (!(g.doses > 0)) return no("No Super Grow left. Kit's shop sells it.", 'none');
  g.doses--; p.plant.boost = true; return ok('Super Grow added! The next pick gives 2 letters.');
}
function growLetter(tier) { const o = CFG.seedLetterOdds[tier] || CFG.seedLetterOdds.common; const r = Math.random(); const t = r < o.common ? 'common' : r < o.common + o.uncommon ? 'uncommon' : 'rare'; const pool = CFG.letters[t]; return pool[rnd(pool.length)]; }
export function harvest(S, i, txn) {
  const g = pouch(S), p = g.plots[i]; if (!p) return no('No such plot.');
  const key = (g.practice ? 'ph' : 'h') + txn; if (txn != null && S.done[key]) return no('Already picked.', 'dup');
  const pl = p.plant; if (!pl) return no('Nothing is planted there.'); if (pl.stage < 2) return no('Not quite ready yet.', 'growing');
  if (txn != null) S.done[key] = 1;
  const n = pl.boost ? 2 : 1, got = []; for (let k = 0; k < n; k++) { const L = growLetter(pl.tier); g.bank[L] = (g.bank[L] || 0) + 1; got.push(L); }
  const sp = pl.species; if ((g.flowers[sp] || 0) < CFG.flowerCap) g.flowers[sp] = (g.flowers[sp] || 0) + 1; else g.basket[sp] = (g.basket[sp] || 0) + 1;
  g.flowerTier = g.flowerTier || {}; g.flowerTier[sp] = pl.tier;
  pl.boost = false; pl.left--; let freed = false;
  if (pl.left > 0) { pl.stage = 0; pl.progress = 0; pl.watered = false; } else { p.plant = null; freed = true; }
  return ok(`Picked! Letter${n > 1 ? 's' : ''} ${got.join(' and ')} and one cut flower.` + (freed ? ' That was the fifth harvest. The plot is free.' : ''), { letters: got, freed, species: sp });
}

/* ---------- Kit's seed shop ---------- */
export function price(item) { const [kind, tier] = item.split(':'); return kind === 'supergrow' ? CFG.prices.supergrow : CFG.prices[kind][tier]; }
export function buy(S, item) {
  const g = pouch(S), [kind, tier] = item.split(':'), cost = price(item); if (cost == null) return no('The shop does not sell that.');
  if (g.coins < cost) return no(`Not enough coins. You need ${cost - g.coins} more.`, 'coins');
  g.coins -= cost; if (kind === 'seed') g.seeds[tier] += 1; else if (kind === 'pack') g.seeds[tier] += 5; else g.doses += 1;
  return ok(kind === 'supergrow' ? 'One Super Grow, all yours.' : `${kind === 'pack' ? 'Five' : 'One'} ${tier} seed${kind === 'pack' ? 's' : ''}, all yours.`);
}

/* ---------- spelling ---------- */
export function craft(S, word) {
  const g = pouch(S), w = String(word || '').toLowerCase();
  if (w.length < CFG.minWordLen) return no(`Words need at least ${CFG.minWordLen} letters.`);
  const k = kinds(w); if (!k) { const sg = suggest(w, g.bank); return no(`"${w.toUpperCase()}" is not in the town dictionary.` + (sg.length ? ' Did you mean ' + sg.map((x) => x.toUpperCase()).join(', ') + '?' : ''), 'unknown'); }
  if (!canSpell(g.bank, w)) return no(`You need more letters: ${missing(g.bank, w).join(', ')}.`, 'letters');
  for (const c of w.toUpperCase()) g.bank[c]--;
  const it = { id: S.nextId++, w, value: wordValue(w) }; g.words.push(it);
  if (!g.practice) S.discovered[w] = k;
  return ok(`You crafted ${w.toUpperCase()}! It is in your Word Inventory.`, { item: it, kinds: k });
}
function takeWord(g, id) { const i = g.words.findIndex((x) => x.id === id); return i < 0 ? null : g.words.splice(i, 1)[0]; }
export function sellNow(S, id) {
  const g = pouch(S), it = takeWord(g, id); if (!it) return no('That word is not in your inventory.');
  const fresh = !g.sold[it.w]; const pay = it.value * (fresh ? CFG.pay.fresh : CFG.pay.repeat); g.sold[it.w] = (g.sold[it.w] || 0) + 1; g.coins += pay;
  return ok(`Sold ${it.w.toUpperCase()} for ${pay} coins.` + (fresh ? ' New-word bonus!' : ''), { pay, fresh });
}
export function stockWord(S, id, now) {
  const g = pouch(S), it = takeWord(g, id); if (!it) return no('That word is not in your inventory.');
  const c = g.wordCart; c.items.push({ w: it.w, value: it.value * CFG.pay.cart }); if (!c.nextAt) c.nextAt = now + (g.practice ? CFG.tutorialSaleSecs : CFG.wordSaleSecs) * 1000;
  return ok(`${it.w.toUpperCase()} is on the Word Cart.`);
}
export function collect(S) { const g = pouch(S), c = g.wordCart; if (!(c.cashbox > 0)) return no('The cashbox is empty.'); const n = c.cashbox; c.cashbox = 0; g.coins += n; return ok(`Collected ${n} coins from the cashbox.`, { coins: n }); }
export function giveWord(S, id, toRequest) {
  const g = pouch(S); const idx = g.words.findIndex((x) => x.id === id); if (idx < 0) return no('That word is not in your inventory.');
  const it = g.words[idx];
  if (g.practice) { g.words.splice(idx, 1); return ok(`${it.w.toUpperCase()} delivered!`, { w: it.w }); }
  const r = S.requests.find((q) => q.id === toRequest); if (!r) return no('That request is gone.'); if (r.word !== it.w) return no(`${r.who} asked for ${r.word.toUpperCase()}.`);
  g.words.splice(idx, 1); const pay = it.value * CFG.pay.request; g.coins += pay; S.requests = S.requests.filter((q) => q !== r);
  return ok(`${r.who} thanks you! ${pay} coins.`, { pay });
}
export function refreshRequests(S) { const who = ['Hudson', 'Snowy', 'Merry', 'Kit', 'Phineas', 'Mayor Ren']; while (S.requests.length < 3) { const w = pick(CFG.requestWords); if (S.requests.some((r) => r.word === w)) continue; S.requests.push({ id: S.nextId++, who: pick(who), word: w, pay: wordValue(w) * CFG.pay.request }); } return S.requests; }

/* ---------- bouquets and the Flower Cart ---------- */
export function flowerTotal(g) { let n = 0; for (const k of Object.keys(g.flowers)) n += g.flowers[k]; for (const k of Object.keys(g.basket)) n += g.basket[k]; return n; }
export function makeBouquet(S, size) {
  const g = pouch(S); if (![3, 6, 9].includes(size)) return no('Bouquets come in 3, 6 or 9 flowers.');
  if (flowerTotal(g) < size) return no(`You need ${size} cut flowers. You have ${flowerTotal(g)}.`);
  let value = 0; const used = {};
  for (let k = 0; k < size; k++) { const src = Object.keys(g.basket).find((s) => g.basket[s] > 0) ? g.basket : g.flowers; const sp = Object.keys(src).filter((s) => src[s] > 0).sort((a, b) => src[b] - src[a])[0]; src[sp]--; used[sp] = (used[sp] || 0) + 1; value += CFG.letterValue[(g.flowerTier || {})[sp] || 'common']; }
  const b = { id: S.nextId++, size, value: value * CFG.pay.bouquet, used }; g.bouquets.push(b); return ok(`A bouquet of ${size} is ready.`, { bouquet: b });
}
export function stockBouquet(S, id, now) {
  const g = pouch(S), c = g.flowerCart; if (c.items.length >= CFG.flowerSlots) return no('The Flower Cart is full.');
  const i = g.bouquets.findIndex((b) => b.id === id); if (i < 0) return no('That bouquet is not in your inventory.');
  c.items.push(g.bouquets.splice(i, 1)[0]); if (!c.nextAt) c.nextAt = now + CFG.flowerSaleSecs * 1000; return ok('The bouquet is on the Flower Cart.');
}

/* ---------- home ---------- */
export function chooseCottage(S, c) { if (S.home.cottage) return no('You already chose your cottage.'); S.home.cottage = c; return ok('Your cottage is chosen.'); }
export function chooseGift(S, gift) { if (S.home.gift) return no('You already chose your gift.'); S.home.gift = gift; S.home.storage = S.home.storage || []; S.home.storage.push(gift); return ok('A delightful choice! It is in Home Storage.'); }
export function homeItems(S) { return [...(S.home.storage || []).map((w, i) => ({ src: 'storage', i, w })), ...S.real.words.filter((x) => CFG.items.includes(x.w)).map((x) => ({ src: 'word', id: x.id, w: x.w }))]; }
export function placeItem(S, ref, slot) {
  const H = S.home; H.storage = H.storage || []; let w = null;
  if (ref.src === 'storage') { w = H.storage[ref.i]; if (!w) return no('That item is gone.'); } else { const it = S.real.words.find((x) => x.id === ref.id); if (!it || !CFG.items.includes(it.w)) return no('That word is not a home item.'); w = it.w; }
  const room = slot.split('-')[0];
  if (w === 'wallpaper' || w === 'floor') { const key = w === 'floor' ? 'floor' : 'wall'; if (H[key][room]) H.storage.push(H[key][room]); H[key][room] = w; }
  else { if (H.placed[slot]) return no('That spot is taken. Put the item away first.'); H.placed[slot] = w; }
  if (ref.src === 'storage') H.storage.splice(ref.i, 1); else takeWord(S.real, ref.id);
  return ok(`${w[0].toUpperCase() + w.slice(1)} placed.`);
}
export function putAway(S, slot) { const H = S.home; if (!H.placed[slot]) return no('Nothing is there.'); H.storage = H.storage || []; H.storage.push(H.placed[slot]); delete H.placed[slot]; return ok('Put away in Home Storage.'); }

/* ---------- the Mad Lib ---------- */
export function slotOptions(S, slot) {
  const out = [];
  for (const w of Object.keys(S.discovered)) { const k = S.discovered[w]; if (slot.category === 'adjective' && k.includes('a')) out.push(w); else if (slot.category === 'verb' && k.includes('v')) out.push(w); else if (slot.category === 'noun' && k.includes('n')) out.push(w); else if (slot.category === 'plural_noun') { if (k.includes('p')) out.push(w); else if (k.includes('n')) out.push(pluralOf(w)); } }
  return [...new Set(out)].sort();
}
export function madReady(S, story) { return story.slots.every((s) => slotOptions(S, s).length > 0); }
export function choose(S, story, slotId, word) { const s = story.slots.find((x) => x.id === slotId); if (!s) return no('No such blank.'); if (!slotOptions(S, s).includes(word)) return no('That word does not fit this blank.'); S.madlib.picks[slotId] = word; return ok('Chosen.'); }
export function surprise(S, story) { let n = 0; for (const s of story.slots) { const o = slotOptions(S, s); if (o.length) { S.madlib.picks[s.id] = pick(o); n++; } } return n === story.slots.length ? ok('Surprise! Every blank is filled. Change any you like.') : no(`You know words for ${n} of ${story.slots.length} blanks so far. Craft more kinds of words.`, 'partial'); }
export function article(word) { const w = word.toLowerCase(); if (/^(hour|honest|honor|heir)/.test(w)) return 'an'; if (/^(uni|use|usu|eu|one|once)/.test(w)) return 'a'; return /^[aeiou]/.test(w) ? 'an' : 'a'; }
export function renderStory(story, picks, blank) {
  return story.paragraphs.map((p) => p.replace(/\{\{article:(\d+)\}\}/g, (m, n) => (picks[n] ? article(picks[n]) : 'a')).replace(/\{\{(\d+)\}\}/g, (m, n) => (picks[n] ? picks[n].toUpperCase() : blank(story.slots.find((s) => s.id === +n)))));
}
export function completeStory(S, story, now, journalText) {
  if (!story.slots.every((s) => S.madlib.picks[s.id])) return no('Some blanks are still empty.');
  const text = renderStory(story, S.madlib.picks, () => '___'); const first = !S.madlib.restored;
  S.madlib.stories.push({ at: now, picks: { ...S.madlib.picks }, text }); S.madlib.picks = {};
  if (first) { S.madlib.restored = true; S.journal.push({ id: 'ch1', at: now, text: journalText(S) }); }
  return ok(first ? 'The Welcome Sign shines again!' : 'A new telling is saved in your Storybook.', { first });
}
