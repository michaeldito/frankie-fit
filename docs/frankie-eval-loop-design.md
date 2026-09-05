# Frankie Eval Loop Design

## Purpose

Frankie Fit needs a repeatable way to improve Frankie without guessing from one-off conversations.

The eval loop is the product and engineering system we will use to:

- replay known user scenarios through Frankie
- inspect what Frankie extracted, logged, replied, and summarized
- label what was good or needs work
- tune prompts and orchestration logic
- rerun the same scenarios to verify that Frankie actually improved

This is the bridge between "Frankie feels better" and "Frankie got measurably better."

## Current Implementation Status

As of the first implementation pass, the repo includes:

- an admin `Evals` route at `/app/admin/evals`
- three benchmark scenario fixtures with 7 days and 3 pillar updates per day
- an eval migration for `eval_runs`, `eval_run_items`, `eval_reviews`, and `coach_summaries`
- admin actions for resetting a scenario user, replaying benchmark messages, running summaries, and saving review labels
- a reusable Frankie turn runner that sends benchmark messages through the same orchestrator and tool-writing path as chat
- daily and weekly coach-summary generation grounded in persisted structured logs
- a browser-local bullet progress indicator for message replay, driven by one request per replay step without storing temporary UI progress in the database
- a local scripted intelligence eval runner, `npm run eval:intelligence`, that can run all scripted scenarios or one scenario with `-- --scenario <scenario-id>`
- scripted extraction benchmarks for `cardio-happy-path`, `lifting-mixed-path`, `difficult-mixed-path`, `messy-input-path`, and `clarification-followthrough-path`; the current suite covers 74 isolated user updates. Expect 73/74 to pass consistently — `lifting-wed-walk` can intermittently fail because gpt-4o-mini occasionally hallucinates an unstated activity, which is model non-determinism rather than a regression (there's no temperature/seed pinning on this call)

The next hardening pass should use the same loop to tune multi-pillar messages, daily summaries, weekly summaries, and eventually all seeded accounts.

## Guiding Principles

- Extraction should stay grounded in the current user message.
- Summaries should improve coaching context, not contaminate extraction.
- Frankie should log clear facts immediately and nudge for optional detail.
- Human review should calibrate taste early, then become mostly exception review.
- Eval runs should compare prompt versions and model behavior over time.
- The system should avoid overfitting to only a few exact messages.

## V1 Benchmark Personas

The first suite should use three controlled users before expanding to all seeded accounts.

### Cardio Happy Path

- User: `internal4@frankiefit.com`
- Persona: Chris Alvarez
- Account key: `chris-runner-recovery`
- Pattern: cardio-focused week, healthy diet, positive wellness check-ins
- Expected coaching: acknowledge consistency, cardio momentum, recovery support, and practical next-step progression

### Lifting Mixed Path

- User: `internal3@frankiefit.com`
- Persona: Maya Patel
- Account key: `maya-strength-regular`
- Pattern: lifting-focused week, healthy diet about half the time, mixed positive and negative wellness check-ins
- Expected coaching: acknowledge strength work, spot nutrition consistency gaps, and suggest recovery-aware next steps

### Difficult Mixed Path

- User: `internal5@frankiefit.com`
- Persona: Nina Brooks
- Account key: `nina-hybrid-bodycomp`
- Pattern: multiple activity types, inconsistent diet, mixed positive and negative wellness check-ins
- Expected coaching: simplify the pattern, avoid judgment, identify likely friction, and recommend a small stabilizing next step

## Seed Shape

Each benchmark user should receive one week of messages.

For each of 7 days:

- one activity or exercise update
- one diet update
- one wellness update

That creates:

- 21 user updates per benchmark user
- 63 user updates across the first three-user suite

The benchmark runner should send these messages through the real Frankie orchestration path instead of directly inserting logs. Direct database inserts can be useful for demos, but they do not test Frankie's intelligence.

## Expected Outputs

Each run should capture:

- eval run id
- scenario id
- user id and account key
- prompt version
- model name
- input message
- Frankie reply
- extracted payload
- persisted activity, diet, and wellness logs
- trace id
- daily summaries
- weekly summary
- reviewer labels and notes

## Daily And Weekly Summaries

Daily summaries are short-term coaching memory.

They should answer:

- what happened today
- what signal matters for tomorrow
- what data was missing or thin
- what next step is reasonable

Weekly summaries are medium-term coaching memory.

They should answer:

- what pattern showed up this week
- what supported consistency
- what created friction
- what to focus on next week

Daily and weekly summaries should be generated from structured logs, not raw chat guesses. They can include raw chat snippets for context later, but the first source of truth should be persisted activity, diet, and wellness data.

## Field-Level Review Checks

Each eval item should use the same seven checks.

Review status should stay simple:

- `Good`
- `Needs Work`
- `N/A`

Severity is intentionally excluded in v1. If something needs work, it enters the improvement queue. Priority can be inferred later from frequency, issue tags, and product risk.

### 1. Pillar Coverage

Did Frankie correctly recognize which pillars were present?

Examples of needs-work behavior:

- misses diet when food is mentioned
- turns a drink into an activity
- ignores wellness signals
- creates a pillar the user did not mention

### 2. Structured Log Accuracy

Did Frankie log the facts the user actually gave?

Examples of needs-work behavior:

- wrong activity
- missed explicit duration
- duplicated logs
- skipped a clear food or drink
- dropped explicit wellness context

### 3. Date And Timing Accuracy

Did Frankie assign dates and timing correctly?

Examples of needs-work behavior:

- Monday becomes Saturday
- yesterday maps to the wrong date
- a food entry gets attached to the wrong day
- a weekly update is flattened into one incorrect date

### 4. Assumption Discipline

Did Frankie avoid inventing missing details?

Examples of needs-work behavior:

- assumes intensity
- assumes meal type
- assumes duration
- assumes activity type from profile context
- turns vague text into over-specific structured data

### 5. Clarification And Nudge Quality

Did Frankie ask for the right amount of extra information?

Examples of needs-work behavior:

- blocks logging for optional fields
- asks for information already provided
- repeats the same clarification
- sounds like a rigid form instead of a coach

### 6. Coaching And Context Quality

Was Frankie's advice useful, specific, and based on the right context?

Examples of needs-work behavior:

- generic encouragement only
- ignores relevant recent logs
- overuses context in a way that changes extraction
- misses obvious coaching connections like sleep, alcohol, soreness, or low motivation

### 7. Voice, Safety, And Product Fit

Did Frankie sound like Frankie?

Examples of needs-work behavior:

- robotic
- corporate
- too verbose
- judgmental
- too clinical
- overconfident medical claims

## Review Notes

Field-level reviews can capture:

- status
- issue tags
- field note
- expected behavior
- actual behavior
- reviewer id
- reviewed at

Expected behavior is especially valuable because it turns a failed example into future tuning material.

## V1 Issue Tags

Start with a small tag vocabulary:

- `missed_pillar`
- `extra_pillar`
- `wrong_log`
- `missing_explicit_detail`
- `duplicate_log`
- `wrong_date`
- `invented_detail`
- `bad_clarification`
- `repeated_clarification`
- `too_rigid`
- `generic_coaching`
- `context_confusion`
- `tone_miss`
- `safety_boundary`

Add tags only when repeated review pain proves they are useful.

## Admin UX

Add a dedicated admin sidebar tab:

- `Evals`

Keep `Debug` focused on individual chat trace inspection.

Use `Evals` for scenario-level quality review:

- select benchmark scenario
- reset benchmark user
- seed the week through Frankie
- run daily summaries
- run weekly summary
- review expected versus actual behavior
- label field-level checks
- jump to trace details when needed

Recommended page sections:

- scenario cards
- eval run actions
- review checklist
- issue tags
- summary evals
- recent runs

## Future Data Model

The first UI can be static while the contract settles. The database-backed version should likely add these tables.

### `eval_runs`

Stores one replay of a scenario suite.

Useful fields:

- `id`
- `name`
- `scenario_id`
- `status`
- `model_name`
- `prompt_version`
- `started_at`
- `completed_at`
- `created_by`

### `eval_run_items`

Stores each benchmark message and its actual outcome.

Useful fields:

- `id`
- `eval_run_id`
- `scenario_id`
- `user_id`
- `input_message`
- `expected_json`
- `trace_id`
- `assistant_reply`
- `actual_json`
- `created_at`

### `eval_reviews`

Stores human labels from the admin review UI.

Useful fields:

- `id`
- `eval_run_item_id`
- `review_check`
- `status`
- `issue_tags`
- `field_note`
- `expected_behavior`
- `actual_behavior`
- `reviewed_by`
- `reviewed_at`

### `coach_summaries`

Stores daily and weekly coaching memory.

Useful fields:

- `id`
- `user_id`
- `summary_type`
- `period_start`
- `period_end`
- `summary_text`
- `structured_metrics_json`
- `model_name`
- `prompt_version`
- `source_json`
- `created_at`

This could eventually replace or sit beside the current `weekly_summaries` table.

## Iteration Workflow

The expected improvement loop is:

1. Reset scenario users.
2. Run the benchmark suite.
3. Review automated diffs and selected traces.
4. Label examples as `Good`, `Needs Work`, or `N/A`.
5. Identify the highest-frequency failure patterns.
6. Tune prompts, schemas, or orchestration logic.
7. Run the suite again.
8. Compare against the prior run.

Ten runs is feasible if the runner stores evidence and reviews. The goal is not to run ten times blindly. The goal is to make each run answer: did Frankie get better, or only different?

## Expansion Path

After the first three scenarios are trustworthy, expand the eval suite to all 10 seeded accounts.

That broader regression suite should add:

- varied goals
- varied writing styles
- typo-heavy updates
- run-on sentences
- one-detail-at-a-time follow-ups
- blended multi-pillar updates
- sparse logs
- high-context coaching moments

The three-user suite teaches us what good looks like. The ten-user suite helps prevent overfitting.
