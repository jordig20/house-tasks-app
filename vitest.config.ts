import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname,
      "server-only": new URL("./test/server-only.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["lib/**/*.test.ts", "app/api/**/*.test.ts"],
  },
});
