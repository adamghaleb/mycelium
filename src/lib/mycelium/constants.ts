// ============================================================================
// Mycelium Engine — Constants & Defaults
// ============================================================================

import { AgentRole, Color, SimulationParams } from "./types";

// ---------------------------------------------------------------------------
// Agent colors (plan spec: amber, blue, red, green, purple)
// ---------------------------------------------------------------------------

export const AGENT_COLORS: Record<AgentRole, Color> = {
  [AgentRole.Creative]: { r: 1.0, g: 0.75, b: 0.2, a: 1 }, // amber
  [AgentRole.Analytical]: { r: 0.2, g: 0.6, b: 1.0, a: 1 }, // blue
  [AgentRole.Critical]: { r: 1.0, g: 0.3, b: 0.3, a: 1 }, // red
  [AgentRole.Synthesizer]: { r: 0.2, g: 0.9, b: 0.5, a: 1 }, // green
  [AgentRole.Wildcard]: { r: 0.7, g: 0.4, b: 1.0, a: 1 }, // purple
};

export const AGENT_LABELS: Record<AgentRole, string> = {
  [AgentRole.Creative]: "Creative",
  [AgentRole.Analytical]: "Analytical",
  [AgentRole.Critical]: "Critical",
  [AgentRole.Synthesizer]: "Synthesizer",
  [AgentRole.Wildcard]: "Wildcard",
};

// CSS-friendly hex for Tailwind usage
export const AGENT_HEX: Record<AgentRole, string> = {
  [AgentRole.Creative]: "#ffbf33",
  [AgentRole.Analytical]: "#3399ff",
  [AgentRole.Critical]: "#ff4d4d",
  [AgentRole.Synthesizer]: "#33e680",
  [AgentRole.Wildcard]: "#b366ff",
};

// ---------------------------------------------------------------------------
// Default simulation parameters
// ---------------------------------------------------------------------------

export const DEFAULT_PARAMS: SimulationParams = {
  // Physics
  repulsion: 8000,
  attraction: 0.005,
  damping: 0.88,
  maxVelocity: 8,
  centerGravity: 0.0003,
  // Edge
  edgeDecay: 0.9995,
  edgeReinforce: 0.3,
  // Message
  hopDelayMs: 350,
  maxHops: 10,
  // Growth
  buddingInterval: 180,
  buddingProbability: 0.35,
  maxNodes: 200,
  // Particle
  maxParticles: 2000,
  particleSpeed: 0.008,
  particleTrailLen: 8,
  ambientRate: 0.03,
  emissionRate: 0.15,
};

// ---------------------------------------------------------------------------
// Initial network
// ---------------------------------------------------------------------------

export const INITIAL_NODE_COUNT = 30;
export const EDGE_LENGTH_MIN = 80;
export const EDGE_LENGTH_MAX = 200;
export const BUDDING_DURATION = 60;

// ---------------------------------------------------------------------------
// Physics constants
// ---------------------------------------------------------------------------

export const MIN_DISTANCE = 20;
export const TEMPERATURE_INITIAL = 1.0;
export const TEMPERATURE_MIN = 0.01;
export const COOLING_RATE = 0.9997;

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export const BG_COLOR = "#060d14";
export const PHYSICS_DT = 1 / 60; // 60Hz fixed timestep
export const MAX_STEPS_PER_FRAME = 3;
export const SNAPSHOT_INTERVAL = 2; // send to React every 2 frames (~30fps)
