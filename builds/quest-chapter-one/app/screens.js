// Letter Town — everything shown on the story board, and the order of the story. No 3D code here.
export function makeScreens(c) {
  const { R, board, BW, BH } = c, g = board.getContext('2d');
  const st = { screen: 'loading', tool: null, tier: 'common', tray: '', page: 0, msg: '', modal: null, wait: null, talk: null, bookTab: 'spell', storyTab: 'tale', pick: null, sel: null, demoPage: 1, demoTab: 'notes', nameDraft: '', read: null };
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
  function say(m) { st.msg = m; dirty = true; }
  function note(r) { if (r && r.msg) say(r.msg); if (r && !r.ok) c.beep(190, 0.1); c.save(); dirty = true; }
  function cue(id) { const d = id && DLG[id]; if (!d) return; say(`${nameOf(d.who)}: ${d.text}`); c.speak(d.file); }
  const nameOf = (who) => ({ HUDSON: 'Hudson', SNOWY: 'Snowy', MERRY: 'Merry', KIT: 'Kit', PHINEAS: 'Phineas', MAYOR: 'Mayor Ren' }[who] || who);
  function talk(ids, then) { st.talk = { ids: ids.filter((i) => DLG[i]), i: 0, then }; if (!st.talk.ids.length) { st.talk = null; return then && then(); } go('talk'); playLine(); }
  function playLine() { const t = st.talk; if (!t) return; const d = DLG[t.ids[t.i]]; c.showPerson(d.who); const played = c.speak(d.file, () => { if (S.settings.auto && st.talk === t) nextLine(); }); t.voiced = played; dirty = true; }
  function nextLine() { const t = st.talk; if (!t) return; c.hush(); if (++t.i >= t.ids.length) { st.talk = null; c.showPerson(null); const f = t.then; if (f) f(); } else playLine(); dirty = true; }
  const LESSONS = {
    intro: ['H01', 'H02', 'H03', { name: 1 }, 'H04', 'H05'],
    snowy: ['H06', 'S01', 'S02', 'S03', { wait: 'page', screen: 'bookdemo', hint: 'Turn a page with the arrows.' }, 'S04', { wait: 'maptab', screen: 'bookdemo', hint: 'Choose the Map tab.' }, 'S05', 'S06', 'S08', 'S09'],
    merry: ['H08', 'H09', 'M01', 'M02', { wait: 'planted', screen: 'garden', hint: 'Plant a seed: pinch the seed packet and let go over an empty plot. Or choose Seeds, then a plot.' }, 'M03', 'M04', { wait: 'watered', screen: 'garden', hint: 'Water a growing plant: tilt the can over it. Or choose Water, then the plot.' }, 'M05', 'M06', { wait: 'bloom', screen: 'garden', hint: 'Watch for a finished flower.' }, 'M07', { wait: 'harvested', screen: 'garden', hint: 'Pick the bloom: pinch it and pull. Or choose Pick, then the plot.' }, 'M08', 'M09', 'M10', 'M12'],
    kit: ['H10', 'H11', 'K01', 'K02', 'K03', { wait: 'bought', screen: 'shop', hint: 'Buy any seed with your practice coins.' }, 'K04', 'K05', 'K06', 'K09'],
    phineas: ['H12', 'P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07'],
    orders: ['H13', 'H14', { wait: 'crafted:flower', screen: 'book', hint: 'Spell F-L-O-W-E-R with the practice letters, then press Craft.' }, 'H16', { wait: 'gave:flower', screen: 'book', hint: 'Open Words and hand FLOWER to the customer.' }, 'H17', 'H18', { wait: 'crafted:milk', screen: 'book', hint: 'Spell M-I-L-K, then press Craft.' }, 'H19', 'H20', { wait: 'stocked:milk', screen: 'carts', hint: 'Stock MILK on the Word Cart.' }, { wait: 'sold:milk', screen: 'carts', hint: 'A customer is on the way. Watch the cart.' }, 'H21', 'H22', 'H23'],
    mayor: ['H24', 'R01', 'R02', 'R03', 'R04', 'R05', 'R06', { wait: 'cottage', screen: 'cottage', hint: 'Choose the cottage that feels like home.' }, 'R07', 'R08', { wait: 'gift', screen: 'gift', hint: 'Choose one housewarming gift.' }, 'R09', 'R10', 'R11', 'R12'],
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
    else { st.wait = step; st.bookTab = step.wait === 'gave:flower' ? 'words' : 'spell'; go(step.screen); say(step.hint); if (step.wait === 'bloom') checkBloom(); }
  }
  function emit(ev) { if (st.wait && st.wait.wait === ev) { st.wait = null; S.lessonStep++; c.save(); setTimeout(runLesson, 500); } }
  function checkBloom() { if (st.wait && st.wait.wait === 'bloom' && S.practice.plots.some((p) => p.plant && p.plant.stage === 2)) emit('bloom'); }
  function finishLesson() { const id = S.lesson; S.lessons[id] = true; S.lesson = null; S.usePractice = false; c.setS(S); c.showPerson(null); if (id === 'mayor') { S.tutorialDone = true; R.refreshRequests(S); c.save(); c.setPlace('day'); go('map'); cue('H25'); } else { c.save(); go('hub'); } }
  function leaveLesson() { c.hush(); st.talk = null; st.wait = null; S.lesson = null; S.usePractice = false; c.setS(S); c.showPerson(null); c.save(); go(S.tutorialDone ? 'map' : 'hub'); }
  function go(screen) { st.screen = screen; st.page = 0; st.modal = null; st.pick = null; st.sel = null; dirty = true; }
  function ask(textStr, yes, yesLabel = 'Yes', noLabel = 'No') { st.modal = { text: textStr, yes, yesLabel, noLabel }; dirty = true; }
  function journalText(s) {
    const n = s.name || 'our new neighbor', cot = { rose: 'rose', sky: 'bluebell', honey: 'honey' }[s.home.cottage] || 'cozy';
    return [`Dear Journal,`, `Today a new neighbor named ${n} arrived in Letter Town, and nothing has been the same since. In a good way. Mostly.`, `Hudson did the welcoming. Snowy did the organizing. Merry did the gardening, Kit did the selling, Phineas did the building, and Mayor Ren did the speeches. I did the supervising, which is the hardest job.`, `${n} got a garden with eight plots and the ${cot} cottage, and grows flowers that grow LETTERS, which I still think is showing off.`, `Then the Welcome Sign got its welcome back. The whole town cheered. I cheered loudest. Somebody had to.`, `I wonder what happens next. I have several ideas. Most of them are windy.`, `— Cat Girl`].join('\n');
  }

  /* ---------- drawing each screen ---------- */
  function frameBg() { g.fillStyle = COL.paper; g.fillRect(0, 0, BW, BH); g.strokeStyle = COL.edge; g.lineWidth = 12; g.strokeRect(6, 6, BW - 12, BH - 12); }
  function footer() { rr(24, 806, BW - 48, 76, 16, '#fbeed2', COL.edge, 3); wrap(st.msg || '', BW / 2, 830, BW - 110, 27, COL.plum, 'center', 2); }
  function header(title) {
    if (S.lesson) { text(title, 40, 52, 40, COL.ink, 'left', true); B(BW - 330, 20, 300, 64, 'Back to Hudson', () => ask('Leave this lesson? You can repeat it any time.', leaveLesson), { style: 'rose', size: 28 }); if (S.usePractice) text('Practice: nothing here uses your real coins or letters', BW / 2 + 60, 52, 24, COL.soft, 'center'); return; }
    const tabs = [['map', 'Map'], ['garden', 'Garden'], ['book', 'Book'], ['shop', 'Shop'], ['carts', 'Carts'], ['home', 'Home'], ['story', 'Story'], ['settings', 'Settings']];
    tabs.forEach(([id, label], i) => B(24 + i * 160, 18, 150, 66, label, () => go(id), { style: st.screen === id ? 'gold' : 'cream', size: 28, on: st.screen === id }));
    text(`${P().coins} coins`, BW - 40, 52, 34, COL.ink, 'right', true);
  }
  function stats(y) { const p = P(); text(`Coins ${p.coins}    Letters ${R.bankCount(p.bank)}    Cut flowers ${R.flowerTotal(p)}    Seeds ${p.seeds.common + p.seeds.uncommon + p.seeds.rare}    Super Grow ${p.doses}`, BW / 2, y, 30, COL.ink, 'center', true); }

  const SCREENS = {
    loading() { frameBg(); text('Opening Letter Town…', BW / 2, BH / 2, 54, COL.ink, 'center', true); },
    title() {
      const bg = img('scene/town_gate.jpg'); if (bg) g.drawImage(bg, 0, 0, BW, BH); else frameBg();
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
      frameBg(); const t = st.talk; if (!t) return; const d = DLG[t.ids[t.i]], who = d.who.toLowerCase(), im = img(`people/${who === 'mayor' ? 'mayor' : who}.png`);
      if (im) { const h = 620, w = Math.min(430, im.width * h / im.height), hh = w * im.height / im.width; g.drawImage(im, 60, 110 + (h - hh) / 2, w, hh); }
      rr(520, 90, 1030, 520, 26, '#fffdf6', COL.edge); rr(540, 60, 330, 70, 18, COL.purple, COL.edge); text(nameOf(d.who), 705, 95, 38, COL.ink, 'center', true);
      wrap(d.text, 570, 190, 940, 44, COL.ink, 'left', 8);
      if (!t.voiced) text('(text only: this line has no recording yet)', 570, 580, 22, COL.soft);
      B(520, 640, 240, 100, 'Hear again', () => playLine(), { style: 'blue' });
      B(790, 640, 300, 100, S.settings.auto ? 'Auto: on' : 'Auto: off', () => { S.settings.auto = !S.settings.auto; c.save(); }, { style: S.settings.auto ? 'gold' : 'cream' });
      B(1120, 640, 430, 100, t.i + 1 < t.ids.length ? 'Next' : 'Continue', () => nextLine(), { style: 'green', size: 40 });
      text(`${t.i + 1} of ${t.ids.length}`, 1535, 60, 24, COL.soft, 'right');
      if (S.lesson && S.lesson !== 'intro') B(60, 760, 300, 64, 'Back to Hudson', () => ask('Leave this lesson? You can repeat it any time.', leaveLesson), { style: 'rose', size: 26 });
      B(1250, 760, 300, 64, 'Skip these lines', () => { c.hush(); const f = t.then; st.talk = null; c.showPerson(null); if (f) f(); }, { size: 26 });
    },
    hub() {
      frameBg(); c.showPerson('hudson'); const hud = img('people/hudson.png'); if (hud) g.drawImage(hud, 40, 150, 330, 330 * hud.height / hud.width);
      text(`Hudson's welcome tour`, 420, 70, 48, COL.ink, 'left', true); text('Take each stop when you are ready. Repeat any lesson you like.', 420, 126, 28, COL.soft);
      let nextFound = false;
      LESSON_LIST.forEach(([id, label], i) => { const done = !!S.lessons[id], next = !done && !nextFound; if (next) nextFound = true; const y = 170 + i * 100;
        rr(420, y, 1130, 88, 18, done ? '#eef6e4' : next ? '#fff3d6' : '#f3efe6', COL.edge, 3); text((done ? '✓  ' : '') + label, 450, y + 44, 32, done || next ? COL.ink : '#a79f90', 'left', next);
        if (done) B(1290, y + 10, 240, 68, 'Repeat', () => startLesson(id), { size: 28 }); else if (next) B(1290, y + 10, 240, 68, 'Go', () => startLesson(id), { style: 'green', size: 34 }); });
      footer();
    },
    bookdemo() {
      frameBg(); header('Your town book'); const bk = img('ui/journal.png'); if (bk) g.drawImage(bk, 260, 100, 1080, 1080 * bk.height / bk.width);
      B(420, 110, 200, 60, 'Notes', () => { st.demoTab = 'notes'; }, { style: st.demoTab === 'notes' ? 'gold' : 'cream', size: 28 }); B(640, 110, 200, 60, 'Map', () => { st.demoTab = 'map'; emit('maptab'); }, { style: st.demoTab === 'map' ? 'gold' : 'cream', size: 28 });
      if (st.demoTab === 'notes') { wrap(['Welcome to Letter Town. Flowers grow letters.', 'Letters make words. Words become useful things.', 'Your lessons, your map and your stories live in this book.'][st.demoPage - 1], 800, 330, 560, 34, COL.ink, 'center'); text(`Page ${st.demoPage} of 3`, 800, 560, 26, COL.soft, 'center'); B(430, 610, 150, 80, '◀', () => { st.demoPage = Math.max(1, st.demoPage - 1); emit('page'); }, {}); B(1020, 610, 150, 80, '▶', () => { st.demoPage = Math.min(3, st.demoPage + 1); emit('page'); }, {}); }
      else wrap('Garden  ·  Seed shop  ·  Workshop and carts  ·  Town square  ·  Mayor\'s office  ·  Home', 800, 360, 560, 34, COL.ink, 'center');
      footer();
    },
    map() {
      frameBg(); header(); text(`Letter Town${S.name ? ', home of ' + S.name : ''}`, BW / 2, 130, 44, COL.ink, 'center', true);
      const cards = [['Your garden', 'Merry says hello', 'people/merry.png', () => go('garden'), 'M13'], ["Kit's seed shop", 'Seeds and Super Grow', 'people/kit.png', () => { go('shop'); cue('K10'); }], ['Spelling Book', 'Craft and keep words', 'people/snowy.png', () => { go('book'); cue('S10'); }], ['The two carts', 'Words and bouquets', 'people/phineas.png', () => { go('carts'); cue('P08'); }], ['Your home', 'Decorate your cottage', 'scene/house.png', () => go('home')], ['Welcome story', S.madlib.restored ? 'Retell or reread it' : 'Help restore the sign', 'people/mayor.png', () => { go('story'); cue(S.madlib.restored ? 'R22' : 'R21'); }], ['Noticeboard', 'Neighbors need words', 'ui/quest_board.png', () => { go('notice'); cue('R19'); }], ['Lessons', 'Repeat the welcome tour', 'people/hudson.png', () => go('hub')]];
      cards.forEach(([t, sub, icon, fn], i) => { const x = 40 + (i % 4) * 385, y = 180 + Math.floor(i / 4) * 305; rr(x, y, 365, 285, 22, '#fffdf6', COL.edge); const im = img(icon); if (im) { const s = Math.min(170 / im.height, 220 / im.width); g.drawImage(im, x + (365 - im.width * s) / 2, y + 12, im.width * s, im.height * s); } text(t, x + 182, y + 212, 32, COL.ink, 'center', true); text(sub, x + 182, y + 252, 24, COL.soft, 'center'); btns.push({ x, y, w: 365, h: 285, fn }); });
      footer();
    },
    garden() {
      frameBg(); header(S.usePractice ? 'Practice garden' : 'Your garden'); const p = P(); stats(130);
      text('Use your hands on the table below, or use these buttons: choose a tool, then a plot.', BW / 2, 178, 26, COL.soft, 'center');
      const tl = [['seeds', 'Seeds'], ['can', 'Water'], ['shaker', 'Super Grow'], [null, 'Pick']]; tl.forEach(([k, label], i) => B(90 + i * 365, 215, 340, 88, label, () => { st.tool = k; say(k ? `${label} selected. Now choose a plot.` : 'Pick selected. Choose a finished flower.'); }, { style: st.tool === k ? 'gold' : 'cream', on: st.tool === k }));
      text('Seed to plant:', 90, 350, 28, COL.ink); ['common', 'uncommon', 'rare'].forEach((t, i) => B(300 + i * 300, 318, 280, 64, `${cap(t)} (${p.seeds[t]})`, () => { st.tier = t; }, { style: st.tier === t ? 'gold' : 'cream', size: 26, on: st.tier === t, off: !p.seeds[t] && st.tier !== t }));
      p.plots.forEach((pl, i) => { const x = 40 + i * 190, y = 410, d = pl.plant; rr(x, y, 178, 370, 20, d ? (d.stage === 2 ? '#fde8f1' : '#eef6e4') : '#f3ece0', COL.edge, d && d.boost ? 8 : 4);
        text(`Plot ${i + 1}`, x + 89, y + 30, 26, COL.soft, 'center');
        if (!d) text('Empty', x + 89, y + 170, 30, '#a79f90', 'center');
        else { const bi = d.stage === 2 && img(`blooms/${d.species}.png`); if (bi) g.drawImage(bi, x + 19, y + 60, 140, 140); else { text(d.stage === 0 ? 'Seed' : 'Sprout', x + 89, y + 120, 30, COL.ink, 'center', true); rr(x + 24, y + 160, 130, 20, 10, '#ffffff', COL.edge, 2); rr(x + 24, y + 160, 130 * ((d.stage + d.progress) / 2), 20, 10, '#8fd18a'); }
          text(d.stage === 2 ? 'Ready!' : d.watered ? 'Watered' : 'Thirsty', x + 89, y + 230, 26, d.stage === 2 ? COL.plum : COL.ink, 'center', d.stage === 2);
          if (d.boost) text('Super Grow', x + 89, y + 268, 24, '#b07a00', 'center', true); text(`${d.left} pick${d.left === 1 ? '' : 's'} left`, x + 89, y + 304, 22, COL.soft, 'center'); }
        btns.push({ x, y, w: 178, h: 370, fn: () => { if (st.tool === 'seeds') c.G.plant(i); else if (st.tool === 'can') c.G.water(i); else if (st.tool === 'shaker') c.G.boost(i); else c.G.pick(i); } }); });
      footer();
    },
    shop() {
      frameBg(); header(S.usePractice ? "Kit's seed shop (practice)" : "Kit's seed shop"); const p = P(); const kit = img('people/kit.png'); if (kit) g.drawImage(kit, 40, 150, 280, 280 * kit.height / kit.width);
      text(`You have ${p.coins} ${S.usePractice ? 'practice ' : ''}coins`, 380, 135, 34, COL.ink, 'left', true);
      const rows = [['seed:common', 'Common seed', 'Mostly everyday letters'], ['seed:uncommon', 'Uncommon seed', 'More unusual letters'], ['seed:rare', 'Rare seed', 'A chance at rare letters'], ['pack:common', 'Five common seeds', 'Save 5 coins'], ['pack:uncommon', 'Five uncommon seeds', 'Save 5 coins'], ['pack:rare', 'Five rare seeds', 'Save 5 coins'], ['supergrow', 'Super Grow', 'Next pick gives 2 letters']];
      rows.forEach(([id, name, sub], i) => { const y = 170 + i * 88, cost = R.price(id); rr(380, y, 1170, 78, 16, '#fffdf6', COL.edge, 3); text(name, 410, y + 39, 32, COL.ink, 'left', true); text(sub, 800, y + 39, 24, COL.soft); text(`${cost} coins`, 1280, y + 39, 30, COL.ink, 'right', true);
        B(1310, y + 8, 220, 62, 'Buy', () => ask(`Buy ${name} for ${cost} coins?`, () => { const r = R.buy(S, id); note(r); if (r.ok) { c.beep(700, 0.08); if (!S.usePractice) c.speak(DLG.K12.file); emit('bought'); } else if (!S.usePractice) cue('K13'); }), { style: 'green', size: 30, off: p.coins < cost }); });
      footer();
    },
    book() {
      frameBg(); header(S.usePractice ? 'Spelling Book (practice)' : 'Spelling Book'); const p = P();
      [['spell', 'Spell'], ['words', `Words (${p.words.length})`], ['known', `Discovered (${Object.keys(S.discovered).length})`]].forEach(([id, label], i) => B(40 + i * 330, 100, 310, 64, label, () => { st.bookTab = id; st.page = 0; }, { style: st.bookTab === id ? 'gold' : 'cream', size: 28, on: st.bookTab === id }));
      if (st.bookTab === 'spell') {
        rr(40, 185, 1100, 100, 18, '#ffffff', COL.edge); text(st.tray.split('').join(' ') || 'Tap letters to spell a word', 70, 235, st.tray ? 56 : 30, st.tray ? COL.plum : '#a79f90', 'left', !!st.tray);
        B(1160, 185, 180, 100, 'Erase', () => { st.tray = st.tray.slice(0, -1); }, { style: 'rose', size: 28 }); B(1360, 185, 200, 100, 'Craft', () => craftTray(), { style: 'green', size: 36, off: st.tray.length < R.CFG.minWordLen });
        const left = { ...p.bank }; for (const ch of st.tray) left[ch] = (left[ch] || 0) - 1;
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((ch, i) => { const n = left[ch] || 0, x = 40 + (i % 13) * 117, y = 310 + Math.floor(i / 13) * 150; B(x, y, 106, 130, ch, () => { st.tray += ch; }, { size: 50, off: n <= 0, style: R.letterTier(ch) === 'rare' ? 'purple' : R.letterTier(ch) === 'uncommon' ? 'blue' : 'cream' }); text(n > 0 ? '×' + n : '', x + 86, y + 108, 22, COL.soft, 'right'); });
        text('Words that fit your cottage: BED, CHAIR, LAMP, TABLE, CUP, BOOK, PEN, EGG, PAN, MUG, DESK, SHELF…', BW / 2, 640, 24, COL.soft, 'center');
        text(`Each letter is worth 1, 2 or 3 coins. A new word sells for double.`, BW / 2, 680, 24, COL.soft, 'center');
      } else if (st.bookTab === 'words') {
        if (!p.words.length) text('No crafted words yet. Spell one on the Spell tab.', BW / 2, 400, 32, '#a79f90', 'center');
        const off = pager(p.words.length, 6, 1180, 100);
        p.words.slice(off, off + 6).forEach((it, i) => { const y = 185 + i * 100; rr(40, y, 1520, 90, 16, '#fffdf6', COL.edge, 3); text(it.w.toUpperCase(), 70, y + 45, 36, COL.plum, 'left', true); text(`worth ${it.value}`, 420, y + 45, 26, COL.soft);
          if (S.usePractice) { B(640, y + 12, 430, 66, 'Hand to the customer', () => { const r = R.giveWord(S, it.id); note(r); if (r.ok) emit('gave:' + r.w); }, { style: 'green', size: 26 }); B(1100, y + 12, 430, 66, 'Stock on Word Cart', () => { const r = R.stockWord(S, it.id, c.now()); note(r); if (r.ok) emit('stocked:' + it.w); }, { style: 'purple', size: 26 }); }
          else { const fresh = !p.sold[it.w]; B(640, y + 12, 400, 66, `Sell now: ${it.value * (fresh ? R.CFG.pay.fresh : R.CFG.pay.repeat)} coins`, () => { const r = R.sellNow(S, it.id); note(r); if (r.ok) c.beep(820, 0.08); }, { style: 'gold', size: 26 }); B(1060, y + 12, 470, 66, `Stock on cart: ${it.value * R.CFG.pay.cart} later`, () => { note(R.stockWord(S, it.id, c.now())); c.speak(DLG.P12.file); }, { style: 'purple', size: 26 }); } });
      } else {
        const ws = Object.keys(S.discovered).sort(); if (!ws.length) text('Every word you craft is remembered here for your stories, even after you sell it.', BW / 2, 400, 30, '#a79f90', 'center');
        const off = pager(ws.length, 24, 1180, 100), names = { n: 'noun', v: 'verb', a: 'adjective', r: 'adverb', p: 'plural' };
        ws.slice(off, off + 24).forEach((w, i) => { const x = 40 + (i % 3) * 510, y = 185 + Math.floor(i / 3) * 76; rr(x, y, 495, 68, 14, '#fffdf6', COL.edge, 2); text(w.toUpperCase(), x + 20, y + 34, 28, COL.plum, 'left', true); text([...S.discovered[w]].map((k) => names[k]).join(', '), x + 478, y + 34, 21, COL.soft, 'right'); });
      }
      footer();
    },
    carts() {
      frameBg(); header(S.usePractice ? 'Carts (practice)' : 'The two carts'); const p = P(), wc = p.wordCart, fc = p.flowerCart;
      rr(30, 100, 760, 695, 22, '#fffdf6', COL.edge); const wi = img('scene/word_cart.png'); if (wi) g.drawImage(wi, 50, 110, 150, 150);
      text('Word Cart', 220, 150, 40, COL.ink, 'left', true); text('Sells crafted words. Coins wait in the cashbox.', 220, 200, 24, COL.soft);
      for (let i = 0; i < 6; i++) { const it = wc.items[i], x = 60 + (i % 3) * 240, y = 280 + Math.floor(i / 3) * 110; rr(x, y, 225, 96, 14, it ? '#f3ebff' : '#f3efe6', COL.edge, 3); text(it ? it.w.toUpperCase() : 'empty', x + 112, y + 36, it ? 30 : 24, it ? COL.plum : '#b5ad9e', 'center', !!it); if (it) text(`${it.value} coins`, x + 112, y + 72, 22, COL.soft, 'center'); }
      text(wc.items.length > 6 ? `${wc.items.length - 6} more waiting behind the cart` : wc.items.length ? 'Oldest sells first.' : 'Empty. Stock words from the Spelling Book.', 410, 525, 24, COL.soft, 'center');
      rr(60, 560, 700, 96, 16, '#fff3d6', COL.edge, 3); text(`Cashbox: ${wc.cashbox} coins`, 90, 608, 34, COL.ink, 'left', true); B(500, 572, 240, 72, 'Collect', () => { const r = R.collect(S); note(r); if (r.ok) c.beep(900, 0.1); }, { style: 'green', off: !wc.cashbox });
      if (!p.words.length) text('Craft a word in the Spelling Book, then stock it here.', 410, 720, 24, COL.soft, 'center');
      p.words.slice(0, 3).forEach((it, i) => B(60 + i * 237, 680, 226, 84, `Stock\n${it.w.toUpperCase()}`, () => { const r = R.stockWord(S, it.id, c.now()); note(r); if (r.ok) { if (S.usePractice) emit('stocked:' + it.w); else c.speak(DLG.P12.file); } }, { style: 'purple', size: 24 }));
      rr(810, 100, 760, 695, 22, '#fffdf6', COL.edge); const fi = img('scene/flower_cart.png'); if (fi) g.drawImage(fi, 830, 110, 150, 150);
      text('Flower Cart', 1000, 150, 40, COL.ink, 'left', true); text('Sells bouquets only. Coins go straight to you.', 1000, 200, 24, COL.soft);
      text(`Cut flowers: ${R.flowerTotal(p)}`, 840, 300, 30, COL.ink, 'left', true); [3, 6, 9].forEach((n, i) => B(1090 + i * 155, 268, 145, 64, `Make ${n}`, () => { note(R.makeBouquet(S, n)); }, { size: 26, style: 'rose', off: R.flowerTotal(p) < n || S.usePractice }));
      text(`Your bouquets: ${p.bouquets.length}`, 840, 380, 28, COL.ink); p.bouquets.slice(0, 3).forEach((b, i) => { const y = 410 + i * 76; rr(840, y, 700, 66, 14, '#fde8f1', COL.edge, 2); text(`Bouquet of ${b.size}`, 860, y + 33, 28, COL.ink, 'left', true); text(`${b.value} coins`, 1180, y + 33, 24, COL.soft); B(1330, y + 6, 200, 54, 'Stock', () => { note(R.stockBouquet(S, b.id, c.now())); }, { style: 'purple', size: 26 }); });
      text(`On the cart: ${fc.items.length} of ${R.CFG.flowerSlots}`, 840, 670, 28, COL.ink); text(fc.items.map((b) => `${b.size} (${b.value})`).join('   ') || 'Nothing stocked yet.', 840, 715, 24, COL.soft);
      footer();
    },
    cottage() {
      frameBg(); header('Choose your cottage'); c.showPerson('mayor');
      [['rose', 'Rose Cottage', '#f4b6c8'], ['sky', 'Bluebell Cottage', '#a9c8ee'], ['honey', 'Honey Cottage', '#f3d58a']].forEach(([id, name, col], i) => { const x = 70 + i * 510; rr(x, 140, 470, 560, 26, '#fffdf6', COL.edge);
        g.fillStyle = '#fbe9c9'; g.fillRect(x + 110, 380, 250, 190); g.fillStyle = col; g.beginPath(); g.moveTo(x + 80, 385); g.lineTo(x + 235, 250); g.lineTo(x + 390, 385); g.closePath(); g.fill(); g.strokeStyle = COL.edge; g.lineWidth = 5; g.stroke(); g.strokeRect(x + 110, 380, 250, 190); g.fillStyle = col; g.fillRect(x + 205, 460, 60, 110); g.fillStyle = '#fff'; g.fillRect(x + 135, 420, 50, 50); g.fillRect(x + 285, 420, 50, 50);
        text(name, x + 235, 620, 36, COL.ink, 'center', true); btns.push({ x, y: 140, w: 470, h: 560, fn: () => ask(`Choose ${name}?`, () => { note(R.chooseCottage(S, id)); emit('cottage'); }) }); });
      footer();
    },
    gift() {
      frameBg(); header('A housewarming gift'); c.showPerson('mayor');
      [['wallpaper', 'Floral wallpaper', 'items/wallpaper.png'], ['floor', 'Honey oak floor', 'items/floorgift.png'], ['stool', 'Wooden stool', 'items/stool.png']].forEach(([id, name, icon], i) => { const x = 70 + i * 510; rr(x, 140, 470, 560, 26, '#fffdf6', COL.edge); const im = img(icon); if (im) { const s = Math.min(330 / im.width, 330 / im.height); g.drawImage(im, x + 235 - im.width * s / 2, 320 - im.height * s / 2, im.width * s, im.height * s); } text(name, x + 235, 620, 36, COL.ink, 'center', true); btns.push({ x, y: 140, w: 470, h: 560, fn: () => ask(`Choose the ${name.toLowerCase()}?`, () => { note(R.chooseGift(S, id)); emit('gift'); }) }); });
      footer();
    },
    home() {
      frameBg(); header(); const H = S.home, hs = img('scene/house.png'), X = 30, Y = 100, sc = 0.9;
      if (!H.cottage) { text('Mayor Ren will give you a cottage at the end of the welcome tour.', BW / 2, 400, 32, COL.soft, 'center'); return footer(); }
      const rooms = { big: [150, 330, 525, 250, 580, 70], small: [760, 330, 190, 250, 580, 60] };   // back wall x,y,w,h then floor y,h (house picture pixels)
      if (hs) { g.drawImage(hs, X, Y, hs.width * sc, hs.height * sc); for (const r of ['big', 'small']) { const [x, y, w, h, fy, fh] = rooms[r]; if (H.wall[r]) { const wp = img('items/wallpaper.png'); if (wp) { g.save(); g.globalAlpha = 0.85; g.fillStyle = g.createPattern(wp, 'repeat'); g.translate(X + x * sc, Y + y * sc); g.scale(0.35, 0.35); g.fillRect(0, 0, w * sc / 0.35, h * sc / 0.35); g.restore(); } } if (H.floor[r]) { const fl = img('items/floorgift.png'); if (fl) { g.save(); g.globalAlpha = 0.9; g.drawImage(fl, X + x * sc, Y + fy * sc, w * sc, fh * sc); g.restore(); } } } }
      const slots = { 'big-0': [215, 615, 120], 'big-1': [345, 615, 120], 'big-2': [475, 615, 120], 'big-3': [600, 615, 120], 'big-4': [300, 450, 100], 'big-5': [520, 450, 100], 'small-0': [810, 615, 95], 'small-1': [905, 615, 95], 'small-2': [857, 450, 90] };
      for (const id of Object.keys(slots)) { const [cx, base, size] = slots[id], w = H.placed[id], x = X + (cx - size / 2) * sc, y = Y + (base - size) * sc, s = size * sc;
        if (w) { const im = img(`items/${w === 'floor' ? 'floor' : w}.png`); if (im) { const k = Math.min(s / im.width, s / im.height); g.drawImage(im, x + (s - im.width * k) / 2, y + s - im.height * k, im.width * k, im.height * k); } else text(cap(w), x + s / 2, y + s / 2, 22, COL.ink, 'center'); }
        else { g.setLineDash([8, 8]); rr(x, y, s, s, 12, st.sel ? 'rgba(191,224,168,0.55)' : 'rgba(255,255,255,0.25)', '#b89b6a', 3); g.setLineDash([]); }
        btns.push({ x, y, w: s, h: s, fn: () => { if (st.sel) { const r = R.placeItem(S, st.sel, id); note(r); if (r.ok) { st.sel = null; c.speak(DLG.P09.file); } } else if (w) note(R.putAway(S, id)); else say('Choose an item on the right first, then a spot.'); } }); }
      text({ rose: 'Rose Cottage', sky: 'Bluebell Cottage', honey: 'Honey Cottage' }[H.cottage], 1300, 120, 34, COL.ink, 'center', true); text('Choose an item, then a dotted spot.', 1300, 162, 22, COL.soft, 'center'); text('Tap a placed item to put it away.', 1300, 190, 22, COL.soft, 'center');
      const items = R.homeItems(S); if (!items.length) wrap('Nothing to place yet. Craft words like BED, CHAIR, LAMP or TABLE in the Spelling Book.', 1300, 290, 480, 26, '#a79f90', 'center');
      const off = pager(items.length, 6, 1125, 730); items.slice(off, off + 6).forEach((it, i) => { const y = 225 + i * 82, on = st.sel && st.sel.src === it.src && st.sel.i === it.i && st.sel.id === it.id; B(1060, y, 490, 72, cap(it.w === 'floor' && it.src === 'storage' ? 'Honey oak floor' : it.w), () => { st.sel = on ? null : it; }, { style: on ? 'gold' : 'cream', on, size: 28, icon: `items/${it.w === 'floor' && it.src === 'storage' ? 'floorgift' : it.w}.png`, iconW: 70 }); });
      footer();
    },
    notice() {
      frameBg(); header(); const qb = img('ui/quest_board.png'); if (qb) g.drawImage(qb, 40, 120, 330, 330 * qb.height / qb.width); text('Neighbors are asking for words', 420, 140, 40, COL.ink, 'left', true); text('A request pays three times the letters. Craft the word, then hand it over.', 420, 190, 26, COL.soft);
      R.refreshRequests(S).forEach((q, i) => { const y = 240 + i * 150, have = S.real.words.find((x) => x.w === q.word); rr(420, y, 1130, 130, 20, '#fffdf6', COL.edge); text(`${q.who} would love: ${q.word.toUpperCase()}`, 450, y + 45, 34, COL.ink, 'left', true); text(`Pays ${q.pay} coins`, 450, y + 95, 26, COL.soft); B(1230, y + 25, 290, 80, have ? 'Hand it over' : 'Not crafted yet', () => { const r = R.giveWord(S, have.id, q.id); note(r); if (r.ok) { c.beep(900, 0.1); R.refreshRequests(S); } }, { style: 'green', off: !have, size: 28 }); });
      footer();
    },
    story() {
      frameBg(); header(); const M = S.madlib;
      [['tale', 'The Welcome Story'], ['saved', `Storybook (${M.stories.length})`], ['journal', `Journal (${S.journal.length})`]].forEach(([id, label], i) => B(40 + i * 400, 100, 380, 64, label, () => { st.storyTab = id; st.page = 0; st.pick = null; st.read = null; }, { style: st.storyTab === id ? 'gold' : 'cream', size: 28, on: st.storyTab === id }));
      if (st.storyTab === 'tale') {
        if (st.pick) { const sl = STORY.slots.find((s) => s.id === st.pick), opts = R.slotOptions(S, sl); text(`Blank ${sl.id}: choose ${R.article(sl.prompt)} ${sl.prompt}`, 40, 215, 36, COL.ink, 'left', true); B(1330, 180, 230, 64, 'Back', () => { st.pick = null; st.page = 0; }, { size: 28 });
          if (!opts.length) wrap(`You have not discovered ${R.article(sl.prompt)} ${sl.prompt} yet. Craft one in the Spelling Book and it will appear here.`, BW / 2, 420, 1100, 32, '#a79f90', 'center');
          const off = pager(opts.length, 20, 600, 730); opts.slice(off, off + 20).forEach((w, i) => B(40 + (i % 4) * 385, 270 + Math.floor(i / 4) * 90, 370, 78, w.toUpperCase(), () => { note(R.choose(S, STORY, sl.id, w)); st.pick = null; st.page = 0; }, { size: 30, style: M.picks[sl.id] === w ? 'gold' : 'cream' })); return footer(); }
        const bk = img('ui/storybook.png'); if (bk) { g.globalAlpha = 0.35; g.drawImage(bk, 20, 170, 900, 640); g.globalAlpha = 1; }
        text(STORY.title, 470, 215, 34, COL.plum, 'center', true);
        const all = []; R.renderStory(STORY, M.picks, (s) => `[${s.id}: ${s.prompt}]`).forEach((p) => { lines(p, 820, 25).forEach((l) => all.push(l)); all.push(''); });
        const per = 15, pages = Math.ceil(all.length / per); if (st.page >= pages) st.page = pages - 1; all.slice(st.page * per, st.page * per + per).forEach((l, i) => text(l, 60, 262 + i * 33, 25, COL.ink));
        B(60, 762, 110, 40, '◀', () => { st.page = Math.max(0, st.page - 1); }, { size: 24, off: st.page === 0, r: 10 }); text(`page ${st.page + 1} of ${pages}`, 300, 782, 22, COL.soft, 'center'); B(430, 762, 110, 40, '▶', () => { st.page = Math.min(pages - 1, st.page + 1); }, { size: 24, off: st.page >= pages - 1, r: 10 });
        STORY.slots.forEach((s, i) => { const x = 940 + (i % 2) * 320, y = 180 + Math.floor(i / 2) * 80, w = M.picks[s.id], n = R.slotOptions(S, s).length; B(x, y, 308, 70, w ? `${s.id}. ${w.toUpperCase()}` : `${s.id}. ${s.prompt}`, () => { st.pick = s.id; st.page = 0; }, { size: w ? 26 : 22, style: w ? 'green' : n ? 'cream' : 'off', bold: !!w }); });
        const filled = STORY.slots.every((s) => M.picks[s.id]);
        B(940, 668, 308, 64, 'Surprise me', () => { note(R.surprise(S, STORY)); }, { style: 'purple', size: 28 });
        B(1260, 668, 308, 64, M.restored ? 'Save this telling' : 'Finish the story', () => ask(M.restored ? 'Save this new telling in your Storybook?' : 'Finish the story and restore the Welcome Sign?', finishStory), { style: 'gold', size: 28, off: !filled });
        text(filled ? 'Every blank is filled. Finish whenever you like.' : 'Fill the blanks with words you have discovered. No hurry.', 1254, 765, 22, COL.soft, 'center');
      } else if (st.storyTab === 'saved') {
        if (st.read != null && M.stories[st.read]) { const all = []; M.stories[st.read].text.forEach((p) => { lines(p, 1440, 28).forEach((l) => all.push(l)); all.push(''); }); const per = 14, pages = Math.ceil(all.length / per); if (st.page >= pages) st.page = pages - 1; all.slice(st.page * per, st.page * per + per).forEach((l, i) => text(l, 70, 215 + i * 38, 28, COL.ink)); B(60, 745, 150, 54, '◀', () => { st.page = Math.max(0, st.page - 1); }, { off: st.page === 0 }); B(230, 745, 150, 54, '▶', () => { st.page = Math.min(pages - 1, st.page + 1); }, { off: st.page >= pages - 1 }); B(1300, 745, 260, 54, 'All stories', () => { st.read = null; st.page = 0; }, { size: 26 }); }
        else { if (!M.stories.length) text('Your finished stories will be kept here to read again.', BW / 2, 420, 32, '#a79f90', 'center'); M.stories.slice(-6).forEach((s, i, arr) => { const idx = M.stories.length - arr.length + i; B(60, 200 + i * 95, 1480, 82, `Telling ${idx + 1}: a ${s.picks[1]} ${s.picks[2]}, and the whole town began to ${s.picks[3]}`, () => { st.read = idx; st.page = 0; }, { size: 26, bold: false }); }); }
      } else {
        const jb = img('ui/journal.png'); if (jb) { g.globalAlpha = 0.4; g.drawImage(jb, 150, 170, 1300, 640); g.globalAlpha = 1; }
        const j = S.journal[S.journal.length - 1]; if (!j) text('Cat Girl writes in the journal when Chapter One is complete.', BW / 2, 420, 32, '#a79f90', 'center'); else { text("Cat Girl's journal: Chapter One", BW / 2, 215, 34, COL.plum, 'center', true); wrap(j.text, 230, 265, 1150, 26, COL.ink, 'left', 16); }
      }
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
      text('Captions are always shown. Every spoken line can be replayed.', 60, 630, 26, COL.soft);
      B(60, 680, 420, 84, 'Back to title', () => { c.saveNow(); c.hush(); c.setPlace('gate'); go('title'); }, { size: 28 }); B(1140, 680, 420, 84, 'Erase my save', () => ask('Erase your town and start over? This cannot be undone.', () => { c.clearSave(); S = null; c.setS(null); c.setSign(false); c.setPlace('gate'); go('title'); }), { style: 'rose', size: 28 });
      footer();
    },
  };
  function craftTray() { const w = st.tray; const r = R.craft(S, w); note(r); if (r.ok) { st.tray = ''; c.beep(780, 0.1); emit('crafted:' + w.toLowerCase()); if (!S.usePractice && R.CFG.items.includes(w.toLowerCase())) say(`You crafted ${w}! It can go in your home, on the cart, or be sold.`); } }
  function finishStory() {
    const r = R.completeStory(S, STORY, c.now(), journalText); note(r); if (!r.ok) return; c.saveNow();
    if (r.first) { c.setSign(true); c.setPlace('night'); c.celebrate(); c.beep(660, 0.15); setTimeout(() => c.beep(880, 0.2), 160); talk(['R16', 'R17', 'R18'], () => { st.storyTab = 'journal'; go('story'); say('The Welcome Sign is restored. Cat Girl left a note in your journal. Keep playing as long as you like.'); }); }
    else { st.storyTab = 'saved'; st.read = S.madlib.stories.length - 1; go('story'); }
  }
  function beginNew() { c.clearSave(); S = c.newGame(); c.setS(S); c.setSign(false); c.setPlace('gate'); c.save(); startLesson('intro'); }
  function beginSave(saved) {
    S = saved; c.setS(S); c.setSign(S.madlib.restored); c.setPlace(S.madlib.restored ? 'night' : S.tutorialDone ? 'day' : 'gate'); const ev = R.advance(S, c.now()); c.save();
    if (S.lesson) return runLesson(); if (!S.tutorialDone) return go('hub');
    go('map'); const sold = ev.wordSales.length + ev.flowerSales.length;
    if (sold || ev.bloomed) { say(`Welcome back! While you were away: ${ev.bloomed ? ev.bloomed + ' flower' + (ev.bloomed > 1 ? 's' : '') + ' bloomed. ' : ''}${ev.wordSales.length ? ev.wordSales.length + ' word' + (ev.wordSales.length > 1 ? 's' : '') + ' sold (check the cashbox). ' : ''}${ev.flowerSales.length ? ev.flowerSales.length + ' bouquet' + (ev.flowerSales.length > 1 ? 's' : '') + ' sold.' : ''}`); c.speak(DLG[sold ? 'H27' : 'H26'].file); } else cue('H26');
  }

  function draw() {
    btns = []; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, BW, BH); (SCREENS[st.screen] || SCREENS.loading)();
    if (st.modal) { const keep = btns; btns = []; g.fillStyle = 'rgba(60,40,30,0.55)'; g.fillRect(0, 0, BW, BH); rr(300, 270, 1000, 360, 30, COL.paper, COL.edge, 8); wrap(st.modal.text, BW / 2, 350, 880, 38, COL.ink, 'center', 3, true); const m = st.modal; B(360, 500, 400, 96, m.noLabel, () => { st.modal = null; }, { style: 'cream', size: 36 }); B(840, 500, 400, 96, m.yesLabel, () => { st.modal = null; m.yes(); }, { style: 'green', size: 36 }); void keep; }
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
    if (ev.wordSales.length) { say(`A customer bought ${ev.wordSales.map((x) => x.w.toUpperCase()).join(', ')}. The coins are in the cashbox.`); c.beep(900, 0.08); c.save(); }
    if (ev.flowerSales.length) { say(`A bouquet sold for ${ev.flowerSales.reduce((a, b) => a + b.value, 0)} coins.`); c.beep(900, 0.08); c.save(); }
    if (ev.bloomed) c.save(); checkBloom();
    if (S.tutorialDone && !S.madlib.restored && !S.madlib.nudged && !st.talk && R.madReady(S, STORY)) { S.madlib.nudged = true; c.save(); cue('R15'); }
    if (['garden', 'carts'].includes(st.screen) || half % 20 === 0) dirty = true;
  }
  async function start() {
    draw(); try { [DLG, STORY] = await Promise.all([fetch('content/dialogue.json').then((r) => r.json()), fetch('content/story.json').then((r) => r.json())]); } catch (e) { st.msg = 'Could not load the story files. Please reload the page.'; }
    ['scene/town_gate.jpg', 'scene/sign_broken.png', 'scene/sign_restored.png', 'people/hudson.png'].forEach(img); const saved = c.load(); c.setSign(!!(saved && saved.madlib.restored)); go('title');
  }
  return { state: st, say, note, cue, emit, press, key, start, everyHalfSecond, frame() { S = c.getS(); if (dirty) draw(); }, tap(label) { if (dirty) draw(); const L = [...btns].reverse(), n = (x) => x.label.replace(/\n/g, ' ').toLowerCase(); const b = L.find((x) => x.label && n(x) === label.toLowerCase()) || L.find((x) => x.label && n(x).includes(label.toLowerCase())); if (!b) return false; lastPress = 0; return press(b.x + b.w / 2, b.y + b.h / 2); }, poke(x, y) { if (dirty) draw(); lastPress = 0; return press(x, y); }, labels: () => { if (dirty) draw(); return btns.map((b) => b.label).filter(Boolean); }, gardenOpen: () => !!c.getS() && st.screen === 'garden' && !st.modal, go, startLesson, get story() { return STORY; } };
}
