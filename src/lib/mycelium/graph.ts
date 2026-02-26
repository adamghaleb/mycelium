// ============================================================================
// Mycelium Engine — Graph (Node/Edge CRUD + Adjacency)
// ============================================================================

import { GraphNode, GraphEdge, AgentRole, CognitiveProfile } from "./types";
import {
  v2,
  v2Add,
  v2Rand,
  v2Dist,
  rng,
  rngPick,
  rngInt,
  rngGauss,
  genId,
} from "./math";
import {
  AGENT_COLORS,
  INITIAL_NODE_COUNT,
  EDGE_LENGTH_MIN,
  EDGE_LENGTH_MAX,
  BUDDING_DURATION,
} from "./constants";
import { createCognitiveProfile } from "./agents";

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

export function createNode(
  x: number,
  y: number,
  role?: AgentRole,
  parentId?: string,
  tick: number = 0,
): GraphNode {
  const r = role ?? rngPick(Object.values(AgentRole) as AgentRole[]);
  const baseRadius = rng(6, 12);

  return {
    id: genId("node"),
    pos: v2(x, y),
    vel: v2(0, 0),
    radius: parentId ? 1 : baseRadius,
    targetRadius: baseRadius,
    role: r,
    color: AGENT_COLORS[r],
    activity: parentId ? 0.8 : 0.1,
    messagesProcessed: 0,
    breathPhase: Math.random() * Math.PI * 2,
    budding: !!parentId,
    parentId: parentId ?? null,
    birthTick: tick,
    pinned: false,
    profile: createCognitiveProfile(r),
  };
}

export function createEdge(
  sourceId: string,
  targetId: string,
  restLength?: number,
): GraphEdge {
  return {
    id: genId("edge"),
    sourceId,
    targetId,
    strength: 1.0,
    restLength: restLength ?? rng(80, 180),
    stiffness: rng(0.8, 1.2),
    curvature: rngGauss(0, 25),
    activity: 0,
  };
}

// ---------------------------------------------------------------------------
// Adjacency
// ---------------------------------------------------------------------------

export function buildAdjacency(
  edges: Map<string, GraphEdge>,
): Map<string, Array<{ nodeId: string; edgeId: string }>> {
  const adj = new Map<string, Array<{ nodeId: string; edgeId: string }>>();
  for (const e of edges.values()) {
    if (!adj.has(e.sourceId)) adj.set(e.sourceId, []);
    if (!adj.has(e.targetId)) adj.set(e.targetId, []);
    adj.get(e.sourceId)!.push({ nodeId: e.targetId, edgeId: e.id });
    adj.get(e.targetId)!.push({ nodeId: e.sourceId, edgeId: e.id });
  }
  return adj;
}

export function nodeDegree(
  nodeId: string,
  edges: Map<string, GraphEdge>,
): number {
  let deg = 0;
  for (const e of edges.values()) {
    if (e.sourceId === nodeId || e.targetId === nodeId) deg++;
  }
  return deg;
}

// ---------------------------------------------------------------------------
// Initial network generation (30 nodes)
// ---------------------------------------------------------------------------

export function generateSeedNetwork(
  cx: number,
  cy: number,
): { nodes: Map<string, GraphNode>; edges: Map<string, GraphEdge> } {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const roles = Object.values(AgentRole) as AgentRole[];

  // Seed node
  const seed = createNode(cx, cy, AgentRole.Synthesizer);
  seed.radius = 14;
  seed.targetRadius = 14;
  nodes.set(seed.id, seed);

  const frontier = [seed.id];
  let placed = 1;

  while (placed < INITIAL_NODE_COUNT && frontier.length > 0) {
    const parentIdx = Math.floor(Math.random() * Math.min(frontier.length, 5));
    const parentId = frontier[frontier.length - 1 - parentIdx];
    const parent = nodes.get(parentId)!;
    const childCount = Math.min(rngInt(1, 2), INITIAL_NODE_COUNT - placed);

    for (let c = 0; c < childCount; c++) {
      const dist = rng(EDGE_LENGTH_MIN, EDGE_LENGTH_MAX);
      const offset = v2Rand(dist);
      const pos = v2Add(parent.pos, offset);
      const role = roles[placed % roles.length];
      const child = createNode(pos.x, pos.y, role);
      child.radius = child.targetRadius;
      child.budding = false;
      nodes.set(child.id, child);

      const edge = createEdge(parentId, child.id, dist);
      edges.set(edge.id, edge);
      frontier.push(child.id);
      placed++;
    }

    if (frontier.length > 5 && Math.random() < 0.3) frontier.shift();
  }

  // Lateral connections (anastomosis)
  addLateralConnections(nodes, edges);

  return { nodes, edges };
}

function addLateralConnections(
  nodes: Map<string, GraphNode>,
  edges: Map<string, GraphEdge>,
): void {
  const arr = Array.from(nodes.values());
  const connected = new Set<string>();
  for (const e of edges.values()) {
    connected.add(`${e.sourceId}:${e.targetId}`);
    connected.add(`${e.targetId}:${e.sourceId}`);
  }

  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i],
        b = arr[j];
      if (connected.has(`${a.id}:${b.id}`)) continue;
      const dist = v2Dist(a.pos, b.pos);
      const maxDist = EDGE_LENGTH_MAX * 1.5;
      if (dist < maxDist && Math.random() < 0.15 * (1 - dist / maxDist)) {
        const edge = createEdge(a.id, b.id, dist);
        edges.set(edge.id, edge);
        connected.add(`${a.id}:${b.id}`);
        connected.add(`${b.id}:${a.id}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Budding (network growth)
// ---------------------------------------------------------------------------

export function attemptBudding(
  nodes: Map<string, GraphNode>,
  edges: Map<string, GraphEdge>,
  maxNodes: number,
  probability: number,
  tick: number,
): { node: GraphNode; edge: GraphEdge } | null {
  if (nodes.size >= maxNodes) return null;
  if (Math.random() > probability) return null;

  const arr = Array.from(nodes.values()).filter((n) => !n.budding);
  if (arr.length === 0) return null;

  // Weighted by activity
  const total = arr.reduce((s, n) => s + n.activity + 0.1, 0);
  let pick = Math.random() * total;
  let parent = arr[0];
  for (const n of arr) {
    pick -= n.activity + 0.1;
    if (pick <= 0) {
      parent = n;
      break;
    }
  }

  const dist = rng(EDGE_LENGTH_MIN * 0.6, EDGE_LENGTH_MAX * 0.8);
  const offset = v2Rand(dist);
  const pos = v2Add(parent.pos, offset);

  const node = createNode(pos.x, pos.y, undefined, parent.id, tick);
  const edge = createEdge(parent.id, node.id, dist);
  return { node, edge };
}

export function findLateralTargets(
  newNode: GraphNode,
  nodes: Map<string, GraphNode>,
  edges: Map<string, GraphEdge>,
): GraphEdge[] {
  const existing = new Set<string>();
  for (const e of edges.values()) {
    if (e.sourceId === newNode.id) existing.add(e.targetId);
    if (e.targetId === newNode.id) existing.add(e.sourceId);
  }

  return Array.from(nodes.values())
    .filter((n) => n.id !== newNode.id && !existing.has(n.id) && !n.budding)
    .map((n) => ({ node: n, dist: v2Dist(n.pos, newNode.pos) }))
    .filter((c) => c.dist < 250)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 2)
    .filter(() => Math.random() < 0.4)
    .map((c) => createEdge(newNode.id, c.node.id, c.dist));
}

// ---------------------------------------------------------------------------
// Budding animation + activity decay
// ---------------------------------------------------------------------------

export function updateBudding(nodes: Map<string, GraphNode>): void {
  for (const n of nodes.values()) {
    if (!n.budding) continue;
    const rate = n.targetRadius / BUDDING_DURATION;
    n.radius = Math.min(n.radius + rate, n.targetRadius);
    if (n.radius >= n.targetRadius * 0.95) {
      n.budding = false;
      n.radius = n.targetRadius;
    }
  }
}

export function decayActivity(
  nodes: Map<string, GraphNode>,
  edges: Map<string, GraphEdge>,
): void {
  for (const n of nodes.values()) {
    n.activity *= 0.995;
    if (n.activity < 0.02) n.activity = 0.02;
    n.breathPhase += 0.02 + n.activity * 0.03;
  }
  for (const e of edges.values()) {
    e.activity *= 0.98;
    if (e.activity < 0) e.activity = 0;
  }
}

export function decayEdgeStrength(
  edges: Map<string, GraphEdge>,
  rate: number,
): void {
  for (const e of edges.values()) {
    e.strength = Math.max(0.1, e.strength * rate);
  }
}

export function reinforceEdge(edge: GraphEdge, amount: number): void {
  edge.strength = Math.min(1.0, edge.strength + amount);
}
