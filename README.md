# Frankie Fit

Frankie Fit is an AI-native wellness coach built around three pillars: activity, diet, and mental wellness.

The product vision and current scope live in [docs/product-brief.md](C:/Users/mcdit/Code/frankie-fit/docs/product-brief.md).

Supporting planning docs:

- [V1 Product Decisions](C:/Users/mcdit/Code/frankie-fit/docs/v1-product-decisions.md)
- [Onboarding Flow](C:/Users/mcdit/Code/frankie-fit/docs/onboarding-flow.md)
- [V1 Dashboard and Screen Spec](C:/Users/mcdit/Code/frankie-fit/docs/v1-dashboard-spec.md)
- [Frankie Voice and UI Decisions](C:/Users/mcdit/Code/frankie-fit/docs/frankie-voice-and-ui-decisions.md)
- [Frankie First-Run and In-App Copy](C:/Users/mcdit/Code/frankie-fit/docs/frankie-first-run-copy.md)
- [Landing Page Copy](C:/Users/mcdit/Code/frankie-fit/docs/landing-page-copy.md)
- [Wireframe Content Map](C:/Users/mcdit/Code/frankie-fit/docs/wireframe-content-map.md)
- [Low-Fidelity Wireframes](C:/Users/mcdit/Code/frankie-fit/docs/low-fi-wireframes.md)
- [MVP Technical Architecture](C:/Users/mcdit/Code/frankie-fit/docs/mvp-technical-architecture.md)
- [Database Schema Plan](C:/Users/mcdit/Code/frankie-fit/docs/database-schema-plan.md)
- [AI-Native Architecture Review](C:/Users/mcdit/Code/frankie-fit/docs/ai-native-architecture-review.md)
- [Mobile Architecture Plan](C:/Users/mcdit/Code/frankie-fit/docs/mobile-architecture-plan.md)
- [Mobile V1 Screen Spec](C:/Users/mcdit/Code/frankie-fit/docs/mobile-v1-screen-spec.md)
- [Mobile Repo Structure Plan](C:/Users/mcdit/Code/frankie-fit/docs/mobile-repo-structure-plan.md)
- [Mobile UI Direction](C:/Users/mcdit/Code/frankie-fit/docs/mobile-ui-direction.md)
- [Seed Data Plan](C:/Users/mcdit/Code/frankie-fit/docs/seed-data-plan.md)
- [Implementation Backlog](C:/Users/mcdit/Code/frankie-fit/docs/implementation-backlog.md)
- [Deployment Strategy](C:/Users/mcdit/Code/frankie-fit/docs/deployment-strategy.md)

## App Scaffold

The repo now includes the first working Next.js scaffold for:

- the public marketing page, now refreshed around fuller-width landing-page sections and a more deliberate Tailwind-style hero
- auth route shells at `/login` and `/signup`
- the authenticated app shell
- starter routes for `/app/chat`, `/app/dashboard`, and `/app/profile`
- Supabase client helpers and environment scaffolding
- a first-pass `lib/ai/` orchestration layer for Frankie

## Development

1. Copy `.env.example` to `.env.local` and fill in the Supabase and OpenAI values.
2. Install dependencies with `pnpm install`.
3. Run the app with `pnpm dev`.

Verification commands:

- `pnpm lint`
- `pnpm build`

## Seed Demo Data

The repo includes a rerunnable demo seeding script for 10 reviewable accounts with:

- varied completed profiles
- one week of activity, diet, and wellness logs
- matching stored Frankie chat history

Commands:

- `pnpm seed:demo:dry`
- `pnpm seed:demo`

Required env for real seeding:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `FF_DEMO_ACCOUNT_PASSWORD`

Note:
The current scripts use `--webpack` for `next dev` and `next build` to avoid a Windows/Turbopack process issue in this environment.
