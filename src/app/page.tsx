"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import NetworkStats from "@/components/mycelium/NetworkStats";
import MessageInput from "@/components/mycelium/MessageInput";
import OutputPanel from "@/components/mycelium/OutputPanel";
import NodeInspector from "@/components/mycelium/NodeInspector";
import ControlPanel from "@/components/mycelium/ControlPanel";
import HeroOverlay from "@/components/mycelium/HeroOverlay";

const MyceliumCanvas = dynamic(
  () => import("@/components/mycelium/MyceliumCanvas"),
  { ssr: false },
);

export default function Home() {
  const [entered, setEntered] = useState(false);

  const handleEnter = useCallback(() => {
    setEntered(true);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <MyceliumCanvas />
      <div className="myc-vignette" />
      <div className="myc-grain" />

      {!entered && <HeroOverlay onEnter={handleEnter} />}

      {entered && (
        <div className="workspace-panels">
          <NetworkStats />
          <ControlPanel />
          <OutputPanel />
          <NodeInspector />
          <MessageInput />
        </div>
      )}
    </main>
  );
}
