---
name: eval-loop-maintenance
description: How to run frankie-fit's intelligence eval suite (npm run eval:intelligence), tell a real regression apart from a stale hardcoded-date fixture, and keep docs/frankie-eval-loop-design.md's case count and pass rate honest. Use this whenever you run the eval suite, add or edit a fixture under lib/evals/intelligence, or see an eval failure and need to judge whether it's a real bug.
---

# Eval loop maintenance (frankie-fit)

The intelligence eval suite is the main regression check for the AI extraction/orchestration pipeline, but it has two maintenance traps that have already bitten this repo once: fixtures that hardcode "today" as a literal date, and a design doc whose reported case count silently falls behind as fixtures get added.

## Running the suite

```bash
npm run eval:intelligence
```

Add `-- --scenario <scenario-id>` to run a single scenario instead of the full suite. The runner (`scripts/eval-intelligence.mjs`) stubs the Supabase/profile boundary with fixtures under `scripts/eval-stubs/` so it can run without a real database, then dynamically imports the case arrays from `lib/evals/intelligence/*.ts` and compares actual vs. expected via `lib/evals/intelligence/compare.ts`. Add `-- --repeat N` (requires `--case` or `--scenario`) to re-run a specific case N times and measure its live pass rate instead of a single result.

## Diagnosing a failure: real regression vs. stale fixture

Before treating an eval failure as a bug in the orchestrator or extraction prompt, check whether the fixture itself is the problem. Some of the older fixture files hardcode a literal date string (e.g. `"2026-05-04"`) to represent "today" in the scenario. That works fine on the day it's written, but once real time moves past that date, the fixture's expected value and the extractor's actual resolved "today" diverge — the case then fails because time passed, not because anything regressed.

Newer fixtures avoid this by computing the date at import time instead:

```ts
// Computed at run time (rather than hardcoded) so implicit_today cases never go stale as real
// dates move forward — this must match the same Pacific-date logic the extraction prompt uses
// to tell the model what "today" is (see buildExtractUserUpdatePrompt).
const TODAY = getPacificDateKey();
```

If you're adding a new date-dependent case, use this pattern (`getPacificDateKey()` from `packages/dashboard-core/pacific-date.ts`) rather than a literal date string — it's what keeps the fixture's expectation in sync with the extractor's own notion of "today," regardless of when the suite runs. If an *existing* hardcoded-date fixture starts failing purely because of elapsed time, that's a sign to migrate it to the dynamic pattern rather than just bumping the literal date another few months forward.

## Distinguishing a real regression from a known flake

Some eval failures are genuine model non-determinism rather than a regression. Use `--repeat N` (10 is a reasonable sample size) before concluding an unexpected failure is a real bug:

```bash
npm run eval:intelligence -- --case lifting-wed-walk --repeat 10
```

- A consistent N/N failure (0% pass rate) across repeats is a real bug — investigate the extraction prompt or orchestrator logic.
- A partial pass rate (neither 0% nor 100%) indicates non-determinism in the model call itself, not a code regression. `--repeat` reports this rate and always exits 0 — it's a diagnostic tool, not a pass/fail gate, so it won't fail CI on its own.

`lifting-mixed-path`'s `lifting-wed-walk` case (`lib/evals/intelligence/lifting-mixed-path.ts`) is the known calibration example: gpt-4o-mini occasionally hallucinates a second, unstated activity from a single-activity message, and there's no temperature/seed pinning on this extraction call to eliminate it. Use its observed `--repeat` pass rate as a rough baseline for judging whether a *different* case's partial pass rate is similarly benign non-determinism or actually concerning.

## Keeping the design doc honest

`docs/frankie-eval-loop-design.md` reports a case count and pass rate for the suite. That number is a snapshot, not something that updates itself — every time a fixture file is added, removed, or changed, the real count can drift away from what the doc claims without anyone noticing until someone happens to compare them.

To check: count the case entries across every file in `lib/evals/intelligence/*.ts` (each scenario file exports an array of cases — count array entries, don't guess from file names), and compare that live total against what the design doc currently states. If they've diverged, update the doc's figure rather than leaving it stale — don't just note the discrepancy and move on. This is exactly the kind of drift that's cheap to catch right after adding a fixture and easy to miss for months otherwise.
