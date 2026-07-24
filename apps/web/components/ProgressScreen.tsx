"use client";

import { motion } from "framer-motion";

const SOFT = [0.22, 1, 0.36, 1] as const;

interface ProgressScreenProps {
  stage: string;
}

export const ProgressScreen = ({ stage }: ProgressScreenProps) => {
  const isDownloading = stage.includes("Download");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: SOFT }}
      className="fixed inset-0 z-[999] flex items-center justify-center p-6"
      style={{ background: "rgba(249,249,251,0.8)", backdropFilter: "blur(40px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: SOFT }}
        className="w-full max-w-sm"
      >
        <div
          className="glass rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.03), inset 0 1px 0 0 rgba(255,255,255,0.9)" }}
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4 flex items-center gap-3">
            <motion.div
              animate={isDownloading ? { scale: [1, 0] } : { rotate: 360 }}
              transition={isDownloading ? { duration: 0.3 } : { duration: 1.6, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 shrink-0"
            >
              {isDownloading ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-4 h-4 rounded-full bg-[#34c759]"
                  style={{ boxShadow: "0 0 12px rgba(52,199,89,0.4)" }}
                />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-[#0071e3]/20 border-t-[#0071e3]" />
              )}
            </motion.div>
            <span className="text-sm font-semibold text-[#1d1d1f] tracking-tight">
              {isDownloading ? "Complete" : "Generating video"}
            </span>
          </div>

          {/* Body */}
          <div className="px-6 pb-6">
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: SOFT }}
            >
              <p className="text-sm text-[#86868b] font-medium leading-relaxed">
                {isDownloading
                  ? "Your video is ready — downloading now..."
                  : "Processing your prompt through Gemini, rendering frames, and compiling your video. This usually takes a minute."}
              </p>
            </motion.div>

            {/* Progress bar for generating state */}
            {!isDownloading && (
              <div className="mt-4 h-1 bg-[#0071e3]/10 rounded-full overflow-hidden">
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="h-full w-1/2 rounded-full bg-[#0071e3]"
                  style={{ boxShadow: "0 0 8px rgba(0,113,227,0.3)" }}
                />
              </div>
            )}

            {isDownloading && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.6, ease: SOFT }}
                className="mt-4 h-1 bg-[#34c759]/20 rounded-full overflow-hidden"
              >
                <div className="h-full w-full rounded-full bg-[#34c759]" />
              </motion.div>
            )}
          </div>

          {/* Status bar */}
          <div className="mx-6 h-[1px] bg-black/[0.05]" />
          <div className="px-6 py-3 flex items-center justify-between text-[11px] text-[#86868b] font-mono">
            <span>Status</span>
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isDownloading ? "bg-[#34c759]" : "bg-[#0071e3]"} animate-pulse`} />
              {isDownloading ? "Done" : "Processing"}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};