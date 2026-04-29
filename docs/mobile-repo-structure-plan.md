# Frankie Fit Mobile Repo Structure Plan

## Purpose

This document defines how Frankie Fit should incorporate a future mobile app into the repo without creating unnecessary chaos.

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
2. add `apps/mobile` when you start on the MacBook
3. extract shared packages only where duplication becomes real

This gives you structure without stalling progress.

## Recommended End-State Shape

```text
frankie-fit/
  apps/
    web/
    mobile/
  packages/
    shared/
      domain/
      schemas/
      frankie/
      utils/
  supabase/
  docs/
  package.json
  pnpm-workspace.yaml
```

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
- progress
- profile
- future HealthKit integration

### `packages/shared`

This should contain only things that truly benefit both apps.

Good candidates:

- domain types
- Zod schemas
- Frankie request/response contracts
- extracted-update schemas
- formatting helpers
- date and summary utilities

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

When you are ready to start mobile:

- create `apps/mobile`
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

Extract only the shared pieces that have become painful to duplicate.

Recommended extraction order:

1. `packages/shared/schemas`
2. `packages/shared/domain`
3. `packages/shared/frankie`
4. `packages/shared/utils`

This avoids premature abstraction.

## Shared Package Recommendations

## 1. `packages/shared/schemas`

Purpose:

- keep shared validation contracts in one place

Good contents:

- extracted user update schema
- profile update schema
- log payload schemas
- recommendation payload schemas

This is likely the first package worth extracting.

## 2. `packages/shared/domain`

Purpose:

- keep conceptual types and enums shared between clients

Good contents:

- activity domain types
- diet domain types
- wellness domain types
- recommendation types
- account and profile types

## 3. `packages/shared/frankie`

Purpose:

- keep Frankie contracts and orchestration-facing data shapes aligned

Good contents:

- orchestrator input/output contracts
- message-shaping helpers
- summary helpers
- context formatting helpers

Important note:

The actual server-side OpenAI execution should stay on the trusted backend path, not inside a shared client package.

## 4. `packages/shared/utils`

Purpose:

- hold simple general helpers worth using in both apps

Good contents:

- date formatting
- score normalization
- progress-summary helpers

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

Once the repo becomes a workspace, a practical script shape could be:

```json
{
  "scripts": {
    "dev:web": "pnpm --dir apps/web dev",
    "dev:mobile": "pnpm --dir apps/mobile start",
    "lint:web": "pnpm --dir apps/web lint",
    "lint:mobile": "pnpm --dir apps/mobile lint",
    "build:web": "pnpm --dir apps/web build",
    "seed:demo": "node scripts/seed-demo-data.mjs"
  }
}
```

The exact commands can change, but the principle is:

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
- backend API base URL if needed

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

After this repo structure plan, the strongest next artifacts are:

- `mobile-ui-direction.md`
- or the actual Expo scaffold on the MacBook
