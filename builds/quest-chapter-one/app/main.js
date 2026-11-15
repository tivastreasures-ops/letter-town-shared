// Letter Town — Chapter One for Quest 3 (WebXR), seated, hands first. Plain JavaScript + Three.js.
// The garden table uses real hand actions (carry seeds, tilt the can, shake Super Grow, pull a bloom).
// The story board in front of you can be poked with a fingertip or pointed at and pinched. Mouse and touch work too.
import * as THREE from '../vendor/three/three.module.min.js';
import * as R from '../rules/game.js';
import { makeScreens } from './screens.js';

const Q = new URLSearchParams(location.search);
const num = (k, d) => (Q.has(k) && !isNaN(parseFloat(Q.get(k))) ? parseFloat(Q.get(k)) : d);
const HAND = { pinchIn: num('pinchIn', 0.022), pinchOut: num('pinchOut', 0.045), grabReach: num('grabReach', 0.10), pullDist: num('pullDist', 0.16), pourTilt: num('pourTilt', 20), pourSecs: num('pourSecs', 0.6), shakeSpeed: num('shakeSpeed', 0.5), shakeFlips: num('shakeFlips', 4), shakeWindow: 1.2, lostGrace: 0.5 };
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
scene.add(new THREE.HemisphereLight('#ffffff', '#b9c9a0', 1.3));
const sun = new THREE.DirectionalLight('#fff3dd', 1.0); sun.position.set(1, 3, 2); scene.add(sun);
const stage = new THREE.Group(); scene.add(stage);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
const loader = new THREE.TextureLoader();
const tex = (path) => { const t = loader.load(path); t.colorSpace = THREE.SRGBColorSpace; return t; };
const ground = new THREE.Mesh(new THREE.CircleGeometry(8, 40), new THREE.MeshLambertMaterial({ color: '#bfdc9f' })); ground.rotation.x = -Math.PI / 2; stage.add(ground);
const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.8), new THREE.MeshLambertMaterial({ color: '#d9a865' })); tableTop.position.set(0, TABLE - 0.02, -0.3); stage.add(tableTop);
function cutout(path, w, h, x, y, z, ry = 0) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex(path), transparent: true, alphaTest: 0.05, side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.y = ry; stage.add(m); return m; }
// the town behind you changes with the story: gate, daytime street, night
const BACK = { gate: tex('assets/scene/town_gate.jpg'), day: tex('assets/scene/town_day.jpg'), night: tex('assets/scene/town_night.jpg') };
const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 4.9), new THREE.MeshBasicMaterial({ map: BACK.gate })); backdrop.position.set(0, TABLE + 1.45, -5.2); stage.add(backdrop);
const signBroken = cutout('assets/scene/sign_broken.png', 1.15, 0.88, -1.35, TABLE + 0.62, -1.7, 0.5);
const signRestored = cutout('assets/scene/sign_restored.png', 1.15, 0.8, -1.35, TABLE + 0.62, -1.7, 0.5); signRestored.visible = false;
cutout('assets/scene/word_cart.png', 0.95, 0.95, 1.4, TABLE + 0.5, -1.75, -0.5);
cutout('assets/scene/flower_cart.png', 0.8, 0.8, 2.1, TABLE + 0.42, -1.0, -0.95);
const PEOPLE = ['hudson', 'snowy', 'merry', 'kit', 'phineas', 'mayor'];
const person = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.72), new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.05, side: THREE.DoubleSide })); person.position.set(0.86, TABLE + 0.38, -0.82); person.rotation.y = -0.45; person.visible = false; stage.add(person);
const personTex = {}; PEOPLE.forEach((p) => { personTex[p] = tex(`assets/people/${p}.png`); });
function showPerson(who) { const k = who && PEOPLE.find((p) => who.toLowerCase().startsWith(p)); person.visible = !!k; if (k) { person.material.map = personTex[k]; person.material.needsUpdate = true; } }
function setPlace(name) { backdrop.material.map = BACK[name] || BACK.day; backdrop.material.needsUpdate = true; scene.background.set(name === 'night' ? '#27306b' : '#cfe6f5'); }
function celebrate() { for (let i = 0; i < 60; i++) spawn(new THREE.Vector3((Math.random() - 0.5) * 1.2, TABLE + 0.9 + Math.random() * 0.3, -0.5 - Math.random() * 0.3), new THREE.Vector3((Math.random() - 0.5) * 0.6, Math.random() * 0.6, (Math.random() - 0.5) * 0.6), ['#ff9ec4', '#ffd34d', '#b99cf0', '#8fd18a'][i % 4], 1.6); }

/* ---------- the story board ---------- */
const BW = 1600, BH = 900, board = document.createElement('canvas'); board.width = BW; board.height = BH;
const boardTex = new THREE.CanvasTexture(board); boardTex.colorSpace = THREE.SRGBColorSpace; boardTex.anisotropy = 4;
const BOARD_W = 1.16, BOARD_H = BOARD_W * BH / BW;
const boardMesh = new THREE.Mesh(new THREE.PlaneGeometry(BOARD_W, BOARD_H), new THREE.MeshBasicMaterial({ map: boardTex })); stage.add(boardMesh);
const dot = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 8), new THREE.MeshBasicMaterial({ color: '#c8745a' })); dot.visible = false; stage.add(dot);
function layout() { const reach = S ? S.settings.reach : 0.5; boardMesh.position.set(0, TABLE + 0.6, -(reach + 0.24)); plots.forEach((p) => { const a = THREE.MathUtils.degToRad(-52.5 + p.i * 15); p.g.position.set(Math.sin(a) * reach, TABLE, -Math.cos(a) * reach); p.g.rotation.y = Math.atan2(-p.g.position.x, -p.g.position.z); }); }
const _bp = new THREE.Vector3();
function boardUV(pt) { _bp.copy(pt).sub(boardMesh.position); return { x: (_bp.x / BOARD_W + 0.5) * BW, y: (0.5 - _bp.y / BOARD_H) * BH, z: _bp.z }; }
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
const bloomTex = {}; R.CFG.species.forEach((s) => { bloomTex[s] = tex(`assets/blooms/${s}.png`); });
const plots = [];
for (let i = 0; i < 8; i++) {
  const g = new THREE.Group();
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.02, 20), new THREE.MeshLambertMaterial({ color: '#7a5236' })); soil.position.y = 0.01; g.add(soil);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.006, 8, 28), new THREE.MeshBasicMaterial({ color: '#58c06a' })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.022; ring.visible = false; g.add(ring);
  const mound = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8), new THREE.MeshLambertMaterial({ color: '#5b3a24' })); mound.scale.y = 0.6; mound.position.y = 0.024; g.add(mound);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.005, 1, 8), new THREE.MeshLambertMaterial({ color: '#5a9a48' })); g.add(stem);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), new THREE.MeshLambertMaterial({ color: '#6fb45a' })); leaf.scale.set(1.3, 0.35, 0.8); g.add(leaf);
  const bloom = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.13), new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.08, side: THREE.DoubleSide })); g.add(bloom);
  const spark = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.005, 8, 24), new THREE.MeshBasicMaterial({ color: '#ffd34d' })); spark.rotation.x = Math.PI / 2; g.add(spark);
  stage.add(g); plots.push({ i, g, ring, mound, stem, leaf, bloom, spark, pourT: 0, bloomPos: BLOOM_HOME.clone(), heldBy: null, lastStage: -1, pop: 0 });
}
const plantAt = (i) => (S ? R.pouch(S).plots[i].plant : null);
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _m = new THREE.Matrix4();
function drawPlot(p, t, dt) {
  const pl = plantAt(p.i); if (p.pop > 0) p.pop = Math.max(0, p.pop - dt * 2);
  const st = pl ? pl.stage : -1; if (st !== p.lastStage) { if (st > p.lastStage && p.lastStage >= 0) p.pop = 1; if (st === 2) p.bloomPos.copy(BLOOM_HOME); p.lastStage = st; }
  p.mound.visible = !!pl && pl.stage === 0; p.stem.visible = p.leaf.visible = !!pl && pl.stage >= 1; p.bloom.visible = !!pl && pl.stage === 2; p.spark.visible = !!pl && pl.boost;
  if (!pl) return;
  const top = pl.stage === 2 ? p.bloomPos : _v.set(0, 0.03 + 0.05 * (pl.stage === 1 ? 0.6 + 0.4 * pl.progress : 0.2), 0);
  p.stem.position.copy(top).multiplyScalar(0.5); p.stem.scale.set(1, Math.max(0.005, top.length()), 1); p.stem.quaternion.setFromUnitVectors(UP, top.clone().normalize());
  p.leaf.position.copy(top).multiplyScalar(0.55); p.leaf.position.x += 0.014;
  if (pl.stage === 2) { if (p.bloom.material.map !== bloomTex[pl.species]) { p.bloom.material.map = bloomTex[pl.species]; p.bloom.material.needsUpdate = true; } p.bloom.position.copy(p.bloomPos); p.bloom.scale.setScalar(1 + p.pop * 0.35); }
  p.spark.position.y = 0.05 + Math.sin(t * 4 + p.i) * 0.012; p.spark.rotation.z = t * 2;
}
function labelTexture(lines, { w = 256, h = 128, bg = '#fff8ea', fg = '#5a3b22', size = 44 } = {}) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = `bold ${size}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.1)); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const tools = [];
function makeTool(kind, home, yaw, build) { const g = new THREE.Group(); build(g); g.position.copy(home); g.rotation.y = yaw; stage.add(g); const t = { kind, g, home: home.clone(), homeQ: g.quaternion.clone(), heldBy: null, flips: [], lastDir: null, cool: 0, prev: new THREE.Vector3() }; tools.push(t); return t; }
makeTool('seeds', new THREE.Vector3(-0.2, TABLE + 0.05, -0.2), 0, (g) => { g.add(new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.095, 0.012), [0, 1, 2, 3, 4, 5].map((i) => new THREE.MeshLambertMaterial(i === 4 ? { map: labelTexture(['SEEDS'], { w: 200, h: 256, bg: '#f6d6e4', size: 46 }) } : { color: '#f0c4d6' })))); });
const canTool = makeTool('can', new THREE.Vector3(0.2, TABLE + 0.045, -0.2), Math.PI / 2, (g) => {
  const mat = new THREE.MeshLambertMaterial({ color: '#8fb8d8' }); g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.046, 0.085, 18), mat));
  const a = new THREE.Vector3(0.035, -0.01, 0), b = new THREE.Vector3(0.115, 0.05, 0), d = b.clone().sub(a);
  const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, d.length(), 10), mat); sp.position.copy(a).addScaledVector(d, 0.5); sp.quaternion.setFromUnitVectors(UP, d.clone().normalize()); g.add(sp);
  const rose = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), new THREE.MeshLambertMaterial({ color: '#6d9cc0' })); rose.position.copy(b); g.add(rose);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.006, 8, 16, Math.PI), mat); h.position.set(-0.045, 0, 0); h.rotation.z = Math.PI / 2; g.add(h);
  const base = new THREE.Object3D(); base.position.copy(a); g.add(base); const tip = new THREE.Object3D(); tip.name = 'water_origin'; tip.position.copy(b); g.add(tip); g.userData = { base, tip };
});
makeTool('shaker', new THREE.Vector3(0, TABLE + 0.05, -0.17), 0, (g) => { g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.09, 16), new THREE.MeshLambertMaterial({ map: labelTexture(['SUPER', 'GROW'], { bg: '#ffe38a', size: 40 }) }))); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.02, 16), new THREE.MeshLambertMaterial({ color: '#e0a92e' })); cap.position.y = 0.055; g.add(cap); });
function sendHome(t) { t.heldBy = null; t.g.position.copy(t.home); t.g.quaternion.copy(t.homeQ); t.flips.length = 0; t.lastDir = null; }
const bits = [], bitGeo = new THREE.SphereGeometry(0.006, 6, 5);
function spawn(pos, vel, color, life) { let b = bits.find((x) => x.life <= 0); if (!b) { if (bits.length > 200) return; b = { m: new THREE.Mesh(bitGeo, new THREE.MeshBasicMaterial()), v: new THREE.Vector3(), life: 0 }; stage.add(b.m); bits.push(b); } b.m.material.color.set(color); b.m.position.copy(pos); b.v.copy(vel); b.life = life; b.m.visible = true; }
function burst(p, color, n) { const o = p.g.position.clone(); o.y += 0.12; for (let i = 0; i < n; i++) spawn(o, new THREE.Vector3((Math.random() - 0.5) * 0.9, Math.random() * 0.9 + 0.2, (Math.random() - 0.5) * 0.9), color, 0.7); }
function stepBits(dt) { for (const b of bits) { if (b.life <= 0) continue; b.life -= dt; b.v.y -= 2.6 * dt; b.m.position.addScaledVector(b.v, dt); if (b.life <= 0 || b.m.position.y < TABLE) { b.life = 0; b.m.visible = false; } } }

/* ---------- garden actions: one place for hands, pointing and the board buttons ---------- */
let txn = Math.floor(Math.random() * 1e9);
const G = {
  seedTier() { const g = R.pouch(S); if (g.seeds[UI.state.tier] > 0) return UI.state.tier; return ['common', 'uncommon', 'rare'].find((t) => g.seeds[t] > 0) || UI.state.tier; },
  plant(i) { const r = R.plant(S, i, G.seedTier()); UI.note(r); if (r.ok) { beep(520, 0.08); UI.emit('planted'); } else if (r.code === 'noseed') UI.cue('M13'); return r; },
  water(i) { const r = R.water(S, i); UI.note(r); if (r.ok) { beep(660, 0.08); UI.emit('watered'); } return r; },
  boost(i) { const r = R.superGrow(S, i); UI.note(r); if (r.ok) { beep(880, 0.1); burst(plots[i], '#ffd34d', 10); UI.emit('boosted'); } return r; },
  pick(i, id) { const r = R.harvest(S, i, id == null ? ++txn : id); if (r.code === 'dup') return r; UI.note(r); if (r.ok) { burst(plots[i], '#ff9ec4', 16); beep(740, 0.07); setTimeout(() => beep(990, 0.1), 80); plots[i].bloomPos.copy(BLOOM_HOME); plots[i].heldBy = null; if (!S.usePractice) UI.cue(r.freed ? 'M16' : null); UI.emit('harvested'); } else if (r.code === 'growing' && !S.usePractice) UI.cue('M14'); return r; },
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
const stageQinv = new THREE.Quaternion();
function readXR() {
  stageQinv.copy(stage.quaternion).invert();
  for (let i = 0; i < 2; i++) {
    const o = xr[i], P = pointers[i]; P.valid = false; P.ray = null; P.tip = null;
    const src = renderer.xr.isPresenting ? o.source : null, J = o.hand.joints || {}, isHand = !!(src && src.hand);
    o.line.visible = !!src && !P.held; o.knob.visible = !!src && !isHand;
    o.dots.forEach((d, k) => { const j = isHand && J[JOINTS[k]]; d.visible = !!(j && j.visible); if (d.visible) j.getWorldPosition(d.position); });
    if (!src) { P.down = false; continue; }
    if (isHand) {
      const th = J['thumb-tip'], ix = J['index-finger-tip'], wr = J['wrist']; if (!th || !ix || !wr || !th.visible || !ix.visible) continue;
      th.getWorldPosition(_a); ix.getWorldPosition(_b); P.gap = _a.distanceTo(_b);
      const want = P.pinching ? P.gap < HAND.pinchOut : P.gap < HAND.pinchIn;
      if (want !== P.pinching) { P.frames++; if (P.frames >= 2) { P.pinching = want; P.frames = 0; } } else P.frames = 0;
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
  let best = null, bd = HAND.grabReach; if (!UI.gardenOpen()) return null;
  for (const t of tools) { if (t.heldBy) continue; const d = t.g.position.distanceTo(pos); if (d < bd) { bd = d; best = { tool: t }; } }
  for (const p of plots) { const pl = plantAt(p.i); if (!pl || pl.stage < 2 || p.heldBy) continue; const d = bloomAt(p, _a).distanceTo(pos); if (d < bd) { bd = d; best = { plot: p }; } }
  return best;
}
function rayPick(ray) {
  const hit = boardRay(ray); let best = hit ? { board: hit.uv, t: hit.t } : null, bt = hit ? hit.t : 4;
  if (!UI.gardenOpen()) return best;
  const test = (c, r, what) => { _a.copy(c).sub(ray.o); const t = _a.dot(ray.d); if (t <= 0 || t > bt) return; const d2 = _a.lengthSq() - t * t; if (d2 < r * r) { bt = t; best = what; } };
  for (const t of tools) if (!t.heldBy) test(t.g.position, 0.06, { tool: t });
  for (const p of plots) test(_v.copy(p.g.position).setY(TABLE + 0.06).clone(), 0.07, { plot: p });
  return best;
}
function selectThing(hit) {
  if (!hit) return; if (hit.board) return UI.press(hit.board.x, hit.board.y);
  if (hit.tool) { UI.state.tool = UI.state.tool === hit.tool.kind ? null : hit.tool.kind; UI.say(UI.state.tool ? `${{ seeds: 'Seeds', can: 'Watering can', shaker: 'Super Grow' }[UI.state.tool]} selected. Now choose a plot.` : 'Nothing selected.'); beep(500, 0.05); return; }
  const i = hit.plot.i, pl = plantAt(i);
  if (UI.state.tool === 'seeds') G.plant(i); else if (UI.state.tool === 'can') G.water(i); else if (UI.state.tool === 'shaker') G.boost(i);
  else if (pl && pl.stage === 2) G.pick(i); else UI.say(pl ? 'Still growing. Choose the can to water it.' : 'Empty plot. Choose the seeds first.');
}
const relP = new THREE.Vector3();
function grab(P, hit) {
  if (hit.tool) { const t = hit.tool; t.heldBy = P; P.held = { tool: t, relQ: P.quat.clone().invert().multiply(t.g.quaternion), relP: t.g.position.clone().sub(P.pos).applyQuaternion(P.quat.clone().invert()) }; t.prev.copy(t.g.position); t.flips.length = 0; t.lastDir = null; UI.state.tool = null; UI.say({ seeds: 'Holding seeds. Let go over an empty plot.', can: 'Holding the can. Tilt the spout down over a plant.', shaker: 'Holding Super Grow. Shake it over a plant.' }[t.kind]); }
  else { hit.plot.heldBy = P; P.held = { plot: hit.plot, txn: ++txn }; UI.say('Got it. Pull!'); }
  beep(600, 0.04);
}
function letGo(P, lost) {
  const h = P.held; if (!h) return; P.held = null;
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
    if (P.tip) { const uv = boardUV(P.tip); const inside = uv.x >= 0 && uv.x <= BW && uv.y >= 0 && uv.y <= BH; if (inside && uv.z < 0.012 && P.tipZ >= 0.012 && uv.z > -0.06) UI.press(uv.x, uv.y); P.tipZ = inside ? uv.z : 9; }   // fingertip poke
    if (P.ray && !P.held) { const h = boardRay(P.ray); if (h) cursor = h.p; }
    if (P.down && !P.was && !P.held) { const hit = nearestGrab(P.pos); if (hit) grab(P, hit); else if (P.ray) selectThing(rayPick(P.ray)); }
    if (P.held && P.held.tool) useTool(P, dt, tnow); else if (P.held) pullBloom(P);
    if (!P.down && P.was && P.held) letGo(P, false);
    P.was = P.down;
  }
  dot.visible = !!cursor; if (cursor) dot.position.copy(cursor).setZ(cursor.z + 0.004);
  for (const p of plots) if (!p.heldBy && p.bloomPos.distanceTo(BLOOM_HOME) > 0.001) p.bloomPos.lerp(BLOOM_HOME, Math.min(1, dt * 12));
  for (const t of tools) { t.g.scale.setScalar(UI.state.tool === t.kind ? 1.25 : 1); t.g.visible = UI.gardenOpen(); }
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
(async () => {
  let ok = false; try { ok = !!navigator.xr && await navigator.xr.isSessionSupported('immersive-vr'); } catch (e) { /* no VR */ }
  if (!ok) { vrBtn.textContent = 'VR not available here'; noteEl.textContent = 'Open this page in the Quest browser (https) to play with your hands. On a computer or phone you can click or tap everything.'; return; }
  vrBtn.disabled = false; vrBtn.textContent = 'Enter VR';
  vrBtn.onclick = async () => {
    if (renderer.xr.isPresenting) return exitVR(); beep(440, 0.01);
    try { const s = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'hand-tracking'] }); renderer.xr.setReferenceSpaceType('local-floor'); await renderer.xr.setSession(s);
      vrBtn.textContent = 'Exit VR'; setTimeout(() => { needsRecenter = true; }, 600); const ref = renderer.xr.getReferenceSpace(); if (ref && ref.addEventListener) ref.addEventListener('reset', () => { needsRecenter = true; });
      s.addEventListener('end', () => { vrBtn.textContent = 'Enter VR'; stage.position.set(0, 0, 0); stage.rotation.set(0, 0, 0); pointers.forEach((P) => { if (P.held) letGo(P, true); }); saveNow(); });
    } catch (e) { noteEl.textContent = 'Could not start VR: ' + e.message; }
  };
})();

/* ---------- screens and flow live in screens.js ---------- */
const UI = makeScreens({ R, board, BW, BH, now, save, saveNow, beep, speak, hush, showPerson, setPlace, celebrate, G, startRecenter, recenter: () => { needsRecenter = true; }, exitVR, layout,
  getS: () => S, setS: (s) => { S = s; plots.forEach((p) => { p.lastStage = -1; }); layout(); }, load, clearSave: () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* fine */ } }, newGame: () => R.newGame(now()),
  setSign: (restored) => { signRestored.visible = restored; signBroken.visible = !restored; }, redraw: () => { boardTex.needsUpdate = true; }, inVR: () => renderer.xr.isPresenting });
layout(); UI.start();

const clock = new THREE.Clock(); let slow = 0;
function tick(dt, simOnly) {
  if (!simOnly) readXR();
  stepPointers(dt, performance.now() / 1000); stepBits(dt);
  const t = clock.elapsedTime; plots.forEach((p) => drawPlot(p, t, dt));
  slow += dt; if (slow > 0.5 && S) { slow = 0; UI.everyHalfSecond(R.advance(S, now())); }
  UI.frame();
}
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (renderer.xr.isPresenting) { if (needsRecenter && recenter()) needsRecenter = false; if (recenterAt && performance.now() >= recenterAt) { recenterAt = 0; if (recenter()) UI.say('All set. Everything is in front of you.'); } }
  tick(dt, false); renderer.render(scene, camera);
});
window.__lt = { get S() { return S; }, R, UI, plots, tools, pointers, TABLE, tick, THREE, board, HAND,
  sim(i, pos, quat, down) { const P = pointers[2 + i]; if (!pos) { P.valid = false; return; } P.valid = true; P.pos.fromArray(pos); if (quat) P.quat.fromArray(quat); else P.quat.identity(); P.down = !!down; } };
