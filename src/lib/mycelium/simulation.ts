// ============================================================================
// Mycelium Engine — Simulation Orchestrator
// Owns the loop, coordinates all subsystems.
// React never drives rendering — this runs its own rAF loop.
// ============================================================================

import {
  GraphNode,
  GraphEdge,
  Message,
  SimulationParams,
  SimulationSnapshot,
  PropagationState,
  Vec2,
} from "./types";
import {
  DEFAULT_PARAMS,
  TEMPERATURE_INITIAL,
  MAX_STEPS_PER_FRAME,
  SNAPSHOT_INTERVAL,
} from "./constants";
import { v2 } from "./math";
import {
  generateSeedNetwork,
  attemptBudding,
  findLateralTargets,
  updateBudding,
  decayActivity,
  decayEdgeStrength,
} from "./graph";
import { physicsTick } from "./physics";
import {
  ParticlePool,
  emitOnActiveEdges,
  emitAmbient,
  emitBurst,
} from "./particles";
import { createMessage, advanceMessages } from "./messages";
import { Quadtree } from "./quadtree";

export type SnapshotCallback = (snapshot: SimulationSnapshot) => void;
export type MessageCallback = (messages: Message[]) => void;

export class Simulation {
  // Core data
  nodes = new Map<string, GraphNode>();
  edges = new Map<string, GraphEdge>();
  particles: ParticlePool;
  activeMessages: Message[] = [];
  completedMessages: Message[] = [];
  quadtree: Quadtree | null = null;

  // State
  params: SimulationParams;
  temperature = TEMPERATURE_INITIAL;
  tick = 0;
  totalMessagesProcessed = 0;
  running = true;
  width = 0;
  height = 0;

  // Loop
  private _rafId = 0;
  private _lastTime = 0;
  private _accumulator = 0;
  private _frameCount = 0;
  private _fpsAccum = 0;
  private _fps = 60;

  // Callbacks
  private _onSnapshot: SnapshotCallback | null = null;
  private _onMessagesChanged: MessageCallback | null = null;

  // Dragging
  private _dragNodeId: string | null = null;

  constructor(params?: Partial<SimulationParams>) {
    this.params = { ...DEFAULT_PARAMS, ...params };
    this.particles = new ParticlePool(this.params.maxParticles);
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  init(width: number, height: number): void {
    this.width = width;
    this.height = height;
    const { nodes, edges } = generateSeedNetwork(width / 2, height / 2);
    this.nodes = nodes;
    this.edges = edges;
    this.temperature = TEMPERATURE_INITIAL;
    this.tick = 0;
    this.totalMessagesProcessed = 0;
    this.activeMessages = [];
    this.completedMessages = [];
  }

  start(): void {
    this.running = true;
    this._lastTime = performance.now();
    this._accumulator = 0;
    this._loop(this._lastTime);
  }

  stop(): void {
    this.running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = 0;
  }

  destroy(): void {
    this.stop();
    this.nodes.clear();
    this.edges.clear();
  }

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  onSnapshot(cb: SnapshotCallback): void {
    this._onSnapshot = cb;
  }

  onMessagesChanged(cb: MessageCallback): void {
    this._onMessagesChanged = cb;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  injectMessage(text: string, entryNodeId?: string): void {
    if (this.nodes.size === 0) return;
    const msg = createMessage(
      text,
      this.nodes,
      this.edges,
      this.params.hopDelayMs,
      this.params.maxHops,
      entryNodeId,
    );
    this.activeMessages.push(msg);
    this._notifyMessages();
  }

  /** Start dragging a node (pin it). */
  startDrag(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.pinned = true;
      this._dragNodeId = nodeId;
    }
  }

  /** Update dragged node position. */
  updateDrag(x: number, y: number): void {
    if (!this._dragNodeId) return;
    const node = this.nodes.get(this._dragNodeId);
    if (node) {
      node.pos = { x, y };
      node.vel = { x: 0, y: 0 };
    }
  }

  /** End drag, unpin the node. */
  endDrag(): void {
    if (this._dragNodeId) {
      const node = this.nodes.get(this._dragNodeId);
      if (node) node.pinned = false;
      this._dragNodeId = null;
    }
  }

  get isDragging(): boolean {
    return this._dragNodeId !== null;
  }

  /** Reheat physics (e.g. after param change). */
  reheat(): void {
    this.temperature = TEMPERATURE_INITIAL;
  }

  updateParams(partial: Partial<SimulationParams>): void {
    this.params = { ...this.params, ...partial };
  }

  resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
  }

  // ---------------------------------------------------------------------------
  // Main loop
  // ---------------------------------------------------------------------------

  private _loop = (now: number): void => {
    if (!this.running) return;
    this._rafId = requestAnimationFrame(this._loop);

    const dt = now - this._lastTime;
    this._lastTime = now;
    this._fpsAccum += dt;
    this._frameCount++;

    if (this._fpsAccum >= 1000) {
      this._fps = Math.round((this._frameCount * 1000) / this._fpsAccum);
      this._fpsAccum = 0;
      this._frameCount = 0;
    }

    // Fixed timestep accumulation (cap at MAX_STEPS_PER_FRAME)
    this._accumulator += Math.min(dt, 50); // cap spike
    let steps = 0;
    while (this._accumulator >= 16.667 && steps < MAX_STEPS_PER_FRAME) {
      this._step();
      this._accumulator -= 16.667;
      steps++;
    }

    // Snapshot to React
    if (this.tick % SNAPSHOT_INTERVAL === 0) {
      this._onSnapshot?.({
        nodeCount: this.nodes.size,
        edgeCount: this.edges.size,
        particleCount: this.particles.activeCount,
        activeMessages: this.activeMessages.length,
        fps: this._fps,
        tick: this.tick,
        totalMessagesProcessed: this.totalMessagesProcessed,
      });
    }
  };

  private _step(): void {
    const { nodes, edges, params } = this;
    const center = v2(this.width / 2, this.height / 2);

    // 1. Physics
    this.temperature = physicsTick(
      nodes,
      edges,
      params,
      center,
      this.temperature,
    );

    // 2. Budding
    if (this.tick % params.buddingInterval === 0) {
      const result = attemptBudding(
        nodes,
        edges,
        params.maxNodes,
        params.buddingProbability,
        this.tick,
      );
      if (result) {
        nodes.set(result.node.id, result.node);
        edges.set(result.edge.id, result.edge);
        const laterals = findLateralTargets(result.node, nodes, edges);
        for (const le of laterals) edges.set(le.id, le);
      }
    }

    // 3. Budding animations
    updateBudding(nodes);

    // 4. Message propagation
    const propResult = advanceMessages(
      this.activeMessages,
      nodes,
      edges,
      params.edgeReinforce,
    );

    // Burst particles on activated edges
    for (const edgeId of propResult.activatedEdges) {
      const edge = edges.get(edgeId);
      const src = edge ? nodes.get(edge.sourceId) : null;
      if (src && edge) {
        emitBurst(this.particles, edgeId, src, params, 15);
      }
    }

    // Move completed
    this.activeMessages = this.activeMessages.filter(
      (m) =>
        m.state === PropagationState.Propagating ||
        m.state === PropagationState.Synthesizing,
    );
    if (propResult.completedMessages.length > 0) {
      this.completedMessages.push(...propResult.completedMessages);
      this.totalMessagesProcessed += propResult.completedMessages.length;
      this._notifyMessages();
    }

    // 5. Particles
    emitOnActiveEdges(this.particles, edges, nodes, params);
    emitAmbient(this.particles, edges, nodes, params);
    this.particles.updateAll(edges, nodes);

    // 6. Decay
    decayActivity(nodes, edges);
    decayEdgeStrength(edges, params.edgeDecay);

    // 7. Quadtree rebuild
    this.quadtree = Quadtree.fromNodes(nodes);

    this.tick++;
  }

  private _notifyMessages(): void {
    this._onMessagesChanged?.([
      ...this.activeMessages,
      ...this.completedMessages,
    ]);
  }
}
