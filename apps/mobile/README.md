# Frankie Fit Mobile

This is the Expo / React Native iPhone client for Frankie Fit.

The mobile app is a sibling client to the web app. It shares the same Supabase project and calls trusted backend routes for Frankie intelligence so OpenAI and service-role secrets stay server-side.

## Current Scope

Implemented in the first mobile pass:

- login and signup
- Supabase session handling
- onboarding/profile editor flow
- chat connected to the mobile Frankie API route
- exercise, diet, and wellness dashboard tabs
- profile summary and edit entry point
- keyboard handling refinements for auth, onboarding, and chat

Not in scope yet:

- Apple Health / HealthKit connection
- push reminders
- voice input
- admin views

## Get started

From the repo root:

```bash
pnpm install
pnpm dev:mobile
```

Or from this directory:

```bash
pnpm start
```

## Environment

Copy `.env.example` to `.env.local`.

Required values:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_FRANKIE_API_BASE_URL`

For local device testing, `EXPO_PUBLIC_FRANKIE_API_BASE_URL` should point at the web backend that exposes `/api/mobile/chat`.

Do not put OpenAI keys or Supabase secret/service-role keys in the mobile env file.

## Development Commands

From the repo root:

- `pnpm dev:mobile`
- `pnpm ios:mobile`
- `pnpm android:mobile`
- `pnpm web:mobile`
- `pnpm lint:mobile`

From `apps/mobile`:

- `pnpm start`
- `pnpm ios`
- `pnpm android`
- `pnpm web`
- `pnpm lint`

Type-checking:

```bash
pnpm --dir apps/mobile exec tsc --noEmit
```

## Expo Go vs Development Build

Expo Go is useful for testing the current core app screens.

HealthKit will require a development build or production iOS app because Expo Go cannot provide Apple Health permissions and native HealthKit modules.

## Notes

- The user-facing dashboard tab is named `Dashboard`.
- The internal route file may still be named `progress.tsx`.
- Mobile chat uses a two-step send flow: save the user message, then generate Frankie's reply.
- The app should keep web/mobile onboarding semantics aligned, including multi-select answers.
