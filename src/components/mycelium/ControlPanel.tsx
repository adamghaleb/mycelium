"use client";

import { Slider } from "@/components/ui/slider";
import { useMyceliumStore } from "@/store/useMyceliumStore";
import { getSimulation } from "@/lib/mycelium/instance";
import { useState } from "react";

export default function ControlPanel() {
  const params = useMyceliumStore((s) => s.params);
  const updateParams = useMyceliumStore((s) => s.updateParams);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        className="fixed top-4 right-4 z-50 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer text-white/30 hover:text-white/60 transition-colors duration-150"
        style={{
          background: "var(--myc-surface)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--myc-border)",
        }}
        onClick={() => setOpen(true)}
      >
        <span className="text-sm leading-none">...</span>
      </button>
    );
  }

  return (
    <div className="myc-panel fixed top-4 right-4 z-50 w-64 px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="myc-title text-base">parameters</h2>
        <button
          className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors duration-150 bg-transparent border-none cursor-pointer"
          onClick={() => setOpen(false)}
        >
          &times;
        </button>
      </div>

      <div className="w-full h-px bg-white/5" />

      {/* Tension */}
      <Section label="Tension">
        <SliderRow
          label="Repulsion"
          value={params.repulsion}
          min={1000}
          max={20000}
          step={500}
          onChange={(v) => {
            updateParams({ repulsion: v });
            getSimulation()?.reheat();
          }}
        />
        <SliderRow
          label="Attraction"
          value={params.attraction}
          min={0.001}
          max={0.02}
          step={0.001}
          format={(v) => v.toFixed(3)}
          onChange={(v) => {
            updateParams({ attraction: v });
            getSimulation()?.reheat();
          }}
        />
        <SliderRow
          label="Damping"
          value={params.damping}
          min={0.5}
          max={0.99}
          step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={(v) => updateParams({ damping: v })}
        />
        <SliderRow
          label="Gravity"
          value={params.centerGravity}
          min={0}
          max={0.002}
          step={0.0001}
          format={(v) => v.toFixed(4)}
          onChange={(v) => updateParams({ centerGravity: v })}
        />
      </Section>

      <div className="w-full h-px bg-white/5" />

      {/* Bonds */}
      <Section label="Bonds">
        <SliderRow
          label="Decay"
          value={params.edgeDecay}
          min={0.99}
          max={1.0}
          step={0.0001}
          format={(v) => v.toFixed(4)}
          onChange={(v) => updateParams({ edgeDecay: v })}
        />
        <SliderRow
          label="Reinforce"
          value={params.edgeReinforce}
          min={0}
          max={1}
          step={0.05}
          format={(v) => v.toFixed(2)}
          onChange={(v) => updateParams({ edgeReinforce: v })}
        />
      </Section>

      <div className="w-full h-px bg-white/5" />

      {/* Signals */}
      <Section label="Signals">
        <SliderRow
          label="Hop delay"
          value={params.hopDelayMs}
          min={100}
          max={1000}
          step={50}
          format={(v) => `${v}ms`}
          onChange={(v) => updateParams({ hopDelayMs: v })}
        />
        <SliderRow
          label="Max hops"
          value={params.maxHops}
          min={3}
          max={20}
          step={1}
          onChange={(v) => updateParams({ maxHops: v })}
        />
      </Section>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="myc-label">{label}</p>
      {children}
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-white/40">{label}</span>
        <span className="myc-value text-[10px]">
          {format ? format(value) : value}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  );
}
