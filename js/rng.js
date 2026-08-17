// ---------------------------------------------------------------------------
// Seeded randomness. Every mark on the page traces back to one integer.
// ---------------------------------------------------------------------------
'use strict';

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const randSeed = () => (Math.random() * 0x7fffffff) | 0;
const rr = (R, a, b) => a + R() * (b - a);
const ri = (R, a, b) => Math.floor(rr(R, a, b + 1));
const chance = (R, p) => R() < p;
const pick = (R, arr) => arr[(R() * arr.length) | 0];

function weighted(R, pairs) {
  let total = 0;
  for (const p of pairs) total += p[1];
  let v = R() * total;
  for (const p of pairs) { v -= p[1]; if (v <= 0) return p[0]; }
  return pairs[pairs.length - 1][0];
}

function shuffle(R, a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = ri(R, 0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);

// Value noise on a coarse lattice, sampled bilinearly. Cheap and good enough
// for paper fibre and the drift of a wash.
function noiseField(R, nx, ny) {
  const d = new Float32Array(nx * ny);
  for (let i = 0; i < d.length; i++) d[i] = R();
  return { nx, ny, d };
}

function sampleField(f, u, v) {
  const x = clamp(u, 0, 1) * (f.nx - 1);
  const y = clamp(v, 0, 1) * (f.ny - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(f.nx - 1, x0 + 1), y1 = Math.min(f.ny - 1, y0 + 1);
  const tx = smooth(x - x0), ty = smooth(y - y0);
  const a = lerp(f.d[y0 * f.nx + x0], f.d[y0 * f.nx + x1], tx);
  const b = lerp(f.d[y1 * f.nx + x0], f.d[y1 * f.nx + x1], tx);
  return lerp(a, b, ty);
}

if (typeof module !== 'undefined') module.exports = {
  TAU, D2R, mulberry32, randSeed, rr, ri, chance, pick, weighted, shuffle,
  clamp, lerp, smooth, noiseField, sampleField
};
