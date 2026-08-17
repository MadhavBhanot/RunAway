// ---------------------------------------------------------------------------
// Polyline geometry. Everything drawn is a list of [x,y].
// ---------------------------------------------------------------------------
'use strict';

// Even spacing along a path. ink() depends on this: the wobble and pressure
// functions are indexed by point, so uneven points make an uneven line.
function resample(pts, step) {
  if (!pts || pts.length < 2) return pts ? pts.slice() : [];
  const out = [[pts[0][0], pts[0][1]]];
  let need = step;
  for (let i = 1; i < pts.length; i++) {
    let x0 = pts[i - 1][0], y0 = pts[i - 1][1];
    const x1 = pts[i][0], y1 = pts[i][1];
    let d = Math.hypot(x1 - x0, y1 - y0);
    while (d >= need) {
      const t = need / d;
      x0 += (x1 - x0) * t; y0 += (y1 - y0) * t;
      out.push([x0, y0]);
      d -= need; need = step;
    }
    need -= d;
  }
  const last = pts[pts.length - 1];
  const tail = out[out.length - 1];
  if (Math.hypot(last[0] - tail[0], last[1] - tail[1]) > step * 0.3) out.push([last[0], last[1]]);
  return out;
}

// Corner cutting. Two passes turns a jagged hull into something that looks
// like water found its own edge.
function chaikin(pts, closed, it) {
  let p = pts;
  for (let k = 0; k < it; k++) {
    const out = [];
    const n = p.length;
    if (!closed) out.push(p[0]);
    const lim = closed ? n : n - 1;
    for (let i = 0; i < lim; i++) {
      const a = p[i], b = p[(i + 1) % n];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    if (!closed) out.push(p[n - 1]);
    p = out;
  }
  return p;
}

function poly(g, pts, close) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  if (close) g.closePath();
}

function bbox(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) {
    if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
    if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

function ring(R, cx, cy, rx, ry, n = 16, rot = 0, jit = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const j = jit ? 1 + (R() - 0.5) * jit : 1;
    out.push([cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j]);
  }
  return out;
}

const rotT = (pts, a, cx, cy) => {
  const c = Math.cos(a), s = Math.sin(a);
  return pts.map(p => [cx + p[0] * c - p[1] * s, cy + p[0] * s + p[1] * c]);
};

const perim = pts => {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return d;
};

// A teardrop, drawn out one side and back the other, never symmetrical.
// Lifted in spirit from the reference: the asymmetry is the whole point.
function petalPts(R, len, wid, ph) {
  const up = [], dn = [], n = 9;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const hw = wid * Math.pow(Math.sin(Math.PI * t), 0.7) * (1 + 0.13 * Math.sin(t * 5.1 + ph));
    const x = len * t * (1 + 0.05 * Math.sin(t * 2.7 + ph));
    up.push([x, hw + (R() - 0.5) * 0.8]);
    dn.push([x, -hw * (0.86 + R() * 0.2) + (R() - 0.5) * 0.8]);
  }
  return [...up, ...dn.reverse()];
}

if (typeof module !== 'undefined') module.exports = {
  resample, chaikin, poly, bbox, ring, rotT, perim, petalPts
};
