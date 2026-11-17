// Letter Town start flow. First visit: the opening video. Every later visit: the short welcome-back video.
// Then the Ivy entrance picture with two buttons: Enter (on this screen) and Enter VR.
const SEEN = 'lettertown_intro_seen';
const $ = (id) => document.getElementById(id);

export function runIntro({ vrSupported, onEnter, onEnterVR }) {
  const root = $('intro'), vid = $('introvid'), still = $('introstill'), row = $('introrow'), skip = $('skip'), hint = $('hint');
  let first = true; try { first = !localStorage.getItem(SEEN); } catch (e) { /* storage blocked: treat as first visit */ }
  let shown = false;
  function showStill() {
    if (shown) return; shown = true;
    try { vid.pause(); } catch (e) { /* fine */ }
    vid.classList.add('hide'); skip.classList.add('hide'); hint.classList.add('hide'); still.classList.remove('hide'); row.classList.remove('hide');
    try { localStorage.setItem(SEEN, '1'); } catch (e) { /* fine */ }
  }
  $('enter').onclick = () => { root.classList.add('hide'); onEnter(); };
  const vrb = $('entervr');
  Promise.resolve(vrSupported).then((ok) => { vrb.disabled = !ok; if (!ok) vrb.title = 'Open this page in the Quest browser to enter VR'; });
  vrb.onclick = () => { root.classList.add('hide'); onEnterVR(); };
  skip.onclick = showStill;
  vid.src = 'assets/video/' + (first ? 'landing-page-opening-video.mp4' : 'letter-town-start.mp4');
  vid.classList.remove('hide'); skip.classList.remove('hide');
  vid.onended = showStill; vid.onerror = showStill;
  const setHint = () => { hint.textContent = vid.muted ? 'Tap anywhere for sound' : 'Tap anywhere to mute'; };
  root.addEventListener('click', (e) => { if (e.target.closest('button') || shown) return; vid.muted = !vid.muted; if (!vid.muted) { vid.volume = 1; const r = vid.play(); if (r && r.catch) r.catch(() => {}); } setHint(); hint.classList.remove('hide'); });
  const p = vid.play();
  vid.addEventListener('playing', () => { if (!shown) { setHint(); hint.classList.remove('hide'); } }, { once: true });
  if (p && p.catch) p.catch(() => {
    // the browser would not start it with sound: start it silent, and let a tap turn the sound on
    vid.muted = true; const q = vid.play(); if (q && q.catch) q.catch(showStill);
    setHint(); hint.classList.remove('hide');
  });
}
