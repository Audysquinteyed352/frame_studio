"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

export type ButtonState = "idle" | "pressing" | "animating" | "loading" | "success";

interface GenerateButtonProps {
  state: ButtonState;
  onClick: () => void;
  disabled?: boolean;
}

const SOFT = [0.22, 1, 0.36, 1] as const;

function PaperPlane({ animating }: { animating: boolean }) {
  return (
    <motion.svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={false}
      animate={
        animating
          ? {
              x: 60,
              y: -40,
              rotate: -30,
              scale: 1.6,
              opacity: [1, 1, 0],
              pathLength: [0, 1, 1],
            }
          : { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }
      }
      transition={{
        duration: animating ? 1.8 : 0.3,
        ease: [0.16, 1, 0.3, 1],
        times: animating ? [0, 0.6, 1] : undefined,
      }}
      style={{ originX: "50%", originY: "50%" }}
    >
      <motion.path
        d="M12 19V5M5 12l7-7 7 7"
        initial={false}
        animate={animating ? { pathLength: [0, 1] } : { pathLength: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.path
        d="M5 12h14"
        initial={false}
        animate={animating ? { pathLength: [0, 1] } : { pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
    </motion.svg>
  );
}

function TrailDots({ show }: { show: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.4, ease: SOFT }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1 h-1 rounded-full bg-white/60"
          animate={show ? { y: [0, -4, 0], opacity: [0.3, 1, 0.3] } : {}}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </motion.div>
  );
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({ state, onClick, disabled }) => {
  const isIdle = state === "idle" && !disabled;
  const isAnimating = state === "animating";

  return (
    <motion.button
      animate={state}
      variants={{
        idle: { scale: 1 },
        pressing: { scale: 0.95 },
        animating: { scale: 1 },
        loading: { scale: 1 },
        success: { scale: 1 },
      }}
      whileHover={isIdle ? { scale: 1.03 } : undefined}
      whileTap={isIdle ? { scale: 0.96 } : undefined}
      transition={{ duration: 0.22, ease: SOFT }}
      onClick={onClick}
      disabled={disabled || state === "loading" || state === "animating"}
      style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
      className="relative flex items-center justify-center px-5 py-2.5 rounded-full overflow-hidden
        bg-[#1d1d1f] text-white text-xs font-semibold min-w-[120px] h-[36px]
        disabled:opacity-30 disabled:cursor-not-allowed
        shadow-[0_4px_14px_rgba(0,0,0,0.14)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.22)]"
    >
      <AnimatePresence mode="wait">
        {state === "loading" && (
          <motion.span
            key="loading"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: SOFT }}
            className="flex items-center gap-2"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Generating…</span>
          </motion.span>
        )}

        {state === "success" && (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: SOFT }}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready</span>
          </motion.span>
        )}

        {(state === "idle" || state === "pressing") && (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: SOFT }}
            className="flex items-center gap-2"
          >
            <span>Generate</span>
            <motion.svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.2 }}
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </motion.svg>
          </motion.span>
        )}

        {isAnimating && (
          <motion.span
            key="animating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: SOFT }}
            className="flex items-center gap-2"
          >
            <span className="opacity-0">Generate</span>
            <PaperPlane animating />
          </motion.span>
        )}
      </AnimatePresence>

      <TrailDots show={isAnimating} />
    </motion.button>
  );
};
