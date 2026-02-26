"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMyceliumStore } from "@/store/useMyceliumStore";

export default function NetworkStats() {
  const snapshot = useMyceliumStore((s) => s.snapshot);
  const isRunning = useMyceliumStore((s) => s.isRunning);
  const toggleRunning = useMyceliumStore((s) => s.toggleRunning);

  return (
    <Card className="fixed top-4 left-4 z-50 w-64 bg-black/60 backdrop-blur-xl border-white/10 text-white shadow-2xl">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono tracking-widest uppercase text-white/70">
            Mycelium
          </CardTitle>
          <Badge
            variant="outline"
            className={`text-[10px] cursor-pointer border-white/20 ${
              isRunning ? "text-emerald-400" : "text-orange-400"
            }`}
            onClick={toggleRunning}
          >
            {isRunning ? "● LIVE" : "○ PAUSED"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <Separator className="bg-white/10" />
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
          <StatRow label="Nodes" value={snapshot.nodeCount} />
          <StatRow label="Edges" value={snapshot.edgeCount} />
          <StatRow label="Particles" value={snapshot.particleCount} />
          <StatRow label="Active" value={snapshot.activeMessages} />
          <StatRow
            label="Processed"
            value={snapshot.totalMessagesProcessed}
            colSpan
          />
          <StatRow label="FPS" value={snapshot.fps} highlight />
        </div>
        <Separator className="bg-white/10" />
        <p className="text-[10px] text-white/30 font-mono">
          Click node to inspect · Drag to move · Shift+drag to pan · Scroll to
          zoom
        </p>
      </CardContent>
    </Card>
  );
}

function StatRow({
  label,
  value,
  colSpan,
  highlight,
}: {
  label: string;
  value: number;
  colSpan?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={colSpan ? "col-span-2" : ""}>
      <span className="text-white/40 font-mono">{label}</span>
      <span
        className={`float-right font-mono tabular-nums ${
          highlight ? "text-emerald-400/80" : "text-white/90"
        }`}
      >
        {value.toLocaleString()}
      </span>
    </div>
  );
}
