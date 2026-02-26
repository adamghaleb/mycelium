// ============================================================================
// Mycelium — Zustand Store (UI state only)
// Hot-path data lives in the Simulation. React gets throttled snapshots.
// ============================================================================

import { create } from "zustand";
import {
  GraphNode,
  Message,
  SimulationSnapshot,
  SimulationParams,
} from "@/lib/mycelium/types";
import { Simulation } from "@/lib/mycelium/simulation";
import { DEFAULT_PARAMS } from "@/lib/mycelium/constants";

export interface MyceliumUIState {
  // Snapshot from simulation (updated at ~30fps)
  snapshot: SimulationSnapshot;

  // Messages
  messages: Message[];

  // Interaction
  selectedNodeId: string | null;
  hoveredNodeId: string | null;

  // Params (drives simulation)
  params: SimulationParams;

  // Running
  isRunning: boolean;

  // Actions
  setSnapshot: (s: SimulationSnapshot) => void;
  setMessages: (m: Message[]) => void;
  selectNode: (id: string | null) => void;
  hoverNode: (id: string | null) => void;
  updateParams: (p: Partial<SimulationParams>) => void;
  toggleRunning: () => void;

  // Selectors
  getLatestCompleted: () => Message | null;
  getActiveMessages: () => Message[];
}

export const useMyceliumStore = create<MyceliumUIState>((set, get) => ({
  snapshot: {
    nodeCount: 0,
    edgeCount: 0,
    particleCount: 0,
    activeMessages: 0,
    fps: 60,
    tick: 0,
    totalMessagesProcessed: 0,
  },
  messages: [],
  selectedNodeId: null,
  hoveredNodeId: null,
  params: { ...DEFAULT_PARAMS },
  isRunning: true,

  setSnapshot: (s) => set({ snapshot: s }),
  setMessages: (m) => set({ messages: m }),
  selectNode: (id) => set({ selectedNodeId: id }),
  hoverNode: (id) => set({ hoveredNodeId: id }),
  updateParams: (p) => set((state) => ({ params: { ...state.params, ...p } })),
  toggleRunning: () => set((state) => ({ isRunning: !state.isRunning })),

  getLatestCompleted: () => {
    const msgs = get().messages;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].state === "complete") return msgs[i];
    }
    return null;
  },
  getActiveMessages: () =>
    get().messages.filter(
      (m) => m.state === "propagating" || m.state === "synthesizing",
    ),
}));
