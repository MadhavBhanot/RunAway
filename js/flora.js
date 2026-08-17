// ---------------------------------------------------------------------------
// WHAT IS GROWING HERE
//
// Six species, each with its own way of being drawn. Six rather than nine on
// purpose: nobody identifies nine natives at sketch scale, but everybody
// notices a wattle puffball that reads as a grey blob.
//
// Late winter into early spring, a week after rain — the one time temperate
// Australian grassland is genuinely green AND at peak bloom. Wattle is gold in
// August; the flannel flowers and everlastings are out; last season's kangaroo
// grass is still standing in bronze.
// ---------------------------------------------------------------------------
'use strict';

const GREENS = [[110, 158, 70], [76, 120, 58], [140, 182, 92], [96, 142, 64]];
const GUM = [122, 158, 126];
const SHADOW = [122, 106, 164];          // green is shadowed with violet, never with black

const SPECIES = [
  // `w` is head size, and it is the main lever on which species dominates a
  // sheet. The paper daisy is the loudest colour here, so it is kept small —
  // otherwise every page turns into the same wall of pink.
  { id: 'wattle',   label: 'WATTLE',        style: 'puffball', col: [232, 168, 32],  w: 22 },
  { id: 'brush',    label: 'BOTTLEBRUSH',   style: 'brush',    col: [196, 52, 44],   w: 14 },
  { id: 'paw',      label: 'KANGAROO PAW',  style: 'claw',     col: [206, 68, 44],   w: 12 },
  { id: 'flannel',  label: 'FLANNEL FLOWER',style: 'daisy',    col: [248, 246, 238], w: 18 },
  { id: 'daisy',    label: 'PAPER DAISY',   style: 'daisy',    col: [218, 126, 148], w: 15 },
  { id: 'themeda',  label: 'KANGAROO GRASS',style: 'tussock',  col: [172, 118, 72],  w: 17 }
];
const byId = id => SPECIES.find(s => s.id === id);

// --- one flower head, colour laid in wet, line drawn over it -----------------
function flowerHead(R, cx, cy, r, sp, dp) {
  const prev = getPen();
  const lw = Math.max(0.6, r * 0.055) * (0.6 + dp * 0.6);
  const la = 0.35 + dp * 0.35;
  const wa = 0.045 + dp * 0.05;

  if (sp.style === 'puffball') {
    // wattle: a cluster of little suns, all stipple and no outline
    for (let k = 0, n = ri(R, 4, 8); k < n; k++) {
      const a = rr(R, 0, TAU), d = rr(R, 0, r * 0.9);
      const bx = cx + Math.cos(a) * d, by = cy + Math.sin(a) * d * 0.8;
      const br = r * rr(R, 0.22, 0.4);
      wash(R, ring(R, bx, by, br * 1.25, br * 1.25, 11, rr(R, 0, TAU), 0.3), sp.col,
        { alpha: wa * 1.5, layers: 6, wobble: 0.1, gran: false });
      setPen(sp.col.map(v => v * 0.62));
      for (let j = 0, m = ri(R, 6, 13); j < m; j++)
        nib(R, bx + rr(R, -br, br), by + rr(R, -br, br), Math.max(0.5, br * rr(R, 0.16, 0.3)), la * rr(R, 0.5, 0.9));
    }
    setPen(prev); return;
  }

  if (sp.style === 'brush') {
    // bottlebrush: filaments straight out of a stem, dense at the middle
    const len = r * 1.5, ax = rr(R, -0.35, 0.35);
    const hull = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, sw = Math.sin(Math.PI * Math.pow(t, 0.8)) * r * 0.72;
      hull.push([cx + (t - 0.5) * len * Math.cos(ax) - sw * Math.sin(ax), cy + (t - 0.5) * len * Math.sin(ax) + sw * Math.cos(ax)]);
    }
    for (let i = 10; i >= 0; i--) {
      const t = i / 10, sw = Math.sin(Math.PI * Math.pow(t, 0.8)) * r * 0.72;
      hull.push([cx + (t - 0.5) * len * Math.cos(ax) + sw * Math.sin(ax), cy + (t - 0.5) * len * Math.sin(ax) - sw * Math.cos(ax)]);
    }
    wash(R, hull, sp.col, { alpha: wa * 1.3, layers: 9, wobble: 0.07 });
    setPen(sp.col.map(v => v * 0.75));
    for (let i = 0, n = ri(R, 26, 44); i < n; i++) {
      const t = R(), sw = Math.sin(Math.PI * Math.pow(t, 0.8)) * r * (R() < 0.5 ? -0.85 : 0.85) * rr(R, 0.5, 1.1);
      const bx = cx + (t - 0.5) * len * Math.cos(ax), by = cy + (t - 0.5) * len * Math.sin(ax);
      const tx = bx - sw * Math.sin(ax), ty = by + sw * Math.cos(ax);
      ink(R, [[bx, by], [tx, ty]], lw * 0.8, { alpha: la * rr(R, 0.5, 1), amp: 0.5, skip: 1.4, nib: false, minPress: 0.4 });
      if (chance(R, 0.4)) nib(R, tx, ty, lw * 0.7, la * 0.6);
    }
    setPen(prev); return;
  }

  if (sp.style === 'claw') {
    // kangaroo paw: velvet tubes off one side of a stalk, curling up at the tip
    const base = [cx, cy + r * 0.7];
    for (let i = 0, n = ri(R, 3, 6); i < n; i++) {
      const a = -Math.PI / 2 + rr(R, -0.85, 0.5) + i * 0.16;
      const ln = r * rr(R, 0.8, 1.25);
      const mid = [base[0] + Math.cos(a) * ln * 0.6, base[1] + Math.sin(a) * ln * 0.6];
      const tip = [mid[0] + Math.cos(a - 0.7) * ln * 0.45, mid[1] + Math.sin(a - 0.7) * ln * 0.45];
      const path = chaikin([base, mid, tip], false, 2);
      const wd = r * 0.15;
      const hull = [...path.map(p => [p[0] - wd, p[1]]), ...path.slice().reverse().map(p => [p[0] + wd, p[1]])];
      wash(R, hull, i > 1 ? sp.col : [104, 140, 60], { alpha: wa * 1.6, layers: 6, wobble: 0.09, gran: false });
      setPen((i > 1 ? sp.col : [104, 140, 60]).map(v => v * 0.7));
      ink(R, path, lw, { alpha: la, amp: 0.6, skip: 1.2, nib: false });
      // the nap on the tube
      for (let k = 0, m = ri(R, 3, 7); k < m; k++) {
        const t = rr(R, 0.15, 0.9), p = path[Math.floor(t * (path.length - 1))];
        ink(R, [[p[0] - wd * 0.8, p[1]], [p[0] + wd * 0.8, p[1]]], lw * 0.5,
          { alpha: la * 0.4, amp: 0.3, skip: 1.6, nib: false, minPress: 0.4 });
      }
    }
    setPen(prev); return;
  }

  if (sp.style === 'tussock') {
    // kangaroo grass: the seed head, not a flower — bronze, hanging, awned
    setPen(sp.col.map(v => v * 0.8));
    for (let i = 0, n = ri(R, 5, 10); i < n; i++) {
      const a = rr(R, -2.6, -0.5), ln = r * rr(R, 0.7, 1.3);
      const tip = [cx + Math.cos(a) * ln, cy + Math.sin(a) * ln];
      ink(R, [[cx, cy], tip], lw * 0.9, { alpha: la * rr(R, 0.6, 1), amp: 0.8, skip: 1.3, nib: false });
      // the seed itself, a dark grain, and the awn bent off it
      wash(R, ring(R, tip[0], tip[1], r * 0.16, r * 0.3, 9, a, 0.3), sp.col, { alpha: wa * 2, layers: 5, gran: false, edge: false });
      nib(R, tip[0], tip[1], lw * 1.3, la * 0.8);
      const aw = a + rr(R, -0.9, 0.9);
      ink(R, [tip, [tip[0] + Math.cos(aw) * ln * 0.5, tip[1] + Math.sin(aw) * ln * 0.5]], lw * 0.5,
        { alpha: la * 0.5, amp: 1.1, skip: 1.6, nib: false, minPress: 0.35 });
    }
    setPen(prev); return;
  }

  // --- daisy: flannel flower and the everlastings ---
  const n = sp.id === 'flannel' ? ri(R, 8, 12) : ri(R, 11, 17);
  const len = r * rr(R, 0.85, 1.05);
  const wid = sp.id === 'flannel' ? r * rr(R, 0.18, 0.26) : r * rr(R, 0.1, 0.16);
  const a0 = rr(R, 0, TAU);
  wash(R, ring(R, cx, cy, r * 1.05, r * 1.05, 13, a0, 0.22), sp.col,
    { alpha: wa * (sp.id === 'flannel' ? 0.7 : 1.4), layers: 8, wobble: 0.1 });
  for (let i = 0; i < n; i++) {
    if (chance(R, 0.07)) continue;                 // one of them never got drawn
    const a = a0 + i / n * TAU + rr(R, -0.15, 0.15);
    const pet = rotT(petalPts(R, len * rr(R, 0.8, 1.14), wid * rr(R, 0.84, 1.16), rr(R, 0, 7)), a, cx, cy);
    if (sp.id === 'flannel') {
      // the grey-green tip is the whole tell of a flannel flower
      setPen([150, 160, 120]);
      const tip = pet.slice(6, 13);
      if (tip.length > 2) ink(R, tip, lw * 0.9, { alpha: la * 0.7, amp: 0.5, skip: 1.2, nib: false });
    }
    setPen(sp.col.map(v => Math.min(200, v * 0.55)));
    inkLoop(R, pet, lw * rr(R, 0.8, 1.2), { alpha: la * rr(R, 0.7, 1), redraw: 0.25, segs: 2 });
  }
  setPen([160, 120, 48]);
  const cr = r * rr(R, 0.16, 0.25);
  wash(R, ring(R, cx, cy, cr * 1.3, cr * 1.3, 9, 0, 0.2), [190, 150, 50], { alpha: wa * 2, layers: 5, gran: false });
  for (let k = 0, m = ri(R, 6, 14); k < m; k++)
    nib(R, cx + rr(R, -cr, cr), cy + rr(R, -cr, cr), Math.max(0.6, cr * rr(R, 0.2, 0.4)), la * rr(R, 0.5, 0.85));
  setPen(prev);
}

// --- a clump. Nobody planted it, so the kinds are mixed and the tall ones
// --- ended up at the back.
function floraPatch(R, cx, cy, w, h, dp, kinds) {
  const prev = getPen();
  const ks = kinds || shuffle(R, SPECIES.slice()).slice(0, ri(R, 2, 3));
  const leaf = pick(R, GREENS);
  const heads = [];
  for (let i = 0, n = ri(R, 4, 9); i < n; i++) {
    const sp = pick(R, ks);
    const x = cx + rr(R, -w / 2, w / 2);
    const depth = R();                                  // back of the clump to the front
    const y = cy - depth * h * 0.25;
    const r = sp.w * (0.5 + dp * 0.7) * rr(R, 0.75, 1.25) * (0.8 + depth * 0.4);
    const stem = h * rr(R, 0.55, 1) * (0.6 + dp * 0.6);
    heads.push({ sp, x, y: y - stem, r, base: [x, y], depth });
  }
  heads.sort((a, b) => a.depth - b.depth);

  // stems and leaves first, the way they go down first in life
  setPen(leaf.map(v => v * 0.62));
  for (const hd of heads) {
    const bend = rr(R, -0.22, 0.22) * (hd.base[1] - hd.y);
    const path = chaikin([hd.base, [hd.base[0] + bend * 0.5, (hd.base[1] + hd.y) / 2], [hd.x, hd.y]], false, 2);
    const sw = Math.max(0.6, hd.r * 0.07);
    wash(R, [...path.map(p => [p[0] - sw, p[1]]), ...path.slice().reverse().map(p => [p[0] + sw, p[1]])],
      leaf, { alpha: 0.05 + dp * 0.04, layers: 5, gran: false, bleed: false });
    ink(R, path, sw, { alpha: (0.3 + dp * 0.35) * rr(R, 0.7, 1), amp: 0.7, skip: 1.2, ghost: 0.2 });
    for (let k = 0, m = ri(R, 1, 3); k < m; k++) {
      const t = rr(R, 0.2, 0.8), p = path[Math.floor(t * (path.length - 1))];
      const a = rr(R, 0, TAU), ll = hd.r * rr(R, 0.5, 1.1);
      const lf = rotT(petalPts(R, ll, ll * 0.2, rr(R, 0, 7)), a, p[0], p[1]);
      wash(R, lf, leaf, { alpha: 0.05 + dp * 0.05, layers: 5, gran: false });
      inkLoop(R, lf, sw * 0.8, { alpha: (0.22 + dp * 0.25), segs: 2 });
    }
  }
  for (const hd of heads) flowerHead(R, hd.x, hd.y, hd.r, hd.sp, dp);
  setPen(prev);
  return ks;
}

// --- grass. The ground is mostly this, and it carries all the depth. ---------
function grassTuft(R, x, y, h, dp) {
  const prev = getPen();
  setPen(pick(R, GREENS).map(v => v * (0.5 + (1 - dp) * 0.3)));
  for (let i = 0, n = ri(R, 4, 11); i < n; i++) {
    const lean = rr(R, -0.55, 0.55);
    const bh = h * rr(R, 0.55, 1.15);
    const path = chaikin([[x, y], [x + lean * bh * 0.35, y - bh * 0.6], [x + lean * bh, y - bh]], false, 2);
    ink(R, path, Math.max(0.45, h * 0.022) * (0.5 + dp * 0.8),
      { alpha: (0.16 + dp * 0.4) * rr(R, 0.6, 1.1), amp: 0.6, skip: 0.7 + dp, nib: false, minPress: 0.35, taper: 0.3 });
  }
  setPen(prev);
}

// --- eucalypt: sickle leaves hanging edge-on, which is why gum trees give no
// --- shade worth having.
function gumSpray(R, x, y, r, dp) {
  const prev = getPen();
  wash(R, ring(R, x, y, r, r * 0.75, 13, rr(R, 0, TAU), 0.35), GUM,
    { alpha: 0.035 + dp * 0.03, layers: 8, wobble: 0.13 });
  setPen(GUM.map(v => v * 0.6));
  for (let i = 0, n = ri(R, 7, 16); i < n; i++) {
    const a = rr(R, 0, TAU), d = rr(R, 0, r);
    const lx = x + Math.cos(a) * d, ly = y + Math.sin(a) * d * 0.75;
    const ll = r * rr(R, 0.25, 0.5), la2 = rr(R, 1.1, 2.1);   // they hang
    const lf = rotT(petalPts(R, ll, ll * 0.16, rr(R, 0, 7)), la2, lx, ly);
    inkLoop(R, lf, Math.max(0.5, r * 0.018) * (0.5 + dp * 0.7),
      { alpha: (0.2 + dp * 0.3) * rr(R, 0.7, 1), segs: 2 });
  }
  setPen(prev);
}
