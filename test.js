// Run: node test.js
//
// The browser loads these as classic scripts sharing one lexical scope.
// Concatenating and running once reproduces that exactly — so this exercises
// the real files, and a duplicate top-level name here is a real collision
// there. main.js is excluded: it touches the DOM on load.
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FILES = ['rng', 'geom', 'v3', 'ink', 'wash', 'paper', 'letter', 'flora', 'figure', 'scene', 'player'];
const src = FILES.map(f => fs.readFileSync(path.join(__dirname, 'js', f + '.js'), 'utf8')).join('\n;\n');

const ctx = vm.createContext({ console });
vm.runInContext(src + '\n;globalThis.__api = {' +
  'mulberry32, rr, resample, chaikin, sampleField, noiseField, bbox,' +
  'RUN_CYCLE, FULL_CYCLE, WALK_CYCLE, FULL_WALK_CYCLE, STUMBLE_CYCLE, FULL_STUMBLE_CYCLE,' +
  'GAITS, scaleCycle, mirrorPose, poseAt, BODY, buildRig, bone,' +
  'project, makeCamera, vlen, vsub,' +
  'GLYPHS, glyphOf, textW, SPECIES, PLAYLIST_TRACKS, formatTime, escapeHtml, buildScene };', ctx, { filename: 'bundle.js' });
const A = ctx.__api;

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; return; }
  fail++;
  console.error('  FAIL  ' + name + (extra ? '  → ' + extra : ''));
}
const near = (a, b, eps) => Math.abs(a - b) <= (eps ?? 1e-9);

// --- rng -------------------------------------------------------------------
{
  const a = A.mulberry32(12345), b = A.mulberry32(12345);
  const xs = Array.from({ length: 200 }, () => a());
  ok('mulberry32 is deterministic', xs.every(v => v === b()));
  ok('mulberry32 stays in [0,1)', xs.every(v => v >= 0 && v < 1));
  ok('mulberry32 does not collapse', new Set(xs).size > 190);
  const c = A.mulberry32(12346);
  ok('a different seed gives a different page', c() !== A.mulberry32(12345)());
}

// --- resample: ink() assumes even spacing ----------------------------------
{
  const line = [[0, 0], [100, 0], [100, 100]];
  const rs = A.resample(line, 5);
  ok('resample keeps the start', rs[0][0] === 0 && rs[0][1] === 0);
  let worst = 0;
  for (let i = 1; i < rs.length - 1; i++) {
    const d = Math.hypot(rs[i][0] - rs[i - 1][0], rs[i][1] - rs[i - 1][1]);
    worst = Math.max(worst, Math.abs(d - 5));
  }
  ok('resample spaces points evenly', worst < 1e-6, 'worst drift ' + worst);
  ok('resample covers the path', rs.length >= 39 && rs.length <= 42, 'got ' + rs.length);
  ok('resample survives a degenerate path', A.resample([[1, 1]], 5).length === 1);
  const dup = A.resample([[0, 0], [0, 0]], 5);
  ok('resample survives zero length', Array.isArray(dup));
}

// --- chaikin ---------------------------------------------------------------
{
  const sq = [[0, 0], [10, 0], [10, 10], [0, 10]];
  const c1 = A.chaikin(sq, true, 1);
  ok('chaikin doubles a closed ring', c1.length === 8, 'got ' + c1.length);
  const b0 = A.bbox(sq), b2 = A.bbox(A.chaikin(sq, true, 3));
  ok('chaikin stays inside the hull it smooths',
    b2.x0 >= b0.x0 - 1e-9 && b2.x1 <= b0.x1 + 1e-9 && b2.y0 >= b0.y0 - 1e-9 && b2.y1 <= b0.y1 + 1e-9);
  const open = A.chaikin([[0, 0], [5, 10], [10, 0]], false, 2);
  ok('chaikin pins the ends of an open path',
    open[0][0] === 0 && open[open.length - 1][0] === 10);
}

// --- the grain field: ink skips and wash granulation both read it ----------
{
  const R = A.mulberry32(7);
  const f = A.noiseField(R, 16, 16);
  let lo = 1, hi = 0;
  for (let i = 0; i <= 20; i++) for (let j = 0; j <= 20; j++) {
    const v = A.sampleField(f, i / 20, j / 20);
    lo = Math.min(lo, v); hi = Math.max(hi, v);
  }
  ok('sampleField stays in [0,1]', lo >= 0 && hi <= 1, lo + '..' + hi);
  ok('sampleField clamps out-of-range uv',
    Number.isFinite(A.sampleField(f, -3, 4)) && A.sampleField(f, -3, 4) === A.sampleField(f, 0, 1));
  ok('sampleField is continuous',
    Math.abs(A.sampleField(f, 0.5, 0.5) - A.sampleField(f, 0.5001, 0.5)) < 0.01);
}

// --- the run cycle ---------------------------------------------------------
{
  ok('five keyframes', A.RUN_CYCLE.length === 5);
  for (const p of A.RUN_CYCLE) {
    // A runner is never in phase with themselves. If both thighs ever swing the
    // same way the whole sequence stops reading as a run.
    ok(p.name + ': legs are in antiphase', p.thigh[0] * p.thigh[1] < 0,
      p.thigh.join(' / '));
    // arms counter-rotate against the leg on the same side
    ok(p.name + ': arms counter the legs', p.arm[0] * p.thigh[0] < 0 && p.arm[1] * p.thigh[1] < 0,
      'arm ' + p.arm.join('/') + ' vs thigh ' + p.thigh.join('/'));
    // a knee does not bend forward
    ok(p.name + ': knees bend one way only', p.knee.every(k => k > 0), p.knee.join('/'));
    ok(p.name + ': leaning forward', p.lean > 0 && p.lean < 40);
  }
  const bobs = A.RUN_CYCLE.map(p => p.bob);
  ok('the body rises and falls over the cycle', Math.max(...bobs) - Math.min(...bobs) > 6);
}

// --- the full cycle and the drawings taken off it --------------------------
{
  ok('the full cycle is both halves', A.FULL_CYCLE.length === 10);
  const m = A.mirrorPose(A.RUN_CYCLE[0]);
  ok('mirroring swaps the sides',
    m.thigh[0] === A.RUN_CYCLE[0].thigh[1] && m.arm[1] === A.RUN_CYCLE[0].arm[0]);
  ok('mirroring leaves the body alone',
    m.lean === A.RUN_CYCLE[0].lean && m.bob === A.RUN_CYCLE[0].bob);

  // the invariants have to survive the mirror, or half the stride is wrong
  for (const p of A.FULL_CYCLE) {
    ok('full cycle ' + p.name + ': legs antiphase', p.thigh[0] * p.thigh[1] < 0);
    ok('full cycle ' + p.name + ': arms counter the legs',
      p.arm[0] * p.thigh[0] < 0 && p.arm[1] * p.thigh[1] < 0);
  }

  ok('poseAt(0) is the first keyframe', near(A.poseAt(0).thigh[0], A.FULL_CYCLE[0].thigh[0], 1e-9));
  ok('poseAt(0.5) is the mirror of the first', near(A.poseAt(0.5).thigh[0], A.FULL_CYCLE[5].thigh[0], 1e-9));
  ok('poseAt wraps at 1', near(A.poseAt(1).thigh[0], A.poseAt(0).thigh[0], 1e-9));
  ok('poseAt handles negative phase', Number.isFinite(A.poseAt(-0.3).thigh[0]));

  // No hitch anywhere, including the seam where the cycle rejoins itself —
  // a jump there is the classic visible stutter in a looping run.
  let worst = 0, at = 0;
  const keys = ['thigh', 'knee', 'arm', 'elbow'];
  for (let i = 0; i < 480; i++) {
    const a = A.poseAt(i / 480), b = A.poseAt((i + 1) / 480);
    for (const k of keys) for (let s = 0; s < 2; s++) {
      const d = Math.abs(a[k][s] - b[k][s]);
      if (d > worst) { worst = d; at = i / 480; }
    }
  }
  ok('the cycle never jumps', worst < 6, 'worst ' + worst.toFixed(2) + ' deg at t=' + at.toFixed(3));

  // and it really does alternate — the left thigh must lead for half of it
  let leads = 0;
  for (let i = 0; i < 100; i++) if (A.poseAt(i / 100).thigh[0] > 0) leads++;
  ok('each leg leads for about half the cycle', leads > 35 && leads < 65, String(leads));
}

// --- walk and stumble: same skeleton, scaled, not hand-authored -----------
{
  ok('three gaits registered', Object.keys(A.GAITS).sort().join(',') === 'run,stumble,walk');
  for (const [name, cycle] of [['walk', A.FULL_WALK_CYCLE], ['stumble', A.FULL_STUMBLE_CYCLE]]) {
    ok(name + ': full cycle is both halves', cycle.length === 10);
    for (const p of cycle) {
      ok(name + ' ' + p.name + ': legs antiphase', p.thigh[0] * p.thigh[1] < 0, p.thigh.join('/'));
      ok(name + ' ' + p.name + ': knees bend one way only', p.knee.every(k => k > 0), p.knee.join('/'));
    }
  }
  ok('walk swings a smaller stride than run',
    Math.abs(A.WALK_CYCLE[0].thigh[1]) < Math.abs(A.RUN_CYCLE[0].thigh[1]));
  ok('run is the fastest gait', A.GAITS.run.speed[0] > A.GAITS.walk.speed[1]);
  ok('walk is steadier than stumble', A.GAITS.walk.jit < A.GAITS.stumble.jit);
  ok('only stumble carries lean noise', A.GAITS.stumble.leanNoise > 0 && A.GAITS.walk.leanNoise === 0);
  // scaleCycle itself: the general tool the three gaits are built from
  const half = A.scaleCycle(A.RUN_CYCLE, { lean: 0, bob: 0, thigh: 1, knee: 1, arm: 1, elbow: 1 });
  ok('scaleCycle at k=1 for a field reproduces it', half[0].thigh[0] === A.RUN_CYCLE[0].thigh[0]);
  ok('scaleCycle can zero a field out', half[0].lean === 0);
  ok('poseAt honours the cycle argument',
    A.poseAt(0, A.FULL_WALK_CYCLE).thigh[0] === A.FULL_WALK_CYCLE[0].thigh[0]);
}

// --- the rig ---------------------------------------------------------------
{
  ok('bone() returns a unit direction', near(A.vlen(A.bone(0.7, 0.3)), 1, 1e-12));
  const J = A.buildRig(A.RUN_CYCLE[0]);
  for (const k in J) {
    if (k === 'headR') continue;
    ok('joint ' + k + ' is finite', J[k].every(Number.isFinite));
  }
  // limb lengths must survive posing — this is what catches a broken rotation
  for (const s of ['L', 'R']) {
    ok('thigh' + s + ' keeps its length',
      near(A.vlen(A.vsub(J['knee' + s], J['hip' + s])), A.BODY.thigh, 1e-9));
    ok('shin' + s + ' keeps its length',
      near(A.vlen(A.vsub(J['ankle' + s], J['knee' + s])), A.BODY.shin, 1e-9));
    ok('upperArm' + s + ' keeps its length',
      near(A.vlen(A.vsub(J['elbow' + s], J['shoulder' + s])), A.BODY.upperArm, 1e-9));
  }
  ok('the head sits above the pelvis', J.head[1] > J.pelvis[1]);
  ok('leaning forward puts the head in front of the pelvis', J.head[0] > J.pelvis[0]);
  // every pose must stand on something
  for (const p of A.RUN_CYCLE) {
    const j = A.buildRig(p);
    ok(p.name + ': a foot is near the ground or airborne, never underground',
      Math.min(j.toeL[1], j.toeR[1]) > -14, String(Math.min(j.toeL[1], j.toeR[1]).toFixed(1)));
  }
}

// --- projection ------------------------------------------------------------
{
  const cam = A.makeCamera({ focal: 900 });
  const near1 = A.project([10, 0, 0], cam);
  const far1 = A.project([10, 0, -500], cam);
  ok('things further away project smaller', far1.s < near1.s, near1.s + ' vs ' + far1.s);
  ok('projection is finite', Number.isFinite(near1.x) && Number.isFinite(near1.y));
  ok('+y is up on the page', A.project([0, 50, 0], cam).y < A.project([0, 0, 0], cam).y);
  const yawed = A.project([100, 0, 0], A.makeCamera({ focal: 900, yaw: 0.5 }));
  ok('yaw foreshortens x', Math.abs(yawed.x) < 100);
}

// --- the alphabet ----------------------------------------------------------
{
  const keys = Object.keys(A.GLYPHS);
  ok('the alphabet is complete', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').every(c => c in A.GLYPHS));
  ok('the digits are complete', '0123456789'.split('').every(c => c in A.GLYPHS));
  for (const k of keys) {
    const [w, strokes] = A.GLYPHS[k];
    ok('glyph ' + k + ' has a width', w > 0 && w < 1.2, String(w));
    for (const st of strokes) {
      ok('glyph ' + k + ' strokes have 2+ points', st.length >= 2);
      ok('glyph ' + k + ' stays in its box',
        st.every(p => p[0] >= -0.1 && p[0] <= w + 0.12 && p[1] >= -0.15 && p[1] <= 1.2),
        JSON.stringify(st.find(p => p[0] < -0.1 || p[0] > w + 0.12 || p[1] < -0.15 || p[1] > 1.2)));
    }
  }
  ok('an unknown character falls back rather than throwing', A.glyphOf('☃')[0] > 0);
  ok('textW grows with the string', A.textW('AAA', 10) > A.textW('AA', 10));
  ok('textW scales with size', near(A.textW('ABC', 20), A.textW('ABC', 10) * 2, 1e-9));
  ok('every species label is drawable',
    A.SPECIES.every(s => s.label.split('').every(c => c in A.GLYPHS)));
}

// --- music player & playlist ------------------------------------------------
{
  ok('17 playlist tracks configured', A.PLAYLIST_TRACKS.length === 17);
  ok('all tracks have valid video IDs', A.PLAYLIST_TRACKS.every(t => typeof t.id === 'string' && t.id.length === 11));
  ok('all tracks have titles and artists', A.PLAYLIST_TRACKS.every(t => t.title && t.artist));
  ok('all tracks have durations and durationSec', A.PLAYLIST_TRACKS.every(t => t.duration && t.durationSec > 0));
  ok('all tracks have thumbnails', A.PLAYLIST_TRACKS.every(t => t.thumbnail.startsWith('http')));
  ok('formatTime handles 0', A.formatTime(0) === '0:00');
  ok('formatTime handles single digit seconds', A.formatTime(65) === '1:05');
  ok('formatTime handles multi digit minutes', A.formatTime(605) === '10:05');
  ok('formatTime handles negative/NaN gracefully', A.formatTime(-5) === '0:00' && A.formatTime(NaN) === '0:00');
  ok('escapeHtml sanitizes html special chars', A.escapeHtml('<script>alert("x&y")</script>') === '&lt;script&gt;alert(&quot;x&amp;y&quot;)&lt;/script&gt;');
}

// --- scene construction -----------------------------------------------------
{
  for (const mode of ['run', 'walk', 'stumble']) {
    const R = A.mulberry32(12345);
    const S = A.buildScene(R, 1920, 1080, 12345, mode);
    ok(`buildScene initializes cleanly for ${mode}`, S && S.focal > 0 && S.rainStreaks.length === 180);
    ok(`buildScene sets correct fisheye factor for ${mode}`, mode === 'run' ? S.fisheyeK > 0 : S.fisheyeK === 0);
  }
}

console.log((fail ? '\nFAILED' : 'ok') + '  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);

