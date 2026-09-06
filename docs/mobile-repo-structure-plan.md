# Frankie Fit Mobile Repo Structure Plan

## Purpose

This document defines how Frankie Fit should incorporate the mobile app into the repo without creating unnecessary chaos.

The goal is to answer:

- where the iPhone app should live
- how much restructuring should happen now versus later
- what should be shared between web and mobile
- what should remain app-specific
- how to protect the current web momentum while adding mobile cleanly

## Direct Recommendation

Frankie Fit should move toward a **workspace-style repo** with:

- one web app
- one mobile app
- shared packages for schemas, contracts, and domain utilities

But it should do that in **phases**, not in one giant refactor.

My recommendation is:

1. keep the current web app stable
2. keep `apps/mobile` as the Expo sibling app
3. extract shared packages only where duplication becomes real

This gives you structure without stalling progress.

## Current Status - September 5, 2026

The repo has moved past the original phase-1 shape described here. Both preconditions this doc set for Phase 2 — "mobile is real enough to justify the reorganization" and "shared-package extraction is starting to matter" — have now been met.

What is in place now:

- root-level Next.js web app remains in place (Phase 2, promoting it into `apps/web`, has not happened yet)
- Expo / React Native app exists at `apps/mobile` with real screens beyond the original scaffold: auth, onboarding, chat, dashboard, profile, and a read-only HealthKit spike
- `pnpm-workspace.yaml` wires the repo as a workspace
- root scripts expose explicit web and mobile commands
- mobile calls trusted backend routes for Frankie orchestration
- local physical-device testing uses both the mobile Metro server and the root Next.js web/API server
- **shared package extraction has started and is real**: `packages/dashboard-core`, `packages/workout-core`, and `packages/profile-core` are formalized pnpm workspace packages (each with its own `package.json`, published under the `@frankie-fit/*` npm scope, consumed by both web and mobile via ordinary bare-specifier imports like `@frankie-fit/dashboard-core`) — see "Recommended End-State Shape" below, which has been updated to reflect the actual structure rather than the kind-based one originally proposed here

This means the repo is now in a phase-2-ready shape: mobile is real, shared-package extraction is proven out, and promoting the web app into `apps/web` (Phase 2) is unblocked whenever it's prioritized — not automatically triggered by this status update, just no longer gated. A detailed, ready-to-execute migration plan for that move exists (produced 2026-09-05); ask for it by referencing this doc's Phase 2 when picking the work back up.

## Recommended End-State Shape

```text
frankie-fit/
  apps/
    web/
    mobile/
  packages/
    dashboard-core/
    workout-core/
    profile-core/
  supabase/
  docs/
  package.json
  pnpm-workspace.yaml
```

Note: the original version of this doc proposed a `packages/shared/{domain,schemas,frankie,utils}` structure, organized *by kind*. What was actually built is organized *by feature* instead — `dashboard-core`, `workout-core`, `profile-core`, each a standalone package under the `@frankie-fit/*` npm scope with its own `package.json` (`main`/`types`/`exports` pointing at `./index.ts`). This tree reflects reality, not the original proposal.

## What This Means In Practice

### `apps/web`

This becomes the current Next.js app.

Responsibilities:

- marketing site
- authenticated web app
- admin experience
- server-side app routes and UI

### `apps/mobile`

This becomes the Expo / React Native iPhone app.

Responsibilities:

- auth
- onboarding
- chat
- dashboard
- profile
- future HealthKit integration

### `packages/*-core`

Each package should contain only things that truly benefit both apps, extracted one feature area at a time rather than grouped under a single `shared/` namespace by kind.

What exists today:

- `packages/dashboard-core` — dashboard aggregation logic, Pacific-date helpers
- `packages/workout-core` — exercise catalog, WOD templates, program workouts/schedules, time formatting
- `packages/profile-core` — profile formatting helpers

Each is a real pnpm workspace package: its own `package.json` under the `@frankie-fit/*` scope, `private: true`, `main`/`types`/`exports` all pointing at `./index.ts`, consumed by both apps via a normal bare-specifier import (e.g. `import { getPacificDateKey } from "@frankie-fit/dashboard-core"`) rather than a relative or `@/`-aliased path. Follow this exact pattern for the next extraction rather than introducing a new organizing scheme.

## What Should Not Be Shared

Do not try to share these early:

- web layout components
- Tailwind-based UI primitives
- React Native UI components
- route files
- app shells
- page-level screen components

The product should be shared. The rendering layer should not.

## Recommended Phased Migration

## Phase 0: Keep Current Repo As-Is

Current reality:

- the Next.js app lives at repo root
- docs and Supabase assets are already working
- AI orchestration and app logic already exist

Do not disrupt that just to "look cleaner."

## Phase 1: Add Mobile With Minimal Repo Movement

Mobile phase 1 has started:

- `apps/mobile` exists
- keep the current web app where it is temporarily
- let mobile prove itself first

At this stage, the repo may look like:

```text
frankie-fit/
  app/
  components/
  lib/
  types/
  docs/
  supabase/
  apps/
    mobile/
```

This is acceptable for a short phase.

Why:

- lower disruption
- faster mobile kickoff
- avoids large path churn in the working web app

## Phase 2: Promote Web Into `apps/web`

After the mobile app exists and the direction is stable:

- move the current Next.js app into `apps/web`
- introduce workspace wiring
- update imports and scripts

Do this only when:

- mobile is real enough to justify the reorganization
- shared-package extraction is starting to matter

## Phase 3: Extract Shared Packages

**Status: underway, but not via the extraction order originally recommended here.** `dashboard-core`, `workout-core`, and `profile-core` already exist (see "What This Means In Practice" above) — extracted by feature area, not by the kind-based `schemas`/`domain`/`frankie`/`utils` split this section originally proposed. That original order is superseded; keep extracting one real, feature-shaped package at a time as duplication actually becomes painful, following the established `@frankie-fit/*-core` pattern rather than reviving the kind-based scheme.

One concrete candidate identified since: `types/database.ts` (the generated Supabase schema type, currently web-app-local) is already reached into by `packages/dashboard-core/dashboard.ts` via a relative import that crosses the app/package boundary — a package depending on an app's internals, which is backwards. A `packages/shared-types`-style extraction (following the same `package.json`/`main`/`types`/`exports` pattern as the existing three packages) would fix this properly. Not urgent, but worth doing before that boundary-crossing import spreads to more call sites.

## Important Note on Server-Side Logic

The actual server-side OpenAI execution should stay on the trusted backend path, not inside a shared client package.

## What Should Stay Server-Side

Even if the repo becomes more shared, these should remain trusted backend concerns:

- OpenAI API calls
- tool routing
- deterministic database writes
- admin permission logic
- service-role operations
- trace logging

The mobile app should consume Frankie intelligence, not own it.

## Recommended Script Structure

The repo is now a workspace. The current root script shape is:

```json
{
  "scripts": {
    "dev:web": "next dev --webpack",
    "dev:mobile": "pnpm --dir apps/mobile start",
    "lint:web": "eslint .",
    "lint:mobile": "pnpm --dir apps/mobile lint",
    "build:web": "next build --webpack",
    "seed:demo": "node scripts/seed-demo-data.mjs"
  }
}
```

The exact commands can keep evolving, but the principle remains:

- web scripts stay explicit
- mobile scripts stay explicit
- shared scripts remain at repo root

## Environment Variable Strategy

## Web

Current web env stays similar:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

## Mobile

Mobile will need a narrower public env set:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_FRANKIE_API_BASE_URL`

Important:

- keep `OPENAI_API_KEY` server-side only
- keep service-role keys server-side only

## Backend Access Recommendation

The cleanest setup is:

- mobile uses Supabase auth directly
- mobile reads its own user-owned data where appropriate
- mobile calls trusted backend routes for Frankie orchestration and sensitive flows

That means the repo structure should support:

- mobile client code
- shared contracts
- stable backend endpoints

## Migration Risks

## 1. Over-refactoring too early

If you restructure the repo before the mobile app exists, you may create churn without clear benefit.

## 2. Under-structuring too long

If mobile becomes real and the repo stays purely web-root forever, duplication and confusion will grow.

## 3. Sharing the wrong layer

Trying to share UI code between web and mobile is the easiest way to slow both apps down.

## 4. Hiding backend complexity in the client

If Frankie orchestration leaks into both clients differently, intelligence behavior will drift.

## Strong Recommendation

The repo should evolve like this:

- current web app stays productive
- mobile gets added beside it
- shared contracts get extracted selectively
- backend intelligence remains centralized

This is the best balance between:

- learning
- speed
- maintainability
- future Apple Health integration

## Suggested Next Step

After the first Expo scaffold, the strongest next repo moves are:

- keep mobile/web behavior in parity while the screens mature
- extract shared schemas only after duplication becomes clearly painful
- validate the HealthKit read-only spike before adding persistence or import tools
