import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#050505",
          secondary: "#0B0B0B",
          surface: "#121212",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.08)",
          hover: "rgba(255, 255, 255, 0.16)",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#B8B8B8",
          muted: "#666666",
        },
        accent: {
          DEFAULT: "#F5F5F5",
          glow: "rgba(255, 255, 255, 0.12)",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro", "Geist", "Inter", "IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "IBM Plex Mono", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
