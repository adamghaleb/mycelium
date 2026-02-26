// ============================================================================
// Shared simulation instance — module-level singleton.
// Set by MyceliumCanvas on mount, accessed by MessageInput etc.
// ============================================================================

import { Simulation } from "./simulation";

let _sim: Simulation | null = null;

export function setSimulation(sim: Simulation | null): void {
  _sim = sim;
}

export function getSimulation(): Simulation | null {
  return _sim;
}
