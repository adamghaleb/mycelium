"use client";

import dynamic from "next/dynamic";
import NetworkStats from "@/components/mycelium/NetworkStats";
import MessageInput from "@/components/mycelium/MessageInput";
import OutputPanel from "@/components/mycelium/OutputPanel";
import NodeInspector from "@/components/mycelium/NodeInspector";
import ControlPanel from "@/components/mycelium/ControlPanel";

const MyceliumCanvas = dynamic(
  () => import("@/components/mycelium/MyceliumCanvas"),
  { ssr: false },
);

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <MyceliumCanvas />
      <NetworkStats />
      <ControlPanel />
      <OutputPanel />
      <NodeInspector />
      <MessageInput />
    </main>
  );
}
