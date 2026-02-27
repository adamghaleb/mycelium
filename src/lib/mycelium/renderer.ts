// ============================================================================
// Mycelium Engine — Canvas 2D Renderer
// Reads from Simulation directly. Batch rendering: edges → particles → nodes.
// Swapping to WebGL later changes only this file.
// ============================================================================

import { GraphNode, GraphEdge, Particle, Vec2 } from "./types";
import { AGENT_COLORS, BG_COLOR } from "./constants";
import {
  colorCSS,
  colorScale,
  colorLerp,
  rgba,
  bezierQuad,
  edgeControlPt,
} from "./math";
import { Simulation } from "./simulation";

export interface Viewport {
  offsetX: number;
  offsetY: number;
  zoom: number;
  width: number;
  height: number;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private _rafId = 0;

  viewport: Viewport = { offsetX: 0, offsetY: 0, zoom: 1, width: 0, height: 0 };

  // Interaction state
  hoveredNodeId: string | null = null;
  selectedNodeId: string | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.viewport.width = window.innerWidth;
    this.viewport.height = window.innerHeight;
  }

  /** Start render loop (separate from simulation loop). */
  start(sim: Simulation): void {
    const loop = () => {
      this._rafId = requestAnimationFrame(loop);
      this.render(sim);
    };
    this._rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = 0;
  }

  /** Screen → world coordinate transform. */
  screenToWorld(sx: number, sy: number): Vec2 {
    return {
      x: (sx - this.viewport.offsetX) / this.viewport.zoom,
      y: (sy - this.viewport.offsetY) / this.viewport.zoom,
    };
  }

  /** Center viewport on a world point at a given zoom level. */
  centerOn(worldX: number, worldY: number, zoom?: number): void {
    if (zoom !== undefined)
      this.viewport.zoom = Math.max(0.2, Math.min(5, zoom));
    this.viewport.offsetX =
      this.viewport.width / 2 - worldX * this.viewport.zoom;
    this.viewport.offsetY =
      this.viewport.height / 2 - worldY * this.viewport.zoom;
  }

  panBy(dx: number, dy: number): void {
    this.viewport.offsetX += dx;
    this.viewport.offsetY += dy;
  }

  zoomAt(delta: number, cx: number, cy: number): void {
    const old = this.viewport.zoom;
    const next = Math.max(0.2, Math.min(5, old * (1 + delta)));
    const ratio = next / old;
    this.viewport.offsetX = cx - (cx - this.viewport.offsetX) * ratio;
    this.viewport.offsetY = cy - (cy - this.viewport.offsetY) * ratio;
    this.viewport.zoom = next;
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  private render(sim: Simulation): void {
    const { ctx, viewport } = this;
    const { nodes, edges } = sim;
    const w = viewport.width;
    const h = viewport.height;

    // Clear
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    // Viewport transform
    ctx.save();
    ctx.translate(viewport.offsetX, viewport.offsetY);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Batch: edges → particles → nodes → glow → labels
    this._drawEdges(nodes, edges);
    this._drawParticles(sim);
    this._drawNodes(nodes, sim.tick);

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Edges
  // ---------------------------------------------------------------------------

  private _drawEdges(
    nodes: Map<string, GraphNode>,
    edges: Map<string, GraphEdge>,
  ): void {
    const ctx = this.ctx;

    for (const edge of edges.values()) {
      const src = nodes.get(edge.sourceId);
      const tgt = nodes.get(edge.targetId);
      if (!src || !tgt) continue;

      const cp = edgeControlPt(src.pos, tgt.pos, edge.curvature);
      const srcC = AGENT_COLORS[src.role];
      const tgtC = AGENT_COLORS[tgt.role];
      const midC = colorLerp(srcC, tgtC, 0.5);

      // Strength-based width and alpha
      const baseAlpha = 0.06 + edge.strength * 0.06 + edge.activity * 0.4;
      const baseWidth = 0.5 + edge.strength * 1.0 + edge.activity * 2;

      // Glow layer
      if (edge.activity > 0.05) {
        ctx.beginPath();
        ctx.moveTo(src.pos.x, src.pos.y);
        ctx.quadraticCurveTo(cp.x, cp.y, tgt.pos.x, tgt.pos.y);
        ctx.strokeStyle = colorCSS({ ...midC, a: edge.activity * 0.3 });
        ctx.lineWidth = baseWidth + 3 + edge.activity * 6;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // Main line
      ctx.beginPath();
      ctx.moveTo(src.pos.x, src.pos.y);
      ctx.quadraticCurveTo(cp.x, cp.y, tgt.pos.x, tgt.pos.y);
      ctx.strokeStyle = colorCSS({ ...midC, a: baseAlpha });
      ctx.lineWidth = baseWidth;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  // ---------------------------------------------------------------------------
  // Particles
  // ---------------------------------------------------------------------------

  private _drawParticles(sim: Simulation): void {
    const ctx = this.ctx;
    const { nodes, edges } = sim;

    const prevComposite = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = "lighter";

    sim.particles.forEach((p) => {
      const edge = edges.get(p.edgeId);
      if (!edge) return;
      const src = nodes.get(edge.sourceId);
      const tgt = nodes.get(edge.targetId);
      if (!src || !tgt) return;

      const cp = edgeControlPt(src.pos, tgt.pos, edge.curvature);
      const t = Math.max(0, Math.min(1, p.progress));
      const pos = bezierQuad(src.pos, cp, tgt.pos, t);
      const alpha = p.life * 0.8;

      // Trail
      if (p.trailLen > 1) {
        for (let i = 0; i < p.trailLen; i++) {
          const idx = (p.trailHead - p.trailLen + i + p.maxTrail) % p.maxTrail;
          const trailAlpha = (i / p.trailLen) * alpha * 0.4;
          const tx = p.trailX[idx];
          const ty = p.trailY[idx];
          ctx.beginPath();
          ctx.arc(tx, ty, p.size * 0.5 * (i / p.trailLen), 0, Math.PI * 2);
          ctx.fillStyle = colorCSS({ ...p.color, a: trailAlpha });
          ctx.fill();
        }
      }

      // Core glow
      const grad = ctx.createRadialGradient(
        pos.x,
        pos.y,
        0,
        pos.x,
        pos.y,
        p.size * 2.5,
      );
      grad.addColorStop(0, colorCSS({ ...p.color, a: alpha }));
      grad.addColorStop(0.4, colorCSS({ ...p.color, a: alpha * 0.5 }));
      grad.addColorStop(1, colorCSS({ ...p.color, a: 0 }));
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    ctx.globalCompositeOperation = prevComposite;
  }

  // ---------------------------------------------------------------------------
  // Nodes
  // ---------------------------------------------------------------------------

  private _drawNodes(nodes: Map<string, GraphNode>, tick: number): void {
    const ctx = this.ctx;
    const prevComposite = ctx.globalCompositeOperation;

    for (const node of nodes.values()) {
      const c = AGENT_COLORS[node.role];
      const breathScale =
        1 + Math.sin(node.breathPhase) * 0.08 * (1 + node.activity);
      const r = node.radius * breathScale;
      const isHovered = node.id === this.hoveredNodeId;
      const isSelected = node.id === this.selectedNodeId;

      // Outer glow (additive)
      ctx.globalCompositeOperation = "lighter";
      const glowR = r * (2.5 + node.activity * 3);
      const glowA = 0.05 + node.activity * 0.25;

      const glowGrad = ctx.createRadialGradient(
        node.pos.x,
        node.pos.y,
        r * 0.5,
        node.pos.x,
        node.pos.y,
        glowR,
      );
      glowGrad.addColorStop(0, colorCSS({ ...c, a: glowA }));
      glowGrad.addColorStop(0.5, colorCSS({ ...c, a: glowA * 0.3 }));
      glowGrad.addColorStop(1, colorCSS({ ...c, a: 0 }));
      ctx.beginPath();
      ctx.arc(node.pos.x, node.pos.y, glowR, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // Node body (normal blend)
      ctx.globalCompositeOperation = "source-over";
      const brightness = 0.3 + node.activity * 0.5;
      const bodyGrad = ctx.createRadialGradient(
        node.pos.x - r * 0.3,
        node.pos.y - r * 0.3,
        0,
        node.pos.x,
        node.pos.y,
        r,
      );
      bodyGrad.addColorStop(
        0,
        colorCSS(colorLerp(colorScale(c, brightness), rgba(1, 1, 1, 1), 0.2)),
      );
      bodyGrad.addColorStop(0.7, colorCSS(colorScale(c, brightness * 0.6)));
      bodyGrad.addColorStop(1, colorCSS(colorScale(c, brightness * 0.3)));
      ctx.beginPath();
      ctx.arc(node.pos.x, node.pos.y, r, 0, Math.PI * 2);
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Selection/hover ring
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.pos.x, node.pos.y, r + 3, 0, Math.PI * 2);
        ctx.strokeStyle = isSelected
          ? colorCSS({ ...c, a: 0.9 })
          : colorCSS({ ...c, a: 0.5 });
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();
      }

      // Core highlight
      const coreA = 0.3 + node.activity * 0.5;
      const coreGrad = ctx.createRadialGradient(
        node.pos.x,
        node.pos.y,
        0,
        node.pos.x,
        node.pos.y,
        r * 0.5,
      );
      coreGrad.addColorStop(0, colorCSS({ r: 1, g: 1, b: 1, a: coreA }));
      coreGrad.addColorStop(1, colorCSS({ r: 1, g: 1, b: 1, a: 0 }));
      ctx.beginPath();
      ctx.arc(node.pos.x, node.pos.y, r * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();
    }

    ctx.globalCompositeOperation = prevComposite;
  }
}
