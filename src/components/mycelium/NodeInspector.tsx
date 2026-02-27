"use client";

import { useMyceliumStore } from "@/store/useMyceliumStore";
import { getSimulation } from "@/lib/mycelium/instance";
import {
  AGENT_COLORS,
  AGENT_LABELS,
  AGENT_HEX,
} from "@/lib/mycelium/constants";
import { colorCSS } from "@/lib/mycelium/math";
import { nodeDegree } from "@/lib/mycelium/graph";
import { useMemo } from "react";

function computePosition(screenPos: { x: number; y: number } | null) {
  if (!screenPos) {
    return { bottom: 80, left: 16 } as const;
  }
  const panelW = 272;
  const panelH = 320;
  const margin = 20;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
  const vh = typeof window !== "undefined" ? window.innerHeight : 1080;

  let x = screenPos.x + margin;
  let y = screenPos.y + margin;

  if (x + panelW > vw - margin) x = screenPos.x - panelW - margin;
  if (y + panelH > vh - margin) y = vh - panelH - margin;
  if (x < margin) x = margin;
  if (y < margin) y = margin;

  return { left: x, top: y } as const;
}

export default function NodeInspector() {
  const selectedNodeId = useMyceliumStore((s) => s.selectedNodeId);
  const selectNode = useMyceliumStore((s) => s.selectNode);
  const screenPos = useMyceliumStore((s) => s.selectedNodeScreenPos);

  // All hooks must be called before any early return
  const positionStyle = useMemo(() => computePosition(screenPos), [screenPos]);

  if (!selectedNodeId) return null;

  const sim = getSimulation();
  if (!sim) return null;

  const node = sim.nodes.get(selectedNodeId);
  if (!node) return null;

  const c = AGENT_COLORS[node.role];
  const label = AGENT_LABELS[node.role];
  const hex = AGENT_HEX[node.role];
  const degree = nodeDegree(node.id, sim.edges);

  const recentMessages = sim.completedMessages
    .filter((m) => m.hops.some((h) => h.nodeId === selectedNodeId))
    .slice(-3);

  return (
    <div
      className="myc-panel fixed z-50 w-[272px] px-4 py-3 space-y-3"
      style={{
        ...positionStyle,
        borderTopColor: `${hex}30`,
        borderTopWidth: 2,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: hex,
              boxShadow: `0 0 8px ${hex}`,
            }}
          />
          <h2
            className="text-sm text-white/80"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            {label} Node
          </h2>
        </div>
        <button
          className="w-6 h-6 flex items-center justify-center text-white/25 hover:text-white/50 transition-colors duration-150 bg-transparent border-none cursor-pointer"
          onClick={() => selectNode(null)}
        >
          &times;
        </button>
      </div>

      <div className="w-full h-px bg-white/5" />

      {/* Cognitive profile */}
      <div>
        <p className="myc-label mb-1">cognitive profile</p>
        <p className="text-xs text-white/50 leading-relaxed">
          {node.profile.style}
        </p>
      </div>

      {/* Verbs */}
      <div>
        <p className="myc-label mb-1.5">transformation style</p>
        <div className="flex flex-wrap gap-1.5">
          {node.profile.verbs.map((verb, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded-full font-mono"
              style={{
                backgroundColor: `${hex}12`,
                color: colorCSS({ ...c, a: 0.7 }),
                border: `1px solid ${hex}20`,
              }}
            >
              {verb}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-white/5" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
        <div>
          <span className="myc-label">Digested</span>
          <span className="myc-value float-right">
            {node.messagesProcessed}
          </span>
        </div>
        <div>
          <span className="myc-label">Synapses</span>
          <span className="myc-value float-right">{degree}</span>
        </div>
        <div>
          <span className="myc-label">Activity</span>
          <span className="myc-value float-right">
            {(node.activity * 100).toFixed(0)}%
          </span>
        </div>
        <div>
          <span className="myc-label">Weight</span>
          <span className="myc-value float-right">
            {node.profile.weight.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Message history */}
      {recentMessages.length > 0 && (
        <>
          <div className="w-full h-px bg-white/5" />
          <div>
            <p className="myc-label mb-1">recent signals</p>
            {recentMessages.map((msg) => {
              const hop = msg.hops.find((h) => h.nodeId === selectedNodeId);
              return (
                <p
                  key={msg.id}
                  className="text-[10px] text-white/30 leading-relaxed mb-1 truncate"
                >
                  {hop?.transformedText.slice(0, 80)}...
                </p>
              );
            })}
          </div>
        </>
      )}

      <div className="text-[9px] font-mono text-white/15 truncate">
        {node.id}
      </div>
    </div>
  );
}
