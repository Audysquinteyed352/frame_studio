"use client";

import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GenerateButton, ButtonState } from "./GenerateButton";
import { Command, ChevronDown, ArrowUpRight } from "lucide-react";

interface PromptBoxProps {
  onGenerate: (prompt: string, model: string) => void;
  isLoading?: boolean;
}

const PRESETS = [
  "Apple keynote title reveal with glass aesthetic",
  "Minimalist SaaS product launch sequence",
  "Kinetic typography with springy 120fps motion",
  "Financial dashboard intro with timeline charts",
];

const GEMINI_MODELS = [
  { id: "gemini-3.6-flash",       name: "Gemini 3.6 Flash" },
  { id: "gemini-3.5-flash-lite",   name: "Gemini 3.5 Flash Lite" },
  { id: "gemini-3.5-flash",        name: "Gemini 3.5 Flash" },
  { id: "gemma-4-31b-it",          name: "Gemma 4 31B" },
  { id: "gemma-4-26b-a4b-it",      name: "Gemma 4 26B" },
  { id: "gemini-3.1-flash-lite",   name: "Gemini 3.1 Flash Lite" },
];

export const PromptBox: React.FC<PromptBoxProps> = ({ onGenerate, isLoading = false }) => {
  const [prompt, setPrompt]               = useState("");
  const [selectedModel, setSelectedModel]  = useState("gemini-3.6-flash");
  const [modelOpen, setModelOpen]          = useState(false);
  const [buttonState, setButtonState]      = useState<ButtonState>("idle");
  const [isTyping, setIsTyping]            = useState(false);
  const dropdownRef                        = useRef<HTMLDivElement>(null);
  const typingTimerRef                     = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setButtonState(isLoading ? "loading" : "idle");
  }, [isLoading]);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setIsTyping(true);
    
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 150);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    setButtonState("pressing");
    setTimeout(() => onGenerate(prompt.trim(), selectedModel), 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  const selectedLabel = GEMINI_MODELS.find(m => m.id === selectedModel)?.name ?? "Model";

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5" style={{ fontFamily: "var(--font-display)" }}>
      <form onSubmit={handleSubmit} className="relative group">
        {/* Focus halo */}
        <div
          className="absolute -inset-[4px] rounded-[22px] pointer-events-none opacity-0 group-focus-within:opacity-100"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(0,113,227,0.15), transparent 70%)",
            transition: "opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1)"
          }}
        />

<div
            className="relative rounded-2xl p-[1.5px] shadow-xl"
            style={{
              background: modelOpen 
                ? "linear-gradient(135deg, rgba(0,113,227,0.25), rgba(94,92,230,0.15))" 
                : "linear-gradient(135deg, rgba(0,113,227,0.08), rgba(0,0,0,0.03))",
              transition: "background 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9) inset"
            }}
          >
          <div
            className="relative rounded-[calc(1rem-1.5px)] px-6 pt-6 pb-5"
            style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(32px)" }}
          >
            <textarea
              value={prompt}
              onChange={handlePromptChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Describe your motion graphics concept…"
              rows={3}
              style={{ 
                fontFamily: "var(--font-display)", 
                letterSpacing: "-0.015em",
                willChange: "transform",
              }}
              className={`w-full bg-transparent text-[#1d1d1f] placeholder:text-[#86868b] text-[15px] leading-relaxed outline-none focus:outline-none focus:ring-0 resize-none transition-all duration-100 ${
                isTyping ? "typing-active" : ""
              }`}
            />

            <div className="flex items-center justify-between gap-4 pt-3 border-t border-black/[0.05] mt-2">
              {/* Left controls */}
              <div className="flex items-center gap-3">

                {/* Custom animated model picker */}
                <div ref={dropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setModelOpen(v => !v)}
                    disabled={isLoading}
                    style={{
                      fontFamily: "var(--font-sans)",
                      transition: "all 0.28s cubic-bezier(0.22, 1, 0.36, 1)"
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                      modelOpen
                        ? "bg-[#0071e3] text-white border-[#0071e3] shadow-[0_4px_14px_rgba(0,113,227,0.28)]"
                        : "bg-black/[0.04] text-[#1d1d1f] border-black/10 hover:bg-black/[0.08] hover:border-black/20"
                    }`}
                  >
                    <span>{selectedLabel}</span>
                    <motion.span
                      animate={{ rotate: modelOpen ? 180 : 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {modelOpen && (
                      <motion.div
                        key="dropdown"
                        initial={{ opacity: 0, scale: 0.94, y: 8 }}
                        animate={{ opacity: 1, scale: 1,    y: 0 }}
                        exit={{    opacity: 0, scale: 0.96, y: 6 }}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                          fontFamily: "var(--font-sans)",
                          transformOrigin: "bottom left",
                        }}
                        className="absolute bottom-[calc(100%+6px)] left-0 z-50 w-52 rounded-xl overflow-hidden
                          bg-white/95 backdrop-blur-2xl
                          border border-black/[0.07]
                          shadow-[0_16px_40px_rgba(0,0,0,0.10),0_1px_0_rgba(255,255,255,0.9)_inset]"
                      >
                        {GEMINI_MODELS.map((model, i) => (
                          <motion.button
                            key={model.id}
                            type="button"
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                            onClick={() => { setSelectedModel(model.id); setModelOpen(false); }}
                            style={{ transition: "background 0.18s cubic-bezier(0.4, 0, 0.2, 1)" }}
                            className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between group/item ${
                              selectedModel === model.id
                                ? "text-[#0071e3] bg-[#0071e3]/[0.06]"
                                : "text-[#1d1d1f] hover:bg-black/[0.04]"
                            }`}
                          >
                            <span className="font-medium">{model.name}</span>
                            {selectedModel === model.id && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3]" />
                            )}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Keyboard hint */}
                <div
                  className="hidden sm:flex items-center gap-1 text-[11px] text-[#a1a1a6]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <Command className="w-3 h-3" />
                  <span>+ Return</span>
                </div>
              </div>

              <GenerateButton
                state={buttonState}
                onClick={handleSubmit}
                disabled={!prompt.trim()}
              />
            </div>
          </div>
        </div>
      </form>

      {/* Preset chips */}
      <div className="space-y-2.5">
        <p
          className="text-[11px] tracking-wide text-[#a1a1a6] uppercase"
          style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}
        >
          Concepts
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRESETS.map((preset, idx) => (
            <motion.button
              key={idx}
              type="button"
              whileHover={{ y: -1, scale: 1.005 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setPrompt(preset)}
              style={{ fontFamily: "var(--font-sans)" }}
              className="group/p text-left px-4 py-3 rounded-xl text-xs text-[#3a3a3c]
                bg-white/70 hover:bg-white border border-black/[0.06] hover:border-black/[0.12]
                shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]
                flex items-center justify-between gap-3"
            >
              <span className="line-clamp-1 leading-relaxed">{preset}</span>
              <ArrowUpRight
                className="w-3.5 h-3.5 text-[#a1a1a6] group-hover/p:text-[#0071e3] shrink-0"
                style={{ transition: "color 0.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
              />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
