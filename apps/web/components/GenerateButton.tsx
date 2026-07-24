"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

export type ButtonState = "idle" | "pressing" | "loading" | "success";

interface GenerateButtonProps {
  state: ButtonState;
  onClick: () => void;
  disabled?: boolean;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({ state, onClick, disabled }) => {
  const isIdle = state === "idle" && !disabled;

  return (
    <motion.button
      animate={state}
      variants={{ idle: { scale: 1 }, pressing: { scale: 0.95 }, loading: { scale: 1 }, success: { scale: 1 } }}
      whileHover={isIdle ? { scale: 1.03 } : undefined}
      whileTap={isIdle ? { scale: 0.96 } : undefined}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      disabled={disabled || state === "loading"}
      style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
      className="relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-full
        bg-[#1d1d1f] text-white text-xs font-semibold
        disabled:opacity-30 disabled:cursor-not-allowed
        shadow-[0_4px_14px_rgba(0,0,0,0.14)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.22)]"
    >
      {state === "loading" ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Generating…</span>
        </>
      ) : state === "success" ? (
        <>
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ready</span>
        </>
      ) : (
        <>
          <span>Generate</span>
          <motion.span whileHover={{ x: 2 }} transition={{ duration: 0.2 }}>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.span>
        </>
      )}
    </motion.button>
  );
};
