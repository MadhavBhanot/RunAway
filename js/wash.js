// ---------------------------------------------------------------------------
// THE WASH
//
// The reference has no wet media at all — its colour is coloured pencil. This
// layer is new, and it lives UNDER every pencil mark on its own canvas.
//
// Four things separate watercolour from a coloured shape. In rough order of how
// much each one matters:
//
//   EDGE DARKENING  pigment is carried to the drying edge and settles there.
//                   This single detail does most of the work.
//   ACCUMULATION    many faint passes, each a slightly different shape, rather
//                   than one flat fill. Real washes are never even.
//   GRANULATION     pigment sinks into the pits of the paper. Sampled from the
//                   SAME grain field the pencil skips on, at opposite polarity
//                   (§ the pencil misses peaks; the wash pools in valleys).
//   BLEED           where the water ran further than intended.
// ---------------------------------------------------------------------------
'use strict';

let WG = null;                       // the wash canvas context
const setWashTarget = ctx => { WG = ctx; };

const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

// Push a hull in and out around its own centre. Each pass gets its own phase,
// so no two passes dry to the same shape.
function deform(pts, cx, cy, amp, ph) {
  return pts.map(p => {
    const dx = p[0] - cx, dy = p[1] - cy;
    const a = Math.atan2(dy, dx);
    const w = 0.6 * Math.sin(a * 2.3 + ph) + 0.3 * Math.sin(a * 5.1 + ph * 1.7) + 0.2 * Math.sin(a * 9.3 + ph * 0.6);
    const s = 1 + amp * w;
    return [cx + dx * s, cy + dy * s];
  });
}

function wash(R, pts, col, o = {}) {
  if (!WG || !pts || pts.length < 3) return;
  const b = bbox(pts);
  const size = Math.max(b.w, b.h);
  if (size < 0.5) return;
  const cx = b.x0 + b.w / 2, cy = b.y0 + b.h / 2;

  const layers = o.layers ?? clamp(Math.round(size / 14) + 4, 4, 12);
  const a1 = o.alpha ?? 0.05;
  const wob = o.wobble ?? 0.055;
  const chaikinPasses = pts.length > 24 ? 1 : 2;

  WG.save();
  WG.globalCompositeOperation = 'multiply';

  // --- accumulation: many faint, differently-shaped passes ---
  let mean = null;
  for (let k = 0; k < layers; k++) {
    const t = k / Math.max(1, layers - 1);
    // later passes pull inward — the puddle retreats as it dries
    const shrink = 1 - t * rr(R, 0.04, 0.16);
    const d = chaikin(deform(pts, cx, cy, wob * rr(R, 0.5, 1.5), rr(R, 0, TAU)), true, chaikinPasses)
      .map(p => [cx + (p[0] - cx) * shrink, cy + (p[1] - cy) * shrink]);
    if (k === 0) mean = d;
    poly(WG, d, true);
    WG.fillStyle = rgba(col, a1 * rr(R, 0.6, 1.4));
    WG.fill();
  }

  // --- bleed: a few fingers where the water got away ---
  if (o.bleed !== false) {
    for (let k = 0, n = ri(R, 0, 3); k < n; k++) {
      const a = rr(R, 0, TAU), reach = size * rr(R, 0.12, 0.4);
      const ex = cx + Math.cos(a) * (b.w / 2), ey = cy + Math.sin(a) * (b.h / 2);
      const tip = [ex + Math.cos(a) * reach, ey + Math.sin(a) * reach];
      const wd = size * rr(R, 0.05, 0.14);
      const finger = chaikin([
        [ex - Math.sin(a) * wd, ey + Math.cos(a) * wd],
        [lerp(ex, tip[0], 0.5) - Math.sin(a) * wd * 0.5, lerp(ey, tip[1], 0.5) + Math.cos(a) * wd * 0.5],
        tip,
        [lerp(ex, tip[0], 0.5) + Math.sin(a) * wd * 0.6, lerp(ey, tip[1], 0.5) - Math.cos(a) * wd * 0.6],
        [ex + Math.sin(a) * wd, ey - Math.cos(a) * wd]
      ], true, 2);
      poly(WG, finger, true);
      WG.fillStyle = rgba(col, a1 * rr(R, 1, 2.2));
      WG.fill();
    }
  }

  // --- edge darkening: the tideline where pigment was left behind ---
  if (o.edge !== false && mean) {
    const canBlur = typeof WG.filter === 'string';
    // Proportional blur is right for a puddle and ruinous for a page-wide
    // band, where it asks for a 49px blur on a stroke thousands of pixels
    // long. Past about this much the tideline is soft either way.
    if (canBlur) WG.filter = `blur(${Math.min(9, size * 0.02 + 0.6).toFixed(2)}px)`;
    poly(WG, mean, true);
    WG.strokeStyle = rgba(col, (o.edgeAlpha ?? 0.16) * rr(R, 0.8, 1.3));
    WG.lineWidth = Math.max(1, size * rr(R, 0.02, 0.05));
    WG.lineJoin = 'round';
    WG.stroke();
    // it is not even all the way round — one side dried first
    const s = ri(R, 0, mean.length - 1), span = Math.round(mean.length * rr(R, 0.2, 0.45));
    const arc = [];
    for (let i = 0; i <= span; i++) arc.push(mean[(s + i) % mean.length]);
    poly(WG, arc, false);
    WG.strokeStyle = rgba(col, (o.edgeAlpha ?? 0.16) * rr(R, 0.9, 1.6));
    WG.lineWidth = Math.max(1, size * rr(R, 0.02, 0.06));
    WG.stroke();
    if (canBlur) WG.filter = 'none';
  }

  // --- granulation: pigment in the pits of the sheet ---
  if (o.gran !== false && size > 6 && mean) {
    WG.save();
    poly(WG, mean, true);
    WG.clip();
    // Granulation is a texture, not a per-pixel simulation. The count came
    // off size squared, so a page-wide band asked for ~118,000 dots and was
    // on its own a quarter of the build. Small washes are far below the cap
    // and are unchanged by it.
    const n = Math.min(5000, Math.round(size * size * 0.02));
    for (let i = 0; i < n; i++) {
      const x = rr(R, b.x0, b.x1), y = rr(R, b.y0, b.y1);
      const pit = 1 - peakAt(x, y);              // opposite polarity to the pencil
      if (!chance(R, pit * 0.55)) continue;
      WG.fillStyle = rgba(col, rr(R, 0.05, 0.16) * pit);
      WG.beginPath();
      WG.arc(x, y, rr(R, 0.4, 1.5), 0, TAU);
      WG.fill();
    }
    WG.restore();
  }

  WG.restore();
}

// A long horizontal band — the ground, the sky. Wet at one edge, dry at the
// other, which is how you lay a graded wash on a tilted board.
//
// `ragged` is the wobble of the top edge IN PIXELS, deliberately not a
// fraction of the band's height: a page-tall band with a proportional wobble
// grows a mountain range out of its own top edge.
function washBand(R, x0, y0, x1, y1, col, o = {}) {
  // Overshoot the ends. wash() deforms and shrinks a hull about its own
  // centre, which is right for a puddle and wrong for a band — it drags the
  // ends inward and leaves a vertical seam down each side of the picture.
  // Running past the edge puts those seams off-screen where they belong.
  const over = (x1 - x0) * 0.14;
  x0 -= over; x1 += over;
  const steps = Math.max(6, Math.min(22, Math.round((x1 - x0) / 72)));
  const top = [], bot = [];
  const amp = o.ragged ?? 10;
  const ph = rr(R, 0, TAU);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, x = lerp(x0, x1, t);
    top.push([x, y0 + Math.sin(t * 7.3 + ph) * amp + Math.sin(t * 17 + ph * 2) * amp * 0.4]);
    bot.push([x, y1 + Math.sin(t * 5.1 + ph * 1.4) * amp * 0.5]);
  }
  wash(R, [...top, ...bot.reverse()], col,
    Object.assign({ wobble: 0.012, layers: 8, alpha: 0.045, bleed: false }, o));
}
