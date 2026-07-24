"use client";

import { motion } from "framer-motion";
import { Download, X } from "lucide-react";

const SOFT = [0.22, 1, 0.36, 1] as const;

interface PreviewScreenProps {
  videoUrl: string;
  filename: string;
  onClose: () => void;
}

export const PreviewScreen = ({ videoUrl, filename, onClose }: PreviewScreenProps) => {
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
        className="w-full max-w-lg"
      >
        <div
          className="glass rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.03), inset 0 1px 0 0 rgba(255,255,255,0.9)" }}
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-[#34c759] shrink-0" style={{ boxShadow: "0 0 12px rgba(52,199,89,0.4)" }} />
              <span className="text-sm font-semibold text-[#1d1d1f] tracking-tight">
                Your video is ready
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/[0.06] transition-all duration-200"
            >
              <X className="w-3.5 h-3.5 text-[#86868b]" strokeWidth={2} />
            </button>
          </div>

          {/* Video player */}
          <div className="px-6 pb-4">
            <div className="rounded-xl overflow-hidden bg-black/[0.03] border border-black/[0.06] aspect-video">
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
                style={{ background: "#000" }}
              />
            </div>
          </div>

          {/* File info */}
          <div className="px-6 pb-1">
            <p className="text-xs text-[#86868b] font-mono truncate">
              {filename}
            </p>
          </div>

          {/* Actions */}
          <div className="mx-6 h-[1px] bg-black/[0.05]" />
          <div className="px-6 py-4 flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium text-[#86868b] bg-black/[0.04] hover:bg-black/[0.08] border border-black/[0.06] transition-all duration-200"
            >
              Close
            </button>
            <a
              href={videoUrl}
              download={filename}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200"
              style={{ boxShadow: "0 4px 14px rgba(0,113,227,0.25)" }}
            >
              <Download className="w-3.5 h-3.5" strokeWidth={2.5} />
              Download
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};