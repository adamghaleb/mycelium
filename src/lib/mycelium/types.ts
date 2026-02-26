// ============================================================================
// Mycelium Engine — Core Types
// Pure data types with zero UI coupling.
// ============================================================================

export interface Vec2 {
  x: number;
  y: number;
}

export interface Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

// ---------------------------------------------------------------------------
// Agent roles
// ---------------------------------------------------------------------------

export enum AgentRole {
  Creative = "creative",
  Analytical = "analytical",
  Critical = "critical",
  Synthesizer = "synthesizer",
  Wildcard = "wildcard",
}

// ---------------------------------------------------------------------------
// Graph
// ---------------------------------------------------------------------------

export interface GraphNode {
  readonly id: string;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  targetRadius: number;
  role: AgentRole;
  color: Color;
  activity: number; // 0..1
  messagesProcessed: number;
  breathPhase: number;
  budding: boolean;
  parentId: string | null;
  birthTick: number;
  pinned: boolean;
  /** Cognitive profile for message transform */
  profile: CognitiveProfile;
}

export interface GraphEdge {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  strength: number; // 0..1 — drives width/alpha, decays over time
  restLength: number;
  stiffness: number;
  curvature: number;
  activity: number; // 0..1
}

// ---------------------------------------------------------------------------
// Cognitive Profile
// ---------------------------------------------------------------------------

export interface CognitiveProfile {
  readonly role: AgentRole;
  readonly style: string;
  readonly verbs: readonly string[];
  readonly weight: number;
}

// ---------------------------------------------------------------------------
// Particles
// ---------------------------------------------------------------------------

export interface Particle {
  active: boolean; // pool management
  edgeId: string;
  progress: number; // 0..1 along edge
  speed: number;
  color: Color;
  life: number; // 0..1
  size: number;
  trailX: Float32Array; // ring buffer
  trailY: Float32Array;
  trailHead: number;
  trailLen: number;
  maxTrail: number;
  ambient: boolean; // dim ambient vs bright message
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export enum PropagationState {
  Propagating = "propagating",
  Synthesizing = "synthesizing",
  Complete = "complete",
}

export interface MessageHop {
  readonly nodeId: string;
  readonly edgeId: string | null;
  transformedText: string;
  activateAt: number; // ms timestamp
  activated: boolean;
}

export interface Message {
  readonly id: string;
  readonly originalText: string;
  readonly entryNodeId: string;
  hops: MessageHop[];
  currentHopIndex: number;
  state: PropagationState;
  synthesizedOutput: string;
  startedAt: number;
}

// ---------------------------------------------------------------------------
// Simulation parameters
// ---------------------------------------------------------------------------

export interface SimulationParams {
  // Physics
  repulsion: number;
  attraction: number;
  damping: number;
  maxVelocity: number;
  centerGravity: number;
  // Edge
  edgeDecay: number; // per-tick multiplier for strength decay
  edgeReinforce: number; // amount added on message pass
  // Message
  hopDelayMs: number;
  maxHops: number;
  // Growth
  buddingInterval: number;
  buddingProbability: number;
  maxNodes: number;
  // Particle
  maxParticles: number;
  particleSpeed: number;
  particleTrailLen: number;
  ambientRate: number;
  emissionRate: number;
}

// ---------------------------------------------------------------------------
// Quadtree
// ---------------------------------------------------------------------------

export interface AABB {
  cx: number;
  cy: number;
  hw: number; // half-width
  hh: number; // half-height
}

// ---------------------------------------------------------------------------
// Snapshot (sent to React at 30fps)
// ---------------------------------------------------------------------------

export interface SimulationSnapshot {
  nodeCount: number;
  edgeCount: number;
  particleCount: number;
  activeMessages: number;
  fps: number;
  tick: number;
  totalMessagesProcessed: number;
}
