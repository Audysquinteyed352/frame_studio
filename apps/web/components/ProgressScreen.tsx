"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

const SOFT = [0.22, 1, 0.36, 1] as const;

interface ProgressScreenProps {
  stage: string;
  percent?: number;
}

interface Orb {
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
}

function genOrbs(): Orb[] {
  return [
    { x: 20, y: 30, size: 300, color: "rgba(0,113,227,0.04)", delay: 0, duration: 18, driftX: 8, driftY: -5 },
    { x: 80, y: 50, size: 250, color: "rgba(191,90,242,0.03)", delay: 3, duration: 22, driftX: -6, driftY: 8 },
    { x: 50, y: 70, size: 350, color: "rgba(52,224,164,0.03)", delay: 6, duration: 15, driftX: 10, driftY: -3 },
  ];
}

export const ProgressScreen = ({ stage, percent }: ProgressScreenProps) => {
  const isDone = percent === 100;
  const orbs = useMemo(() => genOrbs(), []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: SOFT }}
      className="fixed inset-0 z-[999] flex items-center justify-center p-6 overflow-hidden"
      style={{
        background: "rgba(249,249,251,0.65)",
        backdropFilter: "blur(60px) saturate(180%)",
        WebkitBackdropFilter: "blur(60px) saturate(180%)",
      }}
    >
      {/* Animated light orbs floating behind the card */}
      {orbs.map((orb, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: orb.size,
            height: orb.size,
            marginLeft: -orb.size / 2,
            marginTop: -orb.size / 2,
            background: `radial-gradient(ellipse at center, ${orb.color} 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
          animate={{
            x: [0, orb.driftX, -orb.driftX * 0.5, 0],
            y: [0, orb.driftY, -orb.driftY * 0.3, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Gradient ambient wash on the overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,113,227,0.03) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(191,90,242,0.02) 0%, transparent 50%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: SOFT }}
        className="w-full max-w-sm relative"
      >
        <div
          className="rounded-2xl overflow-hidden relative"
          style={{
            background: "rgba(255,255,255,0.78)",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            border: "1px solid rgba(255,255,255,0.5)",
            boxShadow:
              "0 24px 80px rgba(0,0,0,0.07), 0 10px 32px rgba(0,0,0,0.03), 0 1px 0 0 rgba(255,255,255,0.85) inset, 0 0 0 1px rgba(0,0,0,0.04)",
          }}
        >
          {/* Frosted top accent line */}
          <div
            className="h-[1px] mx-6"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)",
            }}
          />

          <div className="px-6 pt-5 pb-4 flex items-center gap-3">
            <motion.div
              animate={isDone ? { scale: [1, 0] } : { rotate: 360 }}
              transition={
                isDone
                  ? { duration: 0.3 }
                  : { duration: 1.6, repeat: Infinity, ease: "linear" }
              }
              className="w-4 h-4 shrink-0"
            >
              {isDone ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="w-4 h-4 rounded-full bg-[#34c759]"
                  style={{ boxShadow: "0 0 12px rgba(52,199,89,0.4)" }}
                />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-[#0071e3]/20 border-t-[#0071e3]" />
              )}
            </motion.div>
            <span className="text-sm font-semibold text-[#1d1d1f] tracking-tight">
              {isDone ? "Complete" : "Generating video"}
            </span>
          </div>

          <div className="px-6 pb-6">
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: SOFT }}
            >
              <p className="text-sm text-[#86868b] font-medium leading-relaxed">
                {stage || "Processing..."}
              </p>
            </motion.div>

            <div className="mt-4 h-1 bg-black/[0.06] rounded-full overflow-hidden relative">
              {isDone || !percent ? (
                <motion.div
                  animate={
                    isDone
                      ? { width: "100%" }
                      : { x: ["-100%", "200%"] }
                  }
                  transition={
                    isDone
                      ? { duration: 0.6, ease: SOFT }
                      : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                  }
                  className="h-full w-1/2 rounded-full bg-[#0071e3] absolute top-0 left-0"
                  style={{
                    boxShadow: "0 0 8px rgba(0,113,227,0.3)",
                    ...(isDone ? { backgroundColor: "#34c759" } : {}),
                  }}
                />
              ) : (
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full rounded-full bg-[#0071e3] absolute top-0 left-0"
                  style={{
                    boxShadow: "0 0 8px rgba(0,113,227,0.3)",
                  }}
                />
              )}
            </div>

            {percent !== undefined && percent > 0 && percent < 100 && (
              <p className="mt-2 text-xs text-[#86868b] font-mono text-right">
                {percent}%
              </p>
            )}
          </div>

          <div className="mx-6 h-[1px] bg-black/[0.04]" />
          <div className="px-6 py-3 flex items-center justify-between text-[11px] text-[#86868b] font-mono">
            <span>Status</span>
            <span className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isDone ? "bg-[#34c759]" : "bg-[#0071e3]"} animate-pulse`}
              />
              {isDone ? "Done" : "Processing"}
            </span>
          </div>

          {/* Bottom frost accent */}
          <div
            className="h-[1px] mx-6"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.03), transparent)",
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};
