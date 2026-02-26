"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
    <Card className="fixed top-16 right-4 z-40 w-80 max-h-[70vh] bg-black/60 backdrop-blur-xl border-white/10 text-white shadow-2xl">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-white/70">
            Network Output
          </CardTitle>
          {activePropagation && (
            <Badge
              variant="outline"
              className="text-[10px] text-emerald-400 border-emerald-400/30 animate-pulse"
            >
              PROPAGATING
            </Badge>
          )}
          {latestCompleted && !activePropagation && (
            <Badge
              variant="outline"
              className="text-[10px] text-cyan-400 border-cyan-400/30"
            >
              COMPLETE
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Separator className="bg-white/10 mb-3" />

        {/* Active propagation */}
        {activePropagation && sim && (
          <div className="mb-3 space-y-2">
            <p className="text-[10px] font-mono text-white/40">SIGNAL PATH</p>
            <div className="flex flex-wrap gap-1">
              {activePropagation.hops.map((hop, i) => {
                const node = sim.nodes.get(hop.nodeId);
                if (!node) return null;
                const hex = AGENT_HEX[node.role];
                return (
                  <span
                    key={i}
                    className={`inline-block w-3 h-3 rounded-full ${
                      hop.activated ? "opacity-100" : "opacity-20"
                    }`}
                    style={{
                      backgroundColor: hex,
                      boxShadow: hop.activated ? `0 0 6px ${hex}` : "none",
                    }}
                    title={AGENT_LABELS[node.role]}
                  />
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
                <p className="text-[10px] font-mono text-white/40 mb-1">
                  ORIGINAL SIGNAL
                </p>
                <p className="text-xs text-white/70 font-mono leading-relaxed">
                  &quot;{latestCompleted.originalText}&quot;
                </p>
              </div>

              <Separator className="bg-white/10" />

              <div>
                <p className="text-[10px] font-mono text-white/40 mb-2">
                  PROPAGATION PATH ({latestCompleted.hops.length} hops)
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
                        style={{ borderColor: colorCSS({ ...c, a: 0.4 }) }}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: hex }}
                          />
                          <span
                            className="text-[10px] font-mono"
                            style={{ color: colorCSS({ ...c, a: 0.8 }) }}
                          >
                            {label}
                          </span>
                        </div>
                        {hop.transformedText && (
                          <p className="text-[11px] text-white/50 leading-relaxed">
                            {hop.transformedText.slice(0, 200)}
                            {hop.transformedText.length > 200 ? "..." : ""}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div>
                <p className="text-[10px] font-mono text-white/40 mb-1">
                  SYNTHESIZED OUTPUT
                </p>
                <pre className="text-[11px] text-white/70 font-mono leading-relaxed whitespace-pre-wrap">
                  {latestCompleted.synthesizedOutput}
                </pre>
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
