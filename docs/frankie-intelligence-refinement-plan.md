# Frankie Intelligence Refinement Plan

## Purpose

`docs/frankie-eval-loop-design.md` built the measurement system. This plan is what we point that system at next: the ordered list of intelligence gaps worth closing, and how each one gets verified rather than just felt.

"Intelligence" here means the orchestrator's extraction, clarification, and coaching quality (`lib/ai/orchestrator/frankie-orchestrator.ts`, `lib/ai/prompts/*`) — not the new structured workout logger, which is a separate form-based path (see Phase 4).

## Current State (verified 2026-09-02, commit ba0a37c)

- Orchestrator is a single custom function, not a framework: extract via structured OpenAI output, sanitize against message evidence, block on missing `activityType`/`loggedForDate`/`sessionSplit`, otherwise ask a model-generated clarification or produce a coach reply. Rule-based fallback covers missing API key or model errors. Prompt version `frankie-orchestrator-v8` as of this section (see below for the version history through `v10`).
- Scripted suite: 3 benchmark personas (`cardio-happy-path`, `lifting-mixed-path`, `difficult-mixed-path`), 63 isolated user updates. These checks only assert structured extraction shape (activities/diet/wellness/persist plan) — they do not score reply tone, clarification quality, or coaching usefulness.
- The 7 qualitative review checks in the eval design (pillar coverage, log accuracy, date accuracy, assumption discipline, clarification quality, coaching quality, voice/safety) are only exercised through human review in the admin `Evals` UI, not the scripted runner.

## Phase 0 — Unblock measurement (done 2026-09-02)

Nothing else in this plan can be verified until the scripted runner works again.

- ~~Fix `scripts/eval-intelligence.mjs`'s resolve hook~~ — done. The hook only rewrote `@/`-prefixed specifiers; relative directory imports like `lib/chat.ts`'s `../packages/dashboard-core` and extensionless relative imports (e.g. `packages/dashboard-core/index.ts`'s own `./pacific-date`) fell through to Node's native ESM resolver, which supports neither. `resolveExistingPath` now only returns a bare specifier when it's an existing *file* (not a directory), and the hook applies it to all relative specifiers, not just `@/` aliases.
- Suite runs again: initially **62/63** against the live OpenAI API (`gpt-4o-mini`, `orchestrationMode: "model"` throughout — confirms the API key and billing are live), then **63/63** after fixing the one real failure below.
  - `difficult-wed-food` (fixed) — `"Wednesday 2026-05-06 breakfast was skipped, dinner was tacos and beer."` `extractTimeReferenceText` (`lib/chat.ts`) matched the weekday word "Wednesday" before ever checking for an explicit `YYYY-MM-DD` date in the message, so the explicit date was discarded and the locally-synthesized "skipped breakfast" entry (`getSkippedMealEntries` in `frankie-orchestrator.ts`, which has no model-provided date to fall back on) landed on today's real date instead of `2026-05-06`. `resolveLoggedForDateFromTimeReference` already had explicit-date handling — it just never received the text. Fix: added an explicit-date match as the highest-priority case in `extractTimeReferenceText`. Verified 63/63 with no regressions elsewhere.
- 63/63 is now the regression floor for Phase 1+ changes.

## Phase 1 Progress (2026-09-02)

Added a 4th scripted scenario, `messy-input-path` (`lib/evals/intelligence/messy-input-path.ts`, 10 cases: typos, shorthand, blended multi-pillar single sentences, sparse/vague logs, run-ons), targeting the exact gap this phase called out. First run: 8/10 failed. Fixing what it found pulled forward several Phase 2 items rather than waiting:

- **Fixed**: a message containing "then" anywhere (even unrelated to activity, e.g. "meetings ran long and **then** had cereal") triggered the legacy regex fallback parser over the whole message, fabricating an activity from the word "ran". Now gated on the model having already confirmed the message is activity-relevant (`supplementMissingActivityClauses`, `frankie-orchestrator.ts`).
- **Fixed**: wellness check-ins were kept whenever the model supplied any notes text, even with zero detected signals or scores ("felt gret" created an empty-scored wellness row). Notes alone no longer counts as evidence (`sanitizeWellnessCheckin`).
- **Fixed**: numeric score attribution used a flat 16-character window per cue with no clause-internal disambiguation, so "energy 2 sleep bad sore af" credited the "2" to soreness as well as energy. Rewritten as nearest-cue-wins across all signals jointly (`resolveScoreOwnersForClause`).
- **Fixed**: typo'd unit/keyword words ("30 minuets", "lunhc") caused the evidence sanitizer to discard correctly-extracted model values, since it re-verified against the literal raw text. Added a 1-edit-distance fuzzy match (adjacent-transposition tolerant) for duration units and meal-type words.
- **Fixed**: `activityType` could come out duplicated ("rnu rnu", "legs legs workout") from a naive `${activityType} ${description}` concatenation with no overlap check (`extracted-user-update.ts`).
- **Fixed**: `timePrecision` was upgraded from `implicit_today` to `explicit_day` whenever `loggedForDate` was in ISO format — which is always true regardless of phrasing, since the model resolves dates to ISO for relative references too. Replaced with a comparison against the actual current date: only a resolved date other than today is treated as evidence of an explicit reference.
- **Fixed**: a zero-confidence placeholder activity (`activityType: "unknown"`, no real content) emitted alongside a genuine one could still block the genuine activity's persistence via its ambiguity flags. Filtered out before mapping (`isPlaceholderActivity`).
- **Fixed**: `findDietEvidence` checked the entry's time-reference word before its description, so a generic word like "today" appearing in an unrelated clause of a multi-clause run-on would win the evidence match, causing two different entries to collapse onto the same wrong clause (garbled description, one entry silently dropped in the merge). Reordered to check description first, matching how `findActivityEvidence` — its sibling function — already worked.
- **Fixed**: the model double-counting food as both a diet entry and a fake activity (`messy-blended-run-eggs`). This was prompt-level, not sanitizer-level — the extraction prompt already said "do not create activity entries for food-only statements" but the model didn't reliably follow it on terse phrasing. Added a concrete worked example matching the exact failure pattern to `lib/ai/prompts/extract-user-update.ts`. Bumped `FRANKIE_PROMPT_VERSION` to `frankie-orchestrator-v9` for this and the accumulated orchestration fixes above, none of which had bumped it yet.
- **Fixed**: `isPlaceholderActivity` (added above) was too narrow — it only caught placeholders with an empty/"unknown" description too, missing cases like `{activityType: "unknown", description: "rested"}` on "I rested but stretched for 10 minutes" (a real second activity got blocked by the stub's ambiguity flags, same failure shape as the shorthand-legs fix). Rereasoned around `missingFields` (the model's own "I don't have this" signal) instead of the noisy `confidence` field, which turned out to read 0 on fully legitimate activities too. Scoped to only drop a placeholder when a genuine activity already exists alongside it — a lone placeholder still needs to reach the "what activity was it?" clarification, not get silently dropped.

Suite status at that point: 72/73 (63 baseline + 10 messy-input), with the one remaining `difficult-wed-food` failure being the pre-existing baseline fixture's noisy `rawModel.wellnessPresent` flag, not a real defect.

### Multi-turn clarification follow-through (2026-09-02)

Investigated whether the eval runner's single-message-per-case design (never any conversation history) was hiding a real gap, not just a coverage gap. It was: `orchestrateFrankieReply`'s extraction call receives only the current message, never `recentMessages` — by design, per the "extraction stays grounded in the current message" principle — but that means answering Frankie's own clarification question (e.g. "worked out" → *"What type of workout did you do, and when?"* → "running") got extracted in total isolation, with no idea it was an answer, so it triggered a **second, different** clarification question instead of completing the log. Confirmed directly by calling the orchestrator twice in sequence before touching any code. Planned and implemented deliberately narrow, stateful tracking (not blanket context injection, to keep the grounding principle intact — full design in a since-superseded plan file, `magical-drifting-charm.md`):

- New `message_type` enum value `clarification_request` (migration `supabase/migrations/20260902180000_clarification_request_message_type.sql`, `types/database.ts`) so a clarification reply is distinguishable from an ordinary one — previously both were persisted identically as `"chat"`.
- `FrankieOrchestrationResult` gained `assistantMessageType: "clarification_request"` (used on both existing clarification-return branches) and `metadata.pendingClarification: { originalMessage, clarificationQuestion }`.
- `orchestrateFrankieReply` accepts an optional `pendingClarification` input; when present, the extraction call combines only those two labeled lines (the original message, Frankie's question, and the new answer) — not the wider conversation — via a new `isAnsweringClarification` parameter on `buildExtractUserUpdatePrompt`. Everything downstream (sanitizers, blocking checks) is unchanged.
- Both `app/api/chat/route.ts` and `app/api/mobile/chat/route.ts` detect an unresolved `clarification_request` in the immediately preceding message, pass its `pendingClarification` through, and persist it forward on a fresh clarification reply. No state survives more than one hop — an unresolved follow-up just produces a new pending marker, so the mechanism can't chain indefinitely.
- Bumped `FRANKIE_PROMPT_VERSION` to `frankie-orchestrator-v10`.
- New eval scenario `lib/evals/intelligence/clarification-followthrough-path.ts` with a small runner extension (`precedingMessages` on `IntelligenceEvalCase`, chained through `orchestrateFrankieReply` carrying `pendingClarification` forward turn to turn — see `scripts/eval-intelligence.mjs`). Verifies "worked out" → "running" now correctly resolves to a persisted running activity. A second case testing "still needs one more clarification round" was tried and dropped — when neither turn ever names an activity, the model represents "still unresolved" inconsistently across runs (empty array vs. a lone placeholder stub, both legitimate), not stable enough to assert on.
- Along the way, found the placeholder-activity filter (added earlier this session) was keying off the model's `missingFields` self-report, which turned out to be as unreliable as `confidence` — widened it to just the type value (`"unknown"`/blank), scoped to only fire when a genuine sibling activity exists in the same response.

Suite status: **73/74** (63 baseline + 10 messy-input + 1 clarification-followthrough), same one pre-existing noisy-flag failure as before.

**Not yet done**: the migration hasn't been applied against a live database in this session (no local Supabase stack available) — verify with `supabase db reset` or equivalent before relying on it in an environment with real data.

## Phase 1 — Widen eval coverage before tuning further

The three-user suite is saturated (63/63 on today's cases), which mostly proves we're not learning much from it anymore. `docs/frankie-eval-loop-design.md`'s own "Expansion Path" already named the next step; this phase is executing it before writing new prompt logic, so tuning has real failure signal to aim at instead of guesses.

- Add scripted cases (not just admin-UI persona replays) that stress the specific known-weak areas below: typo-heavy input, run-on sentences, shorthand ("legs, 45, hard"), one-detail-at-a-time follow-ups, blended multi-pillar single-sentence messages, sparse/low-context logs.
- Expand from 3 to the remaining 7 seeded accounts (`docs/seed-data-plan.md`), favoring varied goals and writing styles over more happy-path volume.
- Where a scripted assertion can't reasonably check tone or coaching quality, route those cases through the admin `Evals` review flow instead of forcing them into the structured-shape assertions the scripted runner uses today.

## Phase 2 — Close known extraction gaps

Ordered by what's already been named as a repeat pain point in `docs/implementation-backlog.md`'s "Future Refinement Notes" and the cross-cutting "AI and Prompting" section:

1. **Mixed-domain parsing** — one message spanning activity + diet + wellness. Partial support exists (`sanitizeActivities`/`sanitizeDietEntries`/`sanitizeWellnessCheckin` already do evidence-splitting), but this is the most-cited unresolved gap.
2. **Time-aware phrasing** — `yesterday`, `last night`, `this morning` mapped to the wrong `loggedForDate`. Some of this is handled (`resolveLoggedForDateFromTimeReference`); needs eval cases specifically targeting date drift, not just presence of a date.
3. **Messy input** — typos, shorthand, grammatically broken sentences. No dedicated handling currently; likely a prompt-level fix in `lib/ai/prompts/extract-user-update.ts` first, orchestrator-level sanitization second.
4. **Domain-specific vocabulary** — alcohol, hydration, recovery-adjacent language, which currently has no explicit cue lists (compare to the wellness signal cue lists already in `sanitizeWellnessCheckin`).

Each fix should ship with new scripted cases from Phase 1 that fail before and pass after, and must not regress the existing 63.

## Phase 3 — Clarification and assumption discipline

This is check categories 4 and 5 from the eval design, and currently the least-instrumented part of the system since the scripted runner doesn't score reply text.

- Audit `buildBlockingClarificationReply` and the blocking-field set (`activityType`, `loggedForDate`, `sessionSplit`) against real review labels — the eval design explicitly calls out "blocks logging for optional fields" and "sounds like a rigid form" as failure modes to watch for.
- Add a light scripted check for the two things that don't require judging tone: clarification is not asked for a field already present in the message, and the same clarification is not repeated across a short conversation.
- Everything about *tone* of clarification stays in human review — don't try to force voice quality into a scripted assertion.

## Phase 4 — Coaching response quality

Named in the backlog as "reflective coaching responses after logging, not just confirmation" and "cautious cross-signal reasoning." This is the highest-judgment phase and should follow, not precede, Phases 1–3 — coaching quality is hard to evaluate while extraction is still noisy.

- Use `buildCoachResponseUserPrompt` inputs (recent conversation, activities, diet, wellness) to connect signals across pillars — e.g. low sleep/soreness plus a hard session — without overstating certainty, per the existing voice constraint in `docs/frankie-voice-and-ui-decisions.md`.
- This phase lives almost entirely in human review (check 6 and 7), since "was this coaching useful and well-calibrated" isn't a structured-shape assertion.

## Phase 5 — Reconcile chat logging with the new structured workout logger

The latest commit added a form-based workout/P90X logging path (`components/workouts/workout-logger.tsx`, `lib/workouts/get-recent-sessions.ts`) that writes structured sessions outside the chat orchestrator entirely. Before this diverges further:

- Decide whether Frankie's chat coaching context should read workout-logger sessions the same way it reads chat-originated activity logs (it currently reasons from chat-extracted data; unclear if `load-chat-context.ts` sees form-logged sessions too).
- Decide whether chat-based activity logging and the form logger are two front doors to the same data model (probably yes) or two coexisting logging philosophies that need their own UX boundary (probably not, long-term).
- This is a scoping decision, not a tuning task — flag it for a product/architecture call rather than eval iteration.

## How Each Phase Gets Verified

Repeat of the existing eval-loop workflow (`docs/frankie-eval-loop-design.md`), applied per phase:

1. Run the scripted suite (`npm run eval:intelligence`) as a hard regression gate — must hold at 100% on all pre-existing cases.
2. Run the relevant admin `Evals` scenario replay for anything scripted assertions can't score.
3. Label with the existing 7 field-level checks; only promote a phase to "done" when the new failure category it targeted is consistently `Good`.
4. Bump `FRANKIE_PROMPT_VERSION` on any prompt or orchestration change so eval runs stay comparable across tuning passes.

## Sequencing Summary

| Phase | Focus | Verification method |
|---|---|---|
| 0 | Fix broken eval runner | scripted suite runs at all |
| 1 | Widen eval coverage (harder cases, 7 more accounts) | scripted + admin review |
| 2 | Extraction gaps (mixed-domain, time, typos, vocab) | scripted, case-by-case |
| 3 | Clarification/assumption discipline | mostly admin review, thin scripted checks |
| 4 | Coaching response quality | admin review only |
| 5 | Chat vs. structured-logger reconciliation | product decision, not eval |

Do not skip ahead to Phase 4 polish while Phase 0–2 issues are still open — a coaching reply built on shaky extraction is tuning the wrong layer.
