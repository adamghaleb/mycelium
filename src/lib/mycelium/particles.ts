// ============================================================================
// Mycelium Engine — Particle System
// Object pool, edge interpolation, ambient + message particles.
// Zero allocations in hot path.
// ============================================================================

import {
  Particle,
  GraphEdge,
  GraphNode,
  Color,
  SimulationParams,
} from "./types";
import { AGENT_COLORS } from "./constants";
import { colorLerp, colorScale, rgba, rng } from "./math";

// ---------------------------------------------------------------------------
// Object pool
// ---------------------------------------------------------------------------

export class ParticlePool {
  private pool: Particle[];
  private _activeCount = 0;

  constructor(maxSize: number) {
    this.pool = new Array(maxSize);
    for (let i = 0; i < maxSize; i++) {
      this.pool[i] = this._blank();
    }
  }

  get activeCount(): number {
    return this._activeCount;
  }

  /** Acquire a particle from the pool. Returns null if full. */
  acquire(): Particle | null {
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        this.pool[i].active = true;
        this._activeCount++;
        return this.pool[i];
      }
    }
    return null;
  }

  /** Release a particle back to the pool. */
  release(p: Particle): void {
    p.active = false;
    this._activeCount--;
  }

  /** Iterate over active particles. */
  forEach(fn: (p: Particle, index: number) => void): void {
    let idx = 0;
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i].active) {
        fn(this.pool[i], idx++);
      }
    }
  }

  /** Update all active particles, releasing dead ones. */
  updateAll(
    edges: Map<string, GraphEdge>,
    nodes: Map<string, GraphNode>,
  ): void {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.progress += p.speed;
      p.life -= 0.005;

      // Dead check
      if (p.life <= 0 || p.progress < -0.05 || p.progress > 1.05) {
        this.release(p);
        continue;
      }

      // Edge still exists?
      if (!edges.has(p.edgeId)) {
        this.release(p);
        continue;
      }

      // Update trail ring buffer
      const edge = edges.get(p.edgeId)!;
      const src = nodes.get(edge.sourceId);
      const tgt = nodes.get(edge.targetId);
      if (!src || !tgt) {
        this.release(p);
        continue;
      }

      // Inline bezier position for trail
      const t = Math.max(0, Math.min(1, p.progress));
      // Control point (simplified — curvature perpendicular offset)
      const mx = (src.pos.x + tgt.pos.x) / 2;
      const my = (src.pos.y + tgt.pos.y) / 2;
      const dx = tgt.pos.x - src.pos.x;
      const dy = tgt.pos.y - src.pos.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const px = -dy / len,
        py = dx / len;
      const cpx = mx + px * edge.curvature;
      const cpy = my + py * edge.curvature;
      const mt = 1 - t;
      const wx = mt * mt * src.pos.x + 2 * mt * t * cpx + t * t * tgt.pos.x;
      const wy = mt * mt * src.pos.y + 2 * mt * t * cpy + t * t * tgt.pos.y;

      p.trailX[p.trailHead] = wx;
      p.trailY[p.trailHead] = wy;
      p.trailHead = (p.trailHead + 1) % p.maxTrail;
      if (p.trailLen < p.maxTrail) p.trailLen++;
    }
  }

  private _blank(): Particle {
    const maxTrail = 8;
    return {
      active: false,
      edgeId: "",
      progress: 0,
      speed: 0,
      color: { r: 1, g: 1, b: 1, a: 1 },
      life: 0,
      size: 0,
      trailX: new Float32Array(maxTrail),
      trailY: new Float32Array(maxTrail),
      trailHead: 0,
      trailLen: 0,
      maxTrail,
      ambient: false,
    };
  }
}

// ---------------------------------------------------------------------------
// Emission helpers
// ---------------------------------------------------------------------------

export function emitOnActiveEdges(
  pool: ParticlePool,
  edges: Map<string, GraphEdge>,
  nodes: Map<string, GraphNode>,
  params: SimulationParams,
): void {
  for (const edge of edges.values()) {
    if (edge.activity <= 0) continue;
    if (Math.random() >= params.emissionRate * edge.activity) continue;

    const src = nodes.get(edge.sourceId);
    if (!src) continue;

    const p = pool.acquire();
    if (!p) return;

    const sc = AGENT_COLORS[src.role];
    const reverse = Math.random() < 0.3;

    p.edgeId = edge.id;
    p.progress = reverse ? 1 : 0;
    p.speed =
      (params.particleSpeed + (Math.random() - 0.5) * 0.008) *
      (reverse ? -1 : 1);
    p.color = colorLerp(sc, rgba(1, 1, 1, 1), 0.15);
    p.life = 1.0;
    p.size = 2.5 * (0.7 + Math.random() * 0.6);
    p.trailHead = 0;
    p.trailLen = 0;
    p.ambient = false;
  }
}

export function emitAmbient(
  pool: ParticlePool,
  edges: Map<string, GraphEdge>,
  nodes: Map<string, GraphNode>,
  params: SimulationParams,
): void {
  const edgeArr = Array.from(edges.values());
  if (edgeArr.length === 0) return;

  const count = Math.floor(params.ambientRate * edgeArr.length);
  for (let i = 0; i < count; i++) {
    if (Math.random() >= params.ambientRate) continue;
    const edge = edgeArr[Math.floor(Math.random() * edgeArr.length)];
    const src = nodes.get(edge.sourceId);
    if (!src) continue;

    const p = pool.acquire();
    if (!p) return;

    const sc = AGENT_COLORS[src.role];

    p.edgeId = edge.id;
    p.progress = 0;
    p.speed = params.particleSpeed * (0.5 + Math.random() * 0.5);
    p.color = colorScale(sc, 0.4);
    p.life = 1.0;
    p.size = 1.5 * (0.7 + Math.random() * 0.6);
    p.trailHead = 0;
    p.trailLen = 0;
    p.ambient = true;
  }
}

export function emitBurst(
  pool: ParticlePool,
  edgeId: string,
  sourceNode: GraphNode,
  params: SimulationParams,
  count: number = 12,
): void {
  const sc = AGENT_COLORS[sourceNode.role];
  const bright = colorLerp(sc, rgba(1, 1, 1, 1), 0.3);

  for (let i = 0; i < count; i++) {
    const p = pool.acquire();
    if (!p) return;

    p.edgeId = edgeId;
    p.progress = rng(0, 0.15);
    p.speed = params.particleSpeed * rng(1.5, 3.0);
    p.color = bright;
    p.life = 1.0;
    p.size = 2.5 * rng(1.2, 2.0);
    p.trailHead = 0;
    p.trailLen = 0;
    p.ambient = false;
  }
}
