/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          void: "#08090D",
          panel: "#101218",
          card: "#161922",
          border: "#252938",
          active: "#3B4256",
          text: "#F5F7FA",
          muted: "#858B9A",
          violet: {
            DEFAULT: "#8B5CF6",
            glow: "rgba(139, 92, 246, 0.25)",
            bright: "#A78BFA",
            dark: "#6D28D9",
          },
          cyan: {
            DEFAULT: "#06B6D4",
            glow: "rgba(6, 182, 212, 0.25)",
            bright: "#22D3EE",
            dark: "#0891B2",
          },
          emerald: {
            DEFAULT: "#10B981",
            glow: "rgba(16, 185, 129, 0.25)",
          }
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },
      boxShadow: {
        "neural-violet": "0 0 20px -3px rgba(139, 92, 246, 0.35)",
        "neural-cyan": "0 0 20px -3px rgba(6, 182, 212, 0.35)",
        "panel-glow": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      keyframes: {
        pulseSlow: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.6, transform: 'scale(0.96)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      animation: {
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite linear',
      }
    },
  },
  plugins: [],
}
