"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useMyceliumStore } from "@/store/useMyceliumStore";
import { getSimulation } from "@/lib/mycelium/instance";
import {
  AGENT_COLORS,
  AGENT_LABELS,
  AGENT_HEX,
} from "@/lib/mycelium/constants";
import { colorCSS } from "@/lib/mycelium/math";
import { PropagationState } from "@/lib/mycelium/types";

export default function OutputPanel() {
  const messages = useMyceliumStore((s) => s.messages);

  const latestCompleted = [...messages]
    .reverse()
    .find((m) => m.state === PropagationState.Complete);

  const activePropagation = messages.find(
    (m) => m.state === PropagationState.Propagating,
  );

  if (!latestCompleted && !activePropagation) return null;

  const sim = getSimulation();

  return (
    <div className="myc-panel fixed top-16 right-4 z-40 w-80 max-h-[70vh] px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="myc-title text-base">synthesis</h2>
        {activePropagation && (
          <span className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: "#50c8b4",
                animation: "myc-dot-pulse 2s ease-in-out infinite",
                color: "#50c8b4",
              }}
            />
            <span className="text-[9px] font-mono text-white/30">
              propagating
            </span>
          </span>
        )}
        {latestCompleted && !activePropagation && (
          <span className="text-[9px] font-mono text-white/25">complete</span>
        )}
      </div>

      <div className="w-full h-px bg-white/5 mb-3" />

      {/* Active propagation path */}
      {activePropagation && sim && (
        <div className="mb-3 space-y-2">
          <p className="myc-label">spore path</p>
          <div className="flex items-center gap-0.5">
            {activePropagation.hops.map((hop, i) => {
              const node = sim.nodes.get(hop.nodeId);
              if (!node) return null;
              const hex = AGENT_HEX[node.role];
              return (
                <span key={i} className="flex items-center">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full transition-opacity duration-300"
                    style={{
                      backgroundColor: hex,
                      opacity: hop.activated ? 1 : 0.15,
                      boxShadow: hop.activated ? `0 0 6px ${hex}` : "none",
                    }}
                    title={AGENT_LABELS[node.role]}
                  />
                  {i < activePropagation.hops.length - 1 && (
                    <span
                      className="inline-block w-3 h-px mx-0.5"
                      style={{
                        backgroundColor: hop.activated
                          ? "rgba(80, 200, 180, 0.2)"
                          : "rgba(255, 255, 255, 0.05)",
                      }}
                    />
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed output */}
      {latestCompleted && sim && (
        <ScrollArea className="max-h-[55vh]">
          <div className="space-y-3">
            <div>
              <p className="myc-label mb-1">original seed</p>
              <p className="text-xs text-white/50 leading-relaxed">
                &quot;{latestCompleted.originalText}&quot;
              </p>
            </div>

            <div className="w-full h-px bg-white/5" />

            <div>
              <p className="myc-label mb-2">
                propagation path ({latestCompleted.hops.length} hops)
              </p>
              <div className="space-y-2">
                {latestCompleted.hops.map((hop, i) => {
                  const node = sim.nodes.get(hop.nodeId);
                  if (!node) return null;
                  const c = AGENT_COLORS[node.role];
                  const label = AGENT_LABELS[node.role];
                  const hex = AGENT_HEX[node.role];

                  return (
                    <div
                      key={i}
                      className="pl-3 border-l-2"
                      style={{ borderColor: colorCSS({ ...c, a: 0.3 }) }}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: hex }}
                        />
                        <span
                          className="text-[10px] italic"
                          style={{
                            color: colorCSS({ ...c, a: 0.7 }),
                            fontFamily: "'Instrument Serif', serif",
                          }}
                        >
                          {label}
                        </span>
                      </div>
                      {hop.transformedText && (
                        <p className="text-[11px] text-white/40 leading-relaxed">
                          {hop.transformedText.slice(0, 200)}
                          {hop.transformedText.length > 200 ? "..." : ""}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full h-px bg-white/5" />

            <div
              className="rounded-lg px-3 py-2"
              style={{ background: "rgba(80, 200, 180, 0.03)" }}
            >
              <p
                className="text-xs mb-1"
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  opacity: 0.5,
                }}
              >
                emergent output
              </p>
              <pre className="text-[11px] text-white/60 font-mono leading-relaxed whitespace-pre-wrap">
                {latestCompleted.synthesizedOutput}
              </pre>
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
