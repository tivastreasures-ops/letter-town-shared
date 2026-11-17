// Letter Town — Chapter One for Quest 3 (WebXR), seated, hands first. Plain JavaScript + Three.js.
// The garden table uses real hand actions (carry seeds, tilt the can, shake Super Grow, pull a bloom).
// The story board in front of you can be poked with a fingertip or pointed at and pinched. Mouse and touch work too.
import * as THREE from '../vendor/three/three.module.min.js';
import * as R from '../rules/game.js';
import { makeScreens } from './screens.js';
import { runIntro } from './intro.js';
import { GLTFLoader } from '../vendor/three/jsm/loaders/GLTFLoader.js';

const Q = new URLSearchParams(location.search);
const num = (k, d) => (Q.has(k) && !isNaN(parseFloat(Q.get(k))) ? parseFloat(Q.get(k)) : d);
const HAND = { pinchIn: num('pinchIn', 0.028), pinchOut: num('pinchOut', 0.05), pokeSpeed: num('pokeSpeed', 0.18), grabReach: num('grabReach', 0.10), pullDist: num('pullDist', 0.16), pourTilt: num('pourTilt', 20), pourSecs: num('pourSecs', 0.6), shakeSpeed: num('shakeSpeed', 0.5), shakeFlips: num('shakeFlips', 4), shakeWindow: 1.2, lostGrace: 0.5 };
const SPEED = num('speed', 1);   // testing only: makes time pass faster
const T0 = Date.now();
export const now = () => T0 + (Date.now() - T0) * SPEED;
const TABLE = 0.7, SAVE_KEY = 'lettertown_ch1_v1';

/* ---------- save ---------- */
let S = null;
function load() { try { const raw = localStorage.getItem(SAVE_KEY); return raw ? R.migrate(JSON.parse(raw), now()) : null; } catch (e) { return null; } }
let saveT = 0;
function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 250); }
function saveNow() { if (!S) return; try { S.lastSeen = now(); localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage full or blocked: keep playing */ } }
addEventListener('visibilitychange', saveNow); addEventListener('pagehide', saveNow);

/* ---------- scene ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight); renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#cfe6f5');
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.02, 60);
camera.position.set(0, TABLE + 0.66, 0.62); camera.lookAt(0, TABLE + 0.33, -0.6);
const hemi = new THREE.HemisphereLight('#ffffff', '#b9c9a0', 1.3); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff3dd', 1.0); sun.position.set(1, 3, 2); scene.add(sun);
const stage = new THREE.Group(); scene.add(stage);
const town = new THREE.Group(); stage.add(town);   // the town: moves around the player when you teleport
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
const loader = new THREE.TextureLoader();
const tex = (path) => { const t = loader.load(path); t.colorSpace = THREE.SRGBColorSpace; return t; };
const grassT = loader.load('assets/world/grass.jpg'); grassT.colorSpace = THREE.SRGBColorSpace; grassT.wrapS = grassT.wrapT = THREE.RepeatWrapping; grassT.repeat.set(26, 26);
const ground = new THREE.Mesh(new THREE.CircleGeometry(42, 48), new THREE.MeshLambertMaterial({ map: grassT, color: '#e4f3c8' })); ground.rotation.x = -Math.PI / 2; town.add(ground);
const oakT = loader.load('assets/world/oak.jpg'); oakT.colorSpace = THREE.SRGBColorSpace; oakT.wrapS = oakT.wrapT = THREE.RepeatWrapping; oakT.repeat.set(1.2, 0.6);
const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 0.95), new THREE.MeshLambertMaterial({ map: oakT, color: '#ffffff' })); tableTop.position.set(0, TABLE - 0.02, -0.3); stage.add(tableTop);
function cutout(path, w, h, x, y, z, ry = 0, parent = null) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex(path), transparent: true, alphaTest: 0.05, side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.y = ry; (parent || town).add(m); return m; }

/* ---------- sky: a colour-graded dome and slow fluffy clouds that follow the player's clock ---------- */
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new THREE.Color('#5aa9e6') }, mid: { value: new THREE.Color('#a9d3f2') }, hor: { value: new THREE.Color('#e8f4fb') } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 hor; void main(){ float h = clamp(vP.y,0.0,1.0); vec3 c = mix(hor, mid, smoothstep(0.0,0.35,h)); c = mix(c, top, smoothstep(0.3,0.95,h)); gl_FragColor = vec4(c,1.0); }' });
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(52, 32, 16), skyMat); skyDome.renderOrder = -10; skyDome.frustumCulled = false; scene.add(skyDome);
function puffTexture() { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'); for (const [px, py, r] of [[60, 78, 34], [100, 62, 44], [150, 66, 46], [192, 80, 32], [128, 84, 40], [84, 90, 28], [176, 92, 28]]) { const g = x.createRadialGradient(px, py, r * 0.15, px, py, r); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.7, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const puffT = puffTexture(), clouds = [];
for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.283 + (i % 3) * 0.2, r = 30 + (i % 4) * 5, sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffT, transparent: true, depthWrite: false, fog: false, opacity: 0.95 })); const w = 14 + (i % 5) * 4; sp.scale.set(w, w * 0.45, 1); sp.position.set(Math.cos(a) * r, 11 + (i % 5) * 3.2, Math.sin(a) * r); sp.userData = { a, r, y: sp.position.y, sp: 0.004 + (i % 3) * 0.002 }; clouds.push(sp); scene.add(sp); }
function stepSky(dt) { skyDome.position.copy(camera.position); const wp = new THREE.Vector3(); try { camera.getWorldPosition(wp); skyDome.position.copy(wp); } catch (e) { /* flat view */ } clouds.forEach((c) => { const u = c.userData; u.a += u.sp * dt; c.position.set(wp.x + Math.cos(u.a) * u.r, u.y, wp.z + Math.sin(u.a) * u.r); }); }
// the town behind you changes with the story: gate, daytime street, night
const BACK = { gate: tex('assets/scene/town_gate.jpg'), day: tex('assets/scene/town_day.jpg'), night: tex('assets/scene/town_night.jpg') };
const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(36, 18.4), new THREE.MeshBasicMaterial({ map: BACK.gate, fog: false })); backdrop.position.set(0, 7.2, -26); backdrop.visible = false; scene.fog = new THREE.Fog('#d9ecf7', 20, 46); town.add(backdrop);
const signBroken = cutout('assets/scene/sign_broken.png', 1.15, 0.88, -1.35, TABLE + 0.62, -1.7, 0.5);
const signRestored = cutout('assets/scene/sign_restored.png', 1.15, 0.8, -1.35, TABLE + 0.62, -1.7, 0.5); signRestored.visible = false;
cutout('assets/scene/word_cart.png', 0.95, 0.95, 1.4, TABLE + 0.5, -1.75, -0.5).name = 'flatWord';
cutout('assets/scene/flower_cart.png', 0.8, 0.8, 2.1, TABLE + 0.42, -1.0, -0.95).name = 'flatFlower';
const PEOPLE = ['hudson', 'snowy', 'merry', 'kit', 'phineas', 'mayor'];
// each resident stands in front of their home, on a little grass stage behind the story board
const HOMES = { hudson: 'archway', snowy: 'cozycottage', merry: 'cottage_green', kit: 'cottage_blue', phineas: 'cottage_roof', mayor: 'townhall' };
const HOME_H = { hudson: 0.95, snowy: 0.85, merry: 0.8, kit: 0.8, phineas: 0.8, mayor: 0.95 }, CHAR_H = { hudson: 0.46, snowy: 0.44, merry: 0.4, kit: 0.42, phineas: 0.46, mayor: 0.5 };
const gltfLoader = new GLTFLoader(), vig = new THREE.Group(); vig.visible = false; stage.add(vig);
const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.33, 0.03, 40), new THREE.MeshLambertMaterial({ color: '#a8d08a' })); stand.position.y = -0.015; vig.add(stand);
const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.34, 3, 32), new THREE.MeshLambertMaterial({ color: '#b98a55' })); plinth.position.y = -1.53; vig.add(plinth);   // a wooden pedestal down to the ground, so nobody floats
const VIG = {}; let vigWho = null, vigSide = 'center';
function fit(o, height) { o.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(o, true), sz = box.getSize(new THREE.Vector3()); o.scale.setScalar(height / Math.max(sz.y, 1e-3)); o.updateMatrixWorld(true); box.setFromObject(o, true); const c = box.getCenter(new THREE.Vector3()); o.position.x -= c.x; o.position.z -= c.z; o.position.y -= box.min.y; const w = new THREE.Group(); w.add(o); return w; }
function loadVig(k) {
  if (VIG[k]) return; const v = VIG[k] = { root: new THREE.Group(), ready: 0, char: null, home: null }; v.root.visible = false; vig.add(v.root);
  const done = () => { v.ready++; if (v.ready >= 1 && vigWho === k) applyVig(); };
  gltfLoader.load(`assets/models/${HOMES[k]}.glb`, (g) => { v.home = fit(g.scene, HOME_H[k]); v.home.position.set(0.22, 0, -0.18); v.root.add(v.home); done(); }, undefined, () => { v.failed = true; done(); });
  gltfLoader.load(`assets/models/${k}.glb`, (g) => { v.char = fit(g.scene, CHAR_H[k]); v.char.position.set(-0.16, 0, 0.14); v.root.add(v.char); done(); }, undefined, () => { v.failed = true; done(); });
}
function applyVig() { const v = VIG[vigWho]; Object.keys(VIG).forEach((k) => { VIG[k].root.visible = k === vigWho && !!VIG[k].char; }); vig.visible = !!(v && v.char); }
function placeVig() { vig.position.set(vigSide === 'left' ? -0.72 : -0.04, TABLE + (vigSide === 'left' ? 0.3 : 0.5), vigSide === 'left' ? -1.45 : -1.6); vig.scale.setScalar(vigSide === 'left' ? 1.05 : 1.3); }
function showPerson(who, side = 'center') { const k = who && PEOPLE.find((p) => who.toLowerCase().startsWith(p)); vigWho = k || null; vigSide = side; placeVig(); if (!k) { vig.visible = false; return; } loadVig(k); applyVig(); }
let placeName = 'gate';
// the sky follows the player's real clock: dawn, day, dusk, night (add ?hour=20 to the address to preview)
function clockHour() { if (Q.has('hour')) return num('hour', 12); const d = new Date(); return d.getHours() + d.getMinutes() / 60; }
function skyPhase() { const h = clockHour(); return h < 5 || h >= 20 ? 'night' : h < 8 ? 'dawn' : h >= 17 ? 'dusk' : 'day'; }
const SKY = { day: ['#ffffff', '#cfe6f5', 1.3, 1.0], dawn: ['#ffd6e4', '#f7c6d2', 1.1, 0.8], dusk: ['#ffc592', '#f0a574', 1.0, 0.7], night: ['#ffffff', '#27306b', 0.6, 0.35] };
const SKYC = { day: ['#4d9fe3', '#9fd0f3', '#eaf6fd', '#ffffff'], dawn: ['#8d9de0', '#f2b6d0', '#ffe3cf', '#fff1ea'], dusk: ['#5560b0', '#d98f9c', '#ffc08a', '#ffd9c0'], night: ['#0c1440', '#1c2660', '#38418a', '#8f95c4'] };
function applySky() { const ph = placeName === 'night' ? 'night' : skyPhase(), k = SKY[ph]; backdrop.material.map = ph === 'night' ? BACK.night : (BACK[placeName] || BACK.day); backdrop.material.color.set(k[0]); backdrop.material.needsUpdate = true; scene.background.set(k[1]); hemi.intensity = k[2]; sun.intensity = k[3]; const sc = SKYC[ph]; skyMat.uniforms.top.value.set(sc[0]); skyMat.uniforms.mid.value.set(sc[1]); skyMat.uniforms.hor.value.set(sc[2]); clouds.forEach((c) => c.material.color.set(sc[3])); scene.fog.color.set(sc[2]); }
function setPlace(name) { placeName = name; applySky(); }
setInterval(applySky, 60000);
function celebrate() { for (let i = 0; i < 60; i++) spawn(new THREE.Vector3((Math.random() - 0.5) * 1.2, TABLE + 0.9 + Math.random() * 0.3, -0.5 - Math.random() * 0.3), new THREE.Vector3((Math.random() - 0.5) * 0.6, Math.random() * 0.6, (Math.random() - 0.5) * 0.6), ['#ff9ec4', '#ffd34d', '#b99cf0', '#8fd18a'][i % 4], 1.6); }

/* ---------- town props: the two carts, the noticeboard and the town book are real 3D objects ---------- */
const props = [], _c3 = new THREE.Vector3(), _c3o = new THREE.Vector3();
function addProp(file, height, x, y, z, ry, opts = {}) {
  const holder = new THREE.Group(); holder.position.set(x, y, z); holder.rotation.y = ry; (opts.parent || stage).add(holder);
  const rec = { holder, kind: opts.kind || null, radius: opts.radius || 0.2, cy: opts.cy || 0 }; props.push(rec);
  gltfLoader.load(`assets/models/${file}.glb`, (g) => { holder.add(fit(g.scene, height)); if (opts.hideFlat) town.children.filter((c) => c.name === opts.hideFlat).forEach((c) => { c.visible = false; }); }, undefined, () => { /* the flat picture stays */ });
  return rec;
}
const wordCartProp = addProp('lettercart', 1.0, 1.8, 0, -2.0, -0.5, { hideFlat: 'flatWord', parent: town, kind: 'carts', radius: 0.62, cy: 0.5 });
const flowerCartProp = addProp('flowercart', 0.9, 2.5, 0, -1.3, -0.95, { hideFlat: 'flatFlower', parent: town, kind: 'carts', radius: 0.62, cy: 0.45 });
/* what is on each cart, drawn in 3D and refreshed twice a second */
const stockW = new THREE.Group(), stockF = new THREE.Group(); wordCartProp.holder.add(stockW); flowerCartProp.holder.add(stockF);
const plaqueTex = {}; function plaque(txt, bg) { const k = txt + bg; if (plaqueTex[k]) return plaqueTex[k]; const c = document.createElement('canvas'); c.width = 256; c.height = 112; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 256, 112); x.strokeStyle = '#6b4a2b'; x.lineWidth = 10; x.strokeRect(5, 5, 246, 102); x.fillStyle = '#4b2f6b'; x.font = 'bold 60px Georgia,serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt.toUpperCase(), 128, 58, 230); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (plaqueTex[k] = t); }
const FCOL = { rose: '#e88aa5', daisy: '#fffdf4', poppy: '#e8453c', peony: '#f2a6c4', lily: '#f6b5d8', sunflower: '#ffc928', violet: '#8a63d2', marigold: '#ff9a1f', buttercup: '#ffe14a', zinnia: '#e2557a', chrysanthemum: '#f4d36b', kopsia: '#f08bb0', jonquil: '#ffd84a', flax: '#6d8fe8', plumeria: '#fff0c7' };
/* real 3D arranging: pick cut flowers from the shelf, they stand in the vase; touch the vase to take the last one out */
const arrG = new THREE.Group(); arrG.visible = false; stage.add(arrG);
const vase = new THREE.Group(); { const v = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.14, 20, 1, true), new THREE.MeshLambertMaterial({ color: '#cfe6f2', transparent: true, opacity: 0.8, side: THREE.DoubleSide })); v.position.y = 0.07; vase.add(v); const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.01, 20), new THREE.MeshLambertMaterial({ color: '#9dc3d8' })); bt.position.y = 0.005; vase.add(bt); } vase.position.set(0.58, TABLE, 0.02); arrG.add(vase);
const vaseRec = { holder: vase, kind: 'vase', radius: 0.09, cy: 0.1 }; props.push(vaseRec);
const vaseFl = new THREE.Group(); vase.add(vaseFl); const pickRecs = []; const SPKEY = { rose: 'rose_pink', daisy: 'daisy_white', peony: 'peony_pink', lily: 'lily_pink' }; let arrSig = '';
const vaseFluted = new THREE.Group(); vase.add(vaseFluted); let vaseLoaded = false; const vaseGlass = vase.children.filter((c) => c.isMesh);
function applyVase() { const f = UI.state.vase === 'fluted'; vaseGlass.forEach((m) => { m.visible = !f; }); vaseFluted.visible = f; if (f && !vaseLoaded) { vaseLoaded = true; flowerModel('vase_fluted', 0.16, (m) => vaseFluted.add(m)); } }
function refreshArr() {
  const on = !!S && UI.state.screen === 'carts'; arrG.visible = on; if (!on) { arrSig = ''; return; } applyVase();
  const PP = R.pouch(S), arr = UI.state.arr || {}, sig = JSON.stringify([PP.flowers, PP.basket, arr]); if (sig === arrSig) return; arrSig = sig;
  pickRecs.splice(0).forEach((r) => { arrG.remove(r.holder); const i = props.indexOf(r); if (i >= 0) props.splice(i, 1); });
  while (vaseFl.children.length) vaseFl.remove(vaseFl.children[0]);
  let row = 0; R.CFG.species.forEach((k) => { const have = (PP.flowers[k] || 0) + (PP.basket[k] || 0) - (arr[k] || 0); if (have <= 0) return; const h = new THREE.Group(), i = row++; h.position.set(0.2 + (i % 8) * 0.1, TABLE, 0.18 + Math.floor(i / 8) * 0.09); arrG.add(h);
    flowerModel(SPKEY[k] || k, 0.13, (m) => { h.add(m); }); const rec = { holder: h, kind: 'pick:' + k, radius: 0.055, cy: 0.07 }; props.push(rec); pickRecs.push(rec); });
  let n = 0; Object.keys(arr).forEach((k) => { for (let j = 0; j < arr[k]; j++) { const a = n * 2.4, r = 0.012 * (1 + (n % 4)), idx = n++; flowerModel(SPKEY[k] || k, 0.2, (m) => { m.position.set(Math.cos(a) * r, 0.07, Math.sin(a) * r); m.rotation.z = Math.cos(a) * 0.12 * (1 + idx % 3); m.rotation.x = Math.sin(a) * 0.12 * (1 + idx % 3); vaseFl.add(m); }); } });
}
let stockSig = '';
function refreshStock() {
  if (!S) return; const PP = R.pouch(S), sig = JSON.stringify([PP.wordCart.items.map((i) => i.w), PP.wordCart.cashbox, PP.flowerCart.items.map((i) => i.id)]); if (sig === stockSig) return; stockSig = sig;
  [stockW, stockF].forEach((g) => { while (g.children.length) { const o = g.children.pop(); o.traverse((m) => { if (m.geometry) m.geometry.dispose(); }); } });
  PP.wordCart.items.slice(0, 6).forEach((it, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.087), new THREE.MeshBasicMaterial({ map: plaque(it.w, '#f4ecff'), side: THREE.DoubleSide })); m.position.set(-0.3 + (i % 3) * 0.3, 0.46 - Math.floor(i / 3) * 0.1, 0.1); m.rotation.x = -0.35; stockW.add(m); });
  if (PP.wordCart.cashbox) { const n = Math.min(8, 1 + Math.floor(PP.wordCart.cashbox / 5)); for (let i = 0; i < n; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 14), new THREE.MeshLambertMaterial({ color: '#f7c948' })); c.position.set(0.4, 0.3 + i * 0.01, 0.16); stockW.add(c); } }
  PP.flowerCart.items.slice(0, 6).forEach((b, i) => { const g = new THREE.Group(), n = Math.min(9, b.size || 3); const sp = Object.keys(b.used || {}); for (let k = 0; k < n; k++) { const col = FCOL[sp[k % Math.max(1, sp.length)]] || '#f29ac0'; const head = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshLambertMaterial({ color: col })); const a = k * 2.4, r = 0.02 + 0.012 * (k % 3); head.position.set(Math.cos(a) * r, 0.08 + (k % 3) * 0.015, Math.sin(a) * r); g.add(head); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.08, 5), new THREE.MeshLambertMaterial({ color: '#4c9a43' })); st.position.set(head.position.x * 0.5, 0.04, head.position.z * 0.5); g.add(st); } g.position.set(-0.3 + (i % 3) * 0.3, 0.33, 0.0 + Math.floor(i / 3) * 0.17); stockF.add(g); });
}
const bookProp = addProp('townbook', 0.14, -0.7, TABLE, -0.3, 0.3, { kind: 'book', radius: 0.14 });
const noticeProp = addProp('noticeboard', 0.34, -2.15, TABLE + 0.55, -0.35, 1.0, { kind: 'notice', radius: 0.4 });
for (const dx of [-0.38, 0.38]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, TABLE + 0.55, 10), new THREE.MeshLambertMaterial({ color: '#8a5a33' })); post.position.set(dx, -(TABLE + 0.55) / 2 + 0.0, -0.02); noticeProp.holder.add(post); post.position.y = -(TABLE + 0.55) / 2; }

/* ---------- a present for the player, shown on the table while a gift is opened ---------- */
const giftHolder = new THREE.Group(); giftHolder.position.set(0, TABLE + 0.02, -0.32); giftHolder.visible = false; stage.add(giftHolder);
gltfLoader.load('assets/models/giftbox.glb', (g) => { giftHolder.add(fit(g.scene, 0.22)); }, undefined, () => { /* no box model: the tiles still show */ });
function showGift(on) { giftHolder.visible = !!on; if (on) for (let i = 0; i < 40; i++) spawn(new THREE.Vector3((Math.random() - 0.5) * 0.4, TABLE + 0.2, -0.32), new THREE.Vector3((Math.random() - 0.5) * 0.9, Math.random() * 0.9 + 0.3, (Math.random() - 0.5) * 0.9), ['#ff9ec4', '#ffd34d', '#b99cf0', '#8fd18a'][i % 4], 1.2); }

/* ---------- the town all around the table: cobblestone, fountain, trees, cottages ---------- */
const FL = {};   // flower models by key, loaded when first needed
const world = new THREE.Group(); town.add(world);
const WM = {};
function worldModel(file, cb) { const w = WM[file] || (WM[file] = { scene: null, wait: [], loading: false }); const go = () => cb(w.scene.clone(true)); if (w.scene) { go(); return; } w.wait.push(go); if (w.loading) return; w.loading = true; gltfLoader.load(`assets/models/world/${file}.glb`, (g) => { w.scene = g.scene; w.wait.splice(0).forEach((f) => f()); }, undefined, () => { w.wait.length = 0; }); }
function fitW(o, width) { o.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(o), sz = box.getSize(new THREE.Vector3()); o.scale.setScalar(width / Math.max(sz.x, sz.z, 1e-3)); o.updateMatrixWorld(true); box.setFromObject(o); const c = box.getCenter(new THREE.Vector3()); o.position.x -= c.x; o.position.z -= c.z; o.position.y -= box.min.y; const w = new THREE.Group(); w.add(o); return w; }
function put(file, height, x, z, ry, parent, y) { worldModel(file, (src) => { const m = fit(src, height); m.position.set(x, y || 0, z); m.rotation.y = ry || 0; (parent || world).add(m); }); }
let seed = 7; const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const cobbleT = loader.load('assets/world/cobble.jpg'); cobbleT.colorSpace = THREE.SRGBColorSpace; cobbleT.wrapS = cobbleT.wrapT = THREE.RepeatWrapping; cobbleT.anisotropy = 4;
function cobbleMat(w, d) { const t = cobbleT.clone(); t.needsUpdate = true; t.repeat.set(w / 1.7, d / 1.7); return new THREE.MeshLambertMaterial({ map: t }); }
let cobY = 0.008;
function cobblePatch(geo, w, d, x, z) { const m = new THREE.Mesh(geo, cobbleMat(w, d)); m.rotation.x = -Math.PI / 2; cobY += 0.0015; m.position.set(x, cobY, z); m.material.polygonOffset = true; m.material.polygonOffsetFactor = -cobY * 400; m.material.polygonOffsetUnits = -1; world.add(m); return m; }
cobblePatch(new THREE.CircleGeometry(2.5, 48), 5, 5, 0, -0.4);                  // under the table
cobblePatch(new THREE.PlaneGeometry(2.2, 4.6), 2.2, 4.6, 0, -4.3);               // the road to the fountain
cobblePatch(new THREE.CircleGeometry(2.8, 48), 5.6, 5.6, 0, -7.0);              // the fountain plaza
cobblePatch(new THREE.PlaneGeometry(5.2, 1.7), 5.2, 1.7, 3.5, -1.3);             // the road to the carts and cottages
cobblePatch(new THREE.PlaneGeometry(1.9, 1.5), 1.9, 1.5, -2.35, -1.5);            // the road to the community garden
cobblePatch(new THREE.CircleGeometry(0.9, 32), 1.8, 1.8, -2.7, -1.5);              // the little pad in front of the garden
put('fountain', 2.3, 0, -7.0, 0);
worldModel('trowel', (src) => { src.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(src), sz = bb.getSize(new THREE.Vector3()); src.scale.setScalar(0.15 / Math.max(sz.x, sz.y, sz.z, 1e-3)); src.updateMatrixWorld(true); bb.setFromObject(src); const c = bb.getCenter(new THREE.Vector3()); src.position.x -= c.x; src.position.z -= c.z; src.position.y -= bb.min.y; const w = new THREE.Group(); w.add(src); w.position.set(0.8, TABLE, 0.02); w.rotation.y = 0.5; stage.add(w); });   // a small trowel left on the table
addProp('townhall', 6.0, 0, 0, -12.5, 0, { parent: town });
[['cottage_new_blue', 3.0, 6.4, -0.6, -1.3], ['cottage_new_green', 3.0, 6.8, -3.8, -1.45], ['cottage_new_blue', 3.0, 6.2, -7.2, -1.8], ['cottage_new_green', 3.0, -7.0, -6.8, 1.6], ['cottage_new_blue', 3.0, -7.4, 0.6, 1.2], ['cottage_new_green', 3.0, 5.0, 5.6, 2.6], ['cottage_new_blue', 3.0, -4.6, 6.2, 3.4]].forEach(([f, h, x, z, ry]) => put(f, h, x, z, ry));
[[-8.5, -2.5], [-9.8, -7.0], [-8, -11], [8.5, -11], [10.2, -6], [9.6, -1.5], [-4.5, -11.5], [4.8, -12], [-9.5, 3.5], [-6, 7.5], [0, 9.5], [8, 6.5], [10.5, 3], [-12.5, -5], [12.5, -4], [-4.8, 2.2], [4.4, 2.8]].forEach(([x, z], i) => put(i % 2 ? 'tree_flowering' : 'tree_lush', 3.4 + rng() * 1.8, x, z, rng() * 6.28));
const KEEP = [[0, -0.4, 2.7], [0, -7, 3.0], [3.5, -1.3, 2.9], [-3.2, -1.9, 2.6], [0, -4.3, 1.6], [-4.2, -2.8, 2.7]];   // keep the cobblestone and garden clear of shrubs
for (let i = 0; i < 70; i++) { const a = rng() * 6.283, r = 2.8 + rng() * 11, x = Math.cos(a) * r, z = -3 + Math.sin(a) * r; if (KEEP.some(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) < kr)) continue; const k = ['shrub', 'bush', 'grassclump', 'grassclump'][i % 4]; put(k, k === 'grassclump' ? 0.35 + rng() * 0.3 : 0.6 + rng() * 0.7, x, z, rng() * 6.28); }
[[-3, 5], [3.4, 7.5], [-8, 9], [7.5, 10], [0, 13], [-11, 6], [11, 8], [-14, -9], [14, -10], [-2, -15], [5, -15]].forEach(([x, z]) => put(rng() < 0.5 ? 'tree_lush' : 'tree_flowering', 3.6 + rng() * 1.6, x, z, rng() * 6.28));
[['cottage_new_green', 3.0, 1.2, 4.6, 3.14], ['cottage_new_blue', 3.0, -9.5, 6.5, 2.2], ['cottage_new_blue', 3.0, 9.5, 6.8, -2.2]].forEach(([f, h, x, z, ry]) => put(f, h, x, z, ry));
const FLW = [['marigold', 0.35], ['buttercup', 0.3], ['sunflower', 0.6], ['violet', 0.3], ['flax', 0.35], ['jonquil', 0.35], ['zinnia', 0.35], ['kopsia', 0.35], ['daisy_white', 0.3], ['rose_pink', 0.4], ['poppy_blue', 0.35], ['peony_pink', 0.35], ['lily_purple', 0.4]];
for (let i = 0; i < 48; i++) { const a = rng() * 6.283, r = 2.6 + rng() * 9, x = Math.cos(a) * r, z = -2 + Math.sin(a) * r; if (KEEP.some(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) < kr)) continue; const [k, h] = FLW[i % FLW.length]; flowerModel(k, h * (0.8 + rng() * 0.5), (m) => { m.position.set(x, 0, z); m.rotation.y = rng() * 6.28; world.add(m); }); }
for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; put('bush', 0.9, Math.cos(a) * 3.3, -7 + Math.sin(a) * 3.3, rng() * 6.28); }   // a ring of bushes around the fountain plaza

/* ---------- the community garden: twelve shared plots in the town square, and neighbors strolling through ---------- */
const comm = new THREE.Group(); comm.position.set(-4.2, 0, -2.8); comm.rotation.y = 0.89; comm.visible = true; town.add(comm);
function flowerModel(key, height, cb) { const f = FL[key] || (FL[key] = { scene: null, wait: [] }); const go = () => { const m = fit(f.scene.clone(true), height); cb(m); }; if (f.scene) { go(); return; } f.wait.push(go); if (f.wait.length > 1 || f.loading) return; f.loading = true; gltfLoader.load(`assets/models/flowers/${key}.glb`, (g) => { f.scene = g.scene; f.wait.splice(0).forEach((fn) => fn()); }, undefined, () => { f.failed = true; f.wait.length = 0; }); }
const CP = [], cTex = {}, cGlb = {};   // one little scene per community plot, redrawn from the saved garden
const cTexOf = (f) => cTex[f] || (cTex[f] = tex(`assets/blooms/${f}.png`));
for (let i = 0; i < 12; i++) {
  const x = (i % 6 - 2.5) * 0.55, z = Math.floor(i / 6) * 0.6, g = new THREE.Group(); g.position.set(x, 0, z); comm.add(g);
  const mound = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.07, 20), new THREE.MeshLambertMaterial({ color: '#7a5236' })); mound.position.y = 0.035; mound.visible = false; g.add(mound); worldModel('stoneplot', (src) => { const m = fitW(src, 0.62); g.add(m); });
  const ico = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.08, side: THREE.DoubleSide })); ico.position.y = 0.22; g.add(ico);
  CP.push({ g, ico, holder: new THREE.Group(), sig: '' }); CP[i].holder.position.y = 0.07; g.add(CP[i].holder);
}
function miniPlant(look) {   // a small 3D seed, sprout or bud for the community plots (no flat pictures)
  const g = new THREE.Group(), soil = new THREE.MeshLambertMaterial({ color: '#5b3a24' }), green = new THREE.MeshLambertMaterial({ color: '#5a9a48' }), leaf = new THREE.MeshLambertMaterial({ color: '#6fb45a' });
  if (look === 'seed') { const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), soil); m.scale.y = 0.45; m.position.y = 0.02; g.add(m); return g; }
  const h = look === 'sprout' ? 0.26 : 0.46, stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, h, 8), green); stem.position.y = h / 2; g.add(stem);
  for (const d of [-1, 1]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), leaf); l.scale.set(1.6, 0.3, 0.8); l.position.set(d * 0.07, h * 0.5, 0); l.rotation.z = d * 0.5; g.add(l); }
  if (look !== 'sprout') { const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshLambertMaterial({ color: '#f08cb4' })); b.scale.y = 1.4; b.position.y = h + 0.04; g.add(b); }
  return g;
}
function drawCommunity() {
  if (!S || !S.comm) return;
  CP.forEach((c, i) => {
    const pl = S.comm.plots[i].plant; const prog = pl ? pl.stage + pl.progress : -1, key = pl ? R.flowerKey(pl.species, pl.color) : '';
    const look = !pl ? 'none' : pl.stage === 2 ? 'bloom:' + key : prog < 0.9 ? 'seed' : prog < 1.5 ? 'sprout' : 'bud:' + R.budColor(pl.species, pl.color);
    if (look === c.sig) return; c.sig = look; c.holder.clear(); c.ico.visible = look !== 'none';
    if (look === 'none') return;
    const flat = (f, sc, y) => { c.ico.visible = true; c.ico.material.map = cTexOf(f); c.ico.material.needsUpdate = true; c.ico.scale.setScalar(sc); c.ico.position.y = y; };
    if (look.startsWith('bloom:') || look.startsWith('bud:')) {
      const mk = look.startsWith('bloom:') ? key : 'bud_' + look.slice(4); c.ico.visible = false;
      flowerModel(mk, look.startsWith('bloom:') ? (pl.species === 'sunflower' ? 0.62 : 0.5) : 0.3, (m) => { if (c.sig === look) { c.holder.clear(); c.holder.add(m); } });
      flat(look.startsWith('bloom:') ? pl.species : 'stage_bud', 1.5, 0.28); c.ico.visible = false; c.fallback = () => flat(look.startsWith('bloom:') ? pl.species : 'stage_bud', 1.5, 0.28);
      if (FL[mk] && FL[mk].failed) c.fallback();
    } else { c.ico.visible = false; flowerModel(look === 'seed' ? 'seed_magic' : 'sprout_seedling', look === 'seed' ? 0.14 : 0.3, (m) => { if (c.sig === look) { c.holder.clear(); c.holder.add(m); } }); }
  });
}
for (let i = 0; i < 2; i++) worldModel('fence', (src) => { const m = fitW(src, 1.95); m.position.set((i - 0.5) * 1.95, 0, -0.62); comm.add(m); });   // fence along the back
for (const sx of [-1, 1]) worldModel('fence', (src) => { const m = fitW(src, 1.5); m.rotation.y = Math.PI / 2; m.position.set(sx * 1.95, 0, 0.1); comm.add(m); });
worldModel('fencepost', (src) => { for (const [sx, sz] of [[-1, -0.62], [1, -0.62], [-1, 0.86], [1, 0.86]]) { const m = fit(src.clone(true), 0.5); m.position.set(sx * 1.95, 0, sz); comm.add(m); } });
const mixers = [], walkers = [], KIDS = ['anna', 'timmy', 'mary', 'billy', 'sally', 'joe'], KID_H = 1.15; let commOn = true, kidsLoaded = false;
const CARTS = { word: [1.25, -1.35], flower: [2.1, -0.65] };   // where a neighbor stands to shop
const SPOTS = [[0, -5.5], [-1.5, -6.2], [1.6, -6.4], [0, -8.4], [-2.2, -4.2], [2.0, -3.4], [-3.0, -0.6], [-2.4, -1.4], [3.2, -0.2], [0.6, -3.0]];   // places to stroll to on the cobblestones
const DOORS = [[5.0, -0.7], [5.4, -3.8], [5.0, -7.0], [-5.6, -6.6], [-6.0, 0.6], [4.4, 4.5], [-3.8, 5.2], [0.2, 3.7], [0, -10.2], [-8.3, 5.4], [8.0, 5.7]];   // front steps of the cottages and the town hall
const _desk = new THREE.Vector3();
function loadKids() {
  if (kidsLoaded) return; kidsLoaded = true;
  KIDS.forEach((k, i) => gltfLoader.load(`assets/models/kids/${k}.glb`, (g) => {
    const m = fit(g.scene, KID_H); m.visible = false; world.add(m); const mx = new THREE.AnimationMixer(g.scene), clip = g.animations.find((a) => /walk/i.test(a.name)) || g.animations[0]; if (clip) mx.clipAction(clip).play(); mixers.push(mx);
    walkers.push({ m, mx, x: 0, z: 0, tx: 0, tz: 0, wait: 2 + i * 5 + Math.random() * 6, i, vis: 0, buy: null, route: [], on: false, door: -1 });
  }, undefined, () => { /* that neighbor is missing: skip */ }));
}
function setCommunity(on) { loadKids(); }
function emerge(w, route) {   // a neighbor steps out of a door and walks the route; at its end they go inside and are gone
  const d = Math.floor(Math.random() * DOORS.length); w.door = d; w.x = DOORS[d][0]; w.z = DOORS[d][1]; w.m.position.set(w.x, 0, w.z); w.on = true; w.vis = 1; w.m.visible = true; w.m.scale.setScalar(1); w.mx.timeScale = 1;
  w.route = route || []; const n = 1 + Math.floor(Math.random() * 3); if (!route) for (let k = 0; k < n; k++) { const sp = SPOTS[Math.floor(Math.random() * SPOTS.length)]; w.route.push([sp[0] + (Math.random() - 0.5) * 0.8, sp[1] + (Math.random() - 0.5) * 0.8]); }
  let e = Math.floor(Math.random() * DOORS.length); if (e === d) e = (e + 1) % DOORS.length; w.route.push(DOORS[e]); w.exit = true; w.tx = w.route[0][0]; w.tz = w.route[0][1]; w.m.rotation.y = Math.atan2(w.tx - w.x, w.tz - w.z);
}
function kidBuys(ev) {   // a neighbor walks to the cart that just sold something, shops, and leaves a letter tile
  const sales = [...(ev.wordSales || []).map(() => 'word'), ...(ev.flowerSales || []).map(() => 'flower')]; if (!sales.length) return;
  sales.forEach((cart) => { let w = walkers.filter((x) => x.on && !x.buy).sort((a, b) => Math.hypot(a.x - CARTS[cart][0], a.z - CARTS[cart][1]) - Math.hypot(b.x - CARTS[cart][0], b.z - CARTS[cart][1]))[0];
    if (!w) { w = walkers.find((x) => !x.on); if (!w) return; emerge(w, [[CARTS[cart][0], CARTS[cart][1]]]); w.route = [[CARTS[cart][0], CARTS[cart][1]]]; const e = Math.floor(Math.random() * DOORS.length); w.route.push(DOORS[e]); w.exit = true; w.tx = CARTS[cart][0]; w.tz = CARTS[cart][1]; }
    w.buy = { cart, t: 0 }; w.route = [[CARTS[cart][0], CARTS[cart][1]], w.route[w.route.length - 1]]; w.tx = CARTS[cart][0]; w.tz = CARTS[cart][1]; w.wait = 0; });
}
let kidGround = 0;
function stepKids(dt) {
  drawCommunity(); if (!walkers.length) return; mixers.forEach((mx) => mx.update(dt));
  kidGround -= dt; _desk.set(0, 0, 0); town.worldToLocal(stage.localToWorld(_desk));   // where the desk is, in the town's own frame
  const active = walkers.filter((x) => x.on).length;
  walkers.forEach((w) => {
    if (!w.on) { w.m.visible = false; w.wait -= dt; if (w.wait <= 0) { if (active < 3 && commOn) emerge(w); else w.wait = 4 + Math.random() * 6; } return; }
    if (w.wait > 0) { w.wait -= dt; w.mx.timeScale = 0; if (w.buy && w.wait <= 0 && w.buy.t) { w.buy = null; w.route.shift(); const n = w.route[0]; if (n) { w.tx = n[0]; w.tz = n[1]; } } return; } w.mx.timeScale = 1;
    const dx = w.tx - w.x, dz = w.tz - w.z, d = Math.hypot(dx, dz);
    if (d < 0.15) {
      if (w.buy && !w.buy.t) { w.buy.t = 1; w.wait = 3; w.mx.timeScale = 0; const cp = CARTS[w.buy.cart]; popWorldTile(cp[0], 1.5, cp[1]); w.m.rotation.y = Math.atan2(cp[0] - w.x + 0.3, cp[1] - w.z - 0.4); return; }
      w.route.shift(); if (!w.route.length) { w.on = false; w.m.visible = false; w.wait = 8 + Math.random() * 14; return; }   // went inside
      w.tx = w.route[0][0]; w.tz = w.route[0][1]; if (w.route.length > 1 && !w.buy) { w.wait = 0.5 + Math.random() * 2.5; w.mx.timeScale = 0; } return;
    }
    w.x += (dx / d) * 0.6 * dt; w.z += (dz / d) * 0.6 * dt;
    const rx = w.x - _desk.x, rz = w.z - _desk.z, rd = Math.hypot(rx, rz), KO = 1.7; if (rd < KO) { w.x = _desk.x + (rx / (rd || 1)) * KO; w.z = _desk.z + (rz / (rd || 1)) * KO; }   // never through the desk
    w.m.position.x = w.x; w.m.position.z = w.z; const want = Math.atan2(dx, dz); w.m.rotation.y += Math.atan2(Math.sin(want - w.m.rotation.y), Math.cos(want - w.m.rotation.y)) * Math.min(1, dt * 4);
    if (kidGround <= 0) { const bb = new THREE.Box3().setFromObject(w.m, true); if (isFinite(bb.min.y)) w.m.position.y -= bb.min.y * 0.9; }
  });
  if (kidGround <= 0) kidGround = 0.4;
}

/* ---------- the story board ---------- */
const BW = 1600, BH = 900, board = document.createElement('canvas'); board.width = BW; board.height = BH;
const boardTex = new THREE.CanvasTexture(board); boardTex.colorSpace = THREE.SRGBColorSpace; boardTex.anisotropy = 4;
const BOARD_W = 1.16, BOARD_H = BOARD_W * BH / BW;
const boardMesh = new THREE.Mesh(new THREE.PlaneGeometry(BOARD_W, BOARD_H), new THREE.MeshBasicMaterial({ map: boardTex, transparent: true, depthWrite: false })); boardMesh.renderOrder = 5; stage.add(boardMesh);
const dot = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 8), new THREE.MeshBasicMaterial({ color: '#c8745a' })); dot.visible = false; stage.add(dot);
function layout() { placeTray(); const set = S ? S.settings : { reach: 0.5, boardDist: 0.95, boardHeight: 0.6, boardScale: 1 }, reach = set.reach; boardMesh.position.set(0, TABLE + set.boardHeight, -set.boardDist); boardMesh.scale.setScalar(set.boardScale); boardSc = set.boardScale; plots.forEach((p) => { const a = THREE.MathUtils.degToRad(-45 + p.i * 12.857); p.g.position.set(Math.sin(a) * reach, TABLE, -Math.cos(a) * reach); p.g.rotation.y = Math.atan2(-p.g.position.x, -p.g.position.z); }); }
let boardSc = 1; const _bp = new THREE.Vector3();
function boardUV(pt) { _bp.copy(pt).sub(boardMesh.position); return { x: (_bp.x / (BOARD_W * boardSc) + 0.5) * BW, y: (0.5 - _bp.y / (BOARD_H * boardSc)) * BH, z: _bp.z }; }
function boardRay(ray) { if (Math.abs(ray.d.z) < 1e-5) return null; const t = (boardMesh.position.z - ray.o.z) / ray.d.z; if (t <= 0 || t > 5) return null; const p = ray.o.clone().addScaledVector(ray.d, t); const uv = boardUV(p); return (uv.x < 0 || uv.x > BW || uv.y < 0 || uv.y > BH) ? null : { uv, p, t }; }

/* ---------- sound ---------- */
let actx = null;
function beep(f, d) { if (S && S.settings.mute) return; try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0.06 * (S ? S.settings.volume : 1), actx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + d + 0.05); o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + d + 0.06); } catch (e) { /* no sound */ } }
const voice = new Audio(); let voiceDone = null;
voice.addEventListener('ended', () => { if (voiceDone) voiceDone(); });
function speak(file, onEnd) { voiceDone = onEnd || null; try { voice.pause(); if (!file || (S && S.settings.mute)) return false; voice.src = 'assets/audio/' + file; voice.volume = S ? S.settings.volume : 1; const p = voice.play(); if (p && p.catch) p.catch(() => {}); return true; } catch (e) { return false; } }
function hush() { voiceDone = null; try { voice.pause(); } catch (e) { /* fine */ } }

/* ---------- garden table ---------- */
const UP = new THREE.Vector3(0, 1, 0), BLOOM_HOME = new THREE.Vector3(0, 0.15, 0);
const bloomTex = {}; [...R.CFG.species, 'buttercup', 'foxglove', 'red_begonia_cluster', 'white_star_flower', 'yarrow', 'zinnia_dahlia'].forEach((s) => { bloomTex[s] = tex(`assets/blooms/${s}.png`); });
const plots = [];
const soilTex = tex('assets/blooms/soil_tile.jpg'); soilTex.wrapS = soilTex.wrapT = THREE.MirroredRepeatWrapping; soilTex.repeat.set(2, 1);   // her soil tile; mirrored so the seam in the picture does not show
const stageTex = { seed: tex('assets/blooms/pseed.png'), sprout: tex('assets/blooms/psprout.png') };   // her glowing seed and sprout art
for (let i = 0; i < 8; i++) {
  const g = new THREE.Group();
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.02, 20), new THREE.MeshLambertMaterial({ color: '#7a5236' })); soil.position.y = 0.01; soil.name = 'soil'; g.add(soil);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.006, 8, 28), new THREE.MeshBasicMaterial({ color: '#58c06a' })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.022; ring.visible = false; g.add(ring);
  const mound = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8), new THREE.MeshLambertMaterial({ color: '#a08068', map: soilTex })); mound.scale.y = 0.6; mound.position.y = 0.024; g.add(mound);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.005, 1, 8), new THREE.MeshLambertMaterial({ color: '#5a9a48' })); g.add(stem);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), new THREE.MeshLambertMaterial({ color: '#6fb45a' })); leaf.scale.set(1.3, 0.35, 0.8); g.add(leaf);
  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), new THREE.MeshLambertMaterial({ color: '#f08cb4' })); bud.scale.y = 1.4; bud.visible = false; g.add(bud);
  const bloom = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.13), new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.08, side: THREE.DoubleSide })); g.add(bloom);
  const spark = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.005, 8, 24), new THREE.MeshBasicMaterial({ color: '#ffd34d' })); spark.rotation.x = Math.PI / 2; g.add(spark);
  const mdl = new THREE.Group(); g.add(mdl);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.08, side: THREE.DoubleSide })); pic.visible = false; g.add(pic);
  const bmdl = new THREE.Group(); bmdl.visible = false; g.add(bmdl);
  stage.add(g); plots.push({ i, g, mdl, pic, bmdl, bkey: '', mkey: '', ring, mound, stem, leaf, bud, bloom, spark, pourT: 0, bloomPos: BLOOM_HOME.clone(), heldBy: null, lastStage: -1, pop: 0 });
}
for (const p of plots) { const soil = p.g.getObjectByName('soil'); if (soil) soil.visible = false; worldModel('stoneplot', (src) => { const m = fitW(src, 0.17); p.g.add(m); }); }
const plantAt = (i) => (S ? R.pouch(S).plots[i].plant : null);
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _m = new THREE.Matrix4();
function drawPlot(p, t, dt) {
  const pl = plantAt(p.i); if (p.pop > 0) p.pop = Math.max(0, p.pop - dt * 2);
  const st = pl ? pl.stage : -1; if (st !== p.lastStage) { if (st > p.lastStage && p.lastStage >= 0) p.pop = 1; if (st === 2) p.bloomPos.copy(BLOOM_HOME); p.lastStage = st; }
  p.mound.visible = !!pl && pl.stage === 0; p.stem.visible = p.leaf.visible = !!pl && pl.stage === 2 && !(FL[R.flowerKey(pl.species, pl.color)] && FL[R.flowerKey(pl.species, pl.color)].scene); p.bloom.visible = !!pl && pl.stage === 2; p.bud.visible = false; if (!pl || pl.stage !== 2) p.mdl.visible = false; p.spark.visible = !!pl && pl.boost;
  p.pic.visible = false; p.bmdl.visible = false;
  if (!pl) return;
  const top = pl.stage === 2 ? p.bloomPos : _v.set(0, 0.04 + 0.12 * (pl.stage === 1 ? 0.55 + 0.45 * pl.progress : 0.2), 0);
  p.stem.position.copy(top).multiplyScalar(0.5); p.stem.scale.set(1, Math.max(0.005, top.length()), 1); p.stem.quaternion.setFromUnitVectors(UP, top.clone().normalize());
  p.leaf.position.copy(top).multiplyScalar(0.55); p.leaf.position.x += 0.014;
  if (pl.stage < 2) {   // her 3D seed, then her 3D sprout, then her 3D bud in the flower's own color, growing up out of the soil
    const bk = pl.stage === 0 ? 'seed_magic' : pl.progress < 0.5 ? 'sprout_seedling' : 'bud_' + R.budColor(pl.species, pl.color), hgt = pl.stage === 0 ? 0.05 : pl.progress < 0.5 ? 0.1 : 0.14;
    if (p.bkey !== bk) { p.bkey = bk; p.bmdl.clear(); flowerModel(bk, hgt, (m) => { if (p.bkey === bk) p.bmdl.add(m); }); }
    p.bmdl.scale.setScalar(pl.stage === 0 ? 1 : pl.progress < 0.5 ? 0.7 + 0.6 * pl.progress : 0.45 + 0.55 * Math.min(1, (pl.progress - 0.5) * 2)); p.bmdl.position.y = 0.02; p.bmdl.visible = true;
    if (FL[bk] && FL[bk].failed) { const seed = pl.stage === 0, sz = seed ? 0.06 : 0.1; p.pic.material.map = seed ? stageTex.seed : stageTex.sprout; p.pic.scale.set(sz, sz, 1); p.pic.position.y = 0.02 + sz / 2; p.pic.visible = true; }   // her flat art only if a model fails to load
  }
  if (pl.stage === 2) { const k3 = R.flowerKey(pl.species, pl.color); if (p.mkey !== k3) { p.mkey = k3; p.mdl.clear(); flowerModel(k3, 0.15, (m) => { if (p.mkey === k3) p.mdl.add(m); }); } p.mdl.visible = true; p.mdl.position.copy(p.bloomPos).sub(_b.set(0, 0.13, 0)); p.bloom.visible = !(FL[k3] && FL[k3].scene); if (p.bloom.material.map !== bloomTex[pl.species]) { p.bloom.material.map = bloomTex[pl.species]; p.bloom.material.needsUpdate = true; } p.bloom.position.copy(p.bloomPos); p.bloom.scale.setScalar(1 + p.pop * 0.35); }
  p.spark.position.y = 0.05 + Math.sin(t * 4 + p.i) * 0.012; p.spark.rotation.z = t * 2;
}
function labelTexture(lines, { w = 256, h = 128, bg = '#fff8ea', fg = '#5a3b22', size = 44 } = {}) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = `bold ${size}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.1)); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const tools = [];
const TRAY = { z: -0.14, y: 0.025, offs: { seeds: -0.17, shaker: 0, can: 0.17 } };   // the shelf runs front-to-back; the tools sit along it
const trayX = () => (S && S.settings.toolX != null ? S.settings.toolX : 0.5);
function makeTool(kind, home, yaw, build) { const g = new THREE.Group(); build(g); g.position.copy(home); g.rotation.y = yaw; stage.add(g); const t = { kind, g, home: home.clone(), homeQ: g.quaternion.clone(), heldBy: null, flips: [], lastDir: null, cool: 0, prev: new THREE.Vector3() }; tools.push(t); return t; }
const PK = R.SPECIES_BY_TIER;
const packetMat = new THREE.MeshLambertMaterial({ transparent: true, alphaTest: 0.1, side: THREE.DoubleSide }); let packetTier = '';
function packetFor(tier) { if (tier === packetTier) return; packetTier = tier; const L = PK[tier] || PK.common, f = R.TIER_OF[tier] ? tier : L[Math.floor(Math.random() * L.length)]; packetMat.map = tex(`assets/seeds/${f}.png`); packetMat.needsUpdate = true; }
makeTool('seeds', new THREE.Vector3(0, TABLE + 0.05, -0.2), 0, (g) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.096), packetMat); m.position.y = 0.01; g.add(m); const m2 = m.clone(); m2.position.z = -0.002; g.add(m2); packetFor('common'); });
const canTool = makeTool('can', new THREE.Vector3(0, TABLE + 0.045, -0.2), Math.PI / 2, (g) => {
  const mat = new THREE.MeshLambertMaterial({ color: '#8fb8d8' }); g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.046, 0.085, 18), mat));
  const a = new THREE.Vector3(0.035, -0.01, 0), b = new THREE.Vector3(0.115, 0.05, 0), d = b.clone().sub(a);
  const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, d.length(), 10), mat); sp.position.copy(a).addScaledVector(d, 0.5); sp.quaternion.setFromUnitVectors(UP, d.clone().normalize()); g.add(sp);
  const rose = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), new THREE.MeshLambertMaterial({ color: '#6d9cc0' })); rose.position.copy(b); g.add(rose);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.006, 8, 16, Math.PI), mat); h.position.set(-0.045, 0, 0); h.rotation.z = Math.PI / 2; g.add(h);
  const base = new THREE.Object3D(); base.position.copy(a); g.add(base); const tip = new THREE.Object3D(); tip.name = 'water_origin'; tip.position.copy(b); g.add(tip); g.userData = { base, tip };
});
makeTool('shaker', new THREE.Vector3(0, TABLE + 0.05, -0.17), 0, (g) => { g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.09, 16), new THREE.MeshLambertMaterial({ map: labelTexture(['SUPER', 'GROW'], { bg: '#ffe38a', size: 40 }) }))); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.02, 16), new THREE.MeshLambertMaterial({ color: '#e0a92e' })); cap.position.y = 0.055; g.add(cap); });
// a small tray the player can slide to the left or right side of the table; the three tools live on it
const tray = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.56), new THREE.MeshLambertMaterial({ color: '#c99a5b' })); stage.add(tray);
const trayEdge = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.012, 0.59), new THREE.MeshLambertMaterial({ color: '#a87b43' })); stage.add(trayEdge);
function placeTray() { const x = trayX(); tray.position.set(x, TABLE + 0.015, TRAY.z); trayEdge.position.set(x, TABLE + 0.006, TRAY.z); for (const t of tools) { t.home.set(x, TABLE + TRAY.y + (t.kind === 'can' ? 0.07 : 0.055), TRAY.z + TRAY.offs[t.kind]); if (!t.heldBy) { t.g.position.copy(t.home); } } }
function moveTray(dir) { if (!S) return; S.settings.toolX = dir; placeTray(); save(); }
tools.forEach((t) => { t.gp = new THREE.Vector3(); });
tools.find((t) => t.kind === 'can').gp.set(-0.075, 0.015, 0);   // the can is lifted by its handle
function skin(kind, file, width, yaw, lift) {
  const t = tools.find((x) => x.kind === kind); gltfLoader.load(`assets/models/${file}.glb`, (g) => { const m = g.scene; m.scale.setScalar(width / 0.95); m.rotation.y = yaw || 0; m.position.y = lift || 0; t.g.children.forEach((c) => { if (c.isMesh) c.visible = false; }); t.g.add(m); }, undefined, () => { /* keep the plain version */ });
}
skin('can', 'can', 0.2, Math.PI, 0.074); skin('shaker', 'supergrow', 0.11, 0, 0);
function sendHome(t) { t.heldBy = null; t.g.position.copy(t.home); t.g.quaternion.copy(t.homeQ); t.flips.length = 0; t.lastDir = null; }
const bits = [], bitGeo = new THREE.SphereGeometry(0.006, 6, 5);
function spawn(pos, vel, color, life) { let b = bits.find((x) => x.life <= 0); if (!b) { if (bits.length > 200) return; b = { m: new THREE.Mesh(bitGeo, new THREE.MeshBasicMaterial()), v: new THREE.Vector3(), life: 0 }; stage.add(b.m); bits.push(b); } b.m.material.color.set(color); b.m.position.copy(pos); b.v.copy(vel); b.life = life; b.m.visible = true; }
function burst(p, color, n) { const o = p.g.position.clone(); o.y += 0.12; for (let i = 0; i < n; i++) spawn(o, new THREE.Vector3((Math.random() - 0.5) * 0.9, Math.random() * 0.9 + 0.2, (Math.random() - 0.5) * 0.9), color, 0.7); }
const tiles = [];
function letterDecal(ch) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#4a2a14'; x.font = 'bold 92px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 64, 70); x.lineWidth = 3; x.strokeStyle = '#f7e2a4'; x.strokeText(ch, 64, 70); x.fillText(ch, 64, 70); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const tileMat = new THREE.MeshLambertMaterial({ color: '#fff1c4', emissive: '#5a4a1e' });
function makeTile(ch, size) {   // your carved letter tile with the letter laid on its face
  const g = new THREE.Group(), face = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.56, size * 0.56), new THREE.MeshBasicMaterial({ map: letterDecal(ch), transparent: true, depthWrite: false })); face.position.z = size * 0.07; g.add(face);
  worldModel('tile', (src) => { src.traverse((o) => { if (o.isMesh) o.material = tileMat; }); const m = new THREE.Group(); src.scale.setScalar(size / 0.06); m.add(src); g.add(m); });
  return g;
}
function popTiles(plot, letters) { letters.forEach((ch, k) => { const m = makeTile(ch, 0.12); m.position.copy(plot.g.position); m.position.y += 0.2 + k * 0.14; m.position.x += (k - (letters.length - 1) / 2) * 0.14; stage.add(m); tiles.push({ m, life: 2.6, spin: true }); }); for (let i = 0; i < 40; i++) spawn(plot.g.position.clone().setY(TABLE + 0.25), new THREE.Vector3((Math.random() - 0.5) * 0.9, Math.random() * 0.9 + 0.3, (Math.random() - 0.5) * 0.9), ['#ff9ec4', '#ffd34d', '#b99cf0', '#8fd18a'][i % 4], 1.2); }
function popWorldTile(x, y, z) { const m = makeTile('ABCDEGILMNORSTW'[Math.floor(Math.random() * 15)], 0.4); m.position.set(x, y, z); world.add(m); tiles.push({ m, life: 3.2, world: true }); }
function stepTiles(dt) { for (let i = tiles.length - 1; i >= 0; i--) { const t = tiles[i]; t.life -= dt; t.m.position.y += dt * (t.world ? 0.15 : 0.04); t.m.rotation.y = Math.atan2(camera.position.x - t.m.position.x, camera.position.z - t.m.position.z) + (t.spin ? Math.sin(t.life * 3) * 0.35 : 0); const k = 1 + Math.max(0, t.life - 2.2) * 1.2; t.m.scale.setScalar(k * Math.min(1, t.life / 0.5)); if (t.life <= 0) { t.m.parent.remove(t.m); tiles.splice(i, 1); } } }
function stepBits(dt) { for (const b of bits) { if (b.life <= 0) continue; b.life -= dt; b.v.y -= 2.6 * dt; b.m.position.addScaledVector(b.v, dt); if (b.life <= 0 || b.m.position.y < TABLE) { b.life = 0; b.m.visible = false; } } }



/* ---------- moving around: the town slides around you, so your table, tools and panel always stay in reach ---------- */
const TP = { home: [0, 0], yard: [3.6, 3.4], carts: [2.2, 0.7], fountain: [0, -4.1], townhall: [0, -8.9], cottages: [4.8, -1.0], commgarden: [-2.7, -0.5] }, TP_LOOK = { home: [0, -2], yard: [3.6, 0], carts: [1.9, -1.6], fountain: [0, -7], townhall: [0, -12.5], cottages: [8.3, -2], commgarden: [-4.2, -2.8] };
let tpName = 'home'; const _tp = new THREE.Vector3();
function placeTown(x, z, lx, lz) { const th = Math.atan2(lx - x, -(lz - z)); const c = Math.cos(th), sn = Math.sin(th); town.rotation.y = th; town.position.set(-(x * c + z * sn), 0, -(-x * sn + z * c)); }
function teleportTo(k, quiet) { const a = TP[k]; if (!a) return; tpName = k; placeTown(a[0], a[1], TP_LOOK[k][0], TP_LOOK[k][1]); if (!quiet) beep(560, 0.06); }
function teleportPoint(x, z) { const th = town.rotation.y, c = Math.cos(th), sn = Math.sin(th); /* current town coords of the stage-local point (x,z) */ const tx = (x - town.position.x) * c - (z - town.position.z) * sn, tz = (x - town.position.x) * sn + (z - town.position.z) * c; town.position.set(-(tx * c + tz * sn), 0, -(-tx * sn + tz * c)); beep(560, 0.06); }
const tpRing = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.3, 32), new THREE.MeshBasicMaterial({ color: '#58c06a', transparent: true, opacity: 0.85, side: THREE.DoubleSide })); tpRing.rotation.x = -Math.PI / 2; tpRing.visible = false; stage.add(tpRing);
// a fence around the yard garden spot, so your own garden sits inside the town like the community garden does
worldModel('fence', (src) => { const f = (px, pz, ry) => { const m = fitW(src.clone(true), 2.2); m.position.set(TP.yard[0] + px, 0, TP.yard[1] + pz); m.rotation.y = ry; world.add(m); }; for (let i = -1; i <= 1; i++) f(i * 2.2, 1.9, 0); for (const sx of [-1, 1]) f(sx * 3.2, 0.4, Math.PI / 2); });
/* ---------- hide the big panel to see the whole town; a round MENU button on the table brings it back ---------- */
const menuBtn = new THREE.Mesh(new THREE.CircleGeometry(0.055, 32), new THREE.MeshBasicMaterial({ map: labelTexture(['MENU'], { w: 128, h: 128, bg: '#fbeed2', fg: '#7a3f6b', size: 30 }) })); menuBtn.rotation.x = -Math.PI / 2; menuBtn.position.set(-0.78, TABLE + 0.012, 0.08); stage.add(menuBtn);
let panelOn = true;
function setPanel(on) { panelOn = on; boardMesh.visible = on; if (!on) dot.visible = false; beep(on ? 640 : 480, 0.05); }
function togglePanel() { setPanel(!panelOn); }
/* ---------- garden actions: one place for hands, pointing and the board buttons ---------- */
let txn = Math.floor(Math.random() * 1e9);
const G = {
  cPlant(i) { const t = G.seedTier(); const r = R.commPlant(S, i, t); UI.note(r); if (r.ok) beep(520, 0.08); return r; },
  cWater(i) { const r = R.commWater(S, i); UI.note(r); if (r.ok) beep(660, 0.08); return r; },
  cPick(i) { const r = R.commPick(S, i); UI.note(r); if (r.ok) { beep(740, 0.07); setTimeout(() => beep(990, 0.1), 80); save(); } return r; },
  seedTier() { const g = R.pouch(S), k = R.ownedSeedKeys(g); return k.includes(UI.state.tier) ? UI.state.tier : (k[0] || UI.state.tier); },
  plant(i) { const r = R.plant(S, i, G.seedTier()); UI.note(r); if (r.ok) { beep(520, 0.08); UI.emit('planted'); } else if (r.code === 'noseed') UI.cue('M13'); return r; },
  water(i) { const r = R.water(S, i); UI.note(r); if (r.ok) { beep(660, 0.08); UI.emit('watered'); } return r; },
  boost(i) { const r = R.superGrow(S, i); UI.note(r); if (r.ok) { beep(880, 0.1); burst(plots[i], '#ffd34d', 10); UI.emit('boosted'); } return r; },
  pick(i, id) { const r = R.harvest(S, i, id == null ? ++txn : id); if (r.code === 'dup') return r; UI.note(r); if (r.ok) { burst(plots[i], '#ff9ec4', 16); popTiles(plots[i], r.letters || []); beep(740, 0.07); setTimeout(() => beep(990, 0.1), 80); plots[i].bloomPos.copy(BLOOM_HOME); plots[i].heldBy = null; if (!S.usePractice) UI.cue(r.freed ? 'M16' : null); UI.emit('harvested'); } else if (r.code === 'growing' && !S.usePractice) UI.cue('M14'); return r; },
};

/* ---------- pointers (hands, controllers, pretend hands for checks) ---------- */
function makePointer(name) { return { name, valid: false, down: false, was: false, pos: new THREE.Vector3(), quat: new THREE.Quaternion(), ray: null, tip: null, held: null, lost: 0, frames: 0, pinching: false, gap: 0, tipZ: 9 }; }
const pointers = [makePointer('xr0'), makePointer('xr1'), makePointer('sim0'), makePointer('sim1')];
const JOINTS = ['wrist', 'thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip', 'index-finger-metacarpal', 'index-finger-phalanx-proximal', 'index-finger-phalanx-intermediate', 'index-finger-phalanx-distal', 'index-finger-tip', 'middle-finger-metacarpal', 'middle-finger-phalanx-proximal', 'middle-finger-phalanx-intermediate', 'middle-finger-phalanx-distal', 'middle-finger-tip', 'ring-finger-metacarpal', 'ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate', 'ring-finger-phalanx-distal', 'ring-finger-tip', 'pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate', 'pinky-finger-phalanx-distal', 'pinky-finger-tip'];
const xr = [0, 1].map((i) => {
  const ctrl = renderer.xr.getController(i), grip = renderer.xr.getControllerGrip(i), hand = renderer.xr.getHand(i); scene.add(ctrl, grip, hand);
  const o = { ctrl, grip, hand, source: null, dots: [] };
  ctrl.addEventListener('connected', (e) => { o.source = e.data; }); ctrl.addEventListener('disconnected', () => { o.source = null; });
  o.line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5 })); o.line.scale.z = 0.9; ctrl.add(o.line);
  o.gm = new THREE.MeshLambertMaterial({ color: '#f1d9b5' }); o.tm = new THREE.MeshLambertMaterial({ color: '#7fae58' });
  for (let k = 0; k < 25; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 8, 6), (k === 4 || k === 9) ? o.tm : o.gm); d.visible = false; scene.add(d); o.dots.push(d); }
  o.knob = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), o.tm); o.knob.visible = false; grip.add(o.knob); return o;
});
/* ---------- Tiva's garden gloves: rigged glove models ride the tracked hand joints (bones are named like the WebXR joints) ---------- */
xr.forEach((o) => {
  o.gl = { left: null, right: null };
  ['left', 'right'].forEach((side) => gltfLoader.load(`assets/models/gloves/glove_${side}.glb`, (g) => {
    const root = g.scene; root.visible = false; root.traverse((c) => { if (c.isMesh || c.isSkinnedMesh) c.frustumCulled = false; });
    const bones = JOINTS.map((n) => root.getObjectByName(n)); o.hand.add(root); o.gl[side] = { root, bones };
  }, undefined, () => { /* no glove file: the plain dots stay */ }));
});
function updateGlove(o, src, J) {
  const set = o.gl && o.gl[src.handedness]; if (!set) return false;
  ['left', 'right'].forEach((k) => { if (o.gl[k]) o.gl[k].root.visible = false; });
  let any = false;
  set.bones.forEach((b, k) => { const j = J[JOINTS[k]]; if (b && j && j.visible) { b.position.copy(j.position); b.quaternion.copy(j.quaternion); any = true; } });
  set.root.visible = any; return any;
}
const stageQinv = new THREE.Quaternion(), _pw = new THREE.Vector3(), _pm = new THREE.Vector3(), _pr = new THREE.Vector3();
function readXR() {
  stageQinv.copy(stage.quaternion).invert();
  for (let i = 0; i < 2; i++) {
    const o = xr[i], P = pointers[i]; P.valid = false; P.ray = null; P.tip = null;
    const src = renderer.xr.isPresenting ? o.source : null, J = o.hand.joints || {}, isHand = !!(src && src.hand);
    o.line.visible = !!src && !P.held; o.knob.visible = !!src && !isHand;
    const gloved = !!(isHand && updateGlove(o, src, J)); if (!isHand && o.gl) ['left', 'right'].forEach((k) => { if (o.gl[k]) o.gl[k].root.visible = false; });
    o.dots.forEach((d, k) => { const j = isHand && !gloved && J[JOINTS[k]]; d.visible = !!(j && j.visible); if (d.visible) j.getWorldPosition(d.position); });
    if (!src) { P.down = false; continue; }
    if (isHand) {
      const th = J['thumb-tip'], ix = J['index-finger-tip'], wr = J['wrist']; if (!th || !ix || !wr || !th.visible || !ix.visible) continue;
      th.getWorldPosition(_a); ix.getWorldPosition(_b); P.gap = _a.distanceTo(_b);
      { const md = J['middle-finger-tip'], rg = J['ring-finger-tip']; if (md && rg && md.visible) { wr.getWorldPosition(_pw); md.getWorldPosition(_pm); rg.getWorldPosition(_pr); const di = _b.distanceTo(_pw); P.point = di > _pm.distanceTo(_pw) * 1.12 && di > _pr.distanceTo(_pw) * 1.12; } else P.point = false; }
      const pf = S ? S.settings.pinch : 1, want = P.pinching ? P.gap < HAND.pinchOut * pf : P.gap < HAND.pinchIn * pf;
      if (want !== P.pinching) { P.frames++; if (P.frames >= 2) { P.pinching = want; P.frames = 0; } } else P.frames = 0;   // 3 steady frames to start a pinch (fewer accidental pinches), 2 to let go
      P.down = P.pinching; P.pos.lerpVectors(_a, _b, 0.5); wr.getWorldQuaternion(P.quat); P.tip = stage.worldToLocal(_b.clone());
    } else { const gp = src.gamepad; P.down = !!(gp && gp.buttons && ((gp.buttons[0] && gp.buttons[0].pressed) || (gp.buttons[1] && gp.buttons[1].pressed))); o.grip.getWorldPosition(P.pos); o.grip.getWorldQuaternion(P.quat); }
    stage.worldToLocal(P.pos); P.quat.premultiply(stageQinv); P.valid = true;
    o.ctrl.getWorldPosition(_a); _m.extractRotation(o.ctrl.matrixWorld); _b.set(0, 0, -1).applyMatrix4(_m);
    P.ray = { o: stage.worldToLocal(_a.clone()), d: _b.clone().applyQuaternion(stageQinv).normalize() };
  }
}
function plotUnder(pos, r) { let best = null, bd = r; for (const p of plots) { const d = Math.hypot(pos.x - p.g.position.x, pos.z - p.g.position.z); if (d < bd && pos.y > TABLE - 0.02 && pos.y < TABLE + 0.45) { bd = d; best = p; } } return best; }
function bloomAt(p, out) { return out.copy(p.bloomPos).applyQuaternion(p.g.quaternion).add(p.g.position); }
function nearestGrab(pos) {
  if (menuBtn.position.distanceTo(pos) < 0.085) return { menu: true };
  if (UI.propsOn()) for (const pr of props) if (pr.kind && pr.holder.parent && pr.holder.parent.visible !== false && stage.worldToLocal(pr.holder.getWorldPosition(_c3)).add(_c3o.set(0, pr.cy, 0)).distanceTo(pos) < (pr.kind === 'carts' ? 0.4 : pr.radius + 0.05)) return { prop: pr.kind };
  let best = null, bd = HAND.grabReach; if (!UI.gardenOpen()) return null;
  for (const t of tools) { if (t.heldBy) continue; const d = _gp.copy(t.gp).applyQuaternion(t.g.quaternion).add(t.g.position).distanceTo(pos); if (d < bd) { bd = d; best = { tool: t }; } }
  for (const p of plots) { const pl = plantAt(p.i); if (!pl || pl.stage < 2 || p.heldBy) continue; const d = bloomAt(p, _a).distanceTo(pos); if (d < bd) { bd = d; best = { plot: p }; } }
  if (!best && S && Math.abs(pos.x - trayX()) < 0.15 && Math.abs(pos.z - TRAY.z) < 0.3 && pos.y > TABLE - 0.02 && pos.y < TABLE + 0.14) return { tray: true };
  return best;
}
function rayPick(ray) {
  const mt = _a.copy(menuBtn.position).sub(ray.o), mtt = mt.dot(ray.d); if (mtt > 0 && mtt < 4 && mt.lengthSq() - mtt * mtt < 0.065 * 0.065) return { menu: true };
  const hit = panelOn ? boardRay(ray) : null; let best = hit ? { board: hit.uv, t: hit.t } : null, bt = hit ? hit.t : 4;
  if (UI.propsOn()) for (const pr of props) if (pr.kind && pr.holder.parent && pr.holder.parent.visible !== false) { const c = stage.worldToLocal(pr.holder.getWorldPosition(_c3)).add(_c3o.set(0, pr.cy || 0, 0)), t = _a.copy(c).sub(ray.o).dot(ray.d); if (t > 0 && t < bt) { const d2 = _b.copy(c).sub(ray.o).lengthSq() - t * t; if (d2 < pr.radius * pr.radius) { bt = t; best = { prop: pr.kind }; } } }
  if (!UI.gardenOpen()) return best;
  const test = (c, r, what) => { _a.copy(c).sub(ray.o); const t = _a.dot(ray.d); if (t <= 0 || t > bt) return; const d2 = _a.lengthSq() - t * t; if (d2 < r * r) { bt = t; best = what; } };
  for (const t of tools) if (!t.heldBy) test(t.g.position, 0.06, { tool: t });
  for (const p of plots) test(_v.copy(p.g.position).setY(TABLE + 0.06).clone(), 0.07, { plot: p });
  return best;
}
function selectThing(hit) {
  if (!hit) return; if (hit.menu) return togglePanel(); if (hit.board) return UI.press(hit.board.x, hit.board.y);
  if (hit.prop && /^pick:|^vase$/.test(hit.prop)) { const a = UI.state.arr = UI.state.arr || {}, tot = Object.values(a).reduce((x, y) => x + y, 0); if (hit.prop === 'vase') { const ks = Object.keys(a).filter((k) => a[k] > 0); if (ks.length) a[ks[ks.length - 1]]--; beep(380, 0.05); } else if (tot < 9) { a[hit.prop.slice(5)] = (a[hit.prop.slice(5)] || 0) + 1; beep(660, 0.06); } else UI.say('The vase is full. Nine flowers is a bouquet.'); arrSig = ''; refreshArr(); return; }
  if (hit.prop) { beep(520, 0.05); setPanel(true); return UI.go(hit.prop === 'book' ? 'book' : hit.prop === 'carts' ? 'carts' : 'notice'); }
  if (hit.tool) { UI.state.tool = UI.state.tool === hit.tool.kind ? null : hit.tool.kind; UI.say(UI.state.tool ? `${{ seeds: 'Seeds', can: 'Watering can', shaker: 'Super Grow' }[UI.state.tool]} selected. Now choose a plot.` : 'Nothing selected.'); beep(500, 0.05); return; }
  const i = hit.plot.i, pl = plantAt(i);
  if (UI.state.tool === 'seeds') G.plant(i); else if (UI.state.tool === 'can') G.water(i); else if (UI.state.tool === 'shaker') G.boost(i);
  else if (pl && pl.stage === 2) G.pick(i); else UI.say(pl ? 'Still growing. Choose the can to water it.' : 'Empty plot. Choose the seeds first.');
}
const relP = new THREE.Vector3(), _gp = new THREE.Vector3();
function grab(P, hit) {
  if (hit.menu) { togglePanel(); return; }
  if (hit.prop) { selectThing(hit); return; }
  if (hit.tray) { P.held = { tray: true, dx: trayX() - P.pos.x }; UI.say('Slide the tool tray where you like, then let go.'); return; }
  if (hit.tool) { const t = hit.tool; t.heldBy = P; P.held = { tool: t, relQ: P.quat.clone().invert().multiply(t.g.quaternion), relP: _gp.copy(t.gp).applyQuaternion(t.g.quaternion).negate().applyQuaternion(P.quat.clone().invert()).clone() }; t.prev.copy(t.g.position); t.flips.length = 0; t.lastDir = null; UI.state.tool = null; UI.say({ seeds: 'Holding seeds. Let go over an empty plot.', can: 'Holding the can. Tilt the spout down over a plant.', shaker: 'Holding Super Grow. Shake it over a plant.' }[t.kind]); }
  else { hit.plot.heldBy = P; P.held = { plot: hit.plot, txn: ++txn }; UI.say('Got it. Pull!'); }
  beep(600, 0.04);
}
function letGo(P, lost) {
  const h = P.held; if (!h) return; P.held = null;
  if (h.tray) { save(); return; }
  if (h.tool) { const t = h.tool; if (!lost && t.kind === 'seeds') { const p = plotUnder(t.g.position, 0.085); if (p) G.plant(p.i); else UI.say('Seeds go back to the tray. Let go right over a plot.'); } sendHome(t); }
  else { h.plot.heldBy = null; if (!lost) UI.say('Let go too soon. The flower is still there. Pull farther.'); }
  if (lost) UI.say('Lost sight of your hand. Nothing changed. Try again.');
  plots.forEach((p) => { p.ring.visible = false; });
}
function useTool(P, dt, tnow) {
  const t = P.held.tool, g = t.g; g.quaternion.copy(P.quat).multiply(P.held.relQ); g.position.copy(relP.copy(P.held.relP).applyQuaternion(P.quat)).add(P.pos);
  if (t.kind === 'seeds') { const p = plotUnder(g.position, 0.085); plots.forEach((x) => { x.ring.visible = x === p; if (x === p) x.ring.material.color.set(plantAt(x.i) ? '#e0584f' : '#58c06a'); }); }
  else if (t.kind === 'can') {
    g.updateMatrixWorld(true); const base = stage.worldToLocal(g.userData.base.getWorldPosition(new THREE.Vector3())), tip = stage.worldToLocal(g.userData.tip.getWorldPosition(new THREE.Vector3()));
    const dir = tip.clone().sub(base).normalize(); t.tilt = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(-dir.y, -1, 1)));
    const pouring = t.tilt > HAND.pourTilt, p = pouring ? plotUnder(tip, 0.09) : null;
    plots.forEach((x) => { x.ring.visible = x === p; if (x === p) x.ring.material.color.set('#4aa3e0'); if (x !== p) x.pourT = 0; });
    if (pouring) { if (Math.random() < 0.7) spawn(tip, new THREE.Vector3(dir.x * 0.25, -0.2, dir.z * 0.25), '#4aa3e0', 0.8); if (p) { p.pourT += dt; if (p.pourT >= HAND.pourSecs && !p.poured) { p.poured = true; G.water(p.i); } } else if (!t.missSaid) { t.missSaid = true; UI.say('Water is pouring, but not onto a plot. Move the spout over a plant.'); } }
    else { t.missSaid = false; plots.forEach((x) => { x.poured = false; }); }
  } else {
    const vel = _a.copy(g.position).sub(t.prev).divideScalar(Math.max(dt, 1e-3));
    if (vel.length() > HAND.shakeSpeed) { if (t.lastDir && vel.dot(t.lastDir) < 0) t.flips.push(tnow); t.lastDir = (t.lastDir || new THREE.Vector3()).copy(vel).normalize(); }
    while (t.flips.length && tnow - t.flips[0] > HAND.shakeWindow) t.flips.shift();
    const p = plotUnder(g.position, 0.1); plots.forEach((x) => { x.ring.visible = x === p; if (x === p) x.ring.material.color.set('#ffc93c'); });
    if (t.flips.length >= HAND.shakeFlips && tnow > t.cool) { t.flips.length = 0; t.cool = tnow + 1.0; if (p) G.boost(p.i); else UI.say('Shaking! Hold it right over a plant.'); }
  }
  t.prev.copy(g.position);
}
function pullBloom(P) {
  const p = P.held.plot, pl = plantAt(p.i); if (!pl || pl.stage < 2) { P.held = null; p.heldBy = null; return; }
  _a.copy(P.pos).sub(p.g.position).applyQuaternion(_q.copy(p.g.quaternion).invert()); p.bloomPos.copy(_a); if (p.bloomPos.y < 0.04) p.bloomPos.y = 0.04;
  if (p.bloomPos.distanceTo(BLOOM_HOME) > HAND.pullDist) { const id = P.held.txn; P.held = null; G.pick(p.i, id); }
}
function stepPointers(dt, tnow) {
  let cursor = null;
  for (const P of pointers) {
    if (!P.valid) { if (P.held) { P.lost += dt; if (P.lost > HAND.lostGrace) { letGo(P, true); P.down = false; P.was = false; P.pinching = false; } } continue; }
    P.lost = 0;
    if (P.tip && panelOn) { const uv = boardUV(P.tip); const inside = uv.x >= 0 && uv.x <= BW && uv.y >= 0 && uv.y <= BH; const vz = P.tipZ < 9 && dt > 0 ? ((P.tipZ - uv.z) / dt) : 0;
      // a fingertip poke needs: one finger pointing (not a flat hand), a deliberate push toward the board, and no pinch. Hands drifting past the board do nothing.
      if (inside && uv.z < 0.012 && P.tipZ >= 0.012 && uv.z > -0.06 && vz > HAND.pokeSpeed && P.point && (!S || S.settings.poke) && !P.pinching && !P.held) UI.press(uv.x, uv.y); P.tipZ = inside ? uv.z : 9; }   // fingertip poke
    if (P.ray && !P.held && panelOn) { const h = boardRay(P.ray); if (h) cursor = h.p; }
    if (P.down && !P.was && !P.held) { const hit = nearestGrab(P.pos); if (hit) grab(P, hit); else if (P.ray) { const rp = rayPick(P.ray); if (rp && rp.board) P.pend = { uv: rp.board, t: performance.now() }; else if (rp) selectThing(rp); else if (P.ray.d.y < -0.06) { const tt = -P.ray.o.y / P.ray.d.y, gx = P.ray.o.x + P.ray.d.x * tt, gz = P.ray.o.z + P.ray.d.z * tt; if (Math.hypot(gx, gz) > 1.6 && tt < 16) P.go = { x: gx, z: gz, t: performance.now() }; } } }
    if (P.go && P.ray && P.down) { const tt = -P.ray.o.y / P.ray.d.y; if (P.ray.d.y < -0.06 && tt > 0 && tt < 16) { P.go.x = P.ray.o.x + P.ray.d.x * tt; P.go.z = P.ray.o.z + P.ray.d.z * tt; tpRing.position.set(P.go.x, 0.02, P.go.z); tpRing.visible = true; } }
    if (!P.down && P.was && P.go) { const gg = P.go; P.go = null; tpRing.visible = false; if (performance.now() - gg.t > 250 && performance.now() - gg.t < 8000) teleportPoint(gg.x, gg.z); }
    if (!P.down && P.was && P.pend) { const pd = P.pend; P.pend = null; const h = P.ray && boardRay(P.ray); if (performance.now() - pd.t < 1200 && h && Math.hypot(h.uv.x - pd.uv.x, h.uv.y - pd.uv.y) < 110) UI.press(pd.uv.x, pd.uv.y); }   // a board button fires when you let go of the pinch, so you can aim first
    if (P.held && P.held.tool) useTool(P, dt, tnow); else if (P.held && P.held.tray) { if (S) { S.settings.toolX = Math.max(-0.9, Math.min(0.95, P.pos.x + P.held.dx)); placeTray(); } } else if (P.held) pullBloom(P);
    if (!P.down && P.was && P.held) letGo(P, false);
    P.was = P.down;
  }
  dot.visible = !!cursor; if (cursor) { dot.position.copy(cursor).setZ(cursor.z + 0.004); const dn = pointers.some((q) => q.down); dot.material.color.set(dn ? '#4fbf6a' : '#c8745a'); dot.scale.setScalar(dn ? 1.7 : 1.3); }
  for (const p of plots) if (!p.heldBy && p.bloomPos.distanceTo(BLOOM_HOME) > 0.001) p.bloomPos.lerp(BLOOM_HOME, Math.min(1, dt * 12));
  for (const t of tools) { t.g.scale.setScalar(UI.state.tool === t.kind ? 1.25 : 1); t.g.visible = UI.gardenOpen(); } tray.visible = trayEdge.visible = UI.gardenOpen();
}
const caster = new THREE.Raycaster(), ndc = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (renderer.xr.isPresenting) return; const r = renderer.domElement.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  caster.setFromCamera(ndc, camera); stageQinv.copy(stage.quaternion).invert(); selectThing(rayPick({ o: stage.worldToLocal(caster.ray.origin.clone()), d: caster.ray.direction.clone().applyQuaternion(stageQinv) }));
});
addEventListener('keydown', (e) => { if (UI.key(e.key)) e.preventDefault(); });

/* ---------- VR session ---------- */
let recenterAt = 0, needsRecenter = false; const head = new THREE.Vector3(), hq = new THREE.Quaternion(), he = new THREE.Euler();
function recenter() { const cam = renderer.xr.getCamera(); cam.getWorldPosition(head); if (head.lengthSq() === 0) return false; cam.getWorldQuaternion(hq); he.setFromQuaternion(hq, 'YXZ'); stage.rotation.set(0, he.y, 0); stage.position.set(head.x, head.y - (S ? S.settings.tableDrop : 0.45) - TABLE, head.z); stage.updateMatrixWorld(true); return true; }
function startRecenter() { recenterAt = performance.now() + 3000; UI.say('Recentering in 3 seconds. Sit comfortably and look straight ahead.'); }
const vrBtn = document.getElementById('vr'), noteEl = document.getElementById('note');
function exitVR() { const s = renderer.xr.getSession(); if (s) s.end(); else UI.say('You are not in VR right now.'); }
let vrOK = false;
const vrReady = (async () => {
  try { vrOK = !!navigator.xr && await navigator.xr.isSessionSupported('immersive-vr'); } catch (e) { /* no VR */ }
  if (!vrOK) { vrBtn.textContent = 'VR not available here'; noteEl.textContent = 'Open this page in the Quest browser (https) to play with your hands. On a computer or phone you can click or tap everything.'; return false; }
  vrBtn.disabled = false; vrBtn.textContent = 'Enter VR'; return true;
})();
async function enterVR() {
  if (!vrOK) return; if (renderer.xr.isPresenting) return exitVR(); beep(440, 0.01);
  try { const s = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'hand-tracking'] }); renderer.xr.setReferenceSpaceType('local-floor'); await renderer.xr.setSession(s);
    vrBtn.textContent = 'Exit VR'; setTimeout(() => { needsRecenter = true; }, 600); const ref = renderer.xr.getReferenceSpace(); if (ref && ref.addEventListener) ref.addEventListener('reset', () => { needsRecenter = true; });
    s.addEventListener('end', () => { vrBtn.textContent = 'Enter VR'; stage.position.set(0, 0, 0); stage.rotation.set(0, 0, 0); pointers.forEach((P) => { if (P.held) letGo(P, true); }); saveNow(); });
  } catch (e) { noteEl.textContent = 'Could not start VR: ' + e.message; }
}
vrBtn.onclick = enterVR;
const barEl = document.getElementById('bar');
runIntro({ vrSupported: vrReady, onEnter: () => barEl.classList.remove('hide'), onEnterVR: () => { barEl.classList.remove('hide'); enterVR(); } });

/* ---------- full-board video (the end-of-chapter film plays on the story board so it also shows in VR) ---------- */
const videoEl = document.createElement('video'); videoEl.playsInline = true; videoEl.preload = 'auto';
function playVideo(src, done) {
  let over = false; const finish = (ok) => { if (over) return; over = true; videoEl.onended = null; videoEl.onerror = null; try { videoEl.pause(); } catch (e) { /* fine */ } if (done) done(ok); };
  videoEl.onended = () => finish(true); videoEl.onerror = () => finish(false); videoEl.muted = false; videoEl.volume = S ? S.settings.volume : 1; videoEl.src = src;
  const p = videoEl.play(); if (p && p.catch) p.catch(() => { videoEl.muted = true; const q = videoEl.play(); if (q && q.catch) q.catch(() => finish(false)); });
  return finish;
}

/* ---------- screens and flow live in screens.js ---------- */
const UI = makeScreens({ R, board, BW, BH, now, video: videoEl, playVideo, save, saveNow, beep, speak, hush, showPerson, setPlace, celebrate, G, startRecenter, recenter: () => { needsRecenter = true; }, exitVR, layout, hidePanel: () => setPanel(false), showPanel: () => setPanel(true), teleport: (k) => teleportTo(k),
  getS: () => S, moveTray, showGift, setCommunity, setS: (s) => { S = s; plots.forEach((p) => { p.lastStage = -1; }); layout(); }, load, clearSave: () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* fine */ } }, newGame: () => R.newGame(now()),
  setSign: (restored) => { signRestored.visible = restored; signBroken.visible = !restored; }, redraw: () => { boardTex.needsUpdate = true; }, inVR: () => renderer.xr.isPresenting });
layout(); UI.start();

const clock = new THREE.Clock(); let slow = 0;
function tick(dt, simOnly) {
  if (!simOnly) readXR();
  stepPointers(dt, performance.now() / 1000); stepBits(dt); stepTiles(dt); stepKids(dt); stepSky(dt); packetFor(G.seedTier()); if (giftHolder.visible) { giftHolder.rotation.y += dt * 0.8; giftHolder.position.y = TABLE + 0.02 + Math.abs(Math.sin(clock.elapsedTime * 2)) * 0.03; }
  const t = clock.elapsedTime; plots.forEach((p) => drawPlot(p, t, dt));
  if (vig.visible) { const v = VIG[vigWho]; if (v && v.char) { const talking = !voice.paused && !voice.ended; v.char.position.y = Math.abs(Math.sin(t * (talking ? 7 : 1.6))) * (talking ? 0.014 : 0.004); v.char.rotation.y = Math.sin(t * 0.9) * (talking ? 0.16 : 0.07); } }
  slow += dt; if (slow > 0.5 && S) { slow = 0; refreshStock(); refreshArr(); { const evn = R.advance(S, now()); kidBuys(evn); UI.everyHalfSecond(evn); } }
  UI.frame();
}
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (renderer.xr.isPresenting) { if (needsRecenter && recenter()) needsRecenter = false; if (recenterAt && performance.now() >= recenterAt) { recenterAt = 0; if (recenter()) UI.say('All set. Everything is in front of you.'); } }
  tick(dt, false); renderer.render(scene, camera);
});
window.__lt = { vaseFl: () => vaseFl, dbg: () => [arrSig, arrG.visible, pickRecs.length], refreshArr, refreshStock, setS: (s) => { S = s; plots.forEach((p) => { p.lastStage = -1; }); layout(); }, camera, world, comm, walkers, kidBuys, get S() { return S; }, R, UI, plots, tools, pointers, TABLE, tick, THREE, board, HAND,
  sim(i, pos, quat, down) { const P = pointers[2 + i]; if (!pos) { P.valid = false; return; } P.valid = true; P.pos.fromArray(pos); if (quat) P.quat.fromArray(quat); else P.quat.identity(); P.down = !!down; } };
