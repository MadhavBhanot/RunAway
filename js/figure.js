// ---------------------------------------------------------------------------
// THE RUNNER
//
// The reference poses a clothed figure from a table of frozen life-drawing
// poses. It never moves. A run is the one thing it cannot do, so this is new.
//
// Five keyframes is not an arbitrary number: a run cycle has five canonical
// moments, and every stride sequence ever drawn uses them.
//
//   CONTACT   lead foot lands, the body at its longest
//   ABSORB    weight sinks onto it, the support knee at its deepest bend
//   PASSING   the swing leg comes through under the hips
//   DRIVE     the support leg extends and throws the body forward
//   FLIGHT    both feet off the ground, the legs fully scissored
//
// Angles are degrees. theta swings a bone in the sagittal plane, measured from
// straight down, positive forward. knee is the extra bend of the shin behind
// the thigh, so it is always positive — a knee does not bend the other way.
// ---------------------------------------------------------------------------
'use strict';

const RUN_CYCLE = [
  { name: 'CONTACT', lean: 13, bob:  0, thigh: [-28,  22], knee: [ 55, 12], arm: [ 35, -30], elbow: [ 78,  92] },
  { name: 'ABSORB',  lean: 15, bob: -6, thigh: [-18,   5], knee: [105, 42], arm: [ 22, -12], elbow: [ 84,  86] },
  { name: 'PASSING', lean: 14, bob: -2, thigh: [  8, -12], knee: [125, 20], arm: [ -5,   8], elbow: [ 92,  90] },
  { name: 'DRIVE',   lean: 17, bob:  2, thigh: [ 38, -35], knee: [ 95,  8], arm: [-22,  30], elbow: [ 88,  80] },
  { name: 'FLIGHT',  lean: 12, bob:  8, thigh: [ 48, -42], knee: [ 62, 40], arm: [-30,  35], elbow: [ 80,  84] }
];

// Those five are one HALF of a stride — the right leg's turn. The other half
// is the same five with the sides swapped. Ten keyframes make the full cycle,
// and interpolating round it gives as many drawings as the animation needs.
const swap = a => [a[1], a[0]];
const mirrorPose = p => ({
  name: p.name + "'", lean: p.lean, bob: p.bob,
  thigh: swap(p.thigh), knee: swap(p.knee), arm: swap(p.arm), elbow: swap(p.elbow)
});
const fullCycle = half => half.concat(half.map(mirrorPose));
const FULL_CYCLE = fullCycle(RUN_CYCLE);

// A walk is not a slow run. It has almost no flight phase and barely any
// bounce — but it is the same antiphase skeleton underneath, just smaller.
// Scaling RUN_CYCLE rather than hand-authoring a new table keeps every angle
// sign exactly where it was, which is what keeps a leg from ever bending the
// wrong way: scaling a positive knee bend by a positive factor cannot flip it,
// and scaling a pair of opposite-signed thigh angles cannot make them agree.
function scaleCycle(cycle, k) {
  return cycle.map(p => ({
    name: p.name, lean: p.lean * k.lean, bob: p.bob * k.bob,
    thigh: p.thigh.map(v => v * k.thigh), knee: p.knee.map(v => v * k.knee),
    arm: p.arm.map(v => v * k.arm), elbow: p.elbow.map(v => v * k.elbow)
  }));
}
const WALK_CYCLE = scaleCycle(RUN_CYCLE, { lean: 0.32, bob: 0.28, thigh: 0.5, knee: 0.42, arm: 0.5, elbow: 0.85 });
const FULL_WALK_CYCLE = fullCycle(WALK_CYCLE);
// Stumble reuses the walk amplitude — what makes it a stumble instead of a
// walk is played back uneven (GAITS below) and baked with heavier per-frame
// jitter, not a different skeleton.
const STUMBLE_CYCLE = scaleCycle(RUN_CYCLE, { lean: 0.4, bob: 0.34, thigh: 0.58, knee: 0.5, arm: 0.62, elbow: 0.85 });
const FULL_STUMBLE_CYCLE = fullCycle(STUMBLE_CYCLE);

// Everything a mode changes, in one place.
const GAITS = {
  walk:    { cycle: FULL_WALK_CYCLE,    speed: [1.2, 1.7],  fps: 7,  jit: 2,   leanNoise: 0,   cadence: null },
  stumble: { cycle: FULL_STUMBLE_CYCLE, speed: [0.7, 1.6],  fps: 8,  jit: 6.5, leanNoise: 4.5, cadence: 'uneven' },
  run:     { cycle: FULL_CYCLE,         speed: [6.5, 8.5],  fps: 13, jit: 2,   leanNoise: 0,   cadence: null }
};

const lerpN = (a, b, t) => a + (b - a) * t;
const lerpPair = (a, b, t) => [lerpN(a[0], b[0], t), lerpN(a[1], b[1], t)];

// One drawing at phase t of a cycle, t in [0,1). Wraps, so the last frame
// runs back into the first without a hitch. Defaults to the run cycle so
// existing callers (and the tests) don't have to change.
function poseAt(t, cycle) {
  cycle = cycle || FULL_CYCLE;
  const n = cycle.length;
  const f = ((t % 1) + 1) % 1 * n;
  const i = Math.floor(f), u = f - i;
  const a = cycle[i % n], b = cycle[(i + 1) % n];
  return {
    name: a.name,
    lean: lerpN(a.lean, b.lean, u),
    bob: lerpN(a.bob, b.bob, u),
    thigh: lerpPair(a.thigh, b.thigh, u),
    knee: lerpPair(a.knee, b.knee, u),
    arm: lerpPair(a.arm, b.arm, u),
    elbow: lerpPair(a.elbow, b.elbow, u)
  };
}

// Proportions of a drawn stick man, ground at y=0.
const BODY = {
  pelvis: 52, chest: 78, neck: 88, head: 96, headR: 7.5,
  shoulderW: 11, hipW: 6.5,
  thigh: 26, shin: 25, foot: 7,
  upperArm: 20, forearm: 18
};

// Build one pose in 3D. `side` phi values push each limb a little out of the
// sagittal plane so the projection has something to foreshorten.
function buildRig(pose, o = {}) {
  const B = o.body || BODY;
  const jit = o.jit || (() => 0);
  const lean = (pose.lean + jit()) * Math.PI / 180;
  const bob = pose.bob;

  // The spine leans from the pelvis. Everything above it rides along.
  const pelvis = [0, B.pelvis + bob, 0];
  const up = t => rotZ([0, t, 0], -lean);
  const chest = vadd(pelvis, up(B.chest - B.pelvis));
  const neck = vadd(pelvis, up(B.neck - B.pelvis));
  const head = vadd(pelvis, up(B.head - B.pelvis));

  const J = { pelvis, chest, neck, head, headR: B.headR };
  const PHI = [0.13, -0.13];   // left limbs lean out one way, right the other

  for (let s = 0; s < 2; s++) {
    const tag = s ? 'R' : 'L';
    const phi = PHI[s];

    // --- leg ---
    const hip = vadd(pelvis, [0, 0, (s ? -1 : 1) * B.hipW]);
    const th = (pose.thigh[s] + jit()) * Math.PI / 180;
    const kn = (pose.knee[s] + jit()) * Math.PI / 180;
    const knee = vstep(hip, bone(th, phi), B.thigh);
    // the shin trails the thigh by the knee bend
    const ankle = vstep(knee, bone(th - kn, phi), B.shin);
    // the toe carries on the way the shin was going, rotated toward the ground
    const toe = vstep(ankle, bone(th - kn + 1.15, phi), B.foot);
    J['hip' + tag] = hip; J['knee' + tag] = knee;
    J['ankle' + tag] = ankle; J['toe' + tag] = toe;

    // --- arm ---
    const sh = vadd(chest, [0, 0, (s ? -1 : 1) * B.shoulderW]);
    const ar = (pose.arm[s] + jit()) * Math.PI / 180 + lean;
    const el = (pose.elbow[s] + jit()) * Math.PI / 180;
    const elbow = vstep(sh, bone(ar, phi * 1.4), B.upperArm);
    const wrist = vstep(elbow, bone(ar + el, phi * 1.4), B.forearm);
    J['shoulder' + tag] = sh; J['elbow' + tag] = elbow; J['wrist' + tag] = wrist;
  }
  return J;
}

// Fit a projected rig to a height and stand it on a point. Measuring the
// projected bounds rather than assuming them is what lets the camera move
// without the figure drifting off its own feet.
function placeRig(J, cam, targetH, footX, footY) {
  const raw = {};
  let lo = Infinity, hi = -Infinity, cxs = 0, n = 0;
  for (const k in J) {
    if (k === 'headR') continue;
    const q = project(J[k], cam);
    raw[k] = [q.x, q.y];
    if (q.y < lo) lo = q.y;
    if (q.y > hi) hi = q.y;
    cxs += q.x; n++;
  }
  const scale = targetH / Math.max(1e-3, hi - lo);
  const cx = cxs / n;
  const out = { headR: J.headR * scale };
  for (const k in raw) out[k] = [footX + (raw[k][0] - cx) * scale, footY + (raw[k][1] - hi) * scale];
  return out;
}

// Project every joint to 2D at a given place and size on the page.
function projectRig(J, cam, x, y, scale) {
  const out = {};
  for (const k in J) {
    if (k === 'headR') { out.headR = J.headR * scale; continue; }
    const q = project(J[k], cam);
    out[k] = [x + q.x * scale, y + q.y * scale];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Drawing one. A stick man, not a body: lines and joints, no volume. The hand
// comes entirely from ink() — pressure, overshoot, the ghost of a first try.
// ---------------------------------------------------------------------------
function drawStickman(R, P, o = {}) {
  const w = o.w || 2.1;
  const a = o.alpha ?? 1;
  const ghost = o.ghost ?? 0.5;
  const seg = (p, q, mul, opt) => ink(R, [p, q], w * (mul || 1),
    Object.assign({ alpha: a * rr(R, 0.82, 1), over: rr(R, 1, 3.5), ghost }, opt || {}));

  // the line of action first, the way it is drawn first in life — visible
  // enough now to read as a gesture sketch under the figure, not just noise
  if (o.action !== false) {
    ink(R, [P.toeR, P.pelvis, P.chest, P.head], w * 0.55,
      { alpha: a * 0.22, amp: 2.6, skip: 0, nib: false });
  }

  // spine and shoulders — the torso gets a second, offset pass, the way a
  // figure study is built from two or three tries at the same line rather
  // than one wire. That is what stops him reading as a stick and nothing else.
  seg(P.pelvis, P.chest, 1.15);
  const spineOff = rr(R, -1.4, 1.4);
  ink(R, [[P.pelvis[0] + spineOff, P.pelvis[1]], [P.chest[0] + spineOff * 0.6, P.chest[1]]],
    w * 0.6, { alpha: a * 0.3, amp: 1.6, skip: 1, nib: false, minPress: 0.4 });
  seg(P.chest, P.neck, 0.9);
  seg(P.shoulderL, P.shoulderR, 0.85, { over: 1 });
  seg(P.hipL, P.hipR, 0.8, { over: 1 });

  // limbs — the far side lighter, which is all the depth a stick man needs
  for (const s of ['L', 'R']) {
    const far = s === 'L' ? 0.72 : 1;
    const fa = { alpha: a * far * rr(R, 0.8, 1), over: rr(R, 1, 3.5), ghost };
    ink(R, [P['hip' + s], P['knee' + s]], w * far, fa);
    ink(R, [P['knee' + s], P['ankle' + s]], w * far, fa);
    ink(R, [P['ankle' + s], P['toe' + s]], w * 0.8 * far, fa);
    ink(R, [P['shoulder' + s], P['elbow' + s]], w * 0.85 * far, fa);
    ink(R, [P['elbow' + s], P['wrist' + s]], w * 0.75 * far, fa);
  }

  // the head: never one confident circle
  inkLoop(R, ring(R, P.head[0], P.head[1], P.headR, P.headR * rr(R, 1.02, 1.16),
    14, rr(R, 0, TAU), 0.1), w * 0.95, { alpha: a * rr(R, 0.7, 0.95), redraw: 0.45, segs: 3 });

  // joints, gone at with the point
  if (o.joints !== false) {
    for (const k of ['kneeL', 'kneeR', 'elbowL', 'elbowR', 'pelvis', 'chest']) {
      if (chance(R, 0.55)) nib(R, P[k][0], P[k][1], w * rr(R, 0.5, 0.9), a * rr(R, 0.35, 0.7));
    }
  }
}

if (typeof module !== 'undefined') module.exports = {
  RUN_CYCLE, FULL_CYCLE, WALK_CYCLE, FULL_WALK_CYCLE, STUMBLE_CYCLE, FULL_STUMBLE_CYCLE,
  GAITS, scaleCycle, BODY, buildRig, projectRig, mirrorPose, poseAt
};
