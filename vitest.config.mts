import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", "apps/mobile", ".next"]
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, ".")
    }
  }
});
