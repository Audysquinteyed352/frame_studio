import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
    },
  });

  const opacity = spring({
    frame,
    fps,
    config: {
      damping: 20,
    },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0b0b0b",
        justifyContent: "center",
        alignItems: "center",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 72, fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>
          Frame Studio
        </h1>
        <p style={{ fontSize: 24, color: "#888888", marginTop: 16 }}>
          AI-Native Motion Graphics
        </p>
      </div>
    </AbsoluteFill>
  );
};
