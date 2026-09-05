import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    // Bare "node_modules" only matches the top-level folder, not nested ones (e.g. a git
    // worktree checked out under .claude/worktrees/ brings its own node_modules) — the custom
    // exclude list here replaces vitest's own recursive default rather than extending it, so
    // this has to be explicit and recursive itself.
    exclude: ["**/node_modules/**", "apps/mobile/**", ".next/**", ".claude/worktrees/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Scoped to files that currently have tests, so the percentage reflects what we've
      // actually covered rather than being diluted by the much larger untested app surface
      // (components, routes, Supabase-bound modules). Add a file here when you add its test.
      // Note: every app/api/**/route.ts handler with a co-located route.test.ts (the 4
      // app/api/logs/*/[id]/route.ts handlers, app/api/notifications/route.ts,
      // app/api/notifications/read-all/route.ts, app/api/notifications/[id]/read/route.ts,
      // app/api/programs/[slug]/enroll/route.ts, app/api/workouts/route.ts,
      // app/api/cron/notifications/route.ts) has real, passing tests but is deliberately NOT
      // listed here — @vitest/coverage-v8 drops the coverage entry for any route.ts file that
      // actually executes during a test run (regardless of whether its path has a bracket
      // segment), while an un-executed sibling with the same include pattern still shows up fine
      // as 0%. Confirmed by scoping runs to individual route tests one at a time: whichever
      // route.ts actually ran vanishes from the report entirely instead of showing real coverage,
      // while never-executed included files list normally at 0%. This is a tooling limitation in
      // coverage-v8's handling of this directory shape, not a signal that these files are
      // untested — see their route.test.ts files for the real coverage.
      include: [
        "components/admin/coaching-memory-grid.tsx",
        "components/chat/logged-entry-format.ts",
        "components/chat/quick-start.ts",
        "lib/admin-evals-data.ts",
        "lib/admin.ts",
        "lib/chat.ts",
        "lib/notifications.ts",
        "lib/rate-limit.ts",
        "lib/workouts/save-workout-session.ts",
        "lib/workouts/validation.ts",
        "lib/ai/context/load-chat-context.ts",
        "lib/ai/orchestrator/frankie-orchestrator.ts",
        "lib/ai/prompts/coach-response.ts",
        "lib/ai/prompts/extract-user-update.ts",
        "lib/ai/prompts/personas.ts",
        "lib/ai/run-frankie-turn.ts",
        "lib/ai/schemas/extracted-user-update.ts",
        "lib/ai/tools/log-activity.ts",
        "lib/ai/tools/log-diet.ts",
        "lib/ai/tools/log-lifestyle.ts",
        "lib/ai/tools/log-wellness.ts",
        "lib/ai/tools/shared.ts",
        "lib/ai/tracing/ai-trace-runs.ts",
        "lib/programs/enroll-in-program.ts",
        "lib/programs/get-program-progress.ts",
        "packages/dashboard-core/dashboard.ts",
        "packages/dashboard-core/pacific-date.ts",
        "packages/profile-core/profile-format.ts",
        "packages/workout-core/exercise-catalog.ts"
      ],
      // Set just below the current baseline (as of this commit: ~75% stmts/lines, ~82% funcs,
      // ~65% branches) so CI catches a real regression. This dropped from the prior baseline
      // when lib/chat.ts, lib/notifications.ts, and coaching-memory-grid.tsx were added to the
      // include list above — those files have tests for specific exported helpers, not full-file
      // coverage, so being honest about including them lowered the aggregate. Ratchet these up
      // as coverage improves (see the "test the log-writing layer" roadmap item).
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 78,
        branches: 60
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, ".")
    }
  }
});
