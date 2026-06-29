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
