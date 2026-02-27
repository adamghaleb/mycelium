"use client";

// ============================================================================
// MyceliumCanvas — Canvas mount, pointer events, simulation lifecycle.
// Simulation owns the loop; renderer reads from it; React doesn't drive rendering.
// ============================================================================

import { useRef, useEffect, useCallback } from "react";
import { Simulation } from "@/lib/mycelium/simulation";
import { Renderer } from "@/lib/mycelium/renderer";
import { setSimulation } from "@/lib/mycelium/instance";
import { useMyceliumStore } from "@/store/useMyceliumStore";

export default function MyceliumCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Simulation | null>(null);
  const rendererRef = useRef<Renderer | null>(null);

  const store = useMyceliumStore;

  // --- Init simulation + renderer on mount ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sim = new Simulation();
    const renderer = new Renderer(canvas);

    simRef.current = sim;
    rendererRef.current = renderer;
    setSimulation(sim);

    // Size
    renderer.resize();
    sim.init(renderer.viewport.width, renderer.viewport.height);

    // Center camera on the network with a comfortable zoom
    renderer.centerOn(
      renderer.viewport.width / 2,
      renderer.viewport.height / 2,
      0.85,
    );

    // Wire snapshot callback to Zustand + publish selected node screen pos
    sim.onSnapshot((snapshot) => {
      store.getState().setSnapshot(snapshot);

      // Publish screen position of selected node
      const selectedId = store.getState().selectedNodeId;
      if (selectedId) {
        const selectedNode = sim.nodes.get(selectedId);
        if (selectedNode) {
          const vp = renderer.viewport;
          const sx = selectedNode.pos.x * vp.zoom + vp.offsetX;
          const sy = selectedNode.pos.y * vp.zoom + vp.offsetY;
          store.getState().setSelectedNodeScreenPos({ x: sx, y: sy });
        }
      }
    });

    sim.onMessagesChanged((messages) => {
      store.getState().setMessages(messages);
    });

    // Start both loops
    sim.start();
    renderer.start(sim);

    // Resize handler
    const onResize = () => {
      renderer.resize();
      sim.resize(renderer.viewport.width, renderer.viewport.height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      sim.destroy();
      renderer.stop();
      setSimulation(null);
    };
  }, [store]);

  // --- Sync running state ---
  const isRunning = useMyceliumStore((s) => s.isRunning);
  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    if (isRunning && !sim.running) sim.start();
    if (!isRunning && sim.running) sim.stop();
  }, [isRunning]);

  // --- Sync params ---
  const params = useMyceliumStore((s) => s.params);
  useEffect(() => {
    simRef.current?.updateParams(params);
  }, [params]);

  // --- Mouse events ---
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const sim = simRef.current;
      const renderer = rendererRef.current;
      if (!sim || !renderer) return;

      // Drag
      if (sim.isDragging) {
        const wp = renderer.screenToWorld(e.clientX, e.clientY);
        sim.updateDrag(wp.x, wp.y);
        return;
      }

      // Pan
      if (e.buttons === 4 || (e.buttons === 1 && e.shiftKey)) {
        renderer.panBy(e.movementX, e.movementY);
        return;
      }

      // Hover
      const wp = renderer.screenToWorld(e.clientX, e.clientY);
      const node = sim.quadtree?.findNearest(wp, 25 / renderer.viewport.zoom);
      const nodeId = node?.id ?? null;
      renderer.hoveredNodeId = nodeId;
      store.getState().hoverNode(nodeId);
    },
    [store],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const sim = simRef.current;
      const renderer = rendererRef.current;
      if (!sim || !renderer) return;

      // Middle click or shift+click → pan start (handled in move)
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) return;

      if (e.button === 0) {
        const wp = renderer.screenToWorld(e.clientX, e.clientY);
        const node = sim.quadtree?.findNearest(wp, 25 / renderer.viewport.zoom);
        if (node) {
          // Start drag
          sim.startDrag(node.id);
          renderer.selectedNodeId = node.id;
          store.getState().selectNode(node.id);
        } else {
          renderer.selectedNodeId = null;
          store.getState().selectNode(null);
        }
      }
    },
    [store],
  );

  const handleMouseUp = useCallback(() => {
    simRef.current?.endDrag();
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    rendererRef.current?.zoomAt(delta, e.clientX, e.clientY);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ background: "#060d14", cursor: "crosshair" }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
