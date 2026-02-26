// ============================================================================
// Mycelium Engine — Force-Directed Physics
// Spring + repulsion + damping + center gravity with simulated annealing.
// ============================================================================

import { GraphNode, GraphEdge, Vec2, SimulationParams } from "./types";
import {
  v2,
  v2Add,
  v2Sub,
  v2Scale,
  v2Norm,
  v2Len,
  v2LenSq,
  v2Clamp,
  v2Zero,
  v2DistSq,
} from "./math";
import { MIN_DISTANCE, COOLING_RATE, TEMPERATURE_MIN } from "./constants";

/**
 * One physics tick. Mutates positions/velocities in-place.
 * Returns updated temperature.
 */
export function physicsTick(
  nodes: Map<string, GraphNode>,
  edges: Map<string, GraphEdge>,
  params: SimulationParams,
  center: Vec2,
  temperature: number,
): number {
  const arr = Array.from(nodes.values());
  const n = arr.length;
  if (n === 0) return temperature;

  // Accumulate forces
  const fx = new Float64Array(n);
  const fy = new Float64Array(n);

  // Repulsion (O(n²) — fine for <500 nodes)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = arr[i].pos.x - arr[j].pos.x;
      const dy = arr[i].pos.y - arr[j].pos.y;
      let distSq = dx * dx + dy * dy;
      if (distSq < MIN_DISTANCE * MIN_DISTANCE)
        distSq = MIN_DISTANCE * MIN_DISTANCE;
      const dist = Math.sqrt(distSq);
      const force = params.repulsion / dist;
      const nx = dx / dist;
      const ny = dy / dist;
      fx[i] += nx * force;
      fy[i] += ny * force;
      fx[j] -= nx * force;
      fy[j] -= ny * force;
    }
  }

  // Index lookup for force arrays
  const idxMap = new Map<string, number>();
  for (let i = 0; i < n; i++) idxMap.set(arr[i].id, i);

  // Attraction (edges)
  for (const e of edges.values()) {
    const si = idxMap.get(e.sourceId);
    const ti = idxMap.get(e.targetId);
    if (si === undefined || ti === undefined) continue;
    const s = arr[si],
      t = arr[ti];
    const dx = t.pos.x - s.pos.x;
    const dy = t.pos.y - s.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1e-6) continue;
    const force = params.attraction * e.stiffness * (dist - e.restLength);
    const nx = dx / dist;
    const ny = dy / dist;
    fx[si] += nx * force;
    fy[si] += ny * force;
    fx[ti] -= nx * force;
    fy[ti] -= ny * force;
  }

  // Center gravity + velocity integration
  for (let i = 0; i < n; i++) {
    const node = arr[i];
    if (node.pinned) continue;

    // Gravity toward center
    fx[i] += (center.x - node.pos.x) * params.centerGravity;
    fy[i] += (center.y - node.pos.y) * params.centerGravity;

    // Scale by temperature
    const svx = (node.vel.x + fx[i] * temperature) * params.damping;
    const svy = (node.vel.y + fy[i] * temperature) * params.damping;

    // Clamp velocity
    const vLenSq = svx * svx + svy * svy;
    const maxV = params.maxVelocity;
    if (vLenSq > maxV * maxV) {
      const vLen = Math.sqrt(vLenSq);
      node.vel = { x: (svx / vLen) * maxV, y: (svy / vLen) * maxV };
    } else {
      node.vel = { x: svx, y: svy };
    }

    node.pos = { x: node.pos.x + node.vel.x, y: node.pos.y + node.vel.y };
  }

  return Math.max(TEMPERATURE_MIN, temperature * COOLING_RATE);
}

/**
 * Find nearest node to a world-space point.
 */
export function findNodeAt(
  nodes: Map<string, GraphNode>,
  point: Vec2,
  maxDist: number = 30,
): GraphNode | null {
  let best: GraphNode | null = null;
  let bestDSq = maxDist * maxDist;
  for (const n of nodes.values()) {
    const dsq = v2DistSq(n.pos, point);
    if (dsq < bestDSq) {
      bestDSq = dsq;
      best = n;
    }
  }
  return best;
}
