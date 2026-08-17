// ---------------------------------------------------------------------------
// THE PAPER
//
// Baked once per seed into its own canvas: the stock, its fibre, its wear, the
// binding it is bound into, and whatever the mill ruled on it.
//
// It also produces the grain field, which is the quiet spine of the whole
// thing. The pencil misses the paper where the tooth stands up; watercolour
// pools where it dips. One field, sampled at opposite polarity, is why the two
// media look like they happened on the same sheet.
// ---------------------------------------------------------------------------
'use strict';

function buildPaper(W, H, DPR, seed, o = {}) {
  const R = mulberry32(seed ^ 0x5eed);
  const cv = (typeof document !== 'undefined') ? document.createElement('canvas') : null;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  const g = cv.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);

  const warm = rr(R, -7, 7);                       // this ream ran warm, or it didn't
  const base = [PAPER_RGB[0] + warm, PAPER_RGB[1] + warm * 0.7, PAPER_RGB[2] + warm * 0.3];
  g.fillStyle = `rgb(${base.map(v => v | 0).join(',')})`;
  g.fillRect(0, 0, W, H);

  // pulp blotching: fast scaled buffer instead of 80,000 separate fillRect string allocations
  const pw = Math.max(32, Math.round(W / 18)), ph = Math.max(32, Math.round(H / 18));
  const pcv = (typeof document !== 'undefined') ? document.createElement('canvas') : null;
  if (pcv) {
    pcv.width = pw; pcv.height = ph;
    const pg = pcv.getContext('2d');
    if (pg && pg.createImageData) {
      const imgData = pg.createImageData(pw, ph);
      const data = imgData.data;
      const oct = [[noiseField(R, 7, 9), 0.5], [noiseField(R, 17, 23), 0.32], [noiseField(R, 39, 52), 0.18]];
      const blot = rr(R, 0.1, 0.2);
      for (let py = 0; py < ph; py++) {
        const v = py / ph;
        for (let px = 0; px < pw; px++) {
          const u = px / pw;
          let n = 0;
          for (let oi = 0; oi < 3; oi++) n += sampleField(oct[oi][0], u, v) * oct[oi][1];
          const d = n - 0.5;
          const idx = (py * pw + px) * 4;
          if (d > 0) {
            data[idx] = 148; data[idx + 1] = 135; data[idx + 2] = 108;
            data[idx + 3] = Math.min(255, (d * blot * 255) | 0);
          } else {
            data[idx] = 250; data[idx + 1] = 246; data[idx + 2] = 234;
            data[idx + 3] = Math.min(255, (-d * blot * 255) | 0);
          }
        }
      }
      pg.putImageData(imgData, 0, 0);
      g.drawImage(pcv, 0, 0, W, H);
    }
  }

  // the tooth itself — fine, and the thing everything else agrees about
  const grain = {
    a: noiseField(R, 150, 100),
    b: noiseField(R, 61, 41),
    lo: rr(R, 0.5, 0.6),
    span: rr(R, 0.28, 0.42)
  };

  // ---- what the mill printed on it before anyone drew anything ----
  const stock = weighted(R, [['plain', 40], ['graph', 34], ['dot', 26]]);
  const rule = (x0, y0, x1, y1, col, wd) => {
    const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d, ny = dx / d, ph = rr(R, 0, 7), amp = rr(R, 0.25, 0.85);
    g.strokeStyle = col; g.lineWidth = wd;
    g.beginPath();
    for (let k = 0; k <= 12; k++) {
      const t = k / 12, off = Math.sin(t * 3.1 + ph) * amp;
      const px = x0 + dx * t + nx * off, py = y0 + dy * t + ny * off;
      k ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.stroke();
  };

  const gp = rr(R, 17, 24);
  if (stock === 'graph') {
    const c = `rgba(126,138,150,${rr(R, 0.13, 0.2)})`;
    for (let x = gp; x < W; x += gp) rule(x, 0, x, H, c, 0.5);
    for (let y = gp; y < H; y += gp) rule(0, y, W, y, c, 0.5);
  } else if (stock === 'dot') {
    g.fillStyle = `rgba(120,132,146,${rr(R, 0.26, 0.38)})`;
    for (let y = gp; y < H; y += gp)
      for (let x = gp; x < W; x += gp)
        g.fillRect(x + rr(R, -0.4, 0.4), y + rr(R, -0.4, 0.4), 1.1, 1.1);
  }

  // ---- it is bound into something ----
  const gut = o.gutter;
  if (gut) {
    // the valley: two leaves falling away from the stitch
    const gw = W * 0.055;
    const gr = g.createLinearGradient(gut - gw, 0, gut + gw, 0);
    gr.addColorStop(0, 'rgba(92,80,62,0)');
    gr.addColorStop(0.38, `rgba(92,80,62,${rr(R, 0.1, 0.16)})`);
    gr.addColorStop(0.5, `rgba(70,60,46,${rr(R, 0.2, 0.28)})`);
    gr.addColorStop(0.62, `rgba(92,80,62,${rr(R, 0.1, 0.16)})`);
    gr.addColorStop(1, 'rgba(92,80,62,0)');
    g.fillStyle = gr;
    g.fillRect(gut - gw, 0, gw * 2, H);
    // the stitching
    g.fillStyle = `rgba(60,52,42,${rr(R, 0.2, 0.34)})`;
    for (let y = H * 0.1; y < H * 0.92; y += H * 0.11)
      g.fillRect(gut - 0.9, y + rr(R, -4, 4), 1.8, H * 0.035);
  }

  // ---- wear ----
  // foxing: little rust spots where the sheet has been somewhere damp
  for (let i = 0, n = ri(R, 8, 22); i < n; i++) {
    const x = rr(R, 0, W), y = rr(R, 0, H), r = rr(R, 1.5, 7);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(150,116,72,${rr(R, 0.06, 0.16)})`);
    gr.addColorStop(1, 'rgba(150,116,72,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  // edges darken and the corners have been turned a few hundred times
  const edge = (x, y, w, h, x0, y0, x1, y1) => {
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, `rgba(118,104,80,${rr(R, 0.1, 0.18)})`);
    gr.addColorStop(1, 'rgba(118,104,80,0)');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
  };
  const m = rr(R, 26, 48);
  edge(0, 0, W, m, 0, 0, 0, m);
  edge(0, H - m, W, m, 0, H, 0, H - m);
  edge(0, 0, m, H, 0, 0, m, 0);
  edge(W - m, 0, m, H, W, 0, W - m, 0);

  return { canvas: cv, grain, stock, warm };
}
