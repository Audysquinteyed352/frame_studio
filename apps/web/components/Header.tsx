"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Github, Play } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const SOFT = "cubic-bezier(0.22, 1, 0.36, 1)";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2.5rem)] max-w-4xl rounded-full px-6 py-3 flex items-center justify-between"
      style={{
        fontFamily: "var(--font-display)",
        background: scrolled
          ? "rgba(255,255,255,0.82)"
          : "rgba(255,255,255,0.68)",
        backdropFilter: scrolled ? "blur(40px) saturate(200%)" : "blur(24px) saturate(180%)",
        WebkitBackdropFilter: scrolled ? "blur(40px) saturate(200%)" : "blur(24px) saturate(180%)",
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: scrolled
          ? "0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 0 rgba(255,255,255,0.9)"
          : "0 4px 16px rgba(0,0,0,0.03), inset 0 1px 0 0 rgba(255,255,255,0.9)",
        transition: `background 0.4s ${SOFT}, backdrop-filter 0.4s ${SOFT}, box-shadow 0.4s ${SOFT}`,
      }}
    >
      <Link href="/" className="flex items-center gap-2 group">
        <span className="font-semibold text-[15px] tracking-tight text-[#1d1d1f]">
          Frame Studio
        </span>
      </Link>

      <nav className="flex items-center gap-1.5">
        <Link
          href="/"
          style={{ transition: `all 0.25s ${SOFT}` }}
          className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
            pathname === "/"
              ? "bg-black/[0.06] text-[#1d1d1f] border border-black/10 shadow-sm"
              : "text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04]"
          }`}
        >
          <Play className="w-3 h-3" style={{ color: "#0071e3" }} strokeWidth={2} />
          <span>Generator</span>
        </Link>

        <a
          href="https://github.com/programmersd21/frame_studio"
          target="_blank"
          rel="noopener noreferrer"
          style={{ transition: `all 0.25s ${SOFT}` }}
          className="px-4 py-1.5 rounded-full text-xs font-medium text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] flex items-center gap-1.5"
        >
          <Github className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>GitHub</span>
        </a>
      </nav>
    </motion.header>
  );
};
