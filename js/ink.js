// ---------------------------------------------------------------------------
// THE PENCIL
//
// One function does nearly all the work on this page. A line is not a stroked
// path — it is a ribbon whose width and darkness rise and fall together the way
// a hand leaning on a pencil makes them, laid down in short chunks of slightly
// different darkness, missing the paper where the tooth stands up.
//
// Three details are load-bearing. Remove any one and it reads as a computer
// drawing it:
//   - the chunked fill (a single even fill is the tell)
//   - skips keyed to a shared grain field, so two lines skip in the SAME places
//   - the ghost: the line that was there before this one was committed to
// ---------------------------------------------------------------------------
'use strict';

const PAPER_RGB = [232, 226, 210];
const INK_RGB = [38, 35, 36];
const PENS = [[28, 26, 27], [30, 28, 29], [24, 24, 26], [20, 26, 52], [26, 32, 64], [22, 28, 46]];

let G = null;                 // where ink lands
let CUR = INK_RGB;            // the colour in the hand right now
let PRESS_W = 1.22;           // how blunt the point is, this sheet
const PRESS_A = 1.2;
let GRAIN = null;             // {a, b, lo, span} — shared with the wash layer
let PGW = 1, PGH = 1;         // page size in CSS px, for grain lookup

const inkA = a => `rgba(${CUR[0]},${CUR[1]},${CUR[2]},${Math.min(1, a * PRESS_A)})`;

function setInkTarget(ctx, o = {}) {
  G = ctx;
  if (o.grain) GRAIN = o.grain;
  if (o.w) PGW = o.w;
  if (o.h) PGH = o.h;
  if (o.press) PRESS_W = o.press;
}
const setPen = rgb => { CUR = rgb; };
const getPen = () => CUR;

// How far the paper's tooth stands up here. ink() misses on the peaks.
function peakAt(x, y) {
  if (!GRAIN) return 1;
  const u = x / PGW, v = y / PGH;
  const h = sampleField(GRAIN.a, u, v) * 0.68 + sampleField(GRAIN.b, u, v) * 0.32;
  return smooth(clamp((h - GRAIN.lo) / GRAIN.span, 0, 1));
}

// A blot where the point stopped and sat.
function nib(R, x, y, r, a) {
  for (let k = 0; k < 3; k++) {
    G.beginPath();
    G.arc(x + rr(R, -r * 0.3, r * 0.3), y + rr(R, -r * 0.3, r * 0.3), r * rr(R, 0.5, 1), 0, TAU);
    G.fillStyle = inkA(a * rr(R, 0.5, 0.9));
    G.fill();
  }
}

function ink(R, pts, w, o = {}) {
  if (!pts || pts.length < 2) return;
  w *= PRESS_W;
  const alpha = o.alpha ?? rr(R, 0.8, 1);
  const amp = o.amp ?? (w * 0.34 + 0.7);
  const skip = o.skip ?? 1;
  let p = pts;

  // an overshoot veers off-axis, the way a flick of the wrist does
  if (o.over) {
    p = p.slice();
    const a = p[0], b = p[1], d0 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, f0 = o.over * rr(R, -0.5, 0.5);
    p[0] = [a[0] - (b[0] - a[0]) / d0 * o.over - (b[1] - a[1]) / d0 * f0,
            a[1] - (b[1] - a[1]) / d0 * o.over + (b[0] - a[0]) / d0 * f0];
    const y = p[p.length - 1], z = p[p.length - 2], d1 = Math.hypot(y[0] - z[0], y[1] - z[1]) || 1, f1 = o.over * rr(R, -0.5, 0.5);
    p[p.length - 1] = [y[0] + (y[0] - z[0]) / d1 * o.over - (y[1] - z[1]) / d1 * f1,
                       y[1] + (y[1] - z[1]) / d1 * o.over + (y[0] - z[0]) / d1 * f1];
  }

  const rs = resample(p, Math.max(1.6, w * 0.7));
  const n = rs.length;
  if (n < 3) {
    G.strokeStyle = inkA(alpha); G.lineWidth = w; G.lineCap = 'round';
    poly(G, p, false); G.stroke();
    return;
  }

  const p1 = rr(R, 0, 7), p2 = rr(R, 0, 7), p3 = rr(R, 0, 7);
  const f1 = rr(R, 1.3, 3.2), f2 = rr(R, 4.5, 8), f3 = rr(R, 13, 22);

  // pressure: the hand leans unevenly, and somewhere along the way it digs in.
  const q1 = rr(R, 0, 7), q2 = rr(R, 0, 7), qf = rr(R, 0.7, 2.3);
  const dig = chance(R, 0.5) ? rr(R, 0.1, 0.9) : -1;
  const digW = rr(R, 0.07, 0.22), digA = rr(R, 0.35, 0.75);
  const faint = chance(R, 0.3) ? rr(R, 0.1, 0.9) : -1;   // and somewhere it goes feathery
  const wf = o.wfn;
  const press = t => {
    let v = 0.84 + 0.26 * Math.sin(t * qf * TAU + q1) + 0.1 * Math.sin(t * 5.3 + q2);
    if (dig >= 0) v += digA * Math.exp(-Math.pow((t - dig) / digW, 2));
    if (faint >= 0) v -= 0.42 * Math.exp(-Math.pow((t - faint) / (digW * 1.3), 2));
    if (wf) v *= wf(t);
    return Math.max(o.minPress ?? 0.3, Math.min(1.9, v));
  };

  const L = [], Rt = [], C = [], P = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = rs[Math.max(0, i - 1)], b = rs[Math.min(n - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const d = Math.hypot(nx, ny) || 1; nx /= d; ny /= d;
    const off = amp * (0.55 * Math.sin(t * f1 * 3 + p1) + 0.3 * Math.sin(t * f2 + p2) + 0.15 * Math.sin(t * f3 + p3));
    const px = rs[i][0] + nx * off + rr(R, -0.3, 0.3);
    const py = rs[i][1] + ny * off + rr(R, -0.3, 0.3);
    const pr = press(t);
    let half = w / 2 * pr * (1 + 0.18 * Math.sin(t * f2 * 1.6 + p3) + rr(R, -0.09, 0.09));
    if (!o.loop) { const e = Math.min(t, 1 - t); half *= 0.5 + 0.5 * smooth(Math.min(1, e / (o.taper ?? 0.06))); }
    half = Math.max(half, 0.24);
    L.push([px + nx * half, py + ny * half]);
    Rt.push([px - nx * half, py - ny * half]);
    C.push([px, py, half, nx, ny]);
    P.push(pr);
  }

  // Laid down in short chunks, each a slightly different darkness. A single
  // even fill is the thing that reads as a computer drawing it.
  const CH = Math.max(3, Math.round(6 + w));
  for (let i = 0; i < n - 1; i += CH) {
    const j = Math.min(n - 1, i + CH);
    let pm = 0;
    for (let k = i; k <= j; k++) pm += P[k];
    pm /= (j - i + 1);
    G.beginPath();
    G.moveTo(L[i][0], L[i][1]);
    for (let k = i + 1; k <= j; k++) G.lineTo(L[k][0], L[k][1]);
    for (let k = j; k >= i; k--) G.lineTo(Rt[k][0], Rt[k][1]);
    G.closePath();
    G.fillStyle = inkA(alpha * Math.min(1, 0.58 + pm * 0.42) * rr(R, 0.88, 1.06));
    G.fill();
  }

  // graphite that didn't stay on the line
  if (w >= 1.1) {
    for (let i = 0; i < n; i += 2) {
      if (chance(R, 0.62)) continue;
      const [px, py, half, nx, ny] = C[i];
      const u = rr(R, -1.3, 1.3), sz = rr(R, 0.5, 1.4);
      G.fillStyle = inkA(alpha * rr(R, 0.15, 0.5));
      G.fillRect(px + nx * half * u + rr(R, -0.5, 0.5) - sz / 2, py + ny * half * u + rr(R, -0.5, 0.5) - sz / 2, sz, sz);
    }
  }

  // Where the paper stood up, the lead never touched it — and it stands up in
  // the same places for every stroke, which is why two lines skip together.
  // Erased rather than painted over, so a wash underneath still shows through.
  if (skip > 0) {
    G.save();
    G.globalCompositeOperation = 'destination-out';
    for (let i = 1; i < n - 1; i++) {
      const [px, py, half] = C[i];
      if (!chance(R, GRAIN ? 0.042 * skip * peakAt(px, py) : 0.016 * skip)) continue;
      G.beginPath();
      G.ellipse(px + rr(R, -half, half), py + rr(R, -half, half),
        half * rr(R, 0.5, 1.4), half * rr(R, 0.5, 1.5), rr(R, 0, TAU), 0, TAU);
      G.fillStyle = `rgba(0,0,0,${rr(R, 0.5, 0.92)})`;
      G.fill();
    }
    G.restore();
  }

  if (o.nib !== false && chance(R, 0.4)) nib(R, C[n - 1][0], C[n - 1][1], w * 0.62, alpha);
  if (o.nib !== false && chance(R, 0.25)) nib(R, C[0][0], C[0][1], w * 0.6, alpha);

  // the line that was there before this one was committed to
  if (o.ghost && chance(R, o.ghost === true ? 0.55 : o.ghost)) {
    ink(R, pts, w * 0.42 / PRESS_W, { alpha: alpha * 0.22, amp: amp * 2.1, skip: 0, nib: false });
    if (chance(R, 0.3)) ink(R, pts, w * 0.34 / PRESS_W, { alpha: alpha * 0.13, amp: amp * 3, skip: 0, nib: false });
  }
}

// A closed outline is never one confident lap. It is two or three passes that
// start in the wrong place, overlap, miss, and don't quite meet.
function inkLoop(R, pts, w, o = {}) {
  const loop = [...pts, pts[0]];
  const rs = resample(loop, Math.max(2.5, perim(loop) / 90));
  const n = rs.length;
  if (n < 8) { ink(R, loop, w, { ...o, loop: true }); return; }
  const segs = o.segs ?? ri(R, 2, 3);
  let s = ri(R, 0, n - 1);
  for (let k = 0; k < segs; k++) {
    const span = Math.round(n / segs * rr(R, 1.05, 1.45));   // they overlap
    const arc = [];
    for (let i = 0; i <= span; i++) arc.push(rs[(s + i) % n]);
    ink(R, arc, w * rr(R, 0.85, 1.1), {
      alpha: (o.alpha ?? rr(R, 0.7, 0.95)) * rr(R, 0.85, 1.05),
      over: rr(R, 0.5, 2), ghost: o.ghost, taper: 0.1, skip: o.skip
    });
    s = (s + Math.round(n / segs * rr(R, 0.85, 1))) % n;
  }
  // one pass gone over again where the hand pressed to commit it
  if (o.redraw && chance(R, o.redraw)) {
    const a = ri(R, 0, n - 1), span = Math.round(n * rr(R, 0.18, 0.4)), arc = [];
    for (let i = 0; i <= span; i++) arc.push(rs[(a + i) % n]);
    ink(R, arc, w * rr(R, 0.9, 1.2), { alpha: rr(R, 0.5, 0.8), taper: 0.12 });
  }
}

// Lift what is already there, softly. A note written over a wash sits in a
// little clearing — the nib pushes the wet colour aside as it goes. Erases
// rather than paints, so the paper's own tone comes back, not a flat patch.
function liftOn(ctx, x, y, rx, ry, a) {
  if (!ctx) return;
  const r = Math.max(0.001, rx, ry);
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.translate(x, y);
  ctx.scale(rx / r, ry / r);            // squash the circle into the ellipse
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, `rgba(0,0,0,${a})`);
  g.addColorStop(0.62, `rgba(0,0,0,${a * 0.72})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.restore();
}
const liftPaper = (x, y, rx, ry, a) => liftOn(G, x, y, rx, ry, a);

// Parallel strokes at an angle, for shadow under a clump.
function hatch(R, box, o = {}) {
  const ang = o.angle ?? rr(R, -1.2, -0.7);
  const gap = o.gap ?? rr(R, 3, 6);
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const cx = box.x0 + box.w / 2, cy = box.y0 + box.h / 2;
  // How far the box reaches along the stroke direction, and across it. Both
  // used to come off the box's diagonal, which is wrong for a wide, flat
  // block — a cloud's underside — in two expensive ways: it swept a third
  // further than the box actually spans, and it made every stroke nearly as
  // long as the box is wide. Those picture-width diagonals were most of the
  // cost of the whole build, and they read as smudge rather than shading.
  const along = Math.abs(box.w * dx) + Math.abs(box.h * dy);
  const across = Math.abs(box.w * dy) + Math.abs(box.h * dx);
  // A block is shaded by many short marks, not a few strokes the width of
  // the picture, so cap a stroke against the box's short side.
  const maxHalf = Math.min(along, Math.min(box.w, box.h) * 1.6) / 2;
  for (let d = -across / 2; d < across / 2; d += gap * rr(R, 0.8, 1.3)) {
    const mx = cx - dy * d, my = cy + dx * d;
    const half = maxHalf * rr(R, 0.5, 1);
    ink(R, [[mx - dx * half, my - dy * half], [mx + dx * half, my + dy * half]],
      (o.w ?? 0.8) * rr(R, 0.8, 1.2),
      { alpha: (o.alpha ?? 0.2) * rr(R, 0.6, 1.2), amp: 1.2, skip: 1.4, nib: false, minPress: 0.4 });
  }
}
