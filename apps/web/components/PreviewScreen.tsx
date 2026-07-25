"use client";

import React from "react";
import { motion } from "framer-motion";
import { Download, X, Check, Cloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const SOFT = [0.22, 1, 0.36, 1] as const;

interface PreviewScreenProps {
  videoUrl: string;
  filename: string;
  prompt?: string;
  model?: string;
  onClose: () => void;
}

export const PreviewScreen = ({ videoUrl, filename, prompt, model, onClose }: PreviewScreenProps) => {
  const [downloadState, setDownloadState] = React.useState<"idle" | "loading" | "success">("idle");
  const [saveState, setSaveState] = React.useState<"idle" | "loading" | "saved" | "error">("idle");
  const [isClosing, setIsClosing] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setDownloadState("loading");
    setTimeout(() => setDownloadState("success"), 800);
    setTimeout(() => setDownloadState("idle"), 2400);
  };

  const handleSave = async () => {
    setSaveState("loading");
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append("video", blob, filename);
      formData.append("prompt", prompt || "");
      formData.append("model", model || "");

      const uploadRes = await fetch("/api/videos/save", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Failed to save");
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 350);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isClosing ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: SOFT }}
      className="fixed inset-0 z-[999] flex items-center justify-center p-6"
      style={{ background: "rgba(249,249,251,0.8)", backdropFilter: "blur(40px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ 
          opacity: isClosing ? 0 : 1, 
          scale: isClosing ? 0.92 : 1, 
          y: isClosing ? 20 : 0 
        }}
        transition={{ duration: 0.35, ease: SOFT }}
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
              onClick={handleClose}
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
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium text-[#86868b] bg-black/[0.04] hover:bg-black/[0.08] border border-black/[0.06] transition-all duration-200"
            >
              Close
            </button>

            {user && (
              <motion.button
                onClick={handleSave}
                disabled={saveState === "loading" || saveState === "saved"}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative overflow-hidden"
                style={{
                  background: saveState === "saved" ? "rgba(52,199,89,0.15)" : saveState === "error" ? "rgba(255,59,48,0.1)" : "rgba(0,113,227,0.1)",
                  color: saveState === "saved" ? "#34c759" : saveState === "error" ? "#ff3b30" : "#0071e3",
                }}
              >
                {saveState === "loading" ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-2 border-[#0071e3]/30 border-t-[#0071e3] rounded-full"
                  />
                ) : saveState === "saved" ? (
                  <>
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    Saved
                  </>
                ) : saveState === "error" ? (
                  <span>Try again</span>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5" strokeWidth={2.5} />
                    Save
                  </>
                )}
              </motion.button>
            )}

            <motion.a
              href={downloadState === "idle" ? videoUrl : undefined}
              download={downloadState === "idle" ? filename : undefined}
              onClick={handleDownload}
              whileTap={{ scale: 0.97 }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 relative overflow-hidden cursor-pointer"
              style={{ boxShadow: "0 4px 14px rgba(0,113,227,0.25)" }}
            >
              {/* Idle state */}
              <motion.div
                initial={false}
                animate={{ 
                  opacity: downloadState === "idle" ? 1 : 0,
                  scale: downloadState === "idle" ? 1 : 0.8,
                }}
                className="flex items-center gap-2 absolute"
              >
                <Download className="w-3.5 h-3.5" strokeWidth={2.5} />
                Download
              </motion.div>

              {/* Loading state */}
              <motion.div
                initial={false}
                animate={{ 
                  opacity: downloadState === "loading" ? 1 : 0,
                  scale: downloadState === "loading" ? 1 : 0.8,
                }}
                className="flex items-center gap-2 absolute"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                <span>Downloading</span>
              </motion.div>

              {/* Success state */}
              <motion.div
                initial={false}
                animate={{ 
                  opacity: downloadState === "success" ? 1 : 0,
                  scale: downloadState === "success" ? 1 : 0.8,
                }}
                className="flex items-center gap-2 absolute"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Check className="w-4 h-4" strokeWidth={3} />
                </motion.div>
                <span>Done</span>
              </motion.div>

              {/* Hidden spacer to keep button width stable */}
              <span className="invisible flex items-center gap-2">
                <span className="w-4 h-4" />
                <span>Downloading</span>
              </span>
            </motion.a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};