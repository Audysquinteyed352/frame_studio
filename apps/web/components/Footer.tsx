"use client";

import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-8 mt-24 border-t border-black/[0.06] text-center text-xs text-neutral-400 font-sans">
      <p>&copy; {new Date().getFullYear()} Frame Studio. All rights reserved.</p>
    </footer>
  );
};
