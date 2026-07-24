"use client";

import React from "react";
import Link from "next/link";
import { Github, Play } from "lucide-react";
import { usePathname } from "next/navigation";

const SOFT = "cubic-bezier(0.22, 1, 0.36, 1)";

export const Header: React.FC = () => {
  const pathname = usePathname();

  return (
    <header
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2.5rem)] max-w-4xl rounded-full glass px-6 py-3 flex items-center justify-between"
      style={{ fontFamily: "var(--font-display)", transition: `box-shadow 0.4s ${SOFT}` }}
    >
      <Link href="/" className="flex items-center gap-2 group">
        <span
          className="font-semibold text-[15px] tracking-tight text-[#1d1d1f]"
          style={{ transition: `opacity 0.2s ${SOFT}` }}
        >
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
          <Play className="w-3 h-3 text-[#0071e3]" />
          <span>Generator</span>
        </Link>

        <a
          href="https://github.com/programmersd21/frame_studio"
          target="_blank"
          rel="noopener noreferrer"
          style={{ transition: `all 0.25s ${SOFT}` }}
          className="px-4 py-1.5 rounded-full text-xs font-medium text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] flex items-center gap-1.5"
        >
          <Github className="w-3.5 h-3.5" />
          <span>GitHub</span>
        </a>
      </nav>
    </header>
  );
};
