// ---------------------------------------------------------------------------
// THE SCENE
//
// A shot, not a sheet. The camera sits behind him; he stays in the middle of
// frame and the country comes at us.
//
// Everything here is DRAWN ONCE and played back. Twelve drawings of the run
// cycle, a sprite for every flower, three bands of sky — all made with the same
// pencil as the static sheet, at build time, then blitted. That is how
// traditional animation is made, and it is the only reason this holds 60fps:
// ink() re-rolled every frame boils the whole picture into noise.
//
// The figure IS redrawn per frame — twelve times, once each, with its own seed
// — so it boils very slightly against a stable world. That is cel-over-
// background, and the boil is the thing that reads as hand-drawn.
// ---------------------------------------------------------------------------
'use strict';

const Q = [];
const push = fn => Q.push(fn);

// Nostalgic dreamcore: warm purple/gold/orange, with real value contrast —
// a deep dusk-plum crown, a bright amber-gold glow low on the horizon, and
// clouds saturated enough to read as distinct shapes, not a gradient soup.
// Dreamy aesthetic cinematic palettes: rich purple zenith, vibrant crimson/red sunset glow,
// blazing golden-orange mid-sky, luminous sunlit golden-yellow horizon.
const SKY_PALETTES = [
  // 1. Dreamy Sunset Cinema (Velvet Purple, Vivid Crimson Red, Burning Sunset Orange, Radiant Golden-Yellow)
  {
    name: 'dreamy-sunset-cinema',
    top: [78, 24, 92],           // Deep velvet purple
    crimson: [232, 50, 86],       // Vivid sunset crimson red
    orange: [255, 130, 36],       // Radiant burning sunset orange
    horizon: [255, 218, 64],      // Luminous warm golden-yellow
    cloudLight: [255, 248, 185],  // Soft luminous golden-yellow sunlight
    cloudMid: [240, 92, 118],     // Dreamy sunset coral-red / rose
    cloudOrange: [255, 148, 52],  // Luminous sunset tangerine
    cloudShadow: [102, 38, 92]    // Soft dreamy plum-violet shadow
  },
  // 2. Twilight Flame (Royal Violet, Ruby Magenta, Sunset Tangerine, Sunlight Gold)
  {
    name: 'twilight-flame',
    top: [64, 20, 98],           // Royal violet-purple
    crimson: [244, 56, 104],      // Ruby magenta-red
    orange: [255, 144, 44],       // Sunset tangerine orange
    horizon: [255, 226, 74],      // Pure sunlight gold
    cloudLight: [255, 250, 195],  // Soft ivory gold
    cloudMid: [236, 98, 134],     // Dreamy pink-coral
    cloudOrange: [255, 156, 60],  // Tangerine glow
    cloudShadow: [90, 32, 96]     // Deep royal violet shadow
  },
  // 3. Golden Hour Bloom (Amethyst Purple, Coral-Red, Amber Sunset, Pure Gold)
  {
    name: 'golden-hour-bloom',
    top: [88, 30, 96],           // Warm amethyst purple
    crimson: [238, 64, 82],       // Blazing coral-red
    orange: [255, 140, 40],       // Warm amber sunset orange
    horizon: [255, 220, 68],      // Radiant golden glow
    cloudLight: [255, 246, 172],  // Warm peach-gold light
    cloudMid: [244, 102, 110],    // Sunset red-coral
    cloudOrange: [255, 152, 48],  // Amber gold
    cloudShadow: [112, 42, 86]    // Deep warm plum shadow
  },
  // 4. Ethereal Dusk Mirage (Velvet Indigo-Purple, Fiery Rose-Red, Sunset Apricot, Honey Gold)
  {
    name: 'ethereal-dusk-mirage',
    top: [68, 26, 94],           // Velvet indigo-purple
    crimson: [228, 54, 94],       // Fiery rose-red
    orange: [255, 136, 46],       // Sunset apricot orange
    horizon: [255, 214, 64],      // Honey gold radiance
    cloudLight: [255, 248, 188],  // Glowing sunlit cream
    cloudMid: [232, 86, 122],     // Rosy sunset midtone
    cloudOrange: [255, 146, 56],  // Apricot glow
    cloudShadow: [96, 34, 88]     // Twilight violet shadow
  }
];

// Build a smooth, soft, undulating horizontal cloud drift polygon.
// 3 passes of Chaikin smoothing produce water-melted, silky organic shapes without sharp kinks.
function buildDreamCloud(R, cx, cy, rx, ry) {
  const steps = 24;
  const pts = [];
  const ph = rr(R, 0, Math.PI * 2);
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const isTop = Math.sin(a) < 0;
    const wave = isTop
      ? (0.8 + 0.22 * Math.sin(a * 3 + ph) + 0.12 * Math.sin(a * 6 + ph * 1.7))
      : (0.75 + 0.1 * Math.sin(a * 2 + ph));
    const x = cx + Math.cos(a) * rx * wave;
    const y = cy + Math.sin(a) * ry * (isTop ? wave * 1.1 : 0.6);
    pts.push([x, y]);
  }
  return chaikin(pts, true, 3);
}

const FRAMES = 12;        // unique drawings per cycle; playback speed is per gait
const SDPR = 1.4;         // sprites carry their own resolution
const LANE = 0.85;        // metres of clear ground he runs down

// Where to stand a thing, sideways, given how far off it is.
const corridorX = (S, z, u) => u * (1.8 + z * 0.32) * (S.W / S.focal);

// Draw into an offscreen sprite. Wash and ink share the one canvas here on
// purpose: a skip erases to transparent, so whatever is behind shows through
// the gap exactly as the paper would.
function sprite(w, h, fn) {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(w * SDPR));
  cv.height = Math.max(1, Math.round(h * SDPR));
  const g = cv.getContext('2d');
  g.setTransform(SDPR, 0, 0, SDPR, 0, 0);
  setWashTarget(g);
  setInkTarget(g);
  fn(g, w, h);
  return cv;
}

function buildScene(R, W, H, seed, mode) {
  Q.length = 0;
  const gait = GAITS[mode] || GAITS.run;

  const rainCount = 180;
  const rainStreaks = [];
  for (let i = 0; i < rainCount; i++) {
    const depth = rr(R, 0, 1);
    rainStreaks.push({
      x: rr(R, -W * 0.2, W * 1.25),
      y: rr(R, -50, H + 50),
      speed: lerp(1200, 2200, depth),
      drift: lerp(-140, -320, depth),
      len: lerp(22, 80, depth),
      w: lerp(0.5, 1.2, depth),
      alpha: lerp(0.18, 0.55, depth),
      splash: chance(R, 0.35),
      splashR: rr(R, 2, 5)
    });
  }

  const isRun = mode === 'run';
  const S = {
    W, H, t: 0, gaitPhase: 0, gait, mode,
    horizonY: H * 0.44,
    camY: 1.6,                                  // eye height, metres
    focal: H * (isRun ? 0.82 : 1.0),            // dramatic wide-angle action lens on run
    fisheyeK: isRun ? 0.52 : 0,                 // heavy fisheye barrel distortion factor on run
    near: 1.7, far: 27,
    speed: rr(R, gait.speed[0], gait.speed[1]), // metres per second
    zRunner: 5.5,                               // how far ahead of us he is
    sky: [], items: [], frames: [], ground: null,
    pal: pick(R, SKY_PALETTES),
    species: shuffle(R, SPECIES.slice()),
    rainStreaks,
    rainActive: false,
    shadowFloraStamp: null,
    shadowGrassStamp: null,
    shadowRainFloraStamp: null,
    shadowRainGrassStamp: null
  };

  // Pre-baked reusable soft blurred watercolor shadow stamps (Zero GC allocations per frame!)
  push(() => {
    const stampBox = 64;
    S.shadowFloraStamp = sprite(stampBox, stampBox, (g) => {
      const rad = g.createRadialGradient(stampBox / 2, stampBox / 2, 1, stampBox / 2, stampBox / 2, stampBox / 2);
      rad.addColorStop(0, 'rgba(40, 30, 52, 0.42)');
      rad.addColorStop(0.45, 'rgba(40, 30, 52, 0.20)');
      rad.addColorStop(0.85, 'rgba(40, 30, 52, 0.05)');
      rad.addColorStop(1, 'rgba(40, 30, 52, 0)');
      g.fillStyle = rad;
      g.beginPath();
      g.arc(stampBox / 2, stampBox / 2, stampBox / 2, 0, Math.PI * 2);
      g.fill();
    });

    S.shadowGrassStamp = sprite(stampBox, stampBox, (g) => {
      const rad = g.createRadialGradient(stampBox / 2, stampBox / 2, 1, stampBox / 2, stampBox / 2, stampBox / 2);
      rad.addColorStop(0, 'rgba(40, 30, 52, 0.28)');
      rad.addColorStop(0.5, 'rgba(40, 30, 52, 0.12)');
      rad.addColorStop(1, 'rgba(40, 30, 52, 0)');
      g.fillStyle = rad;
      g.beginPath();
      g.arc(stampBox / 2, stampBox / 2, stampBox / 2, 0, Math.PI * 2);
      g.fill();
    });

    S.shadowRainFloraStamp = sprite(stampBox, stampBox, (g) => {
      const rad = g.createRadialGradient(stampBox / 2, stampBox / 2, 1, stampBox / 2, stampBox / 2, stampBox / 2);
      rad.addColorStop(0, 'rgba(16, 24, 32, 0.50)');
      rad.addColorStop(0.45, 'rgba(16, 24, 32, 0.24)');
      rad.addColorStop(1, 'rgba(16, 24, 32, 0)');
      g.fillStyle = rad;
      g.beginPath();
      g.arc(stampBox / 2, stampBox / 2, stampBox / 2, 0, Math.PI * 2);
      g.fill();
    });

    S.shadowRainGrassStamp = sprite(stampBox, stampBox, (g) => {
      const rad = g.createRadialGradient(stampBox / 2, stampBox / 2, 1, stampBox / 2, stampBox / 2, stampBox / 2);
      rad.addColorStop(0, 'rgba(16, 24, 32, 0.32)');
      rad.addColorStop(0.5, 'rgba(16, 24, 32, 0.14)');
      rad.addColorStop(1, 'rgba(16, 24, 32, 0)');
      g.fillStyle = rad;
      g.beginPath();
      g.arc(stampBox / 2, stampBox / 2, stampBox / 2, 0, Math.PI * 2);
      g.fill();
    });
  });

  // ---- dreamy aesthetic cinematic sky: 4-tier sunset atmospheric gradient + sun radiance ----
  push(() => {
    const bw = W, bh = Math.round(S.horizonY) + 2;
    const cv = sprite(bw, bh, () => {
      // 1. Deep Velvet Purple Zenith
      washBand(R, 0, 0, bw, bh * 0.44, S.pal.top,
        { alpha: 0.08, layers: 16, ragged: bh * 0.03, gran: false, bleed: false, edge: false });
      // 2. Luminous Sunset Crimson-Red Glow
      washBand(R, 0, bh * 0.16, bw, bh * 0.70, S.pal.crimson,
        { alpha: 0.07, layers: 14, ragged: bh * 0.03, gran: false, bleed: false, edge: false });
      // 3. Radiant Burning Orange Mid-Sky
      washBand(R, 0, bh * 0.38, bw, bh * 0.90, S.pal.orange,
        { alpha: 0.075, layers: 14, ragged: bh * 0.04, gran: false, bleed: false, edge: false });
      // 4. Blazing Luminous Golden-Yellow Horizon Shelf
      washBand(R, 0, bh * 0.64, bw, bh + 4, S.pal.horizon,
        { alpha: 0.08, layers: 14, ragged: bh * 0.03, gran: false, bleed: false, edge: false });

      // 5. Dreamy Sun Radiance: Soft diffused glowing radial wash at the horizon
      const sunX = bw * rr(R, 0.42, 0.58), sunY = bh * 0.78;
      const sunR = bh * rr(R, 0.4, 0.6);
      wash(R, ring(R, sunX, sunY, sunR * 1.5, sunR * 0.85, 20, 0, 0.04), S.pal.horizon, {
        alpha: 0.05, layers: 8, wobble: 0.01, gran: false, edge: false
      });
      wash(R, ring(R, sunX, sunY, sunR * 0.85, sunR * 0.5, 18, 0, 0.04), S.pal.cloudLight, {
        alpha: 0.06, layers: 8, wobble: 0.01, gran: false, edge: false
      });
    });
    S.sky.push({ cv, w: bw, h: bh, rate: 0, y: 0, tile: false });
  });

  // Three parallax cloud bands:
  // L = 2: Distant soft violet/crimson haze drifts (slow, dreamy)
  // L = 1: Midground glowing sunset cloud banks (diffused coral-red & orange)
  // L = 0: Foreground soft billowing sunset clouds (soft golden highlights & warm plum shadows)
  const CLOUD_PARALLAX_RATES = [7.5, 4.0, 1.5];

  for (let L = 0; L < 3; L++) {
    push(() => {
      const bw = Math.round(W * 1.5), bh = Math.round(S.horizonY);
      const rate = CLOUD_PARALLAX_RATES[L];

      const cv = sprite(bw, bh, (g) => {
        // Apply soft Gaussian blur filter for dreamy, watered-down watercolor blending
        const canFilter = typeof g.filter === 'string';
        if (canFilter) g.filter = L === 2 ? 'blur(8px)' : L === 1 ? 'blur(6px)' : 'blur(4px)';

        const clouds = [];
        const numClouds = L === 0 ? ri(R, 2, 4) : L === 1 ? ri(R, 3, 4) : ri(R, 2, 3);

        for (let i = 0; i < numClouds; i++) {
          const cx = rr(R, 0, bw);
          const cy = L === 2
            ? rr(R, bh * 0.45, bh * 0.85)
            : L === 1
            ? rr(R, bh * 0.22, bh * 0.72)
            : rr(R, bh * 0.12, bh * 0.65);

          const rx = L === 2
            ? rr(R, bw * 0.22, bw * 0.45)
            : L === 1
            ? rr(R, bw * 0.18, bw * 0.35)
            : rr(R, bw * 0.15, bw * 0.30);

          const ry = L === 2
            ? rr(R, bh * 0.08, bh * 0.16)
            : L === 1
            ? rr(R, bh * 0.10, bh * 0.20)
            : rr(R, bh * 0.12, bh * 0.24);

          const hull = buildDreamCloud(R, cx, cy, rx, ry);
          clouds.push({ hull, cx, cy, rx, ry });
        }

        const drawCloud = (c, xOffset = 0) => {
          const shiftedHull = c.hull.map(p => [p[0] + xOffset, p[1]]);

          if (L === 2) {
            // Distant soft hazy clouds
            wash(R, shiftedHull, S.pal.cloudShadow, {
              alpha: 0.04, layers: 5, wobble: 0.012, gran: false, edge: false
            });
            wash(R, shiftedHull, S.pal.crimson, {
              alpha: 0.045, layers: 5, wobble: 0.012, gran: false, edge: false
            });
          } else if (L === 1) {
            // Midground diffused sunset clouds
            wash(R, shiftedHull, S.pal.cloudShadow, {
              alpha: 0.05, layers: 6, wobble: 0.015, gran: false, edge: false
            });
            wash(R, shiftedHull, S.pal.cloudMid, {
              alpha: 0.06, layers: 6, wobble: 0.015, gran: false, edge: false
            });
            wash(R, shiftedHull, S.pal.cloudOrange, {
              alpha: 0.05, layers: 5, wobble: 0.015, gran: false, edge: false
            });
          } else {
            // Foreground soft volumetric clouds (lush, melted, dreamy)
            // 1. Soft plum-violet underside
            wash(R, shiftedHull, S.pal.cloudShadow, {
              alpha: 0.06, layers: 6, wobble: 0.015, gran: false, edge: false
            });
            // 2. Sunset coral-red & orange body
            wash(R, shiftedHull, S.pal.cloudMid, {
              alpha: 0.07, layers: 6, wobble: 0.015, gran: false, edge: false
            });
            wash(R, shiftedHull, S.pal.cloudOrange, {
              alpha: 0.055, layers: 5, wobble: 0.015, gran: false, edge: false
            });
            // 3. Soft golden top highlight
            const topHull = shiftedHull.filter(p => p[1] < c.cy + c.ry * 0.1);
            if (topHull.length >= 3) {
              wash(R, topHull, S.pal.cloudLight, {
                alpha: 0.07, layers: 5, wobble: 0.012, gran: false, edge: false
              });
            }
          }
        };

        for (const c of clouds) {
          drawCloud(c, 0);
          if (c.cx - c.rx < 50) drawCloud(c, bw);
          if (c.cx + c.rx > bw - 50) drawCloud(c, -bw);
        }

        if (canFilter) g.filter = 'none';
      });

      S.sky.push({ cv, w: bw, h: bh, rate, y: 0, tile: true });
    });
  }

  // ---- the ground it all stands on ---------------------------------------
  push(() => {
    const hz = S.horizonY, gh = H - hz + 6;
    const cv = sprite(W, gh, (g, w, h) => {
      washBand(R, 0, 8, w, h, pick(R, GREENS), { alpha: 0.04, layers: 8, ragged: H * 0.012 });
      washBand(R, 0, h * 0.42, w, h, [76, 120, 58], { alpha: 0.035, layers: 6, ragged: H * 0.018 });
      for (let i = 0, n = ri(R, 3, 5); i < n; i++) {
        const x = rr(R, 0, w), y = rr(R, h * 0.3, h), s = rr(R, w * 0.06, w * 0.15);
        wash(R, ring(R, x, y, s, s * 0.2, 11, 0, 0.4), SHADOW,
          { alpha: 0.016, layers: 4, wobble: 0.16, gran: false, edge: false });
      }
      // the far edge of the country, thin because it is a long way off
      const prev = getPen();
      setPen([98, 112, 104]);
      const hill = [];
      for (let x = -10; x <= w + 10; x += w / 26)
        hill.push([x, 10 + Math.sin(x / w * 9 + 1.2) * 5 + rr(R, -2, 2)]);
      ink(R, hill, 0.9, { alpha: 0.24, amp: 1.1, skip: 1.4, nib: false, minPress: 0.4 });

      // Six distant bands of background grass blades
      for (let b = 0; b < 6; b++) {
        const d = b / 5;
        const y = 12 + Math.pow(d, 1.7) * h * 0.34;
        const th = lerp(h * 0.012, h * 0.05, d);
        for (let i = 0, n = Math.round(lerp(32, 14, d) * (w / 1400)); i < n; i++) {
          const gx = rr(R, -10, w + 10), gy = y + rr(R, -th * 0.4, th * 0.4);
          setPen(pick(R, GREENS).map(c => c * (0.55 + d * 0.2)));
          for (let k = 0, m = ri(R, 1, 2); k < m; k++) {
            const bh2 = th * rr(R, 0.6, 1.2), lean = rr(R, -0.5, 0.5);
            ink(R, [[gx, gy], [gx + lean * bh2 * 0.4, gy - bh2 * 0.6], [gx + lean * bh2, gy - bh2]],
              Math.max(0.4, th * 0.05), {
                alpha: (0.1 + d * 0.28) * rr(R, 0.6, 1.1),
                amp: 0.5, skip: 0.6 + d, nib: false, minPress: 0.35, taper: 0.3
              });
          }
          if (chance(R, 0.18)) {
            const sp = pick(R, S.species);
            const fr2 = th * rr(R, 0.16, 0.3);
            wash(R, ring(R, gx, gy - th * rr(R, 0.7, 1.1), fr2, fr2 * 0.85, 8, rr(R, 0, TAU), 0.3),
              sp.col, { alpha: 0.04 + d * 0.04, layers: 3, gran: false, edge: false, bleed: false });
          }
        }
      }
      setPen(prev);
    });
    S.ground = { cv, y: hz - 6, h: gh };
  });

  // ---- a few birds in the far field, very occasional ----------------------
  // Six variants so a bird doesn't repeat obviously. They're rare enough that
  // we don't need the bank; just draw them on demand during placement.
  const birdVariants = [];
  for (let v = 0; v < 6; v++) {
    push(() => {
      const box = 80;
      const cv = sprite(box, box, () => {
        const prev = getPen();
        setPen([80, 88, 96]);
        // A minimalist bird: body, neck, head, two wings with flight motion baked in
        const cx = box / 2, cy = box / 2;
        const bodyY = cy + rr(R, -2, 4);
        const wingspan = box * rr(R, 0.5, 0.7);
        const wingTip = box * rr(R, 0.25, 0.4);
        // Left wing at a random dip
        const wingL = [
          [cx - wingspan * 0.5, bodyY - rr(R, 2, 6)],
          [cx - wingspan, bodyY - wingTip],
          [cx - wingspan * 0.7, bodyY + rr(R, -2, 2)]
        ];
        // Right wing
        const wingR = [
          [cx + wingspan * 0.5, bodyY - rr(R, 2, 6)],
          [cx + wingspan, bodyY - wingTip],
          [cx + wingspan * 0.7, bodyY + rr(R, -2, 2)]
        ];
        ink(R, wingL, 0.6, { alpha: 0.6, amp: 0.6, skip: 0.8, nib: false });
        ink(R, wingR, 0.6, { alpha: 0.6, amp: 0.6, skip: 0.8, nib: false });
        // Body and head
        ink(R, [[cx - 6, bodyY], [cx + 8, bodyY]], 1.2, { alpha: 0.7, amp: 0.4, skip: 0.6, nib: false });
        nib(R, cx + 10, bodyY - 3, 2.4, 0.5);  // head
        setPen(prev);
      });
      birdVariants.push({ cv, world: rr(R, 0.35, 0.5) });
    });
  }

  // ---- a sprite for every flower and tuft --------------------------------
  // Four variants each, and every placement can mirror one at runtime — eight
  // effective silhouettes per species is enough for a dense field to stop
  // reading as one drawing stamped down repeatedly, at two-thirds the build
  // cost of six.
  const bank = { flora: [], grass: [] };
  for (const sp of S.species) {
    for (let v = 0; v < 4; v++) {
      push(() => {
        const box = 170, stem = box * rr(R, 0.34, 0.5);
        const hx = box / 2, hy = box - stem;
        const cv = sprite(box, box, () => {
          const prev = getPen();
          const leaf = pick(R, GREENS);
          setPen(leaf.map(c => c * 0.62));
          const path = chaikin([[hx + rr(R, -6, 6), box],
                                [hx + rr(R, -11, 11), box - stem * 0.5], [hx, hy]], false, 2);
          wash(R, [...path.map(p => [p[0] - 2.6, p[1]]),
                   ...path.slice().reverse().map(p => [p[0] + 2.6, p[1]])],
            leaf, { alpha: 0.07, layers: 6, gran: false, bleed: false });
          ink(R, path, 2.2, { alpha: 0.5, amp: 0.8, skip: 1, ghost: 0.3 });
          setPen(prev);
          flowerHead(R, hx, hy, box * 0.19, sp, 1);
        });
        bank.flora.push({ cv, world: rr(R, 0.85, 1.55) });
      });
    }
  }
  for (let v = 0; v < 6; v++) {
    push(() => {
      const box = 130;
      // height varies per drawing, not just per placement — a field of grass
      // is never one blade height repeated
      const cv = sprite(box, box, () => grassTuft(R, box / 2, box, box * rr(R, 0.65, 1.05), 1));
      bank.grass.push({ cv, world: rr(R, 0.45, 1.05) });
    });
  }

  push(() => {
    const place = (kind, n) => {
      for (let i = 0; i < n; i++) {
        const z = rr(R, S.near, S.far);
        // A few flowers stand right in his path rather than clearing the
        // lane like everything else — the point is for him to run through
        // them and shove them aside, not for the lane to stay empty. That
        // means sampling them near the centreline directly, not just
        // skipping the push that clears everyone else out of it.
        const inPath = kind === 'flora' && chance(R, 0.16);
        let x = inPath ? rr(R, -LANE * 0.7, LANE * 0.7) : corridorX(S, z, rr(R, -1, 1));
        if (!inPath && Math.abs(x) < LANE) x += Math.sign(x || 1) * LANE;
        S.items.push({
          kind, x, z, bank: bank[kind], inPath,
          art: pick(R, bank[kind]),
          flip: chance(R, 0.5) ? -1 : 1,        // doubles the effective variant count
          size: rr(R, 0.7, 1.28),               // variable height, not one stamp repeated
          alpha: rr(R, 0.82, 1),
          swayF: rr(R, 0.8, 2.1), swayP: rr(R, 0, TAU)
        });
      }
    };
    // Birds are very occasional, far-field only, never in the near ground
    const placeBirds = (n) => {
      for (let i = 0; i < n; i++) {
        const z = rr(R, S.far * 0.6, S.far);  // far field only
        const x = corridorX(S, z, rr(R, -1, 1));
        S.items.push({
          kind: 'bird', x, z, bank: birdVariants,
          art: pick(R, birdVariants),
          flip: chance(R, 0.5) ? -1 : 1,
          size: rr(R, 0.4, 0.7),               // birds are small, high up
          alpha: rr(R, 0.4, 0.65),             // atmospheric, not solid
          swayF: rr(R, 0.3, 0.6), swayP: rr(R, 0, TAU)
        });
      }
    };
    place('grass', 380);
    // Dense, but not so dense overlapping heads fuse into a muddy patch —
    // this is the ceiling that still reads as individual flowers up close.
    place('flora', 300);
    // Just a few birds, drifting: the rare encounter with life
    placeBirds(ri(R, 3, 7));
  });

  // ---- the runner: twelve drawings, then we only ever play them ----------
  // His height comes out of the same projection as everything else. Picking it
  // as a fraction of the screen puts him at a size the ground never agrees
  // with, and he reads as a giant standing at the horizon.
  const figH = 1.8 * S.focal / S.zRunner;
  const cam = makeCamera({
    // A quarter turn is dead behind him — and dead behind is the one angle
    // where a run is invisible, because the whole stride swings along the line
    // of sight and projects to almost nothing. Half a radian off it is still
    // clearly a view from behind, and the legs actually travel.
    yaw: -Math.PI / 2 + rr(R, 0.44, 0.58),
    pitch: rr(R, 0.05, 0.11),
    focal: 950
  });
  // One scale and one origin for the WHOLE cycle, measured once. Re-fitting
  // each drawing to the same box would iron out the bob and glue his feet to a
  // line — the two things that make a run look like a run.
  const bw = figH * 2.2, bh = figH * 1.8;
  const ref = buildRig(FULL_CYCLE[0]);
  let lo = Infinity, hi = -Infinity;
  for (const k in ref) {
    if (k === 'headR') continue;
    const y = project(ref[k], cam).y;
    if (y < lo) lo = y; if (y > hi) hi = y;
  }
  const scale = figH / Math.max(1e-3, hi - lo);
  const g0 = project([0, 0, 0], cam);
  const ox = bw * 0.52 - g0.x * scale;
  const oy = bh * 0.82 - g0.y * scale;

  for (let i = 0; i < FRAMES; i++) {
    push(() => {
      const pose = Object.assign({}, poseAt(i / FRAMES, gait.cycle));
      // its own seed per drawing, so each one boils independently — that is
      // the hand redrawing him, and the whole point of shooting on twos
      const FR = mulberry32((seed ^ 0x9e37) + i * 7919);
      // a stumble is off balance, which a run and a walk are not
      if (gait.leanNoise) pose.lean += rr(FR, -gait.leanNoise, gait.leanNoise);
      const J = buildRig(pose, { jit: () => rr(FR, -gait.jit, gait.jit) });
      const P = projectRig(J, cam, ox, oy, scale);
      const cv = sprite(bw, bh, (g) => {
        const prev = getPen();
        const canFilter = (g && typeof g.filter === 'string');

        // 0. Articulated 3D Ground Cast Shadow (Slender, translucent, realistic grass-draped shadow)
        const S_pts = {};
        const sunDirX = -0.42;
        const sunDirZ = -0.85;
        for (const k in J) {
          if (k === 'headR') continue;
          const pt = J[k];
          const gPt = [pt[0] + sunDirX * pt[1], 0, pt[2] + sunDirZ * pt[1]];
          const proj = project(gPt, cam);
          S_pts[k] = [ox + proj.x * scale, oy + proj.y * scale];
        }

        // Subtle grass ripple: gently wiggles shadow lines over uneven turf
        const warp = (pts, amp = 1.6, freq = 0.18) => {
          const res = [];
          for (let idx = 0; idx < pts.length; idx++) {
            const p = pts[idx];
            if (idx < pts.length - 1) {
              const q = pts[idx + 1];
              res.push([
                p[0] + Math.sin(p[0] * freq + p[1] * 0.1) * amp,
                p[1] + Math.cos(p[0] * (freq * 0.7)) * (amp * 0.25)
              ]);
              const mid = [(p[0] + q[0]) * 0.5, (p[1] + q[1]) * 0.5];
              res.push([
                mid[0] + Math.sin(mid[0] * freq * 1.4) * amp,
                mid[1] + Math.cos(mid[0] * freq) * (amp * 0.3)
              ]);
            } else {
              res.push([
                p[0] + Math.sin(p[0] * freq) * amp,
                p[1] + Math.cos(p[0] * (freq * 0.7)) * (amp * 0.25)
              ]);
            }
          }
          return res;
        };

        // Slender, tangible, watercolor cast shadow (soft optical blur)
        if (canFilter) g.filter = 'blur(2.6px)';
        setPen([44, 34, 52]);

        // Translucent torso & spine shadow
        const spineWarped = warp([S_pts.pelvis, S_pts.chest, S_pts.neck, S_pts.head], 2.2);
        ink(FR, spineWarped, 4.4, { alpha: 0.36, amp: 0.9, skip: 0.2, nib: false, minPress: 0.35 });

        // Translucent arms shadow
        for (const s of ['L', 'R']) {
          const armWarped = warp([S_pts['shoulder' + s], S_pts['elbow' + s], S_pts['wrist' + s]], 1.8);
          ink(FR, armWarped, 3.2, { alpha: 0.28, amp: 0.7, skip: 0.2, nib: false, minPress: 0.3 });
        }

        // Open, delicate head ring shadow
        inkLoop(FR, ring(FR, S_pts.head[0], S_pts.head[1], P.headR * 0.95, P.headR * 0.75, 9, 0, 0.1),
          2.6, { alpha: 0.30, redraw: 0.15, segs: 2 });

        // Slender legs shadow
        if (canFilter) g.filter = 'blur(1.6px)';
        for (const s of ['L', 'R']) {
          const legWarped = warp([S_pts['hip' + s], S_pts['knee' + s], S_pts['ankle' + s], S_pts['toe' + s]], 2.0);
          ink(FR, legWarped, 3.8, { alpha: 0.38, amp: 0.8, skip: 0.2, nib: false, minPress: 0.4 });
        }

        // Reset filter for crisp pencil stickman & rim light
        if (canFilter) g.filter = 'none';

        // 1. Cinematic Golden Sunset Rim Light (Sunlight catching shoulders, spine & limbs)
        const rimCol = S.pal.cloudOrange || [255, 148, 52];
        setPen(rimCol);
        const P_rim = {};
        for (const k in P) {
          if (k === 'headR') { P_rim.headR = P.headR; continue; }
          P_rim[k] = [P[k][0] + 0.8, P[k][1] - 0.8];
        }
        drawStickman(FR, P_rim, { w: 3.8, alpha: 0.36, ghost: 0.1, action: false, joints: false });

        // 2. Trailing speed gesture lines (warm sunset amber)
        if (mode !== 'walk') {
          setPen(rimCol);
          const trail = (p, k) => {
            for (let s = 0, m = ri(FR, 2, 3); s < m; s++) {
              const len = rr(FR, 10, 22) * (0.6 + k * 0.7);
              ink(FR, [p, [p[0] - len * rr(FR, 0.7, 1), p[1] + rr(FR, -4, 4)]], 0.7,
                { alpha: 0.16, amp: 0.4, skip: 1.6, nib: false, minPress: 0.3, taper: 0.35 });
            }
          };
          trail(P.toeL, 1); trail(P.toeR, 1); trail(P.wristL, 0.6); trail(P.wristR, 0.6);
        }

        // 3. Core graphite pencil stickman
        setPen(PENS[0]);
        drawStickman(FR, P, { w: 3.4, alpha: 1, ghost: 0.24, action: false });
        setPen(prev);
      });
      const footL = P.toeL ? [P.toeL[0] - bw * 0.52, P.toeL[1] - bh * 0.82] : [0, 0];
      const footR = P.toeR ? [P.toeR[0] - bw * 0.52, P.toeR[1] - bh * 0.82] : [0, 0];
      S.frames.push({ cv, w: bw, h: bh, footL, footR, bob: pose.bob || 0 });
    });
  }

  return S;
}

// ---------------------------------------------------------------------------
// Per frame: no drawing at all, only placing. Everything below is a blit.
// ---------------------------------------------------------------------------
function updateScene(S, dt) {
  S.t += dt;
  // A steady gait advances frames at a fixed cadence. A stumble does not —
  // the rate itself wanders, so some steps land quick and some drag, which is
  // what an uneven, fluid gait actually looks like frame to frame.
  const rate = S.gait.cadence === 'uneven'
    ? clamp(0.55 + 0.55 * Math.sin(S.t * 1.7) + 0.35 * Math.sin(S.t * 0.53 + 1.1), 0.15, 1.6)
    : 1;
  S.gaitPhase += dt * S.gait.fps * rate;
  const span = S.far - S.near;
  for (const it of S.items) {
    it.z -= S.speed * dt;
    if (it.z < S.near) {
      it.z += span;                              // recycle it to the far end
      // birds stay in the far field; everything else recycles throughout
      if (it.kind !== 'bird') {
        it.inPath = it.kind === 'flora' && Math.random() < 0.16;
        it.x = it.inPath
          ? (Math.random() * 2 - 1) * LANE * 0.7
          : corridorX(S, it.z, Math.random() * 2 - 1);
        if (!it.inPath && Math.abs(it.x) < LANE) it.x += Math.sign(it.x || 1) * LANE;
      } else {
        it.z = S.far * (0.6 + Math.random() * 0.4);  // birds stay high and far
        it.x = corridorX(S, it.z, Math.random() * 2 - 1);
      }
      // re-rolled on recycle too, or the same clump reappears identically
      // every time it laps the corridor
      if (it.bank) it.art = pick(Math.random, it.bank);
      it.flip = Math.random() < 0.5 ? -1 : 1;
      it.size = it.kind === 'bird' ? (0.4 + Math.random() * 0.3) : (0.7 + Math.random() * 0.58);
    }
  }
  S.items.sort((a, b) => b.z - a.z);             // far first

  // Rain particle simulation
  if (S.rainActive && S.rainStreaks) {
    const H = S.H, W = S.W;
    for (const st of S.rainStreaks) {
      st.y += st.speed * dt;
      st.x += st.drift * dt;
      if (st.y > H + 50 || st.x < -W * 0.25) {
        st.y = -rr(Math.random, 10, 60);
        st.x = rr(Math.random, -W * 0.1, W * 1.25);
      }
    }
  }
}

// The caller owns the background — it lays the paper down first, and this
// draws the shot straight onto it.
function renderScene(g, S) {
  const { W, H, t } = S;

  // 1. Sky is completely stationary (infinite distance backdrop, zero shake)
  for (const b of S.sky) {
    if (!b.tile) { g.drawImage(b.cv, 0, b.y, W, b.h); continue; }
    const off = -(t * b.rate) % b.w;
    g.drawImage(b.cv, off, b.y, b.w, b.h);
    g.drawImage(b.cv, off + b.w, b.y, b.w, b.h);
  }

  // 2. Floor & Ground Terrain (Rock steady camera, zero shake)
  if (S.ground) g.drawImage(S.ground.cv, 0, S.ground.y, W, S.ground.h);

  // 1. Aerial Perspective Horizon Haze (creates immense depth separating sky & ground)
  const hazeH = H * 0.08;
  const hazeGrad = g.createLinearGradient(0, S.horizonY - hazeH * 0.4, 0, S.horizonY + hazeH * 0.8);
  hazeGrad.addColorStop(0, 'rgba(255, 218, 64, 0)');
  hazeGrad.addColorStop(0.35, 'rgba(255, 226, 92, 0.16)');
  hazeGrad.addColorStop(0.65, 'rgba(255, 178, 60, 0.10)');
  hazeGrad.addColorStop(1, 'rgba(255, 140, 50, 0)');
  g.fillStyle = hazeGrad;
  g.fillRect(0, S.horizonY - hazeH * 0.4, W, hazeH * 1.2);

  // Stormy rain background wash: darkens terrain and sky so flowers pop vibrantly
  if (S.rainActive) {
    g.save();
    g.globalCompositeOperation = 'multiply';
    const bgWash = g.createLinearGradient(0, 0, 0, H);
    bgWash.addColorStop(0, 'rgba(38, 44, 64, 0.44)');
    bgWash.addColorStop(0.44, 'rgba(48, 54, 72, 0.38)');
    bgWash.addColorStop(1, 'rgba(40, 46, 54, 0.42)');
    g.fillStyle = bgWash;
    g.fillRect(0, 0, W, H);

    g.globalCompositeOperation = 'overlay';
    g.fillStyle = 'rgba(25, 34, 48, 0.28)';
    g.fillRect(0, 0, W, H);
    g.restore();
  }

  // He sits at a fixed depth. Anything nearer than him is drawn over the top,
  // which is what puts him IN the flowers instead of in front of them.
  const fr = S.frames.length ? S.frames[Math.floor(S.gaitPhase) % S.frames.length] : null;
  const runnerY = S.horizonY + S.camY * (S.focal / S.zRunner);
  let drawn = false;
  const drawRunner = () => {
    if (drawn || !fr) return;
    drawn = true;
    const rx = W / 2, ry = runnerY;

    // --- 1. Realistic Subtle Foot Ground Contact (Zero Big Blobs) ---
    const feet = [fr.footL, fr.footR];
    for (let f = 0; f < feet.length; f++) {
      const foot = feet[f];
      if (!foot) continue;
      const fx = rx + foot[0];
      const heightAboveGround = Math.max(0, -foot[1]);
      const proximity = Math.max(0, 1 - heightAboveGround / 12);

      if (proximity > 0.1) {
        g.save();
        g.globalCompositeOperation = 'multiply';
        const shadowBase = S.rainActive ? '18, 24, 32' : '36, 26, 44';
        g.fillStyle = `rgba(${shadowBase}, ${(0.20 * proximity).toFixed(3)})`;
        g.beginPath();
        g.ellipse(fx, ry + 0.5, 4.0, 1.1, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    }

    // 2. Cinematic Sunset Backlight Bloom around character
    g.save();
    const bloomGrad = g.createRadialGradient(rx, ry - fr.h * 0.45, fr.w * 0.08, rx, ry - fr.h * 0.45, fr.w * 0.75);
    bloomGrad.addColorStop(0, 'rgba(255, 224, 110, 0.20)');
    bloomGrad.addColorStop(0.45, 'rgba(255, 148, 52, 0.10)');
    bloomGrad.addColorStop(1, 'rgba(255, 120, 40, 0)');
    g.fillStyle = bloomGrad;
    g.beginPath();
    g.arc(rx, ry - fr.h * 0.45, fr.w * 0.75, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // 3. Runner Drawing (with synchronized 3D ground cast shadow)
    g.drawImage(fr.cv, rx - fr.w * 0.52, ry - fr.h * 0.82, fr.w, fr.h);
  };

  // Wind, not a metronome: two slow sines that drift in and out of phase make
  // a gust strength with no fixed period, so the field never visibly repeats.
  const gust = 0.55 + 0.45 * Math.sin(t * 0.23) * Math.sin(t * 0.071 + 1.7);

  const kFish = S.fisheyeK || 0;

  for (const it of S.items) {
    if (it.z < S.zRunner) drawRunner();
    const s = S.focal / it.z;
    const rawX = it.x * s;
    const normX = rawX / (W * 0.5);

    // Heavy fisheye barrel distortion: curves outward dramatically towards screen edges
    const fishDistort = 1 + kFish * normX * normX;
    const sx = W / 2 + rawX * fishDistort;

    // Horizon barrel lens dip (curved ground horizon)
    const sy = S.horizonY + S.camY * s + (kFish ? normX * normX * 24 * (1 - it.z / S.far) : 0);

    // Perspective scale swell on edges
    const h = it.art.world * it.size * s * (1 + kFish * 0.35 * Math.min(1.5, normX * normX));
    if (h < 1.5) continue;
    const w = h * (it.art.cv.width / it.art.cv.height);
    if (sx + w < -60 || sx - w > W + 60) continue;

    // Every stalk bends about its own base, plus strong peripheral lens lean on run
    const bendMax = it.kind === 'flora' ? 0.22 : 0.34;
    let bend = (Math.sin(t * it.swayF + it.swayP) * 0.7
              + Math.sin(t * it.swayF * 2.3 + it.swayP * 1.6) * 0.3) * bendMax * gust;
    if (it.inPath) {
      const dz = it.z - S.zRunner;
      const away = it.x !== 0 ? Math.sign(it.x) : it.flip;
      bend += Math.exp(-(dz * dz) / (2 * 0.42 * 0.42)) * 0.7 * away;
    }

    const lensLean = kFish ? normX * 0.38 * clamp((S.zRunner - it.z) / 2.5, 0, 1) : 0;
    const isFlora = it.kind === 'flora';
    const rainPop = (S.rainActive && isFlora);

    // 0. Super-fast hardware accelerated pre-baked Ground Cast Shadow
    if (it.kind !== 'bird' && h > 5) {
      g.save();
      g.globalCompositeOperation = 'multiply';
      g.globalAlpha = (isFlora ? 0.72 : 0.42) * it.alpha * (rainPop ? 1.2 : 1);
      const shLen = h * (isFlora ? 0.42 : 0.26);
      const shW = Math.max(4, w * (isFlora ? 0.60 : 0.40));

      g.translate(sx, sy);
      g.rotate(-0.35 + (bend * 0.35));
      const stamp = S.rainActive
        ? (isFlora ? S.shadowRainFloraStamp : S.shadowRainGrassStamp)
        : (isFlora ? S.shadowFloraStamp : S.shadowGrassStamp);
      if (stamp) g.drawImage(stamp, -shLen * 0.8, -shW * 0.3, shLen * 0.8, shW * 0.6);
      g.restore();
    }

    g.globalAlpha = it.alpha * (rainPop ? 1 : clamp((S.far - it.z) / (S.far * 0.3), 0, 1));
    g.save();
    g.translate(sx, sy);
    g.rotate(bend + lensLean);
    g.scale(it.flip, 1);
    g.drawImage(it.art.cv, -w / 2, -h, w, h);

    // In rain, flowers are vibrant and brighter (luminous glistening rain sheen)
    if (rainPop) {
      g.globalCompositeOperation = 'screen';
      g.globalAlpha = 0.38 * it.alpha;
      g.drawImage(it.art.cv, -w / 2, -h, w, h);
    }
    g.restore();
  }
  g.globalAlpha = 1;
  drawRunner();

  // 5. Cinematic Soft Lens Vignette (draws eye into the horizon depth)
  const vig = g.createRadialGradient(W / 2, H * 0.46, H * 0.38, W / 2, H * 0.46, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(255, 230, 160, 0)');
  vig.addColorStop(0.72, 'rgba(120, 36, 68, 0.04)');
  vig.addColorStop(1, 'rgba(64, 18, 52, 0.16)');
  g.fillStyle = vig;
  g.fillRect(0, 0, W, H);

  // 6. Batched Rain: 1-Pass Strands of Falling Rain & Splashes (Blazing 60/120 FPS performance)
  if (S.rainActive && S.rainStreaks) {
    g.save();
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(50, 58, 70, 0.38)';
    g.lineWidth = 0.8;
    g.beginPath();
    const slant = -0.15;
    for (let si = 0; si < S.rainStreaks.length; si++) {
      const st = S.rainStreaks[si];
      g.moveTo(st.x, st.y);
      g.lineTo(st.x + slant * st.len, st.y + st.len);
    }
    g.stroke();

    // Batched micro graphite splashes
    g.strokeStyle = 'rgba(60, 72, 88, 0.22)';
    g.lineWidth = 0.6;
    g.beginPath();
    for (let si = 0; si < S.rainStreaks.length; si++) {
      const st = S.rainStreaks[si];
      if (st.splash && st.y > S.horizonY + 20 && st.y < H - 10) {
        g.ellipse(st.x, st.y, st.splashR, st.splashR * 0.32, 0, 0, Math.PI * 2);
      }
    }
    g.stroke();
    g.restore();
  }
}
