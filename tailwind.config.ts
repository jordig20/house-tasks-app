import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
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
      },
      boxShadow: {
        soft: "0 18px 60px rgba(33, 51, 35, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
