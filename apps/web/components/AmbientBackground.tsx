"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

// ── Confetti particle config ───────────────────────────────
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  shape: "circle" | "rect" | "ring";
  color: string;
  delay: number;
  duration: number;
  drift: number;
  opacity: number;
  driftX1: number;
  driftX2: number;
}

const COLORS = ["#0071e3", "#bf5af2", "#34e0a4", "#ff9f0a", "#ff2d55", "#ffffff"];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    shape: (["circle", "rect", "ring"] as const)[Math.floor(Math.random() * 3)],
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 10,
    drift: 15 + Math.random() * 35,
    opacity: 0.1 + Math.random() * 0.14,
    driftX1: (Math.random() - 0.5) * 25,
    driftX2: (Math.random() - 0.5) * 15,
  }));
}

// ── Aurora band config ─────────────────────────────────────
interface AuroraBand {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
}

function generateAurora(): AuroraBand[] {
  return [
    {
      id: 0,
      x: -10,
      y: 15,
      width: 120,
      height: 60,
      color: "rgba(0,113,227,0.04)",
      delay: 0,
      duration: 20,
      drift: 8,
    },
    {
      id: 1,
      x: 50,
      y: 55,
      width: 100,
      height: 50,
      color: "rgba(191,90,242,0.03)",
      delay: 4,
      duration: 24,
      drift: -6,
    },
    {
      id: 2,
      x: 30,
      y: 80,
      width: 80,
      height: 40,
      color: "rgba(52,224,164,0.03)",
      delay: 8,
      duration: 18,
      drift: 10,
    },
  ];
}

// ── Floating ring config ───────────────────────────────────
interface Ring {
  id: number;
  x: number;
  y: number;
  size: number;
  thickness: number;
  delay: number;
  duration: number;
}

function generateRings(): Ring[] {
  return [
    { id: 0, x: 15, y: 30, size: 120, thickness: 0.5, delay: 0, duration: 14 },
    { id: 1, x: 78, y: 60, size: 80, thickness: 0.5, delay: 5, duration: 18 },
    { id: 2, x: 60, y: 20, size: 60, thickness: 0.5, delay: 10, duration: 12 },
  ];
}

export const AmbientBackground: React.FC = () => {
  const particles = useMemo(() => generateParticles(35), []);
  const aurora = useMemo(() => generateAurora(), []);
  const rings = useMemo(() => generateRings(), []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ willChange: "transform" }}
    >
      {/* ── Aurora bands ───────────────────────────────── ── */}
      {aurora.map((band) => (
        <motion.div
          key={`aurora-${band.id}`}
          className="absolute rounded-full"
          style={{
            left: `${band.x}%`,
            top: `${band.y}%`,
            width: `${band.width}%`,
            height: `${band.height}%`,
            background: `radial-gradient(ellipse at center, ${band.color} 0%, transparent 70%)`,
            filter: "blur(40px)",
          }}
          animate={{
            x: [0, band.drift, -band.drift * 0.5, 0],
            y: [0, -band.drift * 0.3, band.drift * 0.4, 0],
            scale: [1, 1.08, 0.95, 1],
            opacity: [0.6, 1, 0.7, 0.6],
          }}
          transition={{
            duration: band.duration,
            delay: band.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* ── Floating rings ───────────────────────────────── ── */}
      {rings.map((ring) => (
        <motion.div
          key={`ring-${ring.id}`}
          className="absolute"
          style={{
            left: `${ring.x}%`,
            top: `${ring.y}%`,
            width: ring.size,
            height: ring.size,
            marginLeft: -ring.size / 2,
            marginTop: -ring.size / 2,
            borderRadius: "50%",
            border: `${ring.thickness}px solid rgba(0,113,227,0.06)`,
            boxShadow: "inset 0 0 20px rgba(0,113,227,0.02)",
          }}
          animate={{
            scale: [1, 1.12, 0.98, 1],
            opacity: [0.3, 0.7, 0.4, 0.3],
            rotate: [0, 15, -8, 0],
          }}
          transition={{
            duration: ring.duration,
            delay: ring.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* ── Confetti particles ──────────────────────────── ── */}
      {particles.map((p) => (
        <motion.div
          key={`p-${p.id}`}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            borderRadius: p.shape === "rect" ? "2px" : "50%",
            ...(p.shape === "ring"
              ? {
                  width: p.size * 2.5,
                  height: p.size * 2.5,
                  marginLeft: -(p.size * 2.5) / 2,
                  marginTop: -(p.size * 2.5) / 2,
                  border: `${p.size * 0.15}px solid ${p.color}`,
                }
              : {
                  width: p.shape === "rect" ? p.size * 1.4 : p.size,
                  height: p.shape === "rect" ? p.size * 0.7 : p.size,
                  background: p.color,
                  ...(p.shape === "circle" ? { boxShadow: `0 0 ${p.size * 2}px ${p.color}40` } : {}),
                }),
            opacity: 0,
          }}
          animate={
            p.shape === "rect"
              ? {
                  opacity: [0, p.opacity, 0],
                  y: [0, -p.drift, -p.drift * 0.3],
                  x: [0, p.driftX1, p.driftX2],
                  rotate: [0, 180, 360],
                }
              : p.shape === "ring"
                ? {
                    opacity: [0, p.opacity, 0],
                    scale: [0.5, 1, 0.5],
                    y: [0, -p.drift * 0.3, 0],
                    x: [0, p.driftX1 * 0.6, 0],
                  }
                : {
                    opacity: [0, p.opacity, 0],
                    y: [0, -p.drift * 0.7, -p.drift * 0.2],
                    x: [0, p.driftX1, p.driftX2],
                    scale: [1, 1.3, 1],
                  }
          }
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* ── Grain / noise overlay ───────────────────────── ── */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
          mixBlendMode: "soft-light",
        }}
      />

      {/* ── Single ambient glow — top center, fixed ─────── ── */}
      <motion.div
        className="absolute -top-[15%] left-1/2 -translate-x-1/2 rounded-full"
        style={{
          width: "900px",
          height: "500px",
          background: "radial-gradient(ellipse at center, rgba(0,113,227,0.09) 0%, transparent 72%)",
        }}
        animate={{
          opacity: [0.55, 0.85, 0.55],
          scale: [1, 1.06, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};
