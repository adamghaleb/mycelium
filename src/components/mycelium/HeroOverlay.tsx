"use client";

import { useState, useEffect, useCallback } from "react";

interface HeroOverlayProps {
  onEnter: () => void;
}

function staggerStyle(
  show: boolean,
  exiting: boolean,
  enterTransform: string,
  exitTransform: string,
  initialTransform: string,
  enterDuration: string,
  exitDuration: string,
  enterDelay: string,
  exitDelay: string,
  enterEasing: string = "cubic-bezier(0.16, 1, 0.3, 1)",
  exitEasing: string = "cubic-bezier(0.4, 0, 0.2, 1)",
  targetOpacity: number = 1,
): React.CSSProperties {
  return {
    opacity: show ? (exiting ? 0 : targetOpacity) : 0,
    transform: show
      ? exiting
        ? exitTransform
        : enterTransform
      : initialTransform,
    transitionProperty: "opacity, transform",
    transitionDuration: exiting ? exitDuration : enterDuration,
    transitionTimingFunction: exiting ? exitEasing : enterEasing,
    transitionDelay: exiting ? exitDelay : enterDelay,
  };
}

export default function HeroOverlay({ onEnter }: HeroOverlayProps) {
  const [phase, setPhase] = useState<"mounting" | "visible" | "exiting">(
    "mounting",
  );
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("visible"), 50);
    const t2 = setTimeout(() => setShowContent(true), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleEnter = useCallback(() => {
    setPhase("exiting");
    setTimeout(onEnter, 900);
  }, [onEnter]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.key === "Enter" || e.key === " ") &&
        phase === "visible" &&
        showContent
      ) {
        e.preventDefault();
        handleEnter();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, showContent, handleEnter]);

  const isExiting = phase === "exiting";
  const isVisible = phase === "visible" || phase === "exiting";

  return (
    <div
      className="hero-overlay"
      style={{
        opacity: isExiting ? 0 : isVisible ? 1 : 0,
        transitionProperty: "opacity",
        transitionDuration: "800ms",
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="hero-backdrop" />
      <div className="hero-glow" />

      <div className="hero-content">
        {/* Overline */}
        <div
          className="hero-overline"
          style={staggerStyle(
            showContent,
            isExiting,
            "translateY(0)",
            "translateY(-12px)",
            "translateY(8px)",
            "800ms",
            "500ms",
            "0ms",
            "0ms",
          )}
        >
          Decentralized AI Network
        </div>

        {/* Title */}
        <h1
          className="hero-title"
          style={staggerStyle(
            showContent,
            isExiting,
            "translateY(0) scale(1)",
            "translateY(-20px) scale(0.98)",
            "translateY(24px) scale(0.97)",
            "1000ms",
            "600ms",
            "100ms",
            "50ms",
          )}
        >
          mycelium
        </h1>

        {/* Tagline */}
        <p
          className="hero-tagline"
          style={staggerStyle(
            showContent,
            isExiting,
            "translateY(0)",
            "translateY(-12px)",
            "translateY(16px)",
            "900ms",
            "500ms",
            "300ms",
            "0ms",
            undefined,
            undefined,
            0.4,
          )}
        >
          A living network of AI agents that think, transform,
          <br />
          and synthesize through fungal intelligence
        </p>

        {/* CTA */}
        <button
          onClick={handleEnter}
          className="hero-cta"
          style={staggerStyle(
            showContent,
            isExiting,
            "translateY(0)",
            "translateY(-8px)",
            "translateY(20px)",
            "900ms",
            "400ms",
            "500ms",
            "0ms",
          )}
        >
          <span className="hero-cta-text">Enter the network</span>
          <span className="hero-cta-arrow">&rarr;</span>
        </button>

        {/* Keyboard hint */}
        <div
          className="hero-hint"
          style={{
            opacity: showContent ? (isExiting ? 0 : 0.15) : 0,
            transitionProperty: "opacity",
            transitionDuration: "600ms",
            transitionTimingFunction: "ease",
            transitionDelay: isExiting ? "0ms" : "800ms",
          }}
        >
          press enter
        </div>
      </div>
    </div>
  );
}
