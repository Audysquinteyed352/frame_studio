"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface ShapeAnim {
  y: number[];
  x: number[];
  scale: number[];
  rotate: number[];
}

function genShapeAnims(): ShapeAnim[] {
  return Array.from({ length: 12 }, () => ({
    y: [0, -12 + Math.random() * 8, 0],
    x: [0, (Math.random() - 0.5) * 16, 0],
    scale: [1, 1.08 + Math.random() * 0.06, 1],
    rotate: [0, (Math.random() - 0.5) * 6, 0],
  }));
}

export const Material3Decorations: React.FC = () => {
  const shapeAnims = useMemo(() => genShapeAnims(), []);

  const SHAPES = [
    { x: 8, y: 12, s: 60, c: "rgba(0,113,227,0.12)", r: 30, delay: 0 },
    { x: 82, y: 8, s: 40, c: "rgba(191,90,242,0.10)", r: 20, delay: 1.5 },
    { x: 50, y: 75, s: 80, c: "rgba(52,224,164,0.08)", r: 40, delay: 3 },
    { x: 25, y: 50, s: 30, c: "rgba(255,159,10,0.10)", r: 15, delay: 0.8 },
    { x: 70, y: 40, s: 45, c: "rgba(255,45,85,0.09)", r: 22, delay: 2.2 },
    { x: 15, y: 80, s: 35, c: "rgba(0,113,227,0.10)", r: 18, delay: 4 },
    { x: 90, y: 60, s: 50, c: "rgba(191,90,242,0.08)", r: 25, delay: 1 },
    { x: 40, y: 25, s: 25, c: "rgba(52,224,164,0.12)", r: 12, delay: 3.5 },
    { x: 60, y: 90, s: 35, c: "rgba(255,159,10,0.09)", r: 18, delay: 2 },
    { x: 35, y: 65, s: 55, c: "rgba(0,113,227,0.07)", r: 28, delay: 5 },
    { x: 78, y: 30, s: 20, c: "rgba(255,45,85,0.10)", r: 10, delay: 0.5 },
    { x: 10, y: 35, s: 40, c: "rgba(52,224,164,0.09)", r: 20, delay: 6 },
  ];

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {SHAPES.map((shape, i) => {
        const anim = shapeAnims[i];
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              width: shape.s,
              height: shape.s,
              marginLeft: -shape.s / 2,
              marginTop: -shape.s / 2,
              borderRadius: shape.r,
              background: shape.c,
            }}
            animate={{
              y: anim.y,
              x: anim.x,
              scale: anim.scale,
              rotate: anim.rotate,
            }}
            transition={{
              duration: 8 + Math.random() * 8,
              delay: shape.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* M3-style cookie shapes (scalloped edges) */}
      {[
        { x: 20, y: 20, s: 20, c: "rgba(0,113,227,0.10)", delay: 2.5 },
        { x: 75, y: 70, s: 16, c: "rgba(191,90,242,0.10)", delay: 4.5 },
        { x: 55, y: 15, s: 18, c: "rgba(52,224,164,0.10)", delay: 0.3 },
      ].map((c, i) => (
        <motion.div
          key={`cookie-${i}`}
          className="absolute"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            width: c.s,
            height: c.s,
            marginLeft: -c.s / 2,
            marginTop: -c.s / 2,
            borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
            background: c.c,
          }}
          animate={{
            y: [0, -8, 0],
            x: [0, 6, 0],
            scale: [1, 1.1, 1],
            borderRadius: ["30% 70% 70% 30% / 30% 30% 70% 70%", "50% 50% 30% 70% / 50% 30% 50% 70%", "30% 70% 70% 30% / 30% 30% 70% 70%"],
          }}
          transition={{
            duration: 10 + i * 2,
            delay: c.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* M3-style burst / star shapes */}
      {[
        { x: 92, y: 18, s: 12, c: "rgba(0,113,227,0.08)", delay: 1.2 },
        { x: 45, y: 88, s: 10, c: "rgba(255,159,10,0.08)", delay: 3.8 },
        { x: 8, y: 55, s: 14, c: "rgba(191,90,242,0.08)", delay: 5.5 },
      ].map((b, i) => (
        <motion.div
          key={`burst-${i}`}
          className="absolute"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.s,
            height: b.s,
            marginLeft: -b.s / 2,
            marginTop: -b.s / 2,
            borderRadius: "50%",
            background: `conic-gradient(from ${i * 45}deg, ${b.c} 0%, transparent 40%, ${b.c} 60%, transparent 100%)`,
          }}
          animate={{
            rotate: [0, 360],
            scale: [0.8, 1.2, 0.8],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 12 + i * 3,
            delay: b.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
