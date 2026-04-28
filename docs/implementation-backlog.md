# Frankie Fit MVP Implementation Backlog

## Purpose

This document translates the MVP architecture, schema, and product design into a practical implementation backlog. It is organized as vertical slices so we can build Frankie Fit in end-to-end pieces instead of isolated technical layers.

## Current Progress Snapshot

As of April 27, 2026, the project has moved well beyond the planning-only stage.

Completed in the app:

- project scaffold and infrastructure
- auth and protected app shell
- onboarding and profile persistence
- persistent chat threads and messages
- activity logging from chat
- diet logging from chat with multi-entry support
- wellness check-ins from chat with multi-signal support
- dashboard summaries backed by real saved data
- profile editing for core coaching context
- admin overview with aggregate reporting across tracked accounts
- first-pass Frankie AI orchestration layer with model extraction and response fallbacks
- first visual-system pass across the app shell, chat, dashboard, profile, and admin surfaces
- stacked app shell refactor with modal actions, top-right user controls, and a fixed scrollable chat pane
- public landing-page redesign with full-width header sections, calmer spacing, and a more deliberate Tailwind-style hero composition
- LinkedIn/content notes that capture the build story as it evolves

Completed in the repo:

- demo seed-data plan and rerunnable seed script for 10 reviewable accounts

Now in progress:

- Frankie intelligence refinement
- deeper AI-native migration beyond the first orchestration layer
- lightweight AI observability, evals, and traceability around the new model-backed flow

## Current Build Notes

These are worth keeping in mind as we keep building.

- Chat logging now has a first-pass AI orchestration layer, but the regex parser still exists as an intentional fallback while we harden the model-driven path.
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
- The app UI is moving toward a stricter "less is more" principle. Keep headers specific, remove repeated helper copy, and let layout and hierarchy do more of the work.
- Chat should keep its own internal transcript scrolling, while dashboard and admin should prefer normal page scrolling. Profile is a special case because its form pairs with a fixed footer action bar.
- The public landing page should stay visually aligned with the product shell: edge-to-edge headers, stronger section breathing room, and fewer cramped stacked blocks.

## Future Refinement Notes

These are not blockers for the current MVP, but they are important follow-up areas.

- improve mixed-domain parsing when one message includes activity, diet, and wellness together
- improve time-aware logging for phrases like `yesterday`, `last night`, and `this morning`
- improve interpretation of typos, shorthand, run-on sentences, and grammatically messy input
- add stronger handling for alcohol, hydration, and recovery-adjacent context
- add cautious cross-signal reasoning so Frankie can suggest possible causes without overstating certainty
- consider moving dashboard summaries to precomputed aggregates only after raw-log rendering becomes a performance or complexity problem
- move Frankie from regex-first parsing to model-based structured extraction with deterministic tool writes
- add traceability, eval fixtures, and prompt/version control before calling the app fully AI-native
- expand context loading, add time-aware extraction, and introduce eval coverage before removing the fallback parser

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

### Goal

Create the base application and developer workflow.

### Tasks

- initialize Next.js app with App Router and TypeScript
- add Tailwind CSS
- add a lightweight UI layer such as shadcn/ui
- add environment variable loading and validation
- add Supabase client setup for browser and server usage
- create base folder structure:
  - `app/`
  - `components/`
  - `lib/`
  - `types/`
  - `supabase/`
- add linting and formatting setup
- add a basic README development section

### Deliverables

- app runs locally
- environment variables are documented
- repo structure matches the architecture doc

### Definition of Done

- `npm run dev` starts a working app
- marketing homepage route renders
- shared styling and UI primitives are in place

## Milestone 1: Auth and App Shell

### Goal

Users can sign up, log in, and land in a protected app shell.

### Tasks

- integrate Supabase Auth
- add signup page
- add login page
- add logout flow
- add protected route handling for `/app/*`
- add base authenticated shell with:
  - left nav
  - Chat nav item
  - Dashboard nav item
  - Profile nav item
- add placeholder admin route protection
- load and display basic profile context in the shell

### Deliverables

- auth works end to end
- protected app routes exist
- user sees the shell after login

### Definition of Done

- unauthenticated users are redirected appropriately
- authenticated users can access `/app/chat`
- shell layout matches the wireframe direction

## Milestone 2: Onboarding

### Goal

New users complete the Frankie onboarding flow and produce a usable profile.

### Tasks

- build onboarding route and UI
- implement Frankie-style onboarding prompts
- persist onboarding fields into `profiles`
- store onboarding completion state
- generate and save onboarding summary
- redirect completed users to Chat
- prevent partially onboarded users from bypassing onboarding

### Deliverables

- onboarding flow works from first login
- profile data is written correctly
- onboarding summary appears in profile or chat context

### Definition of Done

- a new user can sign up and finish onboarding
- `profiles.onboarding_completed` is set
- Chat has access to enough profile context to personalize replies

## Milestone 3: Chat Plus Activity Logging

### Goal

Users can talk to Frankie, persist conversations, and log activity through chat.

### Tasks

- build Chat screen layout
- create conversation thread creation/loading logic
- create message persistence
- wire chat request to OpenAI-backed Frankie response flow
- implement minimal tool routing for `log_activity`
- extract structured activity logs from user messages
- save activity logs and assistant confirmations
- show quick actions in Chat
- show current goal and compact next-step context

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

### Goal

Users can log food in natural language and get lightweight diet guidance.

### Tasks

- implement `log_diet` backend tool path
- extract diet entries from chat
- save structured diet logs
- add meal logging quick action
- add diet-aware Frankie confirmation copy
- support simple recent diet context in chat replies

### Deliverables

- diet logs persist end to end
- Frankie can recognize and respond to food updates

### Definition of Done

- user can enter a meal update
- structured diet log is saved
- Frankie acknowledges it in product voice
- support multi-meal and snack logging in a single message

## Milestone 5: Wellness Check-Ins

### Goal

Users can log wellness signals and Frankie can respond with supportive, non-clinical guidance.

### Tasks

- implement `log_wellness_checkin` backend tool path
- support wellness quick action
- capture scores and notes
- persist structured wellness check-ins
- add lightweight daily check-in UI entry point
- support simple follow-up guidance from Frankie

### Deliverables

- wellness logging works
- Frankie can speak to energy, soreness, stress, and recovery trends

### Definition of Done

- user can submit a check-in
- structured row is created
- Frankie responds in the agreed voice and boundaries
- support multiple wellness signals in a single message

## Milestone 6: Dashboard Summaries

### Goal

Users can view the shared dashboard shell and the three pillar tabs.

### Tasks

- build Dashboard shell
- implement Exercise tab layout
- implement Diet tab layout
- implement Wellness tab layout
- query structured records for each tab
- compute summary metrics server-side
- generate simple Frankie insights
- build compact `Next best step` component
- support low-data empty states
- keep the first dashboard implementation simple by computing summaries from raw logs rather than introducing aggregate tables too early

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

### Goal

Users can review and update the context Frankie uses.

### Tasks

- build Profile screen
- display saved onboarding and coaching data
- allow editing of goals, preferences, and check-in settings
- persist profile updates
- make updated profile context available to Frankie

### Deliverables

- editable coaching profile
- Frankie uses updated context in future interactions

### Definition of Done

- user can update profile values
- updates persist and reflect back in the UI

## Milestone 8: Admin Overview

### Goal

Provide the smallest useful admin product-health surface.

### Tasks

- implement admin route protection
- build admin overview page
- add KPI cards for:
  - active users
  - onboarding completion
  - retention snapshot
  - usage by pillar
- add common request summary
- add friction summary
- add test account access view
- add simple product suggestions view

### Deliverables

- admin can review high-level product health
- admin can inspect test and synthetic accounts safely

### Definition of Done

- non-admins cannot access admin routes
- admin overview renders aggregate metrics
- test account review path exists

## Milestone 9: Hardening and Polish

### Goal

Make the MVP more reliable, safer, and cleaner to demo.

### Tasks

- improve error handling in chat flows
- improve loading and empty states
- add audit-friendly admin safeguards
- review RLS and permissions again after app integration
- add minimal analytics instrumentation
- add seed/test users for QA
- add a second seed pack for sparse, messy, or edge-case accounts after the base demo pack is in use
- improve recommendation freshness behavior
- tighten prompt and tool reliability

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

- define Frankie system prompt
- define tool-selection prompt strategy
- define structured output formats
- define summary-generation prompts
- improve Frankie message interpretation for typos, run-on sentences, mixed-domain updates, and grammatically messy user input
- improve time-aware understanding for phrases like `yesterday`, `last night`, and `this morning`
- add better domain-specific recognition for items like alcohol, hydration, and recovery-related context
- add cautious cross-signal reasoning so Frankie can suggest possible connections like sleep, stress, alcohol, or recovery affecting energy and motivation without overstating certainty

### Data Utilities

- add shared TypeScript types for core entities
- add mapping helpers between DB rows and UI models
- add server-side query helpers by domain

### Permissions

- centralize admin checks
- centralize profile-completion checks
- make test-account review rules explicit in code

### UX Consistency

- keep copy aligned with the Frankie voice doc
- keep dashboard behavior aligned with the wireframes
- keep onboarding aligned with the onboarding flow doc

### Frankie Intelligence Refinement

This should improve over time, not block the MVP. The goal is to make Frankie steadily better at understanding how real people actually type.

- support messages that blend multiple domains in one sentence
- handle messy phrasing, shorthand, typos, and run-on updates more gracefully
- improve clarification behavior when user intent is ambiguous
- get better at reflective coaching responses after logging, not just confirmation
- keep inference language careful when Frankie is connecting patterns across days

## Suggested Immediate Ticket List

If we want the next truly actionable set of tasks, I would start here:

1. Scaffold Next.js app with TypeScript, Tailwind, and base folders
2. Add Supabase project wiring and environment config
3. Create auth pages and protected app shell
4. Apply the initial Supabase migration
5. Build onboarding route and profile persistence
6. Build chat page with thread and message persistence
7. Add first `log_activity` tool flow

## Scope Guardrails

Avoid pulling these in too early:

- food image upload
- voice UI
- native mobile app
- advanced analytics
- multi-agent orchestration
- highly customizable dashboards
- social features

## Recommended Next Build Artifact

The next strongest artifact after this backlog would be one of:

- a task board broken into tickets
- the actual app scaffold
- prompt and tool contract definitions for Frankie
