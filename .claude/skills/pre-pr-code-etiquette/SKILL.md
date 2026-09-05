---
name: pre-pr-code-etiquette
description: Self-review checklist matching frankie-fit's established coding conventions before opening a PR — no speculative abstractions, Supabase-client-as-parameter, shared Pacific-date helpers, and evidence-grounding AI-extracted claims. Use this as a final pass before opening a PR or whenever writing new logic that touches the database, dates, or AI-extracted user data, so new code matches the codebase's own best examples instead of drifting from them.
---

# Pre-PR code etiquette (frankie-fit)

These are conventions this codebase already follows in its best code — not new rules, just ones worth checking against deliberately before a PR goes up, since it's easy to drift from an established pattern without noticing when writing something new in isolation.

## No speculative abstractions

AGENTS.md states it directly: build what the current task needs, not what a hypothetical future task might need. Three similar lines of code across call sites is fine; don't extract a helper, config object, or plugin system for a pattern that's only shown up once or twice. If you notice yourself designing for a case nobody has asked for yet, that's the signal to stop and simplify.

## Supabase client as a parameter

Functions that touch the database should accept a `SupabaseClient<Database>` as a parameter rather than constructing their own client internally. `lib/programs/enroll-in-program.ts` shows the pattern — the function takes the client as an argument instead of importing a client-construction helper and calling it itself. This keeps the function usable from any calling context (a server route, a test with a mocked client, a script) without it needing to know which kind of client it's supposed to build.

## Use the shared Pacific-date helpers

Frankie Fit's date logic is deliberately centralized in `packages/dashboard-core/pacific-date.ts` (`getPacificDateKey` and related helpers), because the app's user-facing "today" needs to consistently mean Pacific time regardless of server or client timezone. Don't reach for ad hoc `Date` math or `toISOString().slice(0, 10)`-style shortcuts for anything user-facing — those silently break the Pacific-date assumption the rest of the app relies on. Use the existing helper instead, even for a one-off date calculation.

## Evidence-ground AI-extracted claims

Anything an AI extraction step pulls out of a user's message — a diet entry, an activity, a wellness note, a lifestyle log — needs to be checked against the raw user message before it's trusted and persisted, the way `frankie-orchestrator.ts`'s sanitizer functions do (deduping, filtering empty descriptions, discarding entries that don't actually trace back to something the user said). An LLM extraction step can hallucinate or over-infer; grounding the extracted claim against the source text is what keeps a false extraction from silently becoming a logged fact in someone's data.
