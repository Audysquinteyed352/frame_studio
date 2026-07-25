import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CustomCursor } from "@/components/CustomCursor";
import { AmbientBackground } from "@/components/AmbientBackground";

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
        className="relative bg-[#f9f9fb] text-[#1d1d1f] antialiased min-h-screen overflow-x-hidden"
      >
        <CustomCursor />
        <AmbientBackground />

        <Header />
        <main className="relative z-10 pt-24 min-h-[calc(100vh-80px)]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
