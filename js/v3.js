// ---------------------------------------------------------------------------
// The 150 lines that replace Three.js.
//
// The reference imports the whole engine to obtain Vector3 and a camera. It
// never renders a polygon with it. This is everything it actually used:
// vectors, a bone as a direction, nested rotation, and a perspective divide.
//
// Points are plain [x,y,z]. y is up. The camera looks down -z.
// ---------------------------------------------------------------------------
'use strict';

const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vmul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const vlen = a => Math.hypot(a[0], a[1], a[2]);
const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function vunit(a) { const d = vlen(a) || 1; return [a[0] / d, a[1] / d, a[2] / d]; }
const vlerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const vstep = (p, d, l) => [p[0] + d[0] * l, p[1] + d[1] * l, p[2] + d[2] * l];

function rotX(p, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
}
function rotY(p, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
}
function rotZ(p, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
}

// A bone as a direction. theta swings it in the sagittal plane (the plane a
// runner lives in); phi rotates that swing out of the plane, which is where
// foreshortening comes from.
//   theta = 0 points straight down, +theta swings the far end forward (+x)
function bone(theta, phi) {
  const st = Math.sin(theta), ct = Math.cos(theta);
  return [st * Math.cos(phi), -ct, st * Math.sin(phi)];
}

// Perspective. focal is the distance from eye to the projection plane, in the
// same units as the points; larger focal = longer lens = less foreshortening.
function makeCamera(o = {}) {
  return {
    pos: o.pos || [0, 0, 0],
    yaw: o.yaw || 0,
    pitch: o.pitch || 0,
    focal: o.focal || 900,
    cx: o.cx || 0,
    cy: o.cy || 0,
    zoom: o.zoom || 1
  };
}

// Returns {x, y, z, s} — screen position, view-space depth, and the scale
// factor at that depth (useful for sizing a mark to its distance).
function project(p, cam) {
  let v = vsub(p, cam.pos);
  v = rotY(v, -cam.yaw);
  v = rotX(v, -cam.pitch);
  const z = cam.focal - v[2];
  const s = (cam.focal / Math.max(1e-3, z)) * cam.zoom;
  return { x: cam.cx + v[0] * s, y: cam.cy - v[1] * s, z: v[2], s };
}

const projectXY = (p, cam) => { const q = project(p, cam); return [q.x, q.y]; };

if (typeof module !== 'undefined') module.exports = {
  vadd, vsub, vmul, vlen, vdot, vunit, vlerp, vstep,
  rotX, rotY, rotZ, bone, makeCamera, project, projectXY
};
