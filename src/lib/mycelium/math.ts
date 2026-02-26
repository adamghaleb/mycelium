// ============================================================================
// Mycelium Engine — Vector & Math Utilities
// Pure functions, zero side effects.
// ============================================================================

import { Vec2, Color } from "./types";

// --- Vec2 ops ---

export const v2 = (x: number, y: number): Vec2 => ({ x, y });
export const v2Zero = (): Vec2 => ({ x: 0, y: 0 });
export const v2Add = (a: Vec2, b: Vec2): Vec2 => ({
  x: a.x + b.x,
  y: a.y + b.y,
});
export const v2Sub = (a: Vec2, b: Vec2): Vec2 => ({
  x: a.x - b.x,
  y: a.y - b.y,
});
export const v2Scale = (v: Vec2, s: number): Vec2 => ({
  x: v.x * s,
  y: v.y * s,
});
export const v2Len = (v: Vec2): number => Math.sqrt(v.x * v.x + v.y * v.y);
export const v2LenSq = (v: Vec2): number => v.x * v.x + v.y * v.y;
export const v2Dist = (a: Vec2, b: Vec2): number => v2Len(v2Sub(a, b));
export const v2DistSq = (a: Vec2, b: Vec2): number => v2LenSq(v2Sub(a, b));
export const v2Dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const v2Perp = (v: Vec2): Vec2 => ({ x: -v.y, y: v.x });

export const v2Norm = (v: Vec2): Vec2 => {
  const len = v2Len(v);
  return len < 1e-10 ? { x: 0, y: 0 } : { x: v.x / len, y: v.y / len };
};

export const v2Clamp = (v: Vec2, maxLen: number): Vec2 => {
  const lenSq = v2LenSq(v);
  if (lenSq <= maxLen * maxLen) return v;
  const len = Math.sqrt(lenSq);
  return { x: (v.x / len) * maxLen, y: (v.y / len) * maxLen };
};

export const v2Lerp = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

export const v2Rand = (magnitude: number = 1): Vec2 => {
  const angle = Math.random() * Math.PI * 2;
  return { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude };
};

// --- Scalar ---

export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

// --- Color ops ---

export const rgba = (
  r: number,
  g: number,
  b: number,
  a: number = 1,
): Color => ({ r, g, b, a });

export const colorLerp = (a: Color, b: Color, t: number): Color => ({
  r: a.r + (b.r - a.r) * t,
  g: a.g + (b.g - a.g) * t,
  b: a.b + (b.b - a.b) * t,
  a: a.a + (b.a - a.a) * t,
});

export const colorScale = (c: Color, s: number): Color => ({
  r: c.r * s,
  g: c.g * s,
  b: c.b * s,
  a: c.a,
});

export const colorCSS = (c: Color): string =>
  `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},${c.a.toFixed(3)})`;

// --- Bezier ---

export const bezierQuad = (p0: Vec2, cp: Vec2, p1: Vec2, t: number): Vec2 => {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * cp.x + t * t * p1.x,
    y: mt * mt * p0.y + 2 * mt * t * cp.y + t * t * p1.y,
  };
};

export const edgeControlPt = (
  src: Vec2,
  tgt: Vec2,
  curvature: number,
): Vec2 => {
  const mid = v2Lerp(src, tgt, 0.5);
  const dir = v2Sub(tgt, src);
  const perp = v2Norm(v2Perp(dir));
  return v2Add(mid, v2Scale(perp, curvature));
};

// --- Random ---

export const rng = (min: number, max: number): number =>
  min + Math.random() * (max - min);
export const rngInt = (min: number, max: number): number =>
  Math.floor(rng(min, max + 1));
export const rngPick = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
export const rngGauss = (mean: number = 0, std: number = 1): number => {
  const u1 = Math.random();
  const u2 = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};

// --- ID ---

let _id = 0;
export const genId = (prefix: string = "n"): string =>
  `${prefix}_${(++_id).toString(36)}_${Date.now().toString(36)}`;
