// ============================================================================
// Mycelium Engine — Message Queue & Propagation
// BFS path finding, scheduled forwarding, hop-based TTL.
// ============================================================================

import {
  Message,
  MessageHop,
  PropagationState,
  GraphNode,
  GraphEdge,
} from "./types";
import { genId, rngPick } from "./math";
import { buildAdjacency, reinforceEdge } from "./graph";
import { transformMessage, synthesizeOutput } from "./agents";

// ---------------------------------------------------------------------------
// Path finding — weighted BFS / random walk
// ---------------------------------------------------------------------------

export function findPropagationPath(
  entryId: string,
  nodes: Map<string, GraphNode>,
  edges: Map<string, GraphEdge>,
  maxHops: number,
): string[] {
  const adj = buildAdjacency(edges);
  const visited = new Set<string>([entryId]);
  const path = [entryId];
  let current = entryId;

  for (let hop = 0; hop < maxHops - 1; hop++) {
    const neighbors = adj.get(current) ?? [];
    const unvisited = neighbors
      .filter((n) => !visited.has(n.nodeId))
      .map((n) => {
        const node = nodes.get(n.nodeId);
        if (!node) return null;
        let score = 3.0; // unvisited bonus
        const curNode = nodes.get(current);
        if (curNode && node.role !== curNode.role) score += 0.5;
        if (
          node.role === "synthesizer" &&
          !path.some((id) => nodes.get(id)?.role === "synthesizer")
        ) {
          score += 2.0;
        }
        return { nodeId: n.nodeId, edgeId: n.edgeId, score };
      })
      .filter(Boolean) as Array<{
      nodeId: string;
      edgeId: string;
      score: number;
    }>;

    const candidates =
      unvisited.length > 0
        ? unvisited
        : neighbors.map((n) => ({
            nodeId: n.nodeId,
            edgeId: n.edgeId,
            score: 0.5,
          }));

    if (candidates.length === 0) break;

    const total = candidates.reduce((s, c) => s + c.score, 0);
    let pick = Math.random() * total;
    let chosen = candidates[0];
    for (const c of candidates) {
      pick -= c.score;
      if (pick <= 0) {
        chosen = c;
        break;
      }
    }

    path.push(chosen.nodeId);
    visited.add(chosen.nodeId);
    current = chosen.nodeId;
  }

  return path;
}

// ---------------------------------------------------------------------------
// Message creation
// ---------------------------------------------------------------------------

export function createMessage(
  text: string,
  nodes: Map<string, GraphNode>,
  edges: Map<string, GraphEdge>,
  hopDelayMs: number,
  maxHops: number,
  entryNodeId?: string,
): Message {
  const arr = Array.from(nodes.values());
  const entry = entryNodeId
    ? (nodes.get(entryNodeId) ?? rngPick(arr))
    : rngPick(arr);

  const pathIds = findPropagationPath(entry.id, nodes, edges, maxHops);
  const adj = buildAdjacency(edges);
  const now = Date.now();

  const hops: MessageHop[] = pathIds.map((nodeId, i) => {
    let edgeId: string | null = null;
    if (i > 0) {
      const prev = pathIds[i - 1];
      const nbrs = adj.get(prev) ?? [];
      const conn = nbrs.find((n) => n.nodeId === nodeId);
      edgeId = conn?.edgeId ?? null;
    }
    return {
      nodeId,
      edgeId,
      transformedText: "",
      activateAt: now + i * hopDelayMs,
      activated: false,
    };
  });

  return {
    id: genId("msg"),
    originalText: text,
    entryNodeId: entry.id,
    hops,
    currentHopIndex: -1,
    state: PropagationState.Propagating,
    synthesizedOutput: "",
    startedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Advance propagation
// ---------------------------------------------------------------------------

export function advanceMessages(
  messages: Message[],
  nodes: Map<string, GraphNode>,
  edges: Map<string, GraphEdge>,
  edgeReinforce: number,
): {
  activatedNodes: string[];
  activatedEdges: string[];
  completedMessages: Message[];
} {
  const now = Date.now();
  const activatedNodes: string[] = [];
  const activatedEdges: string[] = [];
  const completedMessages: Message[] = [];

  for (const msg of messages) {
    if (msg.state !== PropagationState.Propagating) continue;
    let allDone = true;

    for (let i = 0; i < msg.hops.length; i++) {
      const hop = msg.hops[i];
      if (hop.activated) continue;

      if (now >= hop.activateAt) {
        hop.activated = true;
        msg.currentHopIndex = i;

        const node = nodes.get(hop.nodeId);
        if (node) {
          const input =
            i === 0
              ? msg.originalText
              : msg.hops[i - 1].transformedText || msg.originalText;
          hop.transformedText = transformMessage(input, node.profile);
          node.messagesProcessed++;
          node.activity = Math.min(1.0, node.activity + 0.6);
          activatedNodes.push(node.id);
        }

        if (hop.edgeId) {
          const edge = edges.get(hop.edgeId);
          if (edge) {
            edge.activity = 1.0;
            reinforceEdge(edge, edgeReinforce);
            activatedEdges.push(hop.edgeId);
          }
        }
      } else {
        allDone = false;
      }
    }

    if (allDone && msg.hops.every((h) => h.activated)) {
      msg.state = PropagationState.Synthesizing;
      const hopData = msg.hops
        .map((h) => {
          const node = nodes.get(h.nodeId);
          if (!node) return null;
          return {
            nodeId: h.nodeId,
            text: h.transformedText,
            profile: node.profile,
          };
        })
        .filter(Boolean) as Array<{
        nodeId: string;
        text: string;
        profile: GraphNode["profile"];
      }>;

      msg.synthesizedOutput = synthesizeOutput(msg.originalText, hopData);
      msg.state = PropagationState.Complete;
      completedMessages.push(msg);
    }
  }

  return { activatedNodes, activatedEdges, completedMessages };
}
