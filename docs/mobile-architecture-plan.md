# Frankie Fit Mobile Architecture Plan

## Purpose

This document maps Frankie Fit from a web-first product into a realistic iPhone companion app plan.

The goal is not to force the current Next.js app into iOS.

The goal is to answer:

- what should be reused
- what should be rebuilt natively
- what the first mobile scope should be
- how Apple Health and Apple Watch fit later
- how to keep the repo maintainable while supporting both web and mobile

## Direct Recommendation

Frankie Fit should grow into mobile as a **sibling native client**, not as a direct port of the existing web UI.

Recommended direction:

- keep the current web app
- add a new iPhone app using Expo and React Native
- share product logic, schemas, domain contracts, and Frankie orchestration inputs where it makes sense
- rebuild the visual layer natively for mobile

This gives the project:

- a better iPhone experience
- a clean path to Apple Health integration
- less UI compromise than trying to force web layouts into a native shell
- more code reuse than building the mobile app as a completely separate system

## Why Mobile Makes Sense For Frankie Fit

Frankie Fit is already well-shaped for iPhone because the product is centered around:

- chat
- lightweight logging
- fast check-ins
- short dashboard summaries
- profile context

Those behaviors fit mobile naturally.

The product also becomes more valuable on iPhone because that is the right place to eventually support:

- Apple Health
- Apple Watch workout import
- push reminders
- lock-screen or widget-style future surfaces

## Direct Answer On Reuse

## What We Can Reuse Well

- Supabase project and database schema
- auth model and user roles
- Frankie orchestration concepts
- OpenAI prompt and extraction contracts
- Zod schemas and shared types
- domain concepts for activity, diet, wellness, and recommendations
- summary shaping logic
- copy, onboarding decisions, voice, and product structure
- admin and product data model on the backend

## What We Should Not Try To Reuse Literally

- Next.js page files
- Tailwind web layouts
- DOM-specific components
- browser-only interactions
- current app shell structure as code

The mobile app should feel like the same product, not the same markup.

## Official Constraint Notes

The mobile recommendation here is based on the official platform realities:

- Expo Router supports file-based routing for native and web apps
- Expo supports monorepos and workspaces
- React Native styling is JavaScript-style driven, not browser CSS

References:

- [Expo Router introduction](https://docs.expo.dev/router/introduction/)
- [Expo file-based routing](https://docs.expo.dev/develop/file-based-routing/)
- [Expo monorepos](https://docs.expo.dev/guides/monorepos/)
- [React Native styling](https://reactnative.dev/docs/style)

## Recommended Repo Shape

The current repo can evolve into a workspace-based monorepo.

Suggested shape:

```text
frankie-fit/
  apps/
    web/
      ...current Next.js app
    mobile/
      ...new Expo app
  packages/
    shared/
      domain types
      zod schemas
      Frankie contracts
      prompt helpers
      formatting and summary helpers
    ui-web/
      optional shared web-only primitives later
    backend/
      optional shared server logic later
  supabase/
  docs/
```

## Practical Migration Note

We do not need to convert the repo into a monorepo immediately.

Two reasonable paths:

### Option A: Start Cleanly With Monorepo First

Best if:

- you want long-term structure early
- you expect mobile to become a real parallel track soon

### Option B: Build A Separate `mobile/` App First, Then Extract Shared Packages

Best if:

- you want to learn fast
- you want to avoid restructuring the current web project too early

My recommendation:

- start with `apps/mobile` soon
- extract shared packages only when duplication becomes real

That keeps momentum high.

## Recommended Mobile Stack

## App Framework

- Expo
- React Native
- TypeScript
- Expo Router

## Backend

- same Supabase project
- same database
- same auth concepts

## AI Layer

- reuse Frankie orchestration concepts
- likely call the same backend endpoints or shared server-side logic
- do not move sensitive model orchestration fully onto the client

## Native Integrations Later

- HealthKit
- push notifications
- secure local storage
- Apple sign-in if desired

## Product Surface Recommendation

The iPhone app should not try to mirror every web screen one-for-one.

Recommended mobile navigation:

- `Chat`
- `Progress`
- `Profile`

Optional later:

- `Plan`
- `Settings`

The default home should still be `Chat`.

## Mobile Information Architecture

## 1. Chat

This should be the center of the iPhone app.

Responsibilities:

- default landing screen after login
- message Frankie naturally
- log activity, diet, and wellness
- show compact next-step context
- support future workout import prompts

This is the strongest shared experience between web and mobile.

## 2. Progress

This is the mobile form of the dashboard.

It should be lighter than the desktop dashboard:

- summary cards
- recent logs
- one insight per pillar
- one next step

Recommended structure:

- segmented control or tabs for `Exercise`, `Diet`, `Wellness`
- fewer dense comparison blocks
- more vertical flow

## 3. Profile

This should remain editable, but simplified for mobile:

- primary goal
- coaching style
- activity preferences
- diet preferences
- wellness preferences

The bottom anchored save pattern you already like on the web will translate well to mobile.

## 4. Admin

Do not bring the full admin experience to mobile in the first pass.

Recommendation:

- keep admin web-only for now
- optionally allow a tiny read-only founder snapshot later

## Recommended Mobile-First Scope

The first iPhone version should be intentionally narrow.

## Mobile Phase 1

- login / signup
- onboarding
- chat
- activity logging
- diet logging
- wellness logging
- basic profile editing

This is enough to make Frankie Fit feel real on iPhone.

## Mobile Phase 2

- progress screen
- better summary cards
- recommendation surfaces
- improved profile/settings

## Mobile Phase 3

- Apple Health connection
- Apple Watch workout import flow
- push reminders or check-ins

## Code Sharing Strategy

This is the most important engineering decision.

The best reuse is **logic sharing**, not **screen sharing**.

## Good Shared Package Candidates

### `packages/shared/domain`

- activity types
- diet types
- wellness types
- recommendation types

### `packages/shared/schemas`

- extracted user update schemas
- profile schemas
- log payload schemas

### `packages/shared/frankie`

- orchestrator request/response contracts
- prompt input shaping helpers
- message formatting helpers

### `packages/shared/utils`

- date helpers
- summary helpers
- formatting helpers

## What Should Stay App-Specific

### Web-specific

- layout shell
- desktop dashboard presentation
- admin UI
- marketing site

### Mobile-specific

- navigation stacks/tabs
- native forms
- modal sheets
- HealthKit permission UI
- push-notification surfaces

## Backend Strategy For Mobile

There are two good ways to support the mobile app.

## Option 1: Reuse Supabase Directly Plus Shared Logic

Mobile app uses:

- Supabase Auth
- direct reads/writes where safe
- server endpoints only for sensitive AI or orchestration flows

## Option 2: Push More Through Server Endpoints

Mobile app uses:

- Supabase Auth
- backend routes for most app logic
- thinner client

My recommendation for Frankie Fit:

- use a hybrid
- let mobile read user-owned data through Supabase where reasonable
- keep Frankie orchestration, tool routing, and sensitive writes on trusted server logic

That preserves safety and keeps the AI path consistent.

## Apple Health / Apple Watch Fit

This is where iPhone really matters.

The right first integration is:

- iPhone app requests HealthKit permission
- Frankie Fit reads recent workouts from HealthKit
- backend stores synced external workout data
- Frankie can match user messages to those workouts and offer import

Example:

- user says: `I went for a run today and logged it on my Apple Watch.`
- Frankie checks recent synced HealthKit workouts
- Frankie replies with a candidate match and asks for confirmation
- imported workout becomes a structured Frankie activity log

This is much better than treating Apple Watch data like raw freeform text.

## Recommended Health Integration Shape

Future entities likely needed:

- `external_health_connections`
- `external_workouts`
- `external_workout_imports`

Important fields:

- provider: `apple_health`
- provider workout id
- start/end time
- duration
- distance
- calories
- heart rate summary
- source device metadata
- import status
- linked Frankie activity log id

This keeps imported data and Frankie-owned logs connected without creating duplicates.

## UI Design Direction For Mobile

The mobile app should feel like the same product system, but more compact and native.

Keep:

- dark blue palette
- calm, low-fluff copy
- succinct headings
- chat-first emphasis
- fixed action areas where useful

Adjust:

- replace desktop sidebar with bottom tabs
- use sheets instead of many permanent side surfaces
- make dashboard cards taller and simpler
- prioritize thumb-friendly composer and quick actions

## Mobile UX Mapping From Current Web App

### Web `Chat`

Almost directly portable in product behavior.

Needed changes:

- mobile composer sizing
- safer keyboard handling
- simpler contextual surfaces

### Web `Dashboard`

Portable, but should become:

- `Progress`
- simpler
- more stacked
- less dense

### Web `Profile`

Portable with smaller grouped forms.

### Web `Admin`

Not phase 1 mobile material.

## Recommended Build Order

1. Write and approve the mobile architecture plan
2. Decide monorepo timing
3. Scaffold Expo app on the MacBook
4. Stand up login/signup with the same Supabase project
5. Build mobile chat first
6. Reuse Frankie backend/orchestration path
7. Add profile editing
8. Add progress screen
9. Add HealthKit integration

## Realistic Risks

## 1. Over-sharing UI code

Trying to force web components into React Native will slow the project down.

## 2. Under-sharing logic

If web and mobile duplicate all schemas and contracts, the product will drift.

## 3. Bringing in HealthKit too early

Health integration is exciting, but should come after the basic mobile Frankie loop is working.

## 4. Trying to make mobile and web identical

They should feel aligned, not identical.

## Strong Recommendation

The right mental model is:

- one product
- one backend
- two clients
- shared logic where it matters
- native UI where it matters

That is the cleanest way to make Frankie Fit real on iPhone without compromising the app or overcomplicating the repo.

## Suggested Next Artifact

The next best artifact after this document would be:

- a `mobile-v1-screen-spec.md`
- or a `mobile-repo-structure-plan.md`
- or the actual Expo app scaffold on the MacBook
