import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6C63FF",
          50: "#F0EFFE",
          100: "#E2DEFE",
          200: "#C5BDFD",
          300: "#A89CFB",
          400: "#8B7BF9",
          500: "#6C63FF",
          600: "#4D42F7",
          700: "#2E21EF",
          800: "#1A0FD8",
          900: "#140CAB",
        },
        emerald: {
          DEFAULT: "#10B981",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
        },
        dark: {
          DEFAULT: "#0F0E1A",
          50: "#1E1B2E",
          100: "#16132A",
          200: "#0F0E1A",
        },
        surface: {
          DEFAULT: "#1A1730",
          50: "#2A2645",
          100: "#1A1730",
          200: "#130F28",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-gradient": "linear-gradient(135deg, #0F0E1A 0%, #1a0a2e 50%, #0F0E1A 100%)",
        "card-gradient": "linear-gradient(135deg, rgba(108,99,255,0.15), rgba(16,185,129,0.08))",
        "glow-purple": "radial-gradient(ellipse at center, rgba(108,99,255,0.3) 0%, transparent 70%)",
      },
      boxShadow: {
        "glow-sm": "0 0 20px rgba(108,99,255,0.3)",
        "glow-md": "0 0 40px rgba(108,99,255,0.4)",
        "glow-emerald": "0 0 30px rgba(16,185,129,0.3)",
        "card": "0 4px 24px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)",
        "card-hover": "0 8px 40px rgba(108,99,255,0.25), 0 2px 6px rgba(0,0,0,0.4)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
