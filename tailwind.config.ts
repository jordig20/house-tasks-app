import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-josefin)", "var(--font-inter)", "sans-serif"],
        ui: ["var(--font-roboto)", "var(--font-inter)", "sans-serif"],
      },
      colors: {
        sage: {
          50: "#f5f8f3",
          100: "#e6efe2",
          500: "#6f9b72",
          700: "#466448",
        },
        cream: {
          50: "#fffaf0",
          100: "#fff1d1",
          200: "#f4dca9",
        },
        olive: {
          100: "#eaf1db",
          600: "#6f8f3d",
          700: "#54712f",
        },
        roof: {
          600: "#7b5235",
          800: "#3f2717",
        },
        terracotta: "#b85c47",
        coral: "#ff8a7a",
        material: {
          red: { 100: "#ffebee", 500: "#f44336", 700: "#d32f2f" },
          pink: { 100: "#fce4ec", 500: "#e91e63", 700: "#c2185b" },
          purple: { 100: "#f3e5f5", 500: "#9c27b0", 700: "#7b1fa2" },
          indigo: { 100: "#e8eaf6", 500: "#3f51b5", 700: "#303f9f" },
          blue: { 100: "#e3f2fd", 500: "#2196f3", 700: "#1976d2" },
          teal: { 100: "#e0f2f1", 500: "#009688", 700: "#00796b" },
          green: { 100: "#e8f5e9", 500: "#4caf50", 700: "#388e3c" },
          amber: { 100: "#fff8e1", 500: "#ffc107", 700: "#ffa000" },
          orange: { 100: "#fff3e0", 500: "#ff9800", 700: "#f57c00" },
          brown: { 100: "#efebe9", 500: "#795548", 700: "#5d4037" },
        },
      },
      boxShadow: {
        soft: "0 18px 60px rgba(33, 51, 35, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
