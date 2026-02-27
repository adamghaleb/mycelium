"use client";

import { useMyceliumStore } from "@/store/useMyceliumStore";

export default function NetworkStats() {
  const snapshot = useMyceliumStore((s) => s.snapshot);
  const isRunning = useMyceliumStore((s) => s.isRunning);
  const toggleRunning = useMyceliumStore((s) => s.toggleRunning);

  return (
    <div className="myc-panel fixed top-4 left-4 z-50 w-56 px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="myc-title text-lg">mycelium</h2>
        <button
          onClick={toggleRunning}
          className="flex items-center gap-1.5 cursor-pointer bg-transparent border-none"
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: isRunning ? "#50c8b4" : "#c88a50",
              boxShadow: isRunning ? "0 0 6px rgba(80, 200, 180, 0.5)" : "none",
              animation: isRunning
                ? "myc-dot-pulse 2s ease-in-out infinite"
                : "none",
              color: isRunning ? "#50c8b4" : "#c88a50",
            }}
          />
          <span
            className="text-[10px] font-mono"
            style={{ opacity: 0.5, color: isRunning ? "#50c8b4" : "#c88a50" }}
          >
            {isRunning ? "breathing" : "dormant"}
          </span>
        </button>
      </div>

      <div className="w-full h-px bg-white/5" />

      <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-[11px]">
        <StatRow label="Nodes" value={snapshot.nodeCount} />
        <StatRow label="Synapses" value={snapshot.edgeCount} />
        <StatRow label="Spores" value={snapshot.particleCount} />
        <StatRow label="Active" value={snapshot.activeMessages} />
        <StatRow
          label="Digested"
          value={snapshot.totalMessagesProcessed}
          colSpan
        />
      </div>

      <div className="text-[9px] font-mono text-white/20 tabular-nums text-right">
        {snapshot.fps} fps
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  colSpan,
}: {
  label: string;
  value: number;
  colSpan?: boolean;
}) {
  return (
    <div className={colSpan ? "col-span-2" : ""}>
      <span className="myc-label">{label}</span>
      <span className="myc-value float-right text-[11px]">
        {value.toLocaleString()}
      </span>
    </div>
  );
}
