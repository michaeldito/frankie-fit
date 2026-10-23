# Frankie Fit MVP Implementation Backlog

## Purpose

This document translates the MVP architecture, schema, and product design into a practical implementation backlog. It is organized as vertical slices so we can build Frankie Fit in end-to-end pieces instead of isolated technical layers.

## Current Progress Snapshot

Last refreshed October 20, 2026. Replace this snapshot when it drifts rather than appending to it.

Completed in the app:

- project scaffold and infrastructure
- auth and protected app shell
- onboarding and profile persistence
- persistent chat threads and messages
- activity, diet, wellness, and lifestyle logging from chat, all with multi-entry/multi-signal support (lifestyle added as the fourth pillar alongside the original three)
- dashboard summaries backed by real saved data, across all four pillars
- profile editing for core coaching context
- coach persona selection
- workout logging and P90X-style program scheduling, browsing, and enrollment
- notifications v1: schema, a cron-driven nudge job, and daily/weekly coach summaries delivered as in-app notifications
- admin overview with aggregate reporting across tracked accounts
- admin debug view with turn-by-turn Frankie trace inspection
- a full admin evals benchmark-replay system (not just a scaffold): three seeded personas replayed through the real orchestrator, daily/weekly coach-summary generation, a seven-check field-level review rubric, and tuning notes — see `docs/frankie-eval-loop-design.md` for the current-state detail
- a separate local scripted intelligence eval runner (`npm run eval:intelligence`) covering 74 isolated extraction cases across 5 scenarios, with a `--repeat` flag for measuring model flakiness
- browser-local bullet progress for eval message replay so admins are not stuck waiting on one opaque long-running request
- Frankie AI orchestration layer with model-based structured extraction, now consolidated so both web and mobile chat run through the same `runFrankieTurn` path rather than separate implementations
- Frankie trace capture for web and mobile chat turns via `ai_trace_runs`, with rule-based quality checks (pass/warn/fail/skip) stored per trace and surfaced in the admin debug view
- first visual-system pass across the app shell, chat, dashboard, profile, and admin surfaces
- stacked app shell refactor with modal actions, top-right user controls, and a fixed scrollable chat pane
- public landing-page redesign with full-width header sections, calmer spacing, and a more deliberate Tailwind-style hero composition
- LinkedIn/content notes that capture the build story as it evolves
- production and dev-preview deployments on Vercel, with a weekly `Promote dev to production` workflow
- CI-gated test coverage: every PR into `main`/`dev` runs lint, typecheck, `test:coverage`, and build (`.github/workflows/ci.yml`), with coverage thresholds enforced against an explicit, growing include-list (`vitest.config.mts`) — a recent sprint applied this systematically across the log routes, notifications, programs, workouts, cron, all 7 admin/evals routes, and `admin-eval-runner.ts`

Completed in the repo:

- demo seed-data plan and rerunnable seed script for 10 reviewable accounts
- pnpm monorepo layout: web app in `apps/web`, mobile app in `apps/mobile`, shared logic in `packages/*`
- Expo / React Native mobile app in `apps/mobile`, past the scaffold stage
- workspace tooling for web and mobile development from the root repo
- three shared domain packages formalized as pnpm workspace packages and consumed by both web and mobile: `packages/dashboard-core` (dashboard math, Pacific-date helpers), `packages/workout-core` (P90X/program model), `packages/profile-core` (profile formatting) — so this logic no longer lives in two copies
- mobile architecture plan, v1 screen spec, repo structure plan, and UI direction docs
- mobile Supabase auth flow using the same project and profile model as web
- mobile onboarding/profile editor with field parity against the web onboarding flow, including multi-select answers where web supports them
- mobile chat connected to server-side Frankie orchestration through the mobile chat API route, now sharing the same orchestration path as web
- mobile dashboard/profile surfaces backed by real Supabase data across all four pillars
- mobile chat-first drawer shell (hamburger opens Dashboard/Workouts/Profile) and paginated onboarding step flow
- read-only Apple Health development-build spike validated on a connected iPhone for workout and heart-rate preview capability

Now in progress (audited October 20, 2026; `[x]` = shipped, `[ ]` = still open):

- [ ] **Frankie Plan** (next up, P0): time-boxed (1- or 4-week) exercise, diet, and lifestyle plans built in chat, approved by the user, and followed in an in-app Today/Week planner on web and mobile. Spec in #46
- [x] strict workout logging with a draft review flow (#40, in production since October 21)
- [x] family beta readiness: production deploy, real-user account tagging, trace capture, and the admin debug view are all live. Real usage is still low (5 chat turns from 1 account in the last 30 days)
- [ ] push notifications: Expo token registration and cron dispatch are scaffolded, but `apps/mobile` still has no EAS project id, so devices can't get tokens yet (#51)
- [ ] shared-types extraction: `apps/mobile` (6 places) and `packages/dashboard-core` (1) still import `apps/web/types` by relative path (`TODO(Phase 3 / shared-types extraction)`) (#50)
- [ ] Frankie intelligence refinement: mixed-domain and messy-input eval scenarios exist (`difficult-mixed-path`, `messy-input-path`), but the work is ongoing; see Future Refinement Notes
- [ ] open-vocabulary activity understanding (`docs/open-vocabulary-activity-plan.md`): phases 1–2 are done (extraction carries category, missing-field, and ambiguity metadata, and clarification reads it). Phases 3–4 are partial: the regex fallback path is gone, but `frankie-orchestrator.ts` still calls `parseActivityMessage`, `isLikelyDietClause`, and `buildStructuredLogConfirmation`
- [ ] mobile UI/UX refinement after device testing (ongoing)

Paused intentionally:

- Apple Health persistence and import tuning after the real-device spike proved the native path
- a baseline Apple Watch app until the core Frankie intelligence and MVP deployment are stronger

## Current Build Notes

These are worth keeping in mind as we keep building.

- Chat logging runs on the model-driven AI orchestration layer. A handful of the original regex-parser functions (activity clause detection, diet-clause detection, structured log confirmation copy) are still imported and called, but as evidence-grounding/supplemental helpers inside the orchestrator — not as a standby fallback path for when the model is unavailable.
- Frankie logging should follow the contract in `docs/frankie-logging-contract.md`: log clear facts, treat optional detail as optional, and clarify only for core blockers.
- Frankie quality tuning should follow `docs/frankie-eval-loop-design.md`: replay benchmark scenarios, review field-level checks, tune, then compare against prior runs.
- Activity parsing supports multiple activities in one message, but interpretation is still keyword-heavy.
- Diet parsing supports multiple meals or snacks in one message, but mixed-domain sentences can still confuse it.
- Wellness parsing supports multiple signals in one message, but response quality should continue improving as we gather real examples.
- Dashboard summaries in v1 should be computed directly from raw logs first. We do not need `weekly_summaries` to unblock the user experience.
- Frankie insights and `Next best step` guidance are rule-based in v1. This is good enough for momentum, and we can make them smarter later.
- The initial admin overview should lean on privacy-safe aggregate functions and explicit role checks rather than broad raw-table access.
- The current admin overview should include seeded `internal_test` and `synthetic_demo` account usage in aggregate metrics so demos and QA sessions show meaningful product signal.
- Seed data should favor `internal_test` and `synthetic_demo` accounts so admin review stays privacy-safe and demos stay realistic.
- Seeded chat history should stay aligned with structured log rows. For Frankie Fit, fake logs without matching messages will make the product feel less believable.
- The first demo seed pack is intentionally happy-path and complete. Add sparse or messy accounts as a second pack rather than overloading the base dataset.
- The first AI layer is fetch-based and uses the OpenAI Responses API with structured outputs rather than introducing the OpenAI SDK or MCP dependencies too early.
- The activity extraction layer now carries richer metadata like category, session count, missing fields, ambiguity flags, time precision, and confidence. Future clarification logic should prefer those structured fields over activity-name regex whenever possible.
- The app UI is moving toward a stricter "less is more" principle. Keep headers specific, remove repeated helper copy, and let layout and hierarchy do more of the work.
- Chat should keep its own internal transcript scrolling, while dashboard and admin should prefer normal page scrolling. Profile is a special case because its form pairs with a fixed footer action bar.
- The public landing page should stay visually aligned with the product shell: edge-to-edge headers, stronger section breathing room, and fewer cramped stacked blocks.
- A small real-user beta does not need a separate database on day one if account boundaries and debug tooling are explicit. The bigger risk is not shared infrastructure; it is shared data without observability.
- Before inviting family beta users, Frankie Fit should be able to answer what happened on a specific turn: raw message, extracted payload, writes performed, reply produced, and whether the model or fallback path handled the turn.
- The current debug path is trace-row based rather than raw-table browsing. That keeps the first beta support workflow focused on what Frankie saw and did, instead of widening real-user table access too early.
- The first mobile app now lives in `apps/mobile`. Keep sharing schemas, contracts, and backend logic first. Do not try to force the Next.js UI code directly into React Native.
- Mobile chat should keep sensitive Frankie orchestration on trusted backend code. The client should send the Supabase bearer token to the mobile API route rather than holding OpenAI secrets.
- Mobile chat now uses a two-step send flow: save the user message first, then show Frankie's thinking state only after the saved message is ready for the model response.
- Mobile onboarding and profile editing should stay 100% aligned with web field semantics. The save action should say `Finish onboarding` only for first-time onboarding and `Save profile changes` for later edits.
- The current mobile dashboard uses the user-facing `Dashboard` tab label. The route file may still be named `progress` internally until a later rename is worth the churn.
- The mobile wellness trend should show the most recent day first, with Today and Yesterday before older entries.
- The right first native integration path for Apple Watch value is iPhone HealthKit import, not a watchOS app on day one.
- Mobile phase 1 should stay narrow: chat first, lighter dashboard summaries, and basic profile editing. Admin should remain web-only.
- Apple Health should be read-only unless the product direction changes. We are not planning to write workouts or health data back into Apple Health.
- Apple Health and workout heart-rate timeline access will require a development build or production native app. Expo Go is fine for basic app testing, but not enough for HealthKit.
- The first Apple Health spike validated the native build path on a connected iPhone. Supabase persistence and Frankie import tools should wait until chat intelligence and deployment are further along.
- Real-device mobile chat testing needs two local servers: Metro for the native bundle and the Next.js web/API server for `/api/mobile/chat`. A mobile `Network request failed` in chat can simply mean the backend is not running or not reachable from the phone.
- The mobile design language should stay aligned with the web app's calmer blue system, but mobile should show less at once and lean more on sheets, sticky actions, and stronger one-thumb ergonomics.

## Future Refinement Notes

These are not blockers for the current MVP, but they are important follow-up areas. Status as of October 20, 2026:

- [ ] improve mixed-domain parsing when one message includes activity, diet, and wellness together (covered by the `difficult-mixed-path` eval; still imperfect)
- [x] improve time-aware logging for phrases like `yesterday`, `last night`, and `this morning` (`extractTimeReferenceText` / `resolveLoggedForDateFromTimeReference`); no intelligence eval case exercises it yet
- [ ] improve interpretation of typos, shorthand, run-on sentences, and grammatically messy input (covered by the `messy-input-path` eval; ongoing)
- [ ] add stronger handling for alcohol, hydration, and recovery-adjacent context: alcohol and substances are handled by the lifestyle pillar, but hydration has no handling yet (#53)
- [ ] add cautious cross-signal reasoning so Frankie can suggest possible causes without overstating certainty (no prompt rule or eval exists for it yet) (#54)
- [ ] consider moving dashboard summaries to precomputed aggregates only after raw-log rendering becomes a performance or complexity problem (not needed yet)
- [x] redesign activity extraction and clarification so Frankie reasons from activity metadata like category, missing fields, and ambiguity flags instead of a short list of hard-coded activity names
- [x] move to model-based structured extraction with deterministic tool writes
- [x] traceability, eval fixtures, and prompt-version control (see `docs/frankie-eval-loop-design.md`), plus rule-based trace quality checks
- [x] expanded context loading

## Working Principle

Build the smallest complete path first, then expand pillar by pillar.

That means:

- get the app shell working
- get auth and onboarding working
- get one real Frankie workflow working
- then deepen the product in slices

## Recommended Build Order

1. Project scaffold and infrastructure
2. Auth and app shell
3. Onboarding
4. Chat plus activity logging
5. Diet logging
6. Wellness check-ins
7. Dashboard summaries
8. Admin overview
9. Hardening and polish

## Milestone 0: Project Scaffold and Infrastructure

Status: complete.

### Goal

Create the base application and developer workflow.

### Tasks

- [x] initialize Next.js app with App Router and TypeScript
- [x] add Tailwind CSS
- [x] add a lightweight UI layer such as shadcn/ui (custom components instead of shadcn/ui)
- [x] add environment variable loading and validation
- [x] add Supabase client setup for browser and server usage
- [x] create base folder structure:
  - [x] `app/`
  - [x] `components/`
  - [x] `lib/`
  - [x] `types/`
  - [x] `supabase/`
- [x] add linting and formatting setup
- [x] add a basic README development section

### Deliverables

- app runs locally
- environment variables are documented
- repo structure matches the architecture doc

### Definition of Done

- `npm run dev` starts a working app
- marketing homepage route renders
- shared styling and UI primitives are in place

## Milestone 1: Auth and App Shell

Status: complete.

### Goal

Users can sign up, log in, and land in a protected app shell.

### Tasks

- [x] integrate Supabase Auth
- [x] add signup page
- [x] add login page
- [x] add logout flow
- [x] add protected route handling for `/app/*`
- [x] add base authenticated shell with:
  - [x] left nav (superseded by the stacked shell with top-right user controls; mobile uses a chat-first drawer)
  - [x] Chat nav item
  - [x] Dashboard nav item
  - [x] Profile nav item
- [x] add placeholder admin route protection
- [x] load and display basic profile context in the shell

### Deliverables

- auth works end to end
- protected app routes exist
- user sees the shell after login

### Definition of Done

- unauthenticated users are redirected appropriately
- authenticated users can access `/app/chat`
- shell layout matches the wireframe direction

## Milestone 2: Onboarding

Status: complete.

### Goal

New users complete the Frankie onboarding flow and produce a usable profile.

### Tasks

- [x] build onboarding route and UI
- [x] implement Frankie-style onboarding prompts
- [x] persist onboarding fields into `profiles`
- [x] store onboarding completion state
- [x] generate and save onboarding summary
- [x] redirect completed users to Chat
- [x] prevent partially onboarded users from bypassing onboarding

### Deliverables

- onboarding flow works from first login
- profile data is written correctly
- onboarding summary appears in profile or chat context

### Definition of Done

- a new user can sign up and finish onboarding
- `profiles.onboarding_completed` is set
- Chat has access to enough profile context to personalize replies

## Milestone 3: Chat Plus Activity Logging

Status: complete.

### Goal

Users can talk to Frankie, persist conversations, and log activity through chat.

### Tasks

- [x] build Chat screen layout
- [x] create conversation thread creation/loading logic
- [x] create message persistence
- [x] wire chat request to OpenAI-backed Frankie response flow
- [x] implement minimal tool routing for `log_activity`
- [x] extract structured activity logs from user messages
- [x] save activity logs and assistant confirmations
- [x] show quick actions in Chat
- [x] show current goal and compact next-step context

### Deliverables

- working chat with persistent messages
- activity logs written from natural language
- Frankie responds with useful confirmation and guidance

### Definition of Done

- user can type a workout message
- message is saved
- activity log row is created
- Frankie reply is saved and displayed

## Milestone 4: Diet Logging

Status: complete.

### Goal

Users can log food in natural language and get lightweight diet guidance.

### Tasks

- [x] implement `log_diet` backend tool path
- [x] extract diet entries from chat
- [x] save structured diet logs
- [x] add meal logging quick action
- [x] add diet-aware Frankie confirmation copy
- [x] support simple recent diet context in chat replies

### Deliverables

- diet logs persist end to end
- Frankie can recognize and respond to food updates

### Definition of Done

- user can enter a meal update
- structured diet log is saved
- Frankie acknowledges it in product voice
- support multi-meal and snack logging in a single message

## Milestone 5: Wellness Check-Ins

Status: complete.

### Goal

Users can log wellness signals and Frankie can respond with supportive, non-clinical guidance.

### Tasks

- [x] implement `log_wellness_checkin` backend tool path
- [x] support wellness quick action
- [x] capture scores and notes
- [x] persist structured wellness check-ins
- [x] add lightweight daily check-in UI entry point
- [x] support simple follow-up guidance from Frankie

### Deliverables

- wellness logging works
- Frankie can speak to energy, soreness, stress, and recovery trends

### Definition of Done

- user can submit a check-in
- structured row is created
- Frankie responds in the agreed voice and boundaries
- support multiple wellness signals in a single message

## Milestone 6: Dashboard Summaries

Status: complete.

### Goal

Users can view the shared dashboard shell and the three pillar tabs.

### Tasks

- [x] build Dashboard shell
- [x] implement Exercise tab layout
- [x] implement Diet tab layout
- [x] implement Wellness tab layout
- [x] query structured records for each tab
- [x] compute summary metrics server-side
- [x] generate simple Frankie insights
- [x] build compact `Next best step` component
- [x] support low-data empty states
- [x] keep the first dashboard implementation simple by computing summaries from raw logs rather than introducing aggregate tables too early

### Deliverables

- dashboard renders real user data
- tabs reflect actual logs and check-ins
- Frankie insight modules appear in each tab

### Definition of Done

- Exercise, Diet, and Wellness tabs all render
- each tab has:
  - one main summary area
  - recent records
  - one Frankie insight
  - one next action

## Milestone 7: Profile

Status: complete.

### Goal

Users can review and update the context Frankie uses.

### Tasks

- [x] build Profile screen
- [x] display saved onboarding and coaching data
- [x] allow editing of goals, preferences, and check-in settings
- [x] persist profile updates
- [x] make updated profile context available to Frankie

### Deliverables

- editable coaching profile
- Frankie uses updated context in future interactions

### Definition of Done

- user can update profile values
- updates persist and reflect back in the UI

## Milestone 8: Admin Overview

Status: complete except the retention snapshot.

### Goal

Provide the smallest useful admin product-health surface.

### Tasks

- [x] implement admin route protection
- [x] build admin overview page
- [ ] add KPI cards for:
  - [x] active users
  - [x] onboarding completion
  - [ ] retention snapshot (not implemented; the admin overview has active users, onboarding, pillar usage, common requests, friction, and suggestions, but no retention metric) (#48)
  - [x] usage by pillar
- [x] add common request summary
- [x] add friction summary
- [x] add test account access view
- [x] add simple product suggestions view

### Deliverables

- admin can review high-level product health
- admin can inspect test and synthetic accounts safely

### Definition of Done

- non-admins cannot access admin routes
- admin overview renders aggregate metrics
- test account review path exists

## Milestone 9: Hardening and Polish

Status: partially complete. See the open tasks below.

### Goal

Make the MVP more reliable, safer, and cleaner to demo.

### Tasks

- [x] improve error handling in chat flows
- [x] improve loading and empty states
- [x] add audit-friendly admin safeguards
- [ ] review RLS and permissions again after app integration (Supabase security advisor, October 20: 8 `SECURITY DEFINER` functions, including the `admin_*` RPCs and `is_admin`, are executable by `anon` and `authenticated`; 2 functions have a mutable `search_path`; leaked-password protection is off) (#47)
- [ ] add minimal analytics instrumentation (no analytics library or event tracking in the app) (#49)
- [x] add seed/test users for QA
- [ ] add a second seed pack for sparse, messy, or edge-case accounts after the base demo pack is in use (`scripts/seed-data` still only has the happy-path pack) (#52)
- [ ] improve recommendation freshness behavior (no code addresses this yet) (#55)
- [ ] tighten prompt and tool reliability (ongoing)

### Deliverables

- product is more stable
- internal demo flow is smoother
- QA can run against seeded accounts

### Definition of Done

- major user paths are testable end to end
- seeded test accounts exist
- no obvious auth or ownership holes remain

## Cross-Cutting Technical Tasks

These do not belong to only one slice, but should be handled throughout.

### AI and Prompting

- [x] define Frankie system prompt
- [x] define tool-selection prompt strategy
- [x] define structured output formats
- [x] define summary-generation prompts
- [ ] improve Frankie message interpretation for typos, run-on sentences, mixed-domain updates, and grammatically messy user input (ongoing; see Future Refinement Notes)
- [x] improve time-aware understanding for phrases like `yesterday`, `last night`, and `this morning`
- [ ] add better domain-specific recognition for items like alcohol, hydration, and recovery-related context (alcohol is done via the lifestyle pillar; hydration is still open)
- [ ] add cautious cross-signal reasoning so Frankie can suggest possible connections like sleep, stress, alcohol, or recovery affecting energy and motivation without overstating certainty

### Data Utilities

- [ ] add shared TypeScript types for core entities (`apps/web/types/database.ts` exists; extracting it into a shared package for mobile is still open)
- [x] add mapping helpers between DB rows and UI models
- [x] add server-side query helpers by domain

### Permissions

- [x] centralize admin checks
- [x] centralize profile-completion checks
- [x] make test-account review rules explicit in code

### UX Consistency

- keep copy aligned with the Frankie voice doc
- keep dashboard behavior aligned with the wireframes
- keep onboarding aligned with the onboarding flow doc

### Frankie Intelligence Refinement

This should improve over time, not block the MVP. The goal is to make Frankie steadily better at understanding how real people actually type.

- [ ] support messages that blend multiple domains in one sentence
- [ ] handle messy phrasing, shorthand, typos, and run-on updates more gracefully
- [x] improve clarification behavior when user intent is ambiguous
- [x] get better at reflective coaching responses after logging, not just confirmation
- [ ] keep inference language careful when Frankie is connecting patterns across days (no prompt rule or eval yet)

## Suggested Immediate Ticket List

The original starter tickets, all done:

1. [x] Scaffold Next.js app with TypeScript, Tailwind, and base folders
2. [x] Add Supabase project wiring and environment config
3. [x] Create auth pages and protected app shell
4. [x] Apply the initial Supabase migration
5. [x] Build onboarding route and profile persistence
6. [x] Build chat page with thread and message persistence
7. [x] Add first `log_activity` tool flow

## Scope Guardrails

Avoid pulling these in too early:

- food image upload
- voice UI
- advanced analytics
- multi-agent orchestration
- highly customizable dashboards
- social features

### Mobile Follow-On Note

Native mobile is now active in the repo, but the scope should stay tight:

- Expo + React Native
- same Supabase backend
- chat-first mobile scope with dashboard/profile support
- server-side Frankie orchestration through trusted backend routes
- web/mobile onboarding parity
- validate read-only HealthKit before syncing or importing workouts

## Recommended Next Build Artifact

This section described pre-scaffold starting choices (a task board, the app scaffold, Frankie's tool contracts) when the backlog was first written; all of that now exists. The live "next" lists are the unchecked items in "Now in progress", Future Refinement Notes, and Milestone 9. New work and bugs are tracked as GitHub issues, prioritized with `priority:P0`–`P3` labels.
