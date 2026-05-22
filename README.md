# Frankie Fit

Frankie Fit is an AI-native wellness coach built around three pillars: activity, diet, and mental wellness.

The product vision and current scope live in [docs/product-brief.md](docs/product-brief.md).

Supporting planning docs:

- [V1 Product Decisions](docs/v1-product-decisions.md)
- [Onboarding Flow](docs/onboarding-flow.md)
- [V1 Dashboard and Screen Spec](docs/v1-dashboard-spec.md)
- [Frankie Voice and UI Decisions](docs/frankie-voice-and-ui-decisions.md)
- [Frankie Logging Contract](docs/frankie-logging-contract.md)
- [Frankie First-Run and In-App Copy](docs/frankie-first-run-copy.md)
- [Landing Page Copy](docs/landing-page-copy.md)
- [Wireframe Content Map](docs/wireframe-content-map.md)
- [Low-Fidelity Wireframes](docs/low-fi-wireframes.md)
- [MVP Technical Architecture](docs/mvp-technical-architecture.md)
- [Database Schema Plan](docs/database-schema-plan.md)
- [AI-Native Architecture Review](docs/ai-native-architecture-review.md)
- [Open-Vocabulary Activity Plan](docs/open-vocabulary-activity-plan.md)
- [Family Beta Debug Plan](docs/family-beta-debug-plan.md)
- [Frankie Eval Loop Design](docs/frankie-eval-loop-design.md)
- [Apple Health Integration Plan](docs/apple-health-integration-plan.md)
- [Mobile Architecture Plan](docs/mobile-architecture-plan.md)
- [Mobile V1 Screen Spec](docs/mobile-v1-screen-spec.md)
- [Mobile Repo Structure Plan](docs/mobile-repo-structure-plan.md)
- [Mobile UI Direction](docs/mobile-ui-direction.md)
- [Seed Data Plan](docs/seed-data-plan.md)
- [Implementation Backlog](docs/implementation-backlog.md)
- [Deployment Strategy](docs/deployment-strategy.md)
- [LinkedIn Series Notes](docs/linkedin-series-notes.md)

## App Scaffold

The repo now includes the first working web and mobile scaffold for:

- the public marketing page, now refreshed around fuller-width landing-page sections and a more deliberate Tailwind-style hero
- auth route shells at `/login` and `/signup`
- the authenticated app shell
- starter routes for `/app/chat`, `/app/dashboard`, and `/app/profile`
- admin routes for `/app/admin`, `/app/admin/debug`, and `/app/admin/evals`
- Supabase client helpers and environment scaffolding
- a first-pass `lib/ai/` orchestration layer for Frankie
- trace capture for Frankie chat turns through `ai_trace_runs`
- an eval-loop foundation for replaying benchmark personas, generating coach summaries, and saving human review labels
- an Expo / React Native mobile app in `apps/mobile`
- a mobile chat API route that keeps Frankie orchestration and OpenAI calls server-side
- mobile auth, onboarding, chat, dashboard, and profile surfaces connected to the same Supabase project
- a read-only Apple Health development-build spike validated on a connected iPhone for workout and heart-rate preview capability

## Current Focus

The next project push is focused on:

- improving Frankie intelligence quality for messy real chat messages
- redesigning activity understanding so Frankie handles open-ended real-world activities more consistently
- adding evals, traceability, and audit-friendly chat behavior
- building a repeatable Frankie eval loop around seeded benchmark personas and human review labels
- applying the eval migration and running the first real benchmark replay
- preparing a small family beta with admin-side conversation debugging
- preparing the first Vercel MVP deployment
- keeping Apple Health read-only and paused until the core chat experience is stronger
- keeping mobile aligned with web while using native iPhone UX where it matters

## Development

1. Copy `.env.example` to `.env.local` and fill in the Supabase and OpenAI values.
2. Copy `apps/mobile/.env.example` to `apps/mobile/.env.local` and fill in the public Supabase values plus the local Frankie API base URL when needed.
3. Install dependencies with `pnpm install`.
4. Run the web app with `pnpm dev:web`.
5. Run the mobile app with `pnpm dev:mobile`.

For physical iPhone chat testing, run the web/API server and the mobile Metro server at the same time. The phone loads the native bundle from Metro, but chat calls the trusted Next.js backend route for Frankie intelligence.

Common commands:

- `pnpm dev:web`
- `pnpm build:web`
- `pnpm lint:web`
- `pnpm dev:mobile`
- `pnpm ios:mobile`
- `pnpm ios:mobile:dev`
- `pnpm android:mobile`
- `pnpm lint:mobile`

Verification commands:

- `pnpm lint:web`
- `pnpm build:web`
- `pnpm lint:mobile`
- `pnpm --dir apps/mobile exec tsc --noEmit`

## Seed Demo Data

The repo includes a rerunnable demo seeding script for 10 reviewable accounts with:

- varied completed profiles
- one week of activity, diet, and wellness logs
- matching stored Frankie chat history

Commands:

- `pnpm seed:demo:dry`
- `pnpm seed:demo`
- `pnpm reset:user -- --email=user@example.com`

Required env for real seeding:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `FF_DEMO_ACCOUNT_PASSWORD`

Note:
The current scripts use `--webpack` for `next dev` and `next build` to avoid a Windows/Turbopack process issue in this environment.

The user reset script preserves the auth account and profile, but clears:

- conversation threads and messages
- activity, diet, and wellness logs
- recommendations and weekly summaries
- AI trace rows tied to that user's threads

By default it runs as a dry run. Add `--execute` to actually delete data.
