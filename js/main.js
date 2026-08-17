// ---------------------------------------------------------------------------
// Wiring: one seed in, one moving shot out.
//
// Two phases. BUILD drains the queue across frames, drawing every sprite with
// the real pencil — that is the expensive part and it happens once. RUN is
// then nothing but blits, so it holds frame rate.
// ---------------------------------------------------------------------------
'use strict';

const view = document.getElementById('c');
const vctx = view.getContext('2d');

let DPR = 1, W = 0, H = 0;
let paperCv = null, SCN = null, SEED = 0, PAPER_GRAIN = null;
let raf = 0, phase = 'build', last = 0;
let MODE = 'walk';
let RAIN = false;

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function build(seed) {
  SEED = seed >>> 0;
  cancelAnimationFrame(raf);

  DPR = Math.min(1.5, window.devicePixelRatio || 1);
  W = Math.max(320, window.innerWidth);
  H = Math.max(320, window.innerHeight);
  view.width = Math.round(W * DPR); view.height = Math.round(H * DPR);
  view.style.width = W + 'px'; view.style.height = H + 'px';
  vctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  const R = mulberry32(SEED);
  const p = buildPaper(W, H, DPR, SEED, {});
  paperCv = p.canvas;
  PAPER_GRAIN = p.grain;

  SCN = buildScene(R, W, H, SEED, MODE);
  SCN.rainActive = RAIN;

  phase = 'build';
  last = 0;
  raf = requestAnimationFrame(tick);
}

// The pencil that draws the loading line needs a target of its own — the
// sprite builder keeps stealing it.
function progress(done, total) {
  vctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  vctx.clearRect(0, 0, W, H);
  vctx.drawImage(paperCv, 0, 0, W, H);
  setInkTarget(vctx, { grain: PAPER_GRAIN, w: W, h: H });
  const R = mulberry32(SEED ^ 0x10ad);
  setPen(PENS[0]);
  const sz = H * 0.02;
  lettering(R, 'DRAWING', W * 0.5 - textW('DRAWING', sz) / 2, H * 0.5, sz, { alpha: 0.55 });
  const bw = W * 0.16, bx = W * 0.5 - bw / 2, by = H * 0.5 + sz * 1.2;
  ink(R, [[bx, by], [bx + bw * (done / Math.max(1, total)), by]], 1.6,
    { alpha: 0.4, amp: 0.7, skip: 1.2, nib: false });
}

function tick(now) {
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
  last = now;

  if (phase === 'build') {
    const total = Q.length + (SCN.builtCount || 0);
    const t0 = performance.now();
    let n = 0;
    // Fast batch draining: processes multiple sprites per frame for snappy loading
    while (Q.length && (n < 16 || performance.now() - t0 < 32)) {
      if (performance.now() - t0 > 36) break;
      Q.shift()(); n++;
      SCN.builtCount = (SCN.builtCount || 0) + 1;
    }
    progress(SCN.builtCount, total);
    if (!Q.length) phase = 'run';
    raf = requestAnimationFrame(tick);
    return;
  }

  if (!reduced()) updateScene(SCN, dt);
  vctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  vctx.clearRect(0, 0, W, H);
  vctx.drawImage(paperCv, 0, 0, W, H);
  renderScene(vctx, SCN);
  raf = requestAnimationFrame(tick);
}

// ---------------------------------------------------------------------------
function seedFromUrl() {
  const v = new URLSearchParams(location.search).get('seed');
  const n = v === null ? NaN : parseInt(v, 10);
  return Number.isFinite(n) ? n >>> 0 : randSeed();
}

function go(seed, replace) {
  const u = new URL(location.href);
  u.searchParams.set('seed', String(seed >>> 0));
  history[replace ? 'replaceState' : 'pushState']({}, '', u);
  build(seed);
}

// Collapsible Actions Drawer (Draw another / Save frame)
const bActionsToggle = document.getElementById('bActionsToggle');
const uiActionsGroup = document.getElementById('ui-actions-group');
if (bActionsToggle && uiActionsGroup) {
  bActionsToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = uiActionsGroup.classList.toggle('open');
    bActionsToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', (e) => {
    if (!uiActionsGroup.contains(e.target)) {
      uiActionsGroup.classList.remove('open');
      bActionsToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

document.getElementById('bNext').addEventListener('click', () => {
  if (uiActionsGroup) {
    uiActionsGroup.classList.remove('open');
    if (bActionsToggle) bActionsToggle.setAttribute('aria-expanded', 'false');
  }
  if (typeof window !== 'undefined' && typeof window.va === 'function') {
    try { window.va('event', { name: 'draw_another' }); } catch (e) {}
  }
  go(randSeed(), false);
});

document.getElementById('bSave').addEventListener('click', async () => {
  if (uiActionsGroup) {
    uiActionsGroup.classList.remove('open');
    if (bActionsToggle) bActionsToggle.setAttribute('aria-expanded', 'false');
  }
  if (typeof window !== 'undefined' && typeof window.va === 'function') {
    try { window.va('event', { name: 'save_frame' }); } catch (e) {}
  }

  const filename = 'runaway-' + SEED + '.png';

  // 1. If Web Share API with File support is available (iOS Chrome, iOS Safari, Android)
  if (navigator.share && navigator.canShare && typeof view.toBlob === 'function') {
    try {
      view.toBlob(async (blob) => {
        if (!blob) {
          fallbackDownload(filename);
          return;
        }
        try {
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'RunAway - ' + SEED,
              text: 'RunAway frame ' + SEED
            });
            return;
          }
        } catch (err) {
          if (err.name === 'AbortError') return; // User simply closed the iOS share sheet
        }
        fallbackDownload(filename);
      }, 'image/png');
      return;
    } catch (e) {}
  }

  fallbackDownload(filename);
});

function fallbackDownload(filename) {
  try {
    const dataUrl = view.toDataURL('image/png');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS) {
      // On iOS WebKit, window.open or rendering to a tab allows direct long-press "Save to Photos"
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>${filename}</title>
              <style>
                body { margin: 0; background: #1a1714; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: -apple-system, sans-serif; color: #fff; text-align: center; }
                img { max-width: 95vw; max-height: 85vh; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                p { margin-top: 14px; font-size: 14px; opacity: 0.7; }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" alt="${filename}">
              <p>Touch and hold the image to save to Photos</p>
            </body>
          </html>
        `);
        return;
      }
    }

    const a = document.createElement('a');
    a.download = filename;
    a.href = dataUrl;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 200);
  } catch (err) {
    console.warn('Fallback download error:', err);
  }
}

const bRain = document.getElementById('bRain');
const rainVolBar = document.getElementById('rain-vol-bar');
const rainVolFill = document.getElementById('rain-vol-fill');
const rainVolLabel = document.getElementById('rain-vol-label');

if (bRain) {
  bRain.addEventListener('click', () => {
    RAIN = !RAIN;
    bRain.setAttribute('aria-pressed', String(RAIN));
    if (SCN) SCN.rainActive = RAIN;
    if (typeof window !== 'undefined' && typeof window.setRainAudio === 'function') {
      window.setRainAudio(RAIN);
    }
    if (typeof window !== 'undefined' && typeof window.va === 'function') {
      try { window.va('event', { name: 'toggle_rain', active: RAIN }); } catch (e) {}
    }
  });
}

if (rainVolBar) {
  rainVolBar.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10) || 0;
    if (rainVolFill) rainVolFill.style.width = val + '%';
    if (rainVolLabel) rainVolLabel.textContent = val + '%';
    if (typeof window !== 'undefined' && typeof window.setRainVolume === 'function') {
      window.setRainVolume(val);
    }
  });
}
for (const btn of document.querySelectorAll('#modes button')) {
  btn.addEventListener('click', () => {
    if (btn.dataset.mode === MODE) return;
    MODE = btn.dataset.mode;
    for (const b of document.querySelectorAll('#modes button')) b.setAttribute('aria-pressed', String(b === btn));
    if (typeof window !== 'undefined' && typeof window.va === 'function') {
      try { window.va('event', { name: 'change_gait', mode: MODE }); } catch (e) {}
    }
    build(SEED);                                 // same seed: same world, different gait
  });
}
window.addEventListener('popstate', () => build(seedFromUrl()));

let rz = 0;
window.addEventListener('resize', () => {
  clearTimeout(rz);
  rz = setTimeout(() => build(SEED), 300);
});

go(seedFromUrl(), true);
