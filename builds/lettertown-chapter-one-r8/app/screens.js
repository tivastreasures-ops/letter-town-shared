// Letter Town — everything shown on the story board, and the order of the story. No 3D code here.
export function makeScreens(c) {
  const { R, board, BW, BH } = c, g = board.getContext('2d');
  const st = { screen: 'loading', tool: null, tier: 'common', tray: '', page: 0, msg: '', modal: null, wait: null, talk: null, bookTab: 'spell', storyTab: 'tale', pick: null, sel: null, demoPage: 1, demoTab: 'notes', nameDraft: '', read: null, arr: {}, mini: null };
  let btns = [], dirty = true, DLG = {}, STORY = null, S = null;
  const IMG = {};
  function img(name) { let i = IMG[name]; if (!i) { i = IMG[name] = new Image(); i.onload = () => { dirty = true; }; i.src = 'assets/' + name; } return i.complete && i.naturalWidth ? i : null; }
  const ts = () => (S ? S.settings.text : 1);
  const COL = { ink: '#5a3b22', soft: '#8a6a4a', plum: '#7a3f6b', cream: '#fff3d6', paper: '#fff8ea', edge: '#c99a5b', green: '#bfe0a8', purple: '#dccdf5', rose: '#f9cfd9', gold: '#ffe08a', off: '#ebe5d8', blue: '#cfe3f5' };
  function rr(x, y, w, h, r, fill, stroke, lw = 4) { g.beginPath(); g.roundRect(x, y, w, h, r); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
  function font(size, bold) { g.font = `${bold ? 'bold ' : ''}${Math.round(size * ts())}px Georgia, serif`; }
  function text(s, x, y, size = 34, color = COL.ink, align = 'left', bold = false) { font(size, bold); g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  function lines(s, maxW, size, bold) { font(size, bold); const out = []; for (const para of String(s).split('\n')) { let line = ''; for (const w of para.split(' ')) { if (line && g.measureText(line + w).width > maxW) { out.push(line.trimEnd()); line = ''; } line += w + ' '; } out.push(line.trimEnd()); } return out; }
  function wrap(s, x, y, maxW, size = 34, color = COL.ink, align = 'left', maxLines = 99, bold = false) { const L = lines(s, maxW, size, bold).slice(0, maxLines), lh = size * ts() * 1.28; L.forEach((l, i) => text(l, x, y + i * lh, size, color, align, bold)); return y + L.length * lh; }
  function B(x, y, w, h, label, fn, o = {}) {
    const off = o.off; rr(x, y, w, h, o.r || 18, off ? COL.off : (COL[o.style] || COL.cream), o.on ? '#b0508f' : COL.edge, o.on ? 7 : 4);
    if (o.icon && img(o.icon)) { const im = img(o.icon), s = Math.min((h - 12) / im.height, (o.iconW || h) / im.width); g.drawImage(im, x + 8, y + (h - im.height * s) / 2, im.width * s, im.height * s); }
    if (label) { const L = String(label).split('\n'), size = o.size || 32, lh = size * ts() * 1.15; L.forEach((l, i) => text(l, x + w / 2 + (o.icon ? (o.iconW || h) / 2 : 0), y + h / 2 + (i - (L.length - 1) / 2) * lh, size, off ? '#a79f90' : COL.ink, 'center', o.bold !== false)); }
    if (fn && !off) btns.push({ x, y, w, h, fn, label: String(label || '') });
  }
  function pager(n, per, x, y) { const pages = Math.max(1, Math.ceil(n / per)); if (st.page >= pages) st.page = pages - 1; if (pages > 1) { B(x, y, 110, 60, '◀', () => { st.page = Math.max(0, st.page - 1); }, { off: st.page === 0 }); text(`${st.page + 1} / ${pages}`, x + 175, y + 30, 28, COL.soft, 'center'); B(x + 240, y, 110, 60, '▶', () => { st.page = Math.min(pages - 1, st.page + 1); }, { off: st.page >= pages - 1 }); } return st.page * per; }
  const cap = (w) => w[0].toUpperCase() + w.slice(1);
  const P = () => R.pouch(S);

  /* ---------- messages, voices, lessons ---------- */
  const plain = (p) => String(p).replace(/^base-form /, '');   // players do not need the grammar term
  function say(m) { st.msg = m; dirty = true; }
  function note(r) { if (r && r.msg) say(r.msg); if (r && !r.ok) c.beep(190, 0.1); c.save(); dirty = true; }
  function cue(id) { const d = id && DLG[id]; if (!d) return; say(`${nameOf(d.who)}: ${d.text}`); c.speak(d.file); }
  const nameOf = (who) => ({ HUDSON: 'Hudson', SNOWY: 'Snowy', MERRY: 'Merry', KIT: 'Kit', PHINEAS: 'Phineas', MAYOR: 'Mayor Ren' }[who] || who);
  function talk(ids, then) { st.talk = { ids: ids.filter((i) => DLG[i]), i: 0, then }; if (!st.talk.ids.length) { st.talk = null; return then && then(); } go('talk'); playLine(); }
  function playLine() { const t = st.talk; if (!t) return; const d = DLG[t.ids[t.i]]; c.showPerson(d.who); const played = c.speak(d.file, () => { if (S.settings.auto && st.talk === t) nextLine(); }); t.voiced = played; dirty = true; }
  function nextLine() { const t = st.talk; if (!t) return; c.hush(); if (++t.i >= t.ids.length) { st.talk = null; c.showPerson(null); const f = t.then; if (f) f(); } else playLine(); dirty = true; }
  const FREE = (screen, hint, off) => ({ free: screen, hint: hint || "Look around as long as you like. Press I'm finished when you are ready.", off });
  const LESSONS = {
    intro: ['H01', 'H02', 'H03', { name: 1 }, 'H04', 'H05', 'H28', 'H29'],
    snowy: ['H06', 'S01', 'S02', 'S03', { wait: 'page', screen: 'bookdemo', hint: 'Turn a page with the arrows.' }, 'S04', { wait: 'maptab', screen: 'bookdemo', hint: 'Choose the Map tab.' }, 'S05', 'S06', FREE('bookdemo', null, ['S08', 'S09'])],
    merry: ['H08', 'H09', 'M01', 'M02', { wait: 'planted', screen: 'garden', hint: 'Plant a seed: pinch the seed packet and let go over an empty plot. Or choose Seeds, then a plot.' }, 'M03', 'M04', { wait: 'watered', screen: 'garden', hint: 'Water a growing plant: tilt the can over it. Or choose Water, then the plot.' }, 'M05', 'M06', { wait: 'bloom', screen: 'garden', hint: 'Watch for a finished flower.' }, 'M07', 'M17', { wait: 'harvested', screen: 'garden', hint: 'Pick the bloom: pinch it and pull. Or choose Pick, then the plot.' }, 'M08', 'M09', 'M10', FREE('garden', "Practice as much as you like. Press I'm finished when you are ready.", ['M12'])],
    kit: ['H11', 'K01', 'K02', 'K03', { wait: 'bought', screen: 'shop', hint: 'Buy any seed with your practice coins.' }, 'K04', 'K05', 'K06', FREE('shop', null, ['K09'])],
    phineas: ['H12', 'P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P14', FREE('carts', null, ['P07'])],
    orders: ['H13', 'H14', { wait: 'crafted:flower', screen: 'book', hint: 'Spell F-L-O-W-E-R with the practice letters, then press Craft.' }, 'H16', { wait: 'gave:flower', screen: 'book', hint: 'Open Words and hand FLOWER to the customer.' }, 'H17', 'H18', { wait: 'crafted:milk', screen: 'book', hint: 'Spell M-I-L-K, then press Craft.' }, 'H19', 'H20', { wait: 'stocked:milk', screen: 'carts', hint: 'Stock MILK on the Word Cart.' }, { wait: 'sold:milk', screen: 'carts', hint: 'A customer is on the way. Watch the cart.' }, 'H21', 'H22', FREE('carts', "Practice as much as you like. Press I'm finished when you are ready.", ['H23'])],
    mayor: ['H24', 'R01', 'R02', 'R03', 'R04', 'R05', 'R06', { wait: 'cottage', screen: 'cottage', hint: 'Choose the cottage that feels like home.' }, 'R07', 'R08', { wait: 'gift', screen: 'gift', hint: 'Choose one housewarming gift.' }, 'R09', 'R11', 'R12'],
  };
  const LESSON_LIST = [['snowy', 'Snowy: your town book and map'], ['merry', "Merry's Green Room: plant, water, pick"], ['kit', "Kit's seed shop"], ['phineas', 'Phineas: crafting and the carts'], ['orders', 'Two practice orders: FLOWER and MILK'], ['mayor', 'Meet Mayor Ren']];
  const PRACTICE = ['merry', 'kit', 'phineas', 'orders'];
  function startLesson(id) { S.lesson = id; S.lessonStep = 0; S.usePractice = PRACTICE.includes(id); if (S.usePractice) S.practice = R.newPractice(c.now()); st.tool = null; st.tray = ''; c.setS(S); c.setPlace(id === 'mayor' ? 'day' : 'gate'); c.save(); runLesson(); }
  function runLesson() {
    const L = LESSONS[S.lesson]; if (!L) return; st.wait = null;
    if (S.lessonStep >= L.length) return finishLesson();
    const step = L[S.lessonStep];
    if (typeof step === 'string') { let i = S.lessonStep; const ids = []; while (i < L.length && typeof L[i] === 'string') ids.push(L[i++]); talk(ids, () => { S.lessonStep = i; c.save(); runLesson(); }); }
    else if (step.name) { st.nameDraft = S.name || ''; go('name'); }
    else if (step.free) { st.wait = step; st.bookTab = 'spell'; go(step.free); say(step.hint); }
    else { st.wait = step; st.bookTab = step.wait === 'gave:flower' ? 'words' : 'spell'; go(step.screen); say(step.hint); if (step.wait === 'bloom') checkBloom(); }
  }
  function emit(ev) { if (st.wait && st.wait.wait === ev) { st.wait = null; S.lessonStep++; c.save(); setTimeout(runLesson, 500); } }
  function checkBloom() { if (st.wait && st.wait.wait === 'bloom' && S.practice.plots.some((p) => p.plant && p.plant.stage === 2)) emit('bloom'); }
  function finishPractice() { const step = st.wait; if (!step || !step.free) return; st.wait = null; S.lessonStep++; c.save(); talk(step.off || [], finishLesson); }
  const ALL_BUT_MAYOR = ['snowy', 'merry', 'kit', 'phineas', 'orders'];
  const GIFTS = { snowy: 'BOOK', merry: 'BLOOM', kit: 'COIN', phineas: 'BUILD', orders: 'LETTER', mayor: 'WELCOME' };
  const SALE_GIFTS = [['Anna', 'SMILE'], ['Timmy', 'FRIEND']];
  function presentGift(from, word, then) {
    S.gifts = S.gifts || { given: {}, sales: 0 }; for (const ch of word) S.real.bank[ch] = (S.real.bank[ch] || 0) + 1; c.save();
    st.gift = { from, word, then }; c.showGift(true); c.beep(700, 0.1); setTimeout(() => c.beep(940, 0.14), 140); go('present');
  }
  function finishLesson() { const id = S.lesson; S.lessons[id] = true; S.lesson = null; S.usePractice = false; c.setS(S); c.showPerson(null); const after = () => { if (id === 'mayor') { S.tutorialDone = true; R.refreshRequests(S); c.save(); c.setPlace('day'); go('map'); cue('H25'); } else { c.save(); go('hub'); cue('H07'); } }; S.gifts = S.gifts || { given: {}, sales: 0 }; if (GIFTS[id] && !S.gifts.given[id]) { S.gifts.given[id] = GIFTS[id]; presentGift({ snowy: 'Snowy', merry: 'Merry', kit: 'Kit', phineas: 'Phineas', orders: 'Phineas', mayor: 'Mayor Ren' }[id], GIFTS[id], after); } else after(); }
  function leaveLesson() { c.hush(); st.talk = null; st.wait = null; S.lesson = null; S.usePractice = false; c.setS(S); c.showPerson(null); c.save(); go(S.tutorialDone ? 'map' : 'hub'); }
  function go(screen) { if (screen !== 'community') c.setCommunity(false); if (screen !== 'present') c.showGift(false); if (screen !== 'talk' && screen !== 'hub') c.showPerson(null); st.screen = screen; st.page = 0; st.modal = null; st.pick = null; st.sel = null; dirty = true; }
  function ask(textStr, yes, yesLabel = 'Yes', noLabel = 'No', no) { st.modal = { text: textStr, yes, yesLabel, noLabel, no }; dirty = true; }
  function journalText(s) {
    const n = s.name || 'our new neighbor', cot = { pink: 'pink', white: 'white', flowerbox: 'flower box', forest: 'forest green', rose: 'rose', sky: 'bluebell', honey: 'honey' }[s.home.cottage] || 'cozy';
    return [`Dear Journal,`, `Today a new neighbor named ${n} arrived in Letter Town, and nothing has been the same since. In a good way. Mostly.`, `Hudson did the welcoming. Snowy did the organizing. Merry did the gardening, Kit did the selling, Phineas did the building, and Mayor Ren did the speeches. I did the supervising, which is the hardest job.`, `${n} got a garden with eight plots and the ${cot} cottage, and grows flowers that grow LETTERS, which I still think is showing off.`, `Then the Welcome Sign got its welcome back. The whole town cheered. I cheered loudest. Somebody had to.`, `I wonder what happens next. I have several ideas. Most of them are windy.`, `— Cat Girl`].join('\n');
  }

  /* ---------- drawing each screen ---------- */
  function glyph(look, cx, by, h, d) {
    const pim = img(look === 'stage_seed' ? 'blooms/pseed.png' : look === 'stage_sprout' ? 'blooms/psprout.png' : `blooms/pbud_${R.budColor(d && d.species, d && d.color)}.png`);   // her seed, sprout and bud art
    if (pim) { const hh = look === 'stage_seed' ? h * 0.5 : look === 'stage_sprout' ? h * 0.85 : h * 0.95, ww = hh * pim.width / pim.height; g.drawImage(pim, cx - ww / 2, by - hh, ww, hh); return; }
    g.save(); g.fillStyle = '#7a5236'; g.beginPath(); g.ellipse(cx, by, h * 0.3, h * 0.08, 0, 0, 7); g.fill();
    if (look === 'stage_seed') { g.fillStyle = '#5b3a24'; g.beginPath(); g.ellipse(cx, by - h * 0.05, h * 0.14, h * 0.07, 0, 0, 7); g.fill(); }
    else { const top = look === 'stage_sprout' ? by - h * 0.55 : by - h * 0.85; g.strokeStyle = '#4f8f3f'; g.lineWidth = Math.max(4, h * 0.035); g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, by); g.quadraticCurveTo(cx + h * 0.05, (by + top) / 2, cx, top); g.stroke();
      g.fillStyle = '#6fb45a'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(cx + d * h * 0.14, by - (by - top) * 0.45, h * 0.15, h * 0.055, d * -0.5, 0, 7); g.fill(); }
      if (look === 'stage_bud') { g.fillStyle = '#f08cb4'; g.beginPath(); g.ellipse(cx, top - h * 0.06, h * 0.08, h * 0.13, 0, 0, 7); g.fill(); g.fillStyle = '#e07aa6'; g.beginPath(); g.ellipse(cx + h * 0.02, top - h * 0.05, h * 0.04, h * 0.1, 0, 0, 7); g.fill(); } }
    g.restore();
  }
  // the seed picker: choose which packet to plant (a specific flower, or a mixed packet of one tier)
  function seedPicker(x, y, bw, h, size) {
    const p = P(), keys = R.ownedSeedKeys(p), cur = keys.includes(st.tier) ? st.tier : (keys[0] || st.tier), idx = Math.max(0, keys.indexOf(cur)), cyc = (d) => { if (keys.length) st.tier = keys[(idx + d + keys.length) % keys.length]; };
    B(x, y, 70, h, '◀', () => cyc(-1), { size, style: 'cream', off: keys.length < 2 }); rr(x + 78, y, bw, h, 14, '#fffdf6', COL.edge, 3);
    if (!keys.length) text('No seeds yet. Kit sells them.', x + 78 + bw / 2, y + h / 2, size - 2, COL.soft, 'center');
    else { const sp = !!R.TIER_OF[cur], pi = sp ? img(`seeds/${cur}.png`) : null; if (pi) { const hh = h - 8, ww = hh * pi.width / pi.height; g.drawImage(pi, x + 86, y + 4, ww, hh); } text(`${sp ? cap(cur) : 'Any ' + cur} (${R.seedKeyCount(p, cur)})`, x + 78 + bw / 2 + (pi ? 24 : 0), y + h / 2, size, COL.ink, 'center', true); }
    B(x + 86 + bw, y, 70, h, '▶', () => cyc(1), { size, style: 'cream', off: keys.length < 2 });
  }
  function frameBg() { g.fillStyle = COL.paper; g.fillRect(0, 0, BW, BH); g.strokeStyle = COL.edge; g.lineWidth = 12; g.strokeRect(6, 6, BW - 12, BH - 12); }
  function footer() { rr(24, 806, BW - 48, 76, 16, '#fbeed2', COL.edge, 3); wrap(st.msg || '', BW / 2, 830, BW - 110, 27, COL.plum, 'center', 2); text('Build R8-23', BW - 40, 872, 16, COL.soft, 'right'); }
  function header(title) {
    if (S.lesson) { text(title, 40, 52, 40, COL.ink, 'left', true); const free = st.wait && st.wait.free; if (free) B(BW - 760, 20, 300, 64, "I'm finished", finishPractice, { style: 'green', size: 30 }); B(BW - 440, 20, 100, 64, 'Hide', () => c.hidePanel && c.hidePanel(), { style: 'blue', size: 26 }); B(BW - 330, 20, 300, 64, 'Back to Hudson', () => ask('Leave this lesson? You can repeat it any time.', leaveLesson), { style: 'rose', size: 28 }); if (S.usePractice && !free) text('Practice: nothing here uses your real coins or letters', BW / 2 + 60, 52, 24, COL.soft, 'center'); return; }
    const tabs = [['map', 'Map'], ['garden', 'Garden'], ['book', 'Book'], ['dict', 'Dictionary'], ['shop', 'Shop'], ['carts', 'Carts'], ['home', 'Home'], ['story', 'Story'], ['settings', 'Settings']];
    tabs.forEach(([id, label], i) => { const on = id === 'dict' ? (st.screen === 'book' && st.bookTab === 'known') : id === 'book' ? (st.screen === 'book' && st.bookTab !== 'known') : st.screen === id;
      B(14 + i * 136, 18, 130, 66, label, () => { if (id === 'dict') { go('book'); st.bookTab = 'known'; } else { go(id); if (id === 'book' && st.bookTab === 'known') st.bookTab = 'spell'; } }, { style: on ? 'gold' : 'cream', size: id === 'dict' ? 21 : 25, on }); });
    B(1244, 18, 90, 66, 'Hide', () => c.hidePanel && c.hidePanel(), { style: 'blue', size: 24 }); B(1342, 18, 84, 66, 'Exit', () => ask('Leave VR and stop playing? Your garden is saved.', () => c.exitVR()), { style: 'rose', size: 24 });
    text(`${P().coins} coins`, BW - 24, 52, 28, COL.ink, 'right', true);
  }
  function stats(y) { const p = P(); text(`Coins ${p.coins}    Letter Bank ${R.bankCount(p.bank)}    Cut flowers ${R.flowerTotal(p)}    Seeds ${R.seedTotal(p)}    Super Grow ${p.doses}`, BW / 2, y, 30, COL.ink, 'center', true); }

  /* ---------- plain lined page, used for every long text ---------- */
  function paper(paras, title, x, y, h, opt = {}) {
    const im = img(opt.ruled ? 'ui/page_plain.png' : null), w = Math.round(h * 1087 / 1446), k = h / 1446;
    if (opt.ruled) { if (im) g.drawImage(im, x, y, w, h); }
    else { for (let i = 5; i >= 1; i--) rr(x + i * 3, y + i * 3, w, h, 14, i % 2 ? '#efe4cc' : '#e6d8b8', '#cdb98d', 1);   // the edge of the pages underneath
      rr(x, y, w, h, 14, '#fbf3df', '#b99a62', 3); const gr = g.createLinearGradient(x, 0, x + 46, 0); gr.addColorStop(0, 'rgba(120,90,40,0.28)'); gr.addColorStop(1, 'rgba(120,90,40,0)'); g.fillStyle = gr; g.fillRect(x + 3, y + 4, 46, h - 8); rr(x - 14, y - 6, 16, h + 12, 6, '#7a4a2a', '#4e2d17', 2); }   // a real page, with the book's spine on the left
    const px = 23, all = []; paras.forEach((p) => { lines(p, 400, px).forEach((l) => all.push(l)); all.push(''); }); while (all.length && all[all.length - 1] === '') all.pop();
    const per = 14, pages = Math.max(1, Math.ceil(all.length / per)); if (st.page >= pages) st.page = pages - 1;
    text(title, x + w / 2, y + 180 * k, title.length > 28 ? 17 : 22, COL.plum, 'center', true);
    all.slice(st.page * per, st.page * per + per).forEach((l, i) => text(l, x + 150 * k, y + (240 + 73.15 * (i + 1)) * k - 13, px, COL.ink));
    if (pages > 1) { const ay = opt.ay != null ? opt.ay : y + h / 2 - 35, ax = opt.ax != null ? opt.ax : x - 250; B(ax, ay, 100, 70, '◀', () => { st.page = Math.max(0, st.page - 1); }, { off: st.page === 0, size: 36 }); text(`Page ${st.page + 1} of ${pages}`, ax + 175, ay + 35, 24, COL.soft, 'center'); B(ax + 250, ay, 100, 70, '▶', () => { st.page = Math.min(pages - 1, st.page + 1); }, { off: st.page >= pages - 1, size: 36 }); }
    return { w, pages };
  }
  /* ---------- mini stories: a resident shares one after two of their requests are fulfilled ---------- */
  let MINI = null; fetch('content/mini.json').then((r) => r.json()).then((d) => { MINI = d.stories; }).catch(() => {});
  const MINI_ORDER = ['Hudson', 'Snowy', 'Merry', 'Kit', 'Phineas', 'Mayor Ren'], MINI_TYPES = ['adventure', 'town', 'seasonal', 'fantasy'];
  function miniOffers() { const M = S.mini || (S.mini = { done: {}, offered: {}, picks: {}, stories: [] }); if (!MINI) return []; const out = []; MINI_ORDER.forEach((who, i) => { if ((M.done[who] || 0) >= 2 && !M.offered[who + ':read']) out.push({ who, type: MINI_TYPES[i % 4], story: MINI.find((x) => x.id === MINI_TYPES[i % 4]) }); }); return out; }
  function openMini(m) { st.mini = { m, picks: {}, pick: null }; st.page = 0; go('mini'); }
  const setSetting = (k, v, lo, hi) => { const s = S.settings; s[k] = Math.round(Math.max(lo, Math.min(hi, v)) * 100) / 100; c.save(); c.layout(); if (k === 'tableDrop' && c.inVR()) c.recenter(); dirty = true; };
  const SCREENS = {
    loading() { frameBg(); text('Opening Letter Town…', BW / 2, BH / 2, 54, COL.ink, 'center', true); },
    title() {
      c.showPerson(null); const bg = img('scene/town_gate.jpg'); if (bg) g.drawImage(bg, 0, 0, BW, BH); else frameBg();
      const saved = c.load(), restored = !!(saved && saved.madlib.restored), sg = img(restored ? 'scene/sign_restored.png' : 'scene/sign_broken.png'); if (sg) { const h = 470, w = sg.width * h / sg.height; g.drawImage(sg, (BW - w) / 2, 40, w, h); }
      if (saved) B(BW / 2 - 430, 560, 400, 110, `Continue${saved.name ? '\n' + saved.name : ''}`, () => beginSave(saved), { style: 'green', size: 38 });
      B(saved ? BW / 2 + 30 : BW / 2 - 200, 560, 400, 110, 'New game', () => (saved ? ask('Start a new game? Your saved town will be replaced.', () => beginNew()) : beginNew()), { style: 'purple', size: 38 });
      rr(BW / 2 - 520, 705, 1040, 70, 16, 'rgba(255,248,234,0.92)', COL.edge, 3); text('Poke a button with your fingertip, or point at it and pinch.', BW / 2, 740, 30, COL.ink, 'center');
    },
    name() {
      frameBg(); const hud = img('people/hudson.png'); if (hud) g.drawImage(hud, 50, 110, 300, 300 * hud.height / hud.width);
      text('What should we call you?', 420, 80, 46, COL.ink, 'left', true);
      rr(420, 130, 760, 96, 18, '#ffffff', COL.edge); text(st.nameDraft || ' ', 450, 178, 52, COL.plum, 'left', true);
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((ch, i) => B(420 + (i % 9) * 122, 260 + Math.floor(i / 9) * 112, 110, 98, ch, () => { if (st.nameDraft.length < 12) st.nameDraft += st.nameDraft ? ch.toLowerCase() : ch; }, { size: 46 }));
      B(420, 600, 230, 96, 'Erase', () => { st.nameDraft = st.nameDraft.slice(0, -1); }, { style: 'rose' });
      B(680, 600, 500, 96, 'That is my name', () => { S.name = st.nameDraft || 'Friend'; S.lessonStep++; c.save(); runLesson(); }, { style: 'green', off: !st.nameDraft });
      footer();
    },
    talk() {
      // transparent board: the resident stands in 3D above a small speech box
      const t = st.talk; if (!t) return; const d = DLG[t.ids[t.i]];
      rr(150, 590, 1300, 290, 28, 'rgba(255,253,246,0.96)', COL.edge, 6); rr(180, 556, 300, 62, 18, COL.purple, COL.edge); text(nameOf(d.who), 330, 588, 36, COL.ink, 'center', true);
      text(`${t.i + 1} of ${t.ids.length}`, 1420, 586, 22, COL.soft, 'right');
      wrap(d.text, 190, 658, 1220, 36, COL.ink, 'left', 3);
      if (!t.voiced) text('(text only: this line has no recording yet)', 190, 784, 20, COL.soft);
      B(190, 800, 240, 64, 'Hear again', () => playLine(), { style: 'blue', size: 26 });
      B(450, 800, 260, 64, S.settings.auto ? 'Auto: on' : 'Auto: off', () => { S.settings.auto = !S.settings.auto; c.save(); }, { style: S.settings.auto ? 'gold' : 'cream', size: 26 });
      B(1150, 800, 270, 64, t.i + 1 < t.ids.length ? 'Next' : 'Continue', () => nextLine(), { style: 'green', size: 32 });
      B(1300, 24, 270, 60, 'Skip these', () => { c.hush(); const f = t.then; st.talk = null; c.showPerson(null); if (f) f(); }, { size: 24 });
      if (S.lesson && S.lesson !== 'intro') B(30, 24, 300, 60, 'Back to Hudson', () => ask('Leave this lesson? You can repeat it any time.', leaveLesson), { style: 'rose', size: 24 });
    },
    hub() {
      c.showPerson('hudson', 'left');
      text(`Hudson's welcome tour`, 1100, 60, 44, COL.ink, 'center', true); rr(600, 96, 960, 56, 14, 'rgba(255,253,246,0.9)'); text('Take the stops in any order. Mayor Ren comes last.', 1080, 125, 26, COL.soft, 'center');
      const doneAll = ALL_BUT_MAYOR.every((id) => S.lessons[id]); let nextFound = false;
      LESSON_LIST.forEach(([id, label], i) => { const done = !!S.lessons[id], locked = id === 'mayor' && !doneAll, next = !done && !locked && !nextFound; if (next) nextFound = true; const y = 170 + i * 100;
        rr(600, y, 960, 88, 18, done ? '#eef6e4' : locked ? '#f3efe6' : '#fff3d6', COL.edge, 3); text((done ? '✓  ' : '') + label, 626, y + 44, 29, locked ? '#a79f90' : COL.ink, 'left', next);
        if (locked) text('Finish the other stops first', 1530, y + 44, 21, '#a79f90', 'right'); else if (done) B(1330, y + 10, 210, 68, 'Repeat', () => startLesson(id), { size: 28 }); else B(1330, y + 10, 210, 68, 'Go', () => startLesson(id), { style: next ? 'green' : 'cream', size: 34 }); });
      footer();
    },
    video() {
      g.fillStyle = '#000'; g.fillRect(0, 0, BW, BH); const v = c.video;
      if (v && v.readyState >= 2) { const vw = v.videoWidth || 1280, vh = v.videoHeight || 720, k = Math.min(BW / vw, BH / vh); g.drawImage(v, (BW - vw * k) / 2, (BH - vh * k) / 2, vw * k, vh * k); } else text('Loading…', BW / 2, BH / 2, 40, '#fff', 'center');
      B(BW - 270, BH - 86, 240, 64, 'Skip', () => { if (st.videoStop) st.videoStop(); }, { size: 26 }); B(BW - 540, BH - 86, 240, 64, 'Replay', () => { if (c.video) { try { c.video.currentTime = 0; c.video.play(); } catch (e) { /* fine */ } } }, { size: 26 });
    },
    bookdemo() {
      frameBg(); header('Your town book'); const bk = img('ui/journal.png'); if (bk) g.drawImage(bk, 260, 100, 1080, 1080 * bk.height / bk.width);
      B(420, 110, 200, 60, 'Notes', () => { st.demoTab = 'notes'; }, { style: st.demoTab === 'notes' ? 'gold' : 'cream', size: 28 }); B(640, 110, 200, 60, 'Map', () => { st.demoTab = 'map'; emit('maptab'); }, { style: st.demoTab === 'map' ? 'gold' : 'cream', size: 28 });
      if (st.demoTab === 'notes') { wrap(['Welcome to Letter Town. Flowers grow letters.', 'Letters make words. Words become useful things.', 'Your lessons, your map and your stories live in this book.'][st.demoPage - 1], 800, 330, 560, 34, COL.ink, 'center'); text(`Page ${st.demoPage} of 3`, 800, 560, 26, COL.soft, 'center'); B(430, 610, 150, 80, '◀', () => { st.demoPage = Math.max(1, st.demoPage - 1); emit('page'); }, {}); B(1020, 610, 150, 80, '▶', () => { st.demoPage = Math.min(3, st.demoPage + 1); emit('page'); }, {}); }
      else { const mi = img('world/welcome_map.png'); if (mi) { const w = 560, h = Math.round(w * 1088 / 1446); g.drawImage(mi, 800 - w / 2, 190, w, h); } else wrap('Garden  ·  Seed shop  ·  Workshop and carts  ·  Town square  ·  Mayor\'s office  ·  Home', 800, 360, 560, 34, COL.ink, 'center'); }
      footer();
    },
    map() {
      frameBg(); header(); text(`Letter Town${S.name ? ', home of ' + S.name : ''}`, BW / 2, 125, 38, COL.ink, 'center', true);
      const MX = 330, MY = 150, MW = 940, MH = Math.round(940 * 1088 / 1446), mi = img('world/welcome_map.png'); if (mi) g.drawImage(mi, MX, MY, MW, MH);
      const k = MW / 1446, hot = (x0, y0, x1, y1, fn) => btns.push({ x: MX + x0 * k, y: MY + y0 * k, w: (x1 - x0) * k, h: (y1 - y0) * k, fn });
      hot(560, 10, 900, 300, () => { c.teleport('townhall'); go('story'); cue(S.madlib.restored ? 'R22' : 'R21'); });              // Town Hall
      hot(170, 160, 430, 440, () => { c.teleport('carts'); go('carts'); cue('P08'); });                                           // Carpenter's shop: the two carts
      hot(990, 140, 1260, 440, () => { c.teleport('seedshop'); go('shop'); cue('K10'); });                                           // Seed shop
      hot(140, 470, 400, 720, () => { go('notice'); S.heard = S.heard || {}; if (!S.heard.R19) { S.heard.R19 = true; cue('R19'); c.save(); } });                                          // Message board
      hot(1020, 470, 1300, 720, () => { c.teleport('home'); go('home'); });                                                           // Home
      hot(450, 300, 980, 560, () => { c.teleport('merry'); go('garden'); cue('M13'); });                                          // Merry's greenhouse: the desk with seeds, watering can and Super Grow
      hot(470, 600, 970, 900, () => go('hub'));                                                              // the welcome arch: lessons
      const side = [[20, 'Spelling Book', () => { go('book'); st.bookTab = 'spell'; cue('S10'); }], [20, "Player's Garden", () => { c.teleport('commgarden'); go('community'); }], [1290, 'Welcome story', () => { go('story'); cue(S.madlib.restored ? 'R22' : 'R21'); }], [1290, 'Lessons', () => { c.teleport('home'); go('hub'); }]];
      side.forEach(([x, label, fn], i) => B(x, 270 + (i % 2) * 150, 290, 110, label, fn, { size: 26 }));
      text('Tap a place on the map', BW / 2, 160 + MH, 22, COL.soft, 'center');
      footer();
    },
    garden() {
      frameBg(); header(S.usePractice ? 'Practice garden' : 'Your garden'); const p = P(); stats(130);
      text('Use your hands on the table below, or use these buttons: choose a tool, then a plot.', BW / 2, 178, 26, COL.soft, 'center');
      const tl = [['seeds', 'Seeds'], ['can', 'Water'], ['shaker', 'Super Grow'], [null, 'Pick']]; tl.forEach(([k, label], i) => B(90 + i * 365, 215, 340, 88, label, () => { st.tool = k; say(k ? `${label} selected. Now choose a plot.` : 'Pick selected. Choose a finished flower.'); }, { style: st.tool === k ? 'gold' : 'cream', on: st.tool === k }));
      text('Seed to plant:', 90, 350, 28, COL.ink); seedPicker(300, 318, 560, 64, 26);
      B(1210, 318, 160, 64, '◀ Table', () => c.moveTray(-0.72), { size: 24, style: S.settings.toolX < 0 ? 'gold' : 'cream' }); B(1390, 318, 160, 64, 'Table ▶', () => c.moveTray(0.72), { size: 24, style: S.settings.toolX >= 0 ? 'gold' : 'cream' });
      p.plots.forEach((pl, i) => { const x = 40 + i * 190, y = 410, d = pl.plant; rr(x, y, 178, 370, 20, d ? (d.stage === 2 ? '#fde8f1' : '#eef6e4') : '#f3ece0', COL.edge, d && d.boost ? 8 : 4);
        text(`Plot ${i + 1}`, x + 89, y + 30, 26, COL.soft, 'center');
        if (!d) text('Empty', x + 89, y + 170, 30, '#a79f90', 'center');
        else { const look = d.stage === 2 ? d.species : d.stage + d.progress < 0.9 ? 'stage_seed' : d.stage + d.progress < 1.5 ? 'stage_sprout' : 'stage_bud', bi = look.startsWith('stage_') ? null : img(`blooms/${look}.png`); if (look.startsWith('stage_')) glyph(look, x + 89, y + 184, 150, d); else if (bi) g.drawImage(bi, x + 19, y + 50, 140, 140); if (d.stage < 2) { rr(x + 24, y + 196, 130, 14, 7, '#ffffff', COL.edge, 2); rr(x + 24, y + 196, 130 * ((d.stage + d.progress) / 2), 14, 7, '#8fd18a'); }
          text(d.stage === 2 ? 'Ready!' : d.watered ? 'Watered' : 'Thirsty', x + 89, y + 230, 26, d.stage === 2 ? COL.plum : COL.ink, 'center', d.stage === 2);
          if (d.boost) text('Super Grow', x + 89, y + 268, 24, '#b07a00', 'center', true); text(`${d.left} pick${d.left === 1 ? '' : 's'} left`, x + 89, y + 304, 22, COL.soft, 'center'); }
        btns.push({ x, y, w: 178, h: 370, fn: () => { if (st.tool === 'seeds') c.G.plant(i); else if (st.tool === 'can') c.G.water(i); else if (st.tool === 'shaker') c.G.boost(i); else c.G.pick(i); } }); });
      footer();
    },
    shop() {
      frameBg(); header(S.usePractice ? "Kit's seed shop (practice)" : "Kit's seed shop"); const p = P(); const fac = img('scene/facade_seed_shop.png'); let fy = 150; if (fac) { const fw = 330, fh = Math.min(400, fw * fac.height / fac.width); g.drawImage(fac, 30, fy, fw, fh); fy += fh - 20; } const kit = img('people/kit.png'); if (kit) { const kh = Math.min(300, 880 - fy), kw = kh * kit.width / kit.height; g.drawImage(kit, 190 - kw / 2, fy, kw, kh); }
      text(`You have ${p.coins} ${S.usePractice ? 'practice ' : ''}coins`, 380, 135, 34, COL.ink, 'left', true);
      st.shopTab = st.shopTab || 'common'; st.qty = st.qty || {};
      [['common', 'Common'], ['uncommon', 'Uncommon'], ['rare', 'Rare'], ['supergrow', 'Super Grow']].forEach(([id, label], i) => B(380 + i * 295, 160, 280, 62, label, () => { st.shopTab = id; }, { style: st.shopTab === id ? 'gold' : 'cream', size: 28, on: st.shopTab === id }));
      const items = st.shopTab === 'supergrow' ? [['supergrow', 'Super Grow', 'Shake over a plant for 2 letters']] : R.SPECIES_BY_TIER[st.shopTab].map((f) => ['sp:' + f, cap(f), 'Grows ' + R.letterOrder(f)]);
      items.forEach(([id, name, sub], i) => { const y = 238 + i * 80, key = id.split(':')[1], one = R.price(id), q = st.qty[id] || 1, total = one * q, sp = id.startsWith('sp:'); rr(380, y, 1170, 72, 16, '#fffdf6', COL.edge, 3);
        const pi = sp ? img(`seeds/${key}.png`) : null; if (pi) { const hh = 62, ww = hh * pi.width / pi.height; g.drawImage(pi, 396, y + 5, ww, hh); }
        text(name, pi ? 478 : 400, y + 36, 28, COL.ink, 'left', true); text(sub, pi ? 770 : 640, y + 36, 21, COL.soft); text(`${one} each`, 1010, y + 36, 22, COL.soft);
        const doBuy = (itemId, q, tot, what) => ask(`Buy ${what} for ${tot} coins?`, () => { const r = R.buy(S, itemId, q); note(r); if (r.ok) { c.beep(700, 0.08); st.qty[id] = 1; if (sp) st.tier = key; if (S.usePractice) emit('bought'); else ask(`${name} is in your inventory. Keep shopping, or check out?`, () => { cue('K09'); go('map'); }, 'Check out', 'Keep shopping'); } else if (!S.usePractice) cue('K13'); });
        if (sp) { const five = R.price('sp5:' + key); B(1090, y + 6, 210, 60, `Buy 1 · ${one}`, () => doBuy(id, 1, one, `1 ${name} seed`), { style: 'green', size: 26, off: p.coins < one }); B(1312, y + 6, 238, 60, `5-pack · ${five}`, () => doBuy('sp5:' + key, 1, five, `a 5-pack of ${name} seeds`), { style: 'gold', size: 26, off: p.coins < five }); text(`${one} each`, 1010, y + 36, 22, COL.soft); return; }
        B(1120, y + 6, 60, 60, '−', () => { st.qty[id] = Math.max(1, q - 1); }, { size: 34, style: 'cream' }); text(String(q), 1213, y + 36, 32, COL.ink, 'center', true); B(1246, y + 6, 60, 60, '+', () => { st.qty[id] = Math.min(9, q + 1); }, { size: 34, style: 'cream' });
        B(1320, y + 6, 220, 60, `Buy · ${total}`, () => doBuy(id, q, total, `${q} ${name}${q > 1 ? 's' : ''}`), { style: 'green', size: 26, off: p.coins < total }); });
      footer();
    },
    book() {
      frameBg(); header(S.usePractice ? 'Spelling Book (practice)' : 'Spelling Book'); const p = P();
      [['spell', 'Letter Bank'], ['words', `Words (${p.words.length})`], ['known', `Dictionary (${Object.keys(S.discovered).length})`]].forEach(([id, label], i) => B(40 + i * 330, 100, 310, 64, label, () => { st.bookTab = id; st.page = 0; }, { style: st.bookTab === id ? 'gold' : 'cream', size: 28, on: st.bookTab === id }));
      if (st.bookTab === 'spell') {
        rr(40, 185, 1100, 100, 18, '#ffffff', COL.edge); text(st.tray.split('').join(' ') || 'Tap letters from your Letter Bank', 70, 235, st.tray ? 56 : 30, st.tray ? COL.plum : '#a79f90', 'left', !!st.tray);
        B(1160, 185, 180, 100, 'Erase', () => { st.tray = st.tray.slice(0, -1); }, { style: 'rose', size: 28 }); B(1360, 185, 200, 100, 'Craft', () => craftTray(), { style: 'green', size: 36, off: st.tray.length < R.CFG.minWordLen });
        const left = { ...p.bank }; for (const ch of st.tray) left[ch] = (left[ch] || 0) - 1;
        const QW = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'], qpos = {}; QW.forEach((r, ri) => r.split('').forEach((ch, ci) => { qpos[ch] = [40 + ri * 50 + ci * 117, 310 + ri * 110]; })); (S.settings.qwerty ? QW.join('') : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ').split('').forEach((ch, i) => { const n = left[ch] || 0, x = S.settings.qwerty ? qpos[ch][0] : 40 + (i % 13) * 117, y = S.settings.qwerty ? qpos[ch][1] : 310 + Math.floor(i / 13) * 150; const kh = S.settings.qwerty ? 100 : 130; B(x, y, 106, kh, ch, () => { st.tray += ch; }, { size: 50, off: n <= 0, style: R.letterTier(ch) === 'rare' ? 'purple' : R.letterTier(ch) === 'uncommon' ? 'blue' : 'cream' }); text(n > 0 ? '×' + n : '', x + 86, y + kh - 22, 22, COL.soft, 'right'); });
        B(1180, 600, 380, 70, S.settings.qwerty ? 'Layout: QWERTY' : 'Layout: A to Z', () => { S.settings.qwerty = !S.settings.qwerty; c.save(); }, { size: 28, style: 'blue' }); text('Your Letter Bank: tap a letter to add it to the word.', 560, 640, 24, COL.soft, 'center');
        text(`Each letter is worth 1, 2 or 3 coins. A new word sells for double.`, BW / 2, 680, 24, COL.soft, 'center');
      } else if (st.bookTab === 'words') {
        if (!p.words.length) text('No crafted words yet. Spell one on the Spell tab.', BW / 2, 400, 32, '#a79f90', 'center');
        const off = pager(p.words.length, 6, 1180, 100);
        p.words.slice(off, off + 6).forEach((it, i) => { const y = 185 + i * 100; rr(40, y, 1520, 90, 16, '#fffdf6', COL.edge, 3); text(it.w.toUpperCase(), 70, y + 45, 36, COL.plum, 'left', true); text(`worth ${it.value}`, 420, y + 45, 26, COL.soft);
          if (S.usePractice) { B(640, y + 12, 430, 66, 'Hand to the customer', () => { const r = R.giveWord(S, it.id); note(r); if (r.ok) emit('gave:' + r.w); }, { style: 'green', size: 26 }); B(1100, y + 12, 430, 66, 'Stock on Word Cart', () => { const r = R.stockWord(S, it.id, c.now()); note(r); if (r.ok) emit('stocked:' + it.w); }, { style: 'purple', size: 26 }); }
          else { const fresh = !p.sold[it.w]; B(640, y + 12, 400, 66, `Sell now: ${it.value * (fresh ? R.CFG.pay.fresh : R.CFG.pay.repeat)} coins`, () => { const r = R.sellNow(S, it.id); note(r); if (r.ok) c.beep(820, 0.08); }, { style: 'gold', size: 26 }); B(1060, y + 12, 470, 66, `Stock on cart: ${it.value * R.CFG.pay.cart} later`, () => { note(R.stockWord(S, it.id, c.now())); (S.heardP12 || (S.heardP12 = true, c.speak(DLG.P12.file))); }, { style: 'purple', size: 26 }); } });
      } else {
        const ws = Object.keys(S.discovered).sort(); if (!ws.length) text('Your dictionary. Every word you craft is remembered here, even after you sell it.', BW / 2, 400, 30, '#a79f90', 'center');
        const off = pager(ws.length, 24, 1180, 100), names = { n: 'noun', v: 'verb', a: 'adjective', r: 'adverb', p: 'plural' };
        ws.slice(off, off + 24).forEach((w, i) => { const x = 40 + (i % 3) * 510, y = 185 + Math.floor(i / 3) * 76; rr(x, y, 495, 68, 14, '#fffdf6', COL.edge, 2); text(w.toUpperCase(), x + 20, y + 34, 28, COL.plum, 'left', true); text([...S.discovered[w]].map((k) => names[k]).join(', '), x + 478, y + 34, 21, COL.soft, 'right'); });
      }
      footer();
    },
    carts() {
      frameBg(); header(S.usePractice ? 'Carts (practice)' : 'The two carts'); const p = P(), wc = p.wordCart, fc = p.flowerCart;
      st.cartSel = st.cartSel || 'word';
      const pickCart = (x0, key, name, file, sub) => { rr(x0, 100, 760, 695, 22, '#fffdf6', COL.edge); const im = img(file); if (im) { const k = Math.min(520 / im.width, 430 / im.height); g.drawImage(im, x0 + 380 - im.width * k / 2, 130, im.width * k, im.height * k); } text(name, x0 + 380, 590, 42, COL.ink, 'center', true); text(sub, x0 + 380, 640, 24, COL.soft, 'center'); B(x0 + 130, 680, 500, 90, `Work at the ${name}`, () => { st.cartSel = key; }, { style: key === 'word' ? 'purple' : 'green', size: 32 }); };
      if (st.cartSel === 'word') {
      rr(30, 100, 760, 695, 22, '#fffdf6', COL.edge); const wi = img('scene/word_cart.png'); if (wi) g.drawImage(wi, 40, 105, 160, 156);
      text('Word Cart', 220, 150, 40, COL.ink, 'left', true); text('Sells crafted words. Coins wait in the cashbox.', 220, 200, 24, COL.soft);
      for (let i = 0; i < 6; i++) { const it = wc.items[i], x = 60 + (i % 3) * 240, y = 280 + Math.floor(i / 3) * 110; rr(x, y, 225, 96, 14, it ? '#f3ebff' : '#f3efe6', COL.edge, 3); text(it ? it.w.toUpperCase() : 'empty', x + 112, y + 36, it ? 30 : 24, it ? COL.plum : '#b5ad9e', 'center', !!it); if (it) text(`${it.value} coins`, x + 112, y + 72, 22, COL.soft, 'center'); }
      text(wc.items.length > 6 ? `${wc.items.length - 6} more waiting behind the cart` : wc.items.length ? 'Oldest sells first.' : 'Empty. Stock words from the Spelling Book.', 410, 525, 24, COL.soft, 'center');
      rr(60, 560, 700, 96, 16, '#fff3d6', COL.edge, 3); text(`Cashbox: ${wc.cashbox} coins`, 90, 608, 34, COL.ink, 'left', true); B(440, 572, 300, 72, wc.cashbox ? `Take ${wc.cashbox} coins` : 'No coins yet', () => { const r = R.collect(S); note(r); if (r.ok) c.beep(900, 0.1); }, { style: 'green', off: !wc.cashbox });
      if (!p.words.length) text('Craft a word in the Spelling Book, then stock it here.', 410, 720, 24, COL.soft, 'center');
      p.words.slice(0, 3).forEach((it, i) => B(60 + i * 237, 680, 226, 84, `Stock\n${it.w.toUpperCase()}`, () => { const r = R.stockWord(S, it.id, c.now()); note(r); if (r.ok) { if (S.usePractice) emit('stocked:' + it.w); else (S.heardP12 || (S.heardP12 = true, c.speak(DLG.P12.file))); } }, { style: 'purple', size: 24 }));
      } else pickCart(30, 'word', 'Word Cart', 'scene/word_cart.png', 'Sells crafted words');
      if (st.cartSel === 'flower') {
      rr(810, 100, 760, 695, 22, '#fffdf6', COL.edge); const fi = img('scene/flower_cart.png'); if (fi) g.drawImage(fi, 825, 105, 130, 146);
      text('Flower Cart', 980, 140, 40, COL.ink, 'left', true); [['glass', 'Glass'], ['fluted', 'Blue'], ['clay', 'Clay']].forEach(([k, label], i) => B(1220 + i * 115, 128, 108, 48, label, () => { st.vase = k; }, { size: 20, r: 10, style: (st.vase || 'glass') === k ? 'gold' : 'cream', on: (st.vase || 'glass') === k })); text('Arrange up to 9 cut flowers into a bouquet.', 980, 192, 24, COL.soft);
      const own = (k) => (p.flowers[k] || 0) + (p.basket[k] || 0), total = Object.values(st.arr).reduce((a, b) => a + b, 0);
      st.arrPage = st.arrPage || 0; const SPP = 8, spl = R.CFG.species.slice(st.arrPage * SPP, st.arrPage * SPP + SPP); text(`Flowers ${st.arrPage * SPP + 1}-${st.arrPage * SPP + spl.length} of ${R.CFG.species.length}`, 1190, 568, 22, COL.soft, 'center'); B(830, 548, 120, 40, '◀', () => { st.arrPage = Math.max(0, st.arrPage - 1); }, { size: 22, off: st.arrPage === 0, r: 10 }); B(1430, 548, 120, 40, '▶', () => { st.arrPage = Math.min(Math.ceil(R.CFG.species.length / SPP) - 1, st.arrPage + 1); }, { size: 22, off: (st.arrPage + 1) * SPP >= R.CFG.species.length, r: 10 });
      spl.forEach((k, i) => { const x = 830 + (i % 2) * 365, y = 245 + Math.floor(i / 2) * 66, have = own(k), n = st.arr[k] || 0; rr(x, y, 350, 58, 12, have ? '#fdf0f5' : '#f3efe6', COL.edge, 2); text(k.replace(/_/g, ' '), x + 10, y + 20, 19, have ? COL.ink : '#a79f90', 'left', true); text(`you have ${have}`, x + 10, y + 43, 17, COL.soft);
        B(x + 195, y + 6, 46, 46, '−', () => { st.arr[k] = Math.max(0, n - 1); }, { size: 30, off: !n, r: 10 }); text(String(n), x + 262, y + 30, 26, COL.plum, 'center', true); B(x + 286, y + 6, 46, 46, '+', () => { st.arr[k] = n + 1; }, { size: 30, off: n >= have || total >= 9, r: 10 }); });
      text(`Bouquet: ${total} of 9 flowers`, 1190, 600, 28, COL.ink, 'center', true);
      const doArr = (place) => { const spec = {}; Object.keys(st.arr).forEach((k) => { if (st.arr[k] > 0) spec[k] = st.arr[k]; }); const r = R.arrange(S, spec); note(r); if (r.ok) { st.arr = {}; if (place) note(R.stockBouquet(S, r.bouquet.id, c.now())); c.beep(800, 0.08); emit('arranged'); } };
      B(830, 622, 350, 66, total ? `Keep ${total} for later` : 'Add flowers first', () => doArr(false), { style: 'green', size: 28, off: !total }); B(1200, 622, 350, 66, total ? 'Sell on the flower cart' : 'Add flowers first', () => doArr(true), { style: 'purple', size: 28, off: !total || fc.items.length >= R.CFG.flowerSlots });
      text(`With you: ${p.bouquets.length} bouquet${p.bouquets.length === 1 ? '' : 's'}.   On the cart: ${fc.items.length} of ${R.CFG.flowerSlots}.`, 1190, 718, 24, COL.ink, 'center');
      B(830, 735, 720, 52, p.bouquets.length ? `Put my ${p.bouquets[0].size}-flower bouquet on the cart` : 'Your bouquets will wait here until you put them on the cart', () => { if (p.bouquets.length) note(R.stockBouquet(S, p.bouquets[0].id, c.now())); }, { style: 'cream', size: 22, off: !p.bouquets.length || fc.items.length >= R.CFG.flowerSlots });
      } else pickCart(810, 'flower', 'Flower Cart', 'scene/flower_cart.png', 'Sells bouquets');
      footer();
    },
    cottage() {
      frameBg(); header('Choose your cottage');
      [['pink', 'Pink Cottage'], ['white', 'White Cottage'], ['flowerbox', 'Flower Box Cottage'], ['forest', 'Forest Green Cottage']].forEach(([id, name], i) => { const x = 30 + i * 390; rr(x, 140, 370, 560, 26, '#fffdf6', COL.edge);
        const hi = img(`houses/${id}.png`); if (hi) { const sc = Math.min(340 / hi.width, 400 / hi.height); g.drawImage(hi, x + 185 - hi.width * sc / 2, 570 - hi.height * sc, hi.width * sc, hi.height * sc); }
        text(name, x + 185, 620, 32, COL.ink, 'center', true); btns.push({ x, y: 140, w: 370, h: 560, fn: () => ask(`Choose ${name}?`, () => { note(R.chooseCottage(S, id)); emit('cottage'); }) }); });
      footer();
    },
    gift() {
      frameBg(); header('A housewarming gift');
      [['wallpaper', 'Floral wallpaper', 'items/wallpaper.png'], ['floor', 'Honey oak floor', 'items/floorgift.png'], ['stool', 'Wooden stool', 'items/stool.png']].forEach(([id, name, icon], i) => { const x = 70 + i * 510; rr(x, 140, 470, 560, 26, '#fffdf6', COL.edge); const im = img(icon); if (im) { const s = Math.min(330 / im.width, 330 / im.height); g.drawImage(im, x + 235 - im.width * s / 2, 320 - im.height * s / 2, im.width * s, im.height * s); } text(name, x + 235, 620, 36, COL.ink, 'center', true); btns.push({ x, y: 140, w: 470, h: 560, fn: () => ask(`Choose the ${name.toLowerCase()}?`, () => { note(R.chooseGift(S, id)); emit('gift'); }) }); });
      footer();
    },
    home() {
      frameBg(); header(); const H = S.home, FAC = { pink: 'pink_cottage', white: 'white_cottage', flowerbox: 'flower_box_cottage', forest: 'forest_green_cottage', rose: 'pink_cottage', sky: 'white_cottage', honey: 'flower_box_cottage' }, hs = img(`scene/facade_${FAC[S.home.cottage] || 'pink_cottage'}.png`), X = 30, Y = 100, sc = 0.9, p = S.real;
      if (!H.cottage) { text('Mayor Ren will give you a cottage at the end of the welcome tour.', BW / 2, 400, 32, COL.soft, 'center'); return footer(); }
      // the cottage and everything already placed in it: look only
      const rooms = { big: [150, 330, 525, 250, 580, 70], small: [760, 330, 190, 250, 580, 60] };
      if (hs) { const k = Math.min(1000 / hs.width, 690 / hs.height); g.drawImage(hs, 30 + (1000 - hs.width * k) / 2, 100 + (690 - hs.height * k) / 2, hs.width * k, hs.height * k); }   // her cottage from the front (the dollhouse cutaway is gone)
      const slots = { 'big-0': [215, 615, 120], 'big-1': [345, 615, 120], 'big-2': [475, 615, 120], 'big-3': [600, 615, 120], 'big-4': [300, 450, 100], 'big-5': [520, 450, 100], 'small-0': [810, 615, 95], 'small-1': [905, 615, 95], 'small-2': [857, 450, 90] };
      // inventory
      rr(1060, 100, 500, 690, 22, '#fffdf6', COL.edge); text({ pink: 'Pink Cottage', white: 'White Cottage', flowerbox: 'Flower Box Cottage', forest: 'Forest Green Cottage', rose: 'Rose Cottage', sky: 'Bluebell Cottage', honey: 'Honey Cottage' }[H.cottage], 1310, 140, 34, COL.ink, 'center', true); text('Your things', 1310, 184, 28, COL.plum, 'center', true);
      const seeds = p.seeds, rows = [['Coins', p.coins], ['Letter Bank', R.bankCount(p.bank)], ['Cut flowers', R.flowerTotal(p)], ['Seeds', R.seedTotal(p)], ['Super Grow', p.doses], ['Crafted words', p.words.length]];
      rows.forEach(([k, v], i) => { const y = 226 + i * 46; text(k, 1090, y, 24, COL.soft); text(String(v), 1530, y, 24, COL.ink, 'right', true); });
      const items = R.homeItems(S); text('In storage', 1090, 530, 26, COL.plum, 'left', true);
      if (!items.length) text('Nothing yet.', 1090, 575, 22, '#a79f90'); items.slice(0, 5).forEach((it, i) => text(cap(it.w === 'floor' && it.src === 'storage' ? 'Honey oak floor' : it.w), 1090, 572 + i * 38, 24, COL.ink)); if (items.length > 5) text(`and ${items.length - 5} more`, 1090, 572 + 5 * 38, 22, COL.soft);
      text('Decorating is coming soon.', 1310, 770, 22, COL.soft, 'center');
      footer();
    },
    notice() {
      frameBg(); header(); const qb = img('ui/quest_board.png'); if (qb) g.drawImage(qb, 40, 120, 330, 330 * qb.height / qb.width); text('Neighbors are asking for words', 420, 140, 40, COL.ink, 'left', true); text('A request pays three times the letters. Craft the word, then hand it over.', 420, 190, 26, COL.soft);
      R.refreshRequests(S).forEach((q, i) => { const y = 225 + i * 112, have = S.real.words.find((x) => x.w === q.word); rr(420, y, 1130, 100, 20, '#fffdf6', COL.edge); text(`${q.who} would love: ${q.word.toUpperCase()}`, 450, y + 36, 32, COL.ink, 'left', true); text(`Pays ${q.pay} coins`, 450, y + 74, 24, COL.soft); if (have) B(1230, y + 14, 290, 72, 'Give it to ' + q.who.split(' ')[0], () => { const r = R.giveWord(S, have.id, q.id); note(r); if (r.ok) { c.beep(900, 0.1); R.refreshRequests(S); if (miniOffers().length) cue('X01'); } }, { style: 'green', size: 26 }); else B(1230, y + 14, 290, 72, 'Craft it first', () => { go('book'); st.bookTab = 'spell'; }, { style: 'cream', size: 26 }); });
      const MS = miniOffers().slice(0, 3); MS.forEach((m, i) => { const y = 225 + 3 * 112 + i * 76; rr(420, y, 1130, 66, 18, '#f3ebff', COL.edge); text(`${m.who} has a ${m.type} story to share`, 450, y + 34, 28, COL.plum, 'left', true); B(1280, y + 6, 250, 56, 'Read it', () => openMini(m), { style: 'purple', size: 26 }); });
      footer();
    },
    story() {
      frameBg(); header(); const M = S.madlib;
      [['tale', 'The Welcome Story'], ['saved', `Storybook (${M.stories.length})`], ['journal', `Journal (${S.journal.length})`]].forEach(([id, label], i) => B(40 + i * 310, 100, 296, 64, label, () => { st.storyTab = id; st.page = 0; st.pick = null; st.read = null; }, { style: st.storyTab === id ? 'gold' : 'cream', size: 28, on: st.storyTab === id }));
      if (st.storyTab === 'tale') {
        if (st.pick) { const sl = STORY.slots.find((s) => s.id === st.pick), opts = R.slotOptions(S, sl, true); text(`Blank ${sl.id}: ${plain(sl.prompt)}`, 40, 215, 36, COL.ink, 'left', true); B(1330, 180, 230, 64, 'Back', () => { st.pick = null; st.page = 0; }, { size: 28 });
          if (!opts.length) wrap(`You have not discovered ${R.article(plain(sl.prompt))} ${plain(sl.prompt)} yet. Craft one in the Spelling Book and it will appear here.`, BW / 2, 420, 1100, 32, '#a79f90', 'center');
          const off = pager(opts.length, 20, 600, 730); opts.slice(off, off + 20).forEach((w, i) => B(40 + (i % 4) * 385, 270 + Math.floor(i / 4) * 90, 370, 78, w.toUpperCase(), () => { note(R.choose(S, STORY, sl.id, w)); st.pick = null; st.page = 0; }, { size: 30, style: M.picks[sl.id] === w ? 'gold' : 'cream' })); return footer(); }
        const allIn = STORY.slots.every((sl) => M.picks[sl.id]); if (allIn) { const px = 1040, pw = paper(R.renderStory(STORY, M.picks, (sl) => `[${sl.id}: ${plain(sl.prompt)}]`), STORY.title, px, 88, 715, { ax: 690, ay: 700 }).w; void pw; } else wrap('Pick a word for each blank. Your own words come first. The story appears when every blank is filled.', 1400, 330, 560, 30, COL.soft, 'center');
        STORY.slots.forEach((sl, i) => { const x = 40 + (i % 3) * 330, y = 200 + Math.floor(i / 3) * 84, w = M.picks[sl.id]; B(x, y, 316, 72, w ? `${sl.id}. ${w.toUpperCase()}` : `${sl.id}. ${plain(sl.prompt)}`, () => { st.pick = sl.id; st.page = 0; }, { size: w ? 26 : 22, style: w ? 'green' : 'cream', bold: !!w }); });
        const filled = STORY.slots.every((sl) => M.picks[sl.id]);
        B(40, 560, 316, 72, 'Surprise me', () => { note(R.surprise(S, STORY)); }, { style: 'purple', size: 28 });
        B(370, 560, 616, 72, M.restored ? 'Save this telling' : 'Finish the story', () => ask(M.restored ? 'Save this new telling in your Storybook?' : 'Finish the story and restore the Welcome Sign?', finishStory), { style: 'gold', size: 30, off: !filled });
        text(filled ? 'Every blank is filled. Finish whenever you like.' : 'Tap a blank, then tap a word for it. No hurry.', 500, 665, 24, COL.soft, 'center');
      } else if (st.storyTab === 'saved') {
        if (st.read != null && M.stories[st.read]) { paper(M.stories[st.read].text, M.stories[st.read].title || 'Your story', (BW - 526) / 2, 88, 715, { ax: 120, ay: 380 }); B(40, 700, 300, 64, 'All stories', () => { st.read = null; st.page = 0; }, { size: 26 }); }
        else { if (!M.stories.length) text('Your finished stories will be kept here to read again.', BW / 2, 420, 32, '#a79f90', 'center'); M.stories.slice(-6).forEach((s, i, arr) => { const idx = M.stories.length - arr.length + i; B(60, 200 + i * 95, 1480, 82, s.title ? s.title : `Telling ${idx + 1}: a ${s.picks[1]} ${s.picks[2]}, and the whole town began to ${s.picks[3]}`, () => { st.read = idx; st.page = 0; }, { size: 26, bold: false }); }); }
      } else {
        const j = S.journal[S.journal.length - 1]; if (!j) text('Cat Girl writes in the journal when Chapter One is complete.', BW / 2, 420, 32, '#a79f90', 'center'); else paper(j.text.split('\n'), "Cat Girl's journal", (BW - 526) / 2, 88, 715, { ruled: true, ax: 120, ay: 380 });
      }
      footer();
    },
    present() {
      frameBg(); const gf = st.gift; if (!gf) { go('map'); return; } text(`${gf.from} left you a present!`, BW / 2, 130, 52, COL.ink, 'center', true);
      text('The letters are in your Letter Bank. Spell the word whenever you like.', BW / 2, 200, 30, COL.soft, 'center');
      const n = gf.word.length, tw = 120, gap = 16, x0 = (BW - (n * tw + (n - 1) * gap)) / 2; [...gf.word].forEach((ch, i) => { rr(x0 + i * (tw + gap), 300, tw, 150, 22, '#fff3d6', COL.edge, 6); text(ch, x0 + i * (tw + gap) + tw / 2, 378, 84, COL.ink, 'center', true); });
      text(gf.word, BW / 2, 530, 40, COL.plum, 'center', true);
      B(BW / 2 - 200, 610, 400, 96, 'Thank you!', () => { const f = gf.then; st.gift = null; c.showGift(false); if (f) f(); else go('map'); }, { style: 'green', size: 40 });
      footer();
    },
    community() {
      frameBg(); header(); c.setCommunity(true); text("The Player's Garden", BW / 2, 138, 44, COL.ink, 'center', true);
      const cm = S.comm, p = S.real; st.ctool = st.ctool || 'water';
      wrap('Twelve garden plots by your cottage. Plant, water or pick here. Flowers grow three times slower here than at the greenhouse desk.', BW / 2, 190, 1300, 26, COL.soft, 'center', 2);
      [['seeds', 'Plant'], ['water', 'Water'], ['pick', 'Pick']].forEach(([k, label], i) => B(90 + i * 300, 245, 280, 70, label, () => { st.ctool = k; say(`${label} selected. Now choose a plot.`); }, { style: st.ctool === k ? 'gold' : 'cream', on: st.ctool === k }));
      seedPicker(1000, 245, 330, 70, 22);
      cm.plots.forEach((pl, i) => { const x = 40 + (i % 6) * 258, y = 335 + Math.floor(i / 6) * 215, d = pl.plant;
        rr(x, y, 244, 200, 18, d ? (d.stage === 2 ? '#fde8f1' : '#eef6e4') : '#f3ece0', COL.edge, 3);
        if (!d) text('Empty', x + 122, y + 100, 28, '#a79f90', 'center');
        else { const look = d.stage === 2 ? d.species : d.stage + d.progress < 0.9 ? 'stage_seed' : d.stage + d.progress < 1.5 ? 'stage_sprout' : 'stage_bud', bi = look.startsWith('stage_') ? null : img(`blooms/${look}.png`); if (look.startsWith('stage_')) glyph(look, x + 122, y + 104, 96, d); else if (bi) g.drawImage(bi, x + 72, y + 8, 100, 100);
          if (d.stage === 2) text(d.species, x + 122, y + 128, 22, COL.plum, 'center', true); else { rr(x + 40, y + 120, 164, 12, 6, '#ffffff', COL.edge, 2); rr(x + 40, y + 120, 164 * ((d.stage + d.progress) / 2), 12, 6, '#8fd18a'); }
          text(d.stage === 2 ? 'Ready!' : d.watered ? 'Watered' : 'Thirsty', x + 122, y + 160, 24, d.stage === 2 ? COL.plum : COL.ink, 'center', d.stage === 2); }
        btns.push({ x, y, w: 244, h: 200, fn: () => { if (st.ctool === 'seeds') c.G.cPlant(i); else if (st.ctool === 'water') c.G.cWater(i); else c.G.cPick(i); } }); });
      B(BW / 2 - 200, 780, 400, 56, 'Back to the map', () => go('map'), { size: 26 });
    },
    mini() {
      frameBg(); header(); const mm = st.mini; if (!mm) { go('notice'); return; } const sty = mm.m.story;
      if (mm.pick) { const sl = sty.slots.find((x) => x.id === mm.pick), opts = R.slotOptions(S, sl, true); text(`Blank ${sl.id}: ${plain(sl.prompt)}`, 40, 215, 36, COL.ink, 'left', true); B(1330, 180, 230, 64, 'Back', () => { mm.pick = null; st.page = 0; }, { size: 28 });
        const off = pager(opts.length, 20, 600, 730); opts.slice(off, off + 20).forEach((w, i) => B(40 + (i % 4) * 385, 270 + Math.floor(i / 4) * 90, 370, 78, w.toUpperCase(), () => { mm.picks[sl.id] = w; mm.pick = null; st.page = 0; }, { size: 30, style: mm.picks[sl.id] === w ? 'gold' : 'cream' })); return footer(); }
      text(`${mm.m.who}'s story`, 40, 135, 36, COL.plum, 'left', true); const filled0 = sty.slots.every((sl) => mm.picks[sl.id]); if (filled0) paper(R.renderStory(sty, mm.picks, (sl) => `[${sl.id}: ${sl.prompt}]`), sty.title, 1040, 88, 715, { ax: 690, ay: 700 }); else text('Pick a word for each blank. Your story appears here when every blank is filled.', 1300, 330, 26, COL.soft, 'center');
      sty.slots.forEach((sl, i) => { const w = mm.picks[sl.id]; B(40, 180 + i * 84, 600, 72, w ? `${sl.id}. ${w.toUpperCase()}` : `${sl.id}. ${plain(sl.prompt)}`, () => { mm.pick = sl.id; st.page = 0; }, { size: w ? 28 : 24, style: w ? 'green' : 'cream', bold: !!w }); });
      const filled = sty.slots.every((sl) => mm.picks[sl.id]);
      B(40, 620, 300, 72, 'Surprise me', () => { sty.slots.forEach((sl) => { const o = R.slotOptions(S, sl, true); mm.picks[sl.id] = o[Math.floor(Math.random() * o.length)]; }); }, { style: 'purple', size: 28 });
      B(360, 620, 280, 72, 'Finish', () => ask('Finish this story and keep it in your Storybook?', () => { const text2 = R.renderStory(sty, mm.picks, () => '...'); S.madlib.stories.push({ title: sty.title, picks: mm.picks, text: text2 }); S.mini.offered[mm.m.who + ':read'] = true; st.mini = null; st.storyTab = 'saved'; st.read = S.madlib.stories.length - 1; c.save(); go('story'); say('Saved in your Storybook.'); }), { style: 'gold', size: 30, off: !filled });
      B(40, 710, 300, 60, 'Back', () => { st.mini = null; go('notice'); }, { size: 26 });
      footer();
    },
    movies() {
      frameBg(); header(); text('Watch the videos', BW / 2, 140, 46, COL.ink, 'center', true);
      [['The opening video', 'landing-page-opening-video'], ['The welcome-back video', 'letter-town-start'], ['The Welcome Sign returns', 'end-chapter-one'], ['The celebration', 'celebration']].forEach(([label, f], i) => B(300, 200 + i * 125, 1000, 105, label, () => playClip(`assets/video/${f}.mp4`), { size: 38 }));
      B(60, 710, 300, 70, 'Back', () => go('settings'), { size: 30 }); footer();
    },
    adjust() {
      frameBg(); const s = S.settings; text('Make it comfortable', BW / 2, 62, 50, COL.ink, 'center', true);
      text('Everything below moves right now. Sit the way you will play, and set it until you can reach comfortably.', BW / 2, 112, 26, COL.soft, 'center');
      const row = (i, label, value, k, step, lo, hi, flip) => { const y = 150 + i * 86; text(label, 60, y + 38, 30, COL.ink, 'left', true); B(800, y, 110, 70, '−', () => setSetting(k, s[k] - step * (flip ? -1 : 1), lo, hi), { size: 42 }); text(value, 1050, y + 36, 30, COL.plum, 'center', true); B(1190, y, 110, 70, '+', () => setSetting(k, s[k] + step * (flip ? -1 : 1), lo, hi), { size: 42 }); };
      row(0, 'Screen distance (closer / farther)', Math.round(s.boardDist * 100) + ' cm', 'boardDist', 0.1, 0.8, 1.5);
      row(1, 'Screen height (lower / higher)', Math.round(s.boardHeight * 100) + ' cm above table', 'boardHeight', 0.05, 0.3, 0.9);
      row(2, 'Screen size (smaller / bigger)', Math.round(s.boardScale * 100) + '%', 'boardScale', 0.1, 0.7, 1.4);
      row(3, 'Table height (lower / higher)', Math.round(s.tableDrop * 100) + ' cm below eyes', 'tableDrop', 0.03, 0.25, 0.7, true);
      row(4, 'Garden reach (closer / farther)', Math.round(s.reach * 100) + ' cm', 'reach', 0.03, 0.35, 0.65);
      row(5, 'Pinch (needs a tighter / easier pinch)', Math.round(s.pinch * 100) + '%', 'pinch', 0.1, 0.6, 2.6);
      B(60, 680, 400, 84, s.poke ? 'Fingertip poke: on' : 'Fingertip poke: off', () => { s.poke = !s.poke; c.save(); }, { style: s.poke ? 'gold' : 'cream', size: 28 });
      B(500, 680, 320, 84, 'Recenter', () => c.startRecenter(), { style: 'blue', size: 30 }); B(830, 680, 360, 84, 'Return to Garden', () => { c.teleport('merry'); go('garden'); }, { style: 'green', size: 28 });
      B(1200, 680, 350, 84, st.afterAdjust ? 'Done, start tour' : 'Done', () => { s.adjusted = true; c.save(); const f = st.afterAdjust; st.afterAdjust = null; if (f) f(); else go('settings'); }, { style: 'green', size: 36 });
      footer();
    },
    settings() {
      frameBg(); header(); const s = S.settings; const row = (i, label, value, minus, plus) => { const y = 120 + i * 92; text(label, 60, y + 38, 32, COL.ink, 'left', true); B(700, y, 120, 76, '−', minus, { size: 44 }); text(value, 940, y + 38, 32, COL.plum, 'center', true); B(1060, y, 120, 76, '+', plus, { size: 44 }); };
      const set = (k, v, lo, hi) => { s[k] = Math.round(Math.max(lo, Math.min(hi, v)) * 100) / 100; c.save(); c.layout(); if (k === 'tableDrop' && c.inVR()) c.recenter(); };
      row(0, 'Text size', Math.round(s.text * 100) + '%', () => set('text', s.text - 0.1, 0.8, 1.4), () => set('text', s.text + 0.1, 0.8, 1.4));
      row(1, 'Voice volume', s.mute ? 'muted' : Math.round(s.volume * 100) + '%', () => set('volume', s.volume - 0.1, 0.1, 1), () => set('volume', s.volume + 0.1, 0.1, 1));
      row(2, 'Table height (lower / higher)', Math.round(s.tableDrop * 100) + ' cm below eyes', () => set('tableDrop', s.tableDrop + 0.03, 0.25, 0.7), () => set('tableDrop', s.tableDrop - 0.03, 0.25, 0.7));
      row(3, 'Reach (closer / farther)', Math.round(s.reach * 100) + ' cm', () => set('reach', s.reach - 0.03, 0.35, 0.65), () => set('reach', s.reach + 0.03, 0.35, 0.65));
      B(60, 500, 360, 84, s.mute ? 'Sound: off' : 'Sound: on', () => { s.mute = !s.mute; if (s.mute) c.hush(); c.save(); }, { style: s.mute ? 'rose' : 'green' });
      B(440, 500, 360, 84, s.auto ? 'Auto-advance: on' : 'Auto-advance: off', () => { s.auto = !s.auto; c.save(); }, { style: s.auto ? 'gold' : 'cream', size: 28 });
      B(820, 500, 360, 84, 'Recenter', () => c.startRecenter(), { style: 'blue' }); B(1200, 500, 360, 84, 'Exit VR', () => c.exitVR(), { style: 'cream' });
      B(60, 596, 560, 70, 'Adjust screen, reach and pinch', () => go('adjust'), { style: 'purple', size: 28 }); B(640, 596, 540, 70, 'Watch the videos', () => go('movies'), { style: 'blue', size: 28 });
      B(60, 680, 420, 84, 'Back to title', () => { c.saveNow(); c.hush(); c.setPlace('gate'); go('title'); }, { size: 28 }); B(1140, 680, 420, 84, 'Erase my save', () => ask('Erase your town and start over? This cannot be undone.', () => { c.clearSave(); S = null; c.setS(null); c.setSign(false); c.setPlace('gate'); go('title'); }), { style: 'rose', size: 28 });
      footer();
    },
  };
  function playClip(src) { go('video'); const stop = c.playVideo(src, (ok) => { st.videoStop = null; if (ok === false) say('That video is not in the game folder yet.'); go('movies'); }); st.videoStop = () => stop(true); }
  function craftTray() { const w = st.tray; const r = R.craft(S, w); note(r); if (r.ok) { st.tray = ''; c.beep(780, 0.1); if (c.showWordObject) c.showWordObject(w); emit('crafted:' + w.toLowerCase()); if (!S.usePractice && R.CFG.items.includes(w.toLowerCase())) say(`You crafted ${w}! It can go in your home, on the cart, or be sold.`); } }
  function finishStory() {
    const r = R.completeStory(S, STORY, c.now(), journalText); note(r); if (!r.ok) return; c.saveNow();
    if (r.first) { c.setSign(true); c.setPlace('night'); c.celebrate(); c.beep(660, 0.15); setTimeout(() => c.beep(880, 0.2), 160);
      const toLetter = () => { st.videoStop = null; st.storyTab = 'journal'; st.page = 0; go('story'); say("The Welcome Sign is restored. Cat Girl left you a letter. It stays in your Journal."); };
      const afterCelebration = (ok) => { st.videoStop = null; if (ok === false) talk(['R16', 'R17', 'R18'], toLetter); else toLetter(); };
      const afterFilm = () => { st.videoStop = null; go('video'); const stop2 = c.playVideo('assets/video/celebration.mp4', afterCelebration); st.videoStop = () => stop2(true); };
      go('video'); const stop = c.playVideo('assets/video/end-chapter-one.mp4', afterFilm); st.videoStop = () => stop(); }
    else { st.storyTab = 'saved'; st.read = S.madlib.stories.length - 1; go('story'); }
  }
  function beginNew() { c.clearSave(); S = c.newGame(); c.setS(S); c.setSign(false); c.setPlace('gate'); c.save(); st.afterAdjust = () => startLesson('intro'); go('adjust'); }
  function beginSave(saved) {
    S = saved; c.setS(S); c.setSign(S.madlib.restored); c.setPlace(S.madlib.restored ? 'night' : S.tutorialDone ? 'day' : 'gate'); const ev = R.advance(S, c.now()); c.save();
    if (S.lesson) return runLesson(); if (!S.tutorialDone) return go('hub');
    go('map'); const sold = ev.wordSales.length + ev.flowerSales.length;
    if (sold || ev.bloomed) { say(`Welcome back! While you were away: ${ev.bloomed ? ev.bloomed + ' flower' + (ev.bloomed > 1 ? 's' : '') + ' bloomed. ' : ''}${ev.wordSales.length ? ev.wordSales.length + ' word' + (ev.wordSales.length > 1 ? 's' : '') + ' sold (check the cashbox). ' : ''}${ev.flowerSales.length ? ev.flowerSales.length + ' bouquet' + (ev.flowerSales.length > 1 ? 's' : '') + ' sold.' : ''}`); c.speak(DLG[sold ? 'H27' : 'H26'].file); } else cue('H26');
  }

  function draw() {
    btns = []; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, BW, BH); try { (SCREENS[st.screen] || SCREENS.loading)(); } catch (e) { console.error('screen error', st.screen, e); btns = []; g.clearRect(0, 0, BW, BH); try { SCREENS.loading(); } catch (e2) {} }   // a screen opened before the game exists shows the loading screen instead of an error
    if (st.modal) { const keep = btns; btns = []; g.fillStyle = 'rgba(60,40,30,0.55)'; g.fillRect(0, 0, BW, BH); rr(300, 270, 1000, 360, 30, COL.paper, COL.edge, 8); wrap(st.modal.text, BW / 2, 350, 880, 38, COL.ink, 'center', 3, true); const m = st.modal; B(360, 500, 400, 96, m.noLabel, () => { st.modal = null; if (m.no) m.no(); }, { style: 'cream', size: 36 }); B(840, 500, 400, 96, m.yesLabel, () => { st.modal = null; m.yes(); }, { style: 'green', size: 36 }); void keep; }
    dirty = false; c.redraw();
  }
  let lastPress = 0;
  function press(x, y) { const t = performance.now(); if (t - lastPress < 220) return false; for (let i = btns.length - 1; i >= 0; i--) { const b = btns[i]; if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { lastPress = t; c.beep(440, 0.04); b.fn(); dirty = true; if (S) c.save(); return true; } } return false; }
  function key(k) { if (st.modal) return false; if (st.screen === 'name') { if (/^[a-zA-Z]$/.test(k) && st.nameDraft.length < 12) { st.nameDraft += st.nameDraft ? k.toLowerCase() : k.toUpperCase(); dirty = true; return true; } if (k === 'Backspace') { st.nameDraft = st.nameDraft.slice(0, -1); dirty = true; return true; } }
    if (st.screen === 'book' && st.bookTab === 'spell') { if (/^[a-zA-Z]$/.test(k)) { const ch = k.toUpperCase(), left = (P().bank[ch] || 0) - [...st.tray].filter((x) => x === ch).length; if (left > 0) { st.tray += ch; dirty = true; } else say(`You have no more ${ch} tiles.`); return true; } if (k === 'Backspace') { st.tray = st.tray.slice(0, -1); dirty = true; return true; } if (k === 'Enter') { craftTray(); dirty = true; return true; } }
    if (st.screen === 'talk' && (k === 'Enter' || k === ' ')) { nextLine(); return true; } return false; }
  let half = 0;
  function everyHalfSecond(ev) {
    S = c.getS(); if (!S) return; half++;
    if (ev.practiceSale) { say(`A customer bought ${ev.practiceSale.w.toUpperCase()}!`); c.beep(900, 0.1); emit('sold:' + ev.practiceSale.w); }
    if ((ev.wordSales.length || ev.flowerSales.length) && S.gifts && S.gifts.sales < 2 && !st.talk && !st.gift && !['video', 'present', 'title'].includes(st.screen)) { const [who, word] = SALE_GIFTS[S.gifts.sales]; S.gifts.sales++; presentGift(who, word, () => go(S.tutorialDone ? 'map' : 'hub')); return; }
    if (ev.wordSales.length) { say(`A customer bought ${ev.wordSales.map((x) => x.w.toUpperCase()).join(', ')}. The coins are in the cashbox.`); c.beep(900, 0.08); c.save(); }
    if (ev.flowerSales.length) { say(`A bouquet sold for ${ev.flowerSales.reduce((a, b) => a + b.value, 0)} coins.`); c.beep(900, 0.08); c.save(); }
    if (ev.bloomed) c.save(); checkBloom();
    if (S.tutorialDone && !S.madlib.restored && !S.madlib.nudged && !st.talk && R.madReady(S, STORY) && Object.keys(S.discovered).length >= 12) { S.madlib.nudged = true; c.save(); cue('R15'); }
    if (['garden', 'carts'].includes(st.screen) || half % 20 === 0) dirty = true;
  }
  async function start() {
    draw(); try { [DLG, STORY] = await Promise.all([fetch('content/dialogue.json').then((r) => r.json()), fetch('content/story.json').then((r) => r.json())]); } catch (e) { st.msg = 'Could not load the story files. Please reload the page.'; }
    ['scene/town_gate.jpg', 'scene/sign_broken.png', 'scene/sign_restored.png', 'people/hudson.png'].forEach(img); const saved = c.load(); c.setSign(!!(saved && saved.madlib.restored)); go('title');
  }
  return { state: st, say, note, cue, emit, press, key, start, everyHalfSecond, frame() { S = c.getS(); if (st.screen === 'video') dirty = true; if (dirty) draw(); }, tap(label) { if (dirty) draw(); const L = [...btns].reverse(), n = (x) => x.label.replace(/\n/g, ' ').toLowerCase(); const b = L.find((x) => x.label && n(x) === label.toLowerCase()) || L.find((x) => x.label && n(x).includes(label.toLowerCase())); if (!b) return false; lastPress = 0; return press(b.x + b.w / 2, b.y + b.h / 2); }, poke(x, y) { if (dirty) draw(); lastPress = 0; return press(x, y); }, labels: () => { if (dirty) draw(); return btns.map((b) => b.label).filter(Boolean); }, propsOn: () => !!c.getS() && !!c.getS().tutorialDone && !c.getS().lesson && !st.modal && !['talk', 'video', 'name', 'title', 'adjust'].includes(st.screen), gardenOpen: () => !!c.getS() && st.screen === 'garden' && !st.modal, go, startLesson, get story() { return STORY; } };
}
