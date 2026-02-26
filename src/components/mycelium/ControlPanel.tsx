"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useMyceliumStore } from "@/store/useMyceliumStore";
import { getSimulation } from "@/lib/mycelium/instance";
import { useState } from "react";

export default function ControlPanel() {
  const params = useMyceliumStore((s) => s.params);
  const updateParams = useMyceliumStore((s) => s.updateParams);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed top-4 right-4 z-50 bg-black/60 backdrop-blur-xl border-white/10 text-white/50 hover:text-white hover:bg-white/10 font-mono text-[10px] h-8 px-3"
        onClick={() => setOpen(true)}
      >
        CONTROLS
      </Button>
    );
  }

  return (
    <Card className="fixed top-4 right-4 z-50 w-72 bg-black/60 backdrop-blur-xl border-white/10 text-white shadow-2xl">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-white/70">
            Controls
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white/40 hover:text-white hover:bg-white/10"
            onClick={() => setOpen(false)}
          >
            &times;
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        <Separator className="bg-white/10" />

        {/* Physics */}
        <Section label="PHYSICS">
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

        <Separator className="bg-white/10" />

        {/* Edge */}
        <Section label="EDGES">
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

        <Separator className="bg-white/10" />

        {/* Messages */}
        <Section label="MESSAGES">
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
      </CardContent>
    </Card>
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
    <div className="space-y-2.5">
      <p className="text-[10px] font-mono text-white/40">{label}</p>
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
        <span className="text-[10px] font-mono text-white/50">{label}</span>
        <span className="text-[10px] font-mono text-white/70 tabular-nums">
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
