"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useMyceliumStore } from "@/store/useMyceliumStore";
import { getSimulation } from "@/lib/mycelium/instance";
import {
  AGENT_COLORS,
  AGENT_LABELS,
  AGENT_HEX,
} from "@/lib/mycelium/constants";
import { colorCSS } from "@/lib/mycelium/math";
import { nodeDegree } from "@/lib/mycelium/graph";

export default function NodeInspector() {
  const selectedNodeId = useMyceliumStore((s) => s.selectedNodeId);
  const selectNode = useMyceliumStore((s) => s.selectNode);

  if (!selectedNodeId) return null;

  const sim = getSimulation();
  if (!sim) return null;

  const node = sim.nodes.get(selectedNodeId);
  if (!node) return null;

  const c = AGENT_COLORS[node.role];
  const label = AGENT_LABELS[node.role];
  const hex = AGENT_HEX[node.role];
  const degree = nodeDegree(node.id, sim.edges);

  // Find recent message hops through this node
  const recentMessages = sim.completedMessages
    .filter((m) => m.hops.some((h) => h.nodeId === selectedNodeId))
    .slice(-3);

  return (
    <Card className="fixed bottom-20 left-4 z-50 w-72 bg-black/70 backdrop-blur-xl border-white/10 text-white shadow-2xl">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: hex,
                boxShadow: `0 0 8px ${hex}`,
              }}
            />
            <CardTitle className="text-sm font-mono text-white/90">
              {label} Node
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white/40 hover:text-white hover:bg-white/10"
            onClick={() => selectNode(null)}
          >
            &times;
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <Separator className="bg-white/10" />

        {/* Cognitive profile */}
        <div>
          <p className="text-[10px] font-mono text-white/40 mb-1">
            COGNITIVE PROFILE
          </p>
          <p className="text-xs text-white/60 leading-relaxed">
            {node.profile.style}
          </p>
        </div>

        {/* Verbs */}
        <div>
          <p className="text-[10px] font-mono text-white/40 mb-1">
            TRANSFORMATION STYLE
          </p>
          <div className="flex flex-wrap gap-1.5">
            {node.profile.verbs.map((verb, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-[10px] border-white/15 text-white/50"
                style={{
                  borderColor: colorCSS({ ...c, a: 0.3 }),
                  color: colorCSS({ ...c, a: 0.7 }),
                }}
              >
                {verb}
              </Badge>
            ))}
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div>
            <span className="text-white/30">Messages</span>
            <span className="float-right text-white/70 tabular-nums">
              {node.messagesProcessed}
            </span>
          </div>
          <div>
            <span className="text-white/30">Connections</span>
            <span className="float-right text-white/70 tabular-nums">
              {degree}
            </span>
          </div>
          <div>
            <span className="text-white/30">Activity</span>
            <span className="float-right text-white/70 tabular-nums">
              {(node.activity * 100).toFixed(0)}%
            </span>
          </div>
          <div>
            <span className="text-white/30">Weight</span>
            <span className="float-right text-white/70 tabular-nums">
              {node.profile.weight.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Message history */}
        {recentMessages.length > 0 && (
          <>
            <Separator className="bg-white/10" />
            <div>
              <p className="text-[10px] font-mono text-white/40 mb-1">
                RECENT MESSAGES
              </p>
              {recentMessages.map((msg) => {
                const hop = msg.hops.find((h) => h.nodeId === selectedNodeId);
                return (
                  <p
                    key={msg.id}
                    className="text-[10px] text-white/40 leading-relaxed mb-1 truncate"
                  >
                    {hop?.transformedText.slice(0, 80)}...
                  </p>
                );
              })}
            </div>
          </>
        )}

        <div className="text-[9px] font-mono text-white/20 truncate">
          ID: {node.id}
        </div>
      </CardContent>
    </Card>
  );
}
