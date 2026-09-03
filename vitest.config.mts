import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", "apps/mobile", ".next"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Scoped to files that currently have tests, so the percentage reflects what we've
      // actually covered rather than being diluted by the much larger untested app surface
      // (components, routes, Supabase-bound modules). Add a file here when you add its test.
      include: [
        "lib/admin.ts",
        "lib/rate-limit.ts",
        "lib/workouts/validation.ts",
        "lib/ai/context/load-chat-context.ts",
        "lib/ai/orchestrator/frankie-orchestrator.ts",
        "lib/ai/prompts/coach-response.ts",
        "lib/ai/prompts/extract-user-update.ts",
        "lib/ai/schemas/extracted-user-update.ts",
        "lib/ai/tools/shared.ts",
        "lib/programs/enroll-in-program.ts",
        "lib/programs/get-program-progress.ts",
        "packages/dashboard-core/dashboard.ts",
        "packages/dashboard-core/pacific-date.ts",
        "packages/workout-core/exercise-catalog.ts"
      ],
      // Set just below the current baseline (as of this commit: ~70% stmts/lines, ~75% funcs,
      // ~59% branches) so CI catches a real regression without blocking on frankie-orchestrator.ts's
      // many still-untested internal branches. Ratchet these up as coverage there improves.
      thresholds: {
        lines: 65,
        statements: 65,
        functions: 70,
        branches: 55
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, ".")
    }
  }
});
