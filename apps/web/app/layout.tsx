import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CustomCursor } from "@/components/CustomCursor";

export const metadata: Metadata = {
  title: "Frame Studio",
  description: "Generate high-frame-rate Remotion motion graphics from a single prompt. Fast, minimal, precise.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* SF Pro Display — Apple CDN (works on all platforms via CSS font-face) */}
        <link rel="stylesheet" href="https://fonts.cdnfonts.com/css/sf-pro-display" />
        {/* Instrument Serif + Plus Jakarta Sans + Geist Mono — Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Geist+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{ fontFamily: "'SF Pro Display', 'Plus Jakarta Sans', sans-serif" }}
        className="relative bg-[#f9f9fb] text-[#1d1d1f] antialiased min-h-screen overflow-x-hidden"
      >
        <CustomCursor />
        
        {/* Single ambient glow — top center, fixed */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-60 animate-ambient-glow"
            style={{ background: "radial-gradient(ellipse at center, rgba(0,113,227,0.09) 0%, transparent 72%)" }}
          />
        </div>

        <Header />
        <main className="relative z-10 pt-24 min-h-[calc(100vh-80px)]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
