import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tea: {
          dark: "#143424",       // Deep Tea Green (Primary)
          forest: "#1B4332",     // Forest Tea Green
          leaf: "#2D6A4F",       // Natural Leaf Green (Secondary)
          sage: "#40916C",       // Lighter Leaf Green
          soft: "#74C69D",       // Soft Mint
          pale: "#D8F3DC",       // Very Light Green Tint
          bg: "#F4F7F4",         // Secondary Background (very light natural green)
          surface: "#F8FAF8",    // Card background
          gold: "#C5A059",       // Subtle warm gold accent
          goldLight: "#E8D8B0",  // Pale gold accent
          goldHover: "#B38F43",  // Hover gold
          charcoal: "#1F2421",   // Dark charcoal text
          muted: "#4A5550",      // Muted body text
          border: "#E2E8E2",     // Subtle border
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 2px 10px rgba(20, 52, 36, 0.05)",
        card: "0 4px 20px rgba(20, 52, 36, 0.08)",
        hover: "0 8px 30px rgba(20, 52, 36, 0.12)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "subtle-zoom": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.04)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        "subtle-zoom": "subtle-zoom 25s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
