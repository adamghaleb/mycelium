"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSimulation } from "@/lib/mycelium/instance";
import { useMyceliumStore } from "@/store/useMyceliumStore";

export default function MessageInput() {
  const [value, setValue] = useState("");
  const activeCount = useMyceliumStore((s) => s.snapshot.activeMessages);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;
      const sim = getSimulation();
      if (sim) sim.injectMessage(trimmed);
      setValue("");
    },
    [value],
  );

  const isProcessing = activeCount > 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 w-[560px] max-w-[90vw]"
    >
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder={
            isProcessing
              ? "Signal propagating through network..."
              : "Inject a thought into the network..."
          }
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="bg-black/60 backdrop-blur-xl border-white/10 text-white placeholder:text-white/30 font-mono text-sm h-11 pr-4 focus-visible:ring-white/20 focus-visible:border-white/20"
        />
        {isProcessing && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        )}
      </div>
      <Button
        type="submit"
        disabled={!value.trim() || isProcessing}
        variant="outline"
        className="bg-black/60 backdrop-blur-xl border-white/10 text-white/70 hover:text-white hover:bg-white/10 font-mono text-xs h-11 px-4 disabled:opacity-30"
      >
        INJECT &rarr;
      </Button>
    </form>
  );
}
