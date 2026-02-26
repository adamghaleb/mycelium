// ============================================================================
// Mycelium Engine — Quadtree
// Spatial index for hit-testing and future Barnes-Hut optimization.
// ============================================================================

import { Vec2, AABB, GraphNode } from "./types";

const MAX_ITEMS = 8;
const MAX_DEPTH = 8;

interface QTNode {
  bounds: AABB;
  items: GraphNode[];
  children: QTNode[] | null;
  depth: number;
}

export class Quadtree {
  private root: QTNode;

  constructor(cx: number, cy: number, hw: number, hh: number) {
    this.root = {
      bounds: { cx, cy, hw, hh },
      items: [],
      children: null,
      depth: 0,
    };
  }

  /** Rebuild from scratch with the given nodes. */
  static fromNodes(nodes: Map<string, GraphNode>): Quadtree {
    // Compute bounds
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const n of nodes.values()) {
      if (n.pos.x < minX) minX = n.pos.x;
      if (n.pos.y < minY) minY = n.pos.y;
      if (n.pos.x > maxX) maxX = n.pos.x;
      if (n.pos.y > maxY) maxY = n.pos.y;
    }

    if (!isFinite(minX)) {
      return new Quadtree(0, 0, 1000, 1000);
    }

    const pad = 50;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const hw = (maxX - minX) / 2 + pad;
    const hh = (maxY - minY) / 2 + pad;

    const qt = new Quadtree(cx, cy, hw, hh);
    for (const n of nodes.values()) {
      qt.insert(n);
    }
    return qt;
  }

  insert(node: GraphNode): void {
    this._insert(this.root, node);
  }

  private _insert(qt: QTNode, node: GraphNode): void {
    if (!this._containsPoint(qt.bounds, node.pos)) return;

    if (qt.children === null) {
      qt.items.push(node);
      if (qt.items.length > MAX_ITEMS && qt.depth < MAX_DEPTH) {
        this._subdivide(qt);
      }
      return;
    }

    for (const child of qt.children) {
      if (this._containsPoint(child.bounds, node.pos)) {
        this._insert(child, node);
        return;
      }
    }
  }

  /** Find all nodes within radius of point. */
  queryRadius(point: Vec2, radius: number): GraphNode[] {
    const results: GraphNode[] = [];
    const r2 = radius * radius;
    this._queryRadius(this.root, point, r2, results);
    return results;
  }

  private _queryRadius(
    qt: QTNode,
    p: Vec2,
    r2: number,
    out: GraphNode[],
  ): void {
    if (!this._intersectsCircle(qt.bounds, p, Math.sqrt(r2))) return;

    for (const item of qt.items) {
      const dx = item.pos.x - p.x;
      const dy = item.pos.y - p.y;
      if (dx * dx + dy * dy <= r2) out.push(item);
    }

    if (qt.children) {
      for (const child of qt.children) {
        this._queryRadius(child, p, r2, out);
      }
    }
  }

  /** Find nearest node to point within maxDist. */
  findNearest(point: Vec2, maxDist: number): GraphNode | null {
    let best: GraphNode | null = null;
    let bestDSq = maxDist * maxDist;

    const candidates = this.queryRadius(point, maxDist);
    for (const c of candidates) {
      const dx = c.pos.x - point.x;
      const dy = c.pos.y - point.y;
      const dsq = dx * dx + dy * dy;
      if (dsq < bestDSq) {
        bestDSq = dsq;
        best = c;
      }
    }

    return best;
  }

  private _subdivide(qt: QTNode): void {
    const { cx, cy, hw, hh } = qt.bounds;
    const nhw = hw / 2,
      nhh = hh / 2;
    const d = qt.depth + 1;

    qt.children = [
      {
        bounds: { cx: cx - nhw, cy: cy - nhh, hw: nhw, hh: nhh },
        items: [],
        children: null,
        depth: d,
      },
      {
        bounds: { cx: cx + nhw, cy: cy - nhh, hw: nhw, hh: nhh },
        items: [],
        children: null,
        depth: d,
      },
      {
        bounds: { cx: cx - nhw, cy: cy + nhh, hw: nhw, hh: nhh },
        items: [],
        children: null,
        depth: d,
      },
      {
        bounds: { cx: cx + nhw, cy: cy + nhh, hw: nhw, hh: nhh },
        items: [],
        children: null,
        depth: d,
      },
    ];

    for (const item of qt.items) {
      for (const child of qt.children) {
        if (this._containsPoint(child.bounds, item.pos)) {
          this._insert(child, item);
          break;
        }
      }
    }
    qt.items = [];
  }

  private _containsPoint(b: AABB, p: Vec2): boolean {
    return (
      p.x >= b.cx - b.hw &&
      p.x <= b.cx + b.hw &&
      p.y >= b.cy - b.hh &&
      p.y <= b.cy + b.hh
    );
  }

  private _intersectsCircle(b: AABB, p: Vec2, r: number): boolean {
    const closestX = Math.max(b.cx - b.hw, Math.min(p.x, b.cx + b.hw));
    const closestY = Math.max(b.cy - b.hh, Math.min(p.y, b.cy + b.hh));
    const dx = p.x - closestX;
    const dy = p.y - closestY;
    return dx * dx + dy * dy <= r * r;
  }
}
