"use client";

import { useState, useCallback, useRef } from "react";
import { getSimulation } from "@/lib/mycelium/instance";
import { useMyceliumStore } from "@/store/useMyceliumStore";

export default function MessageInput() {
  const [value, setValue] = useState("");
  const [pulsing, setPulsing] = useState(false);
  const activeCount = useMyceliumStore((s) => s.snapshot.activeMessages);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;
      const sim = getSimulation();
      if (sim) sim.injectMessage(trimmed);
      setValue("");

      // Trigger submit pulse
      setPulsing(true);
      setTimeout(() => setPulsing(false), 250);
    },
    [value],
  );

  const isProcessing = activeCount > 0;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[540px] max-w-[90vw]"
      style={{
        animation: pulsing ? "myc-submit-pulse 200ms ease-out" : "none",
      }}
    >
      <div
        className="flex items-center gap-0 rounded-full overflow-hidden"
        style={{
          background: "var(--myc-surface)",
          backdropFilter: "blur(20px) saturate(1.2)",
          WebkitBackdropFilter: "blur(20px) saturate(1.2)",
          border: "1px solid var(--myc-border)",
          animation: "myc-breathe 4s ease-in-out infinite",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(80, 200, 180, 0.04)",
        }}
      >
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={
              isProcessing
                ? "Spore releasing through mycelium..."
                : "Seed a thought into the network..."
            }
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-transparent text-white/80 placeholder:text-white/25 font-mono text-sm h-11 pl-5 pr-3 outline-none border-none focus:text-white/90"
          />
          {isProcessing && (
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: "#50c8b4",
                animation: "myc-dot-pulse 2s ease-in-out infinite",
                color: "#50c8b4",
              }}
            />
          )}
        </div>
        <button
          type="submit"
          disabled={!value.trim() || isProcessing}
          className="h-11 px-5 font-mono text-xs text-white/40 bg-transparent border-none border-l border-l-white/5 cursor-pointer transition-colors duration-150 hover:text-white/70 disabled:opacity-20 disabled:cursor-not-allowed whitespace-nowrap"
        >
          Seed &rarr;
        </button>
      </div>
    </form>
  );
}
