# Frankie Fit Apple Health Integration Plan

## Purpose

This document defines the first read-only Apple Health integration path for Frankie Fit mobile.

The goal is to make Apple Watch and iPhone workout data useful to Frankie without turning Frankie Fit into another manual tracker or writing data back to Apple Health.

## Current Status - May 1, 2026

The first HealthKit spike has been validated far enough to prove the native path.

Implemented so far:

- `expo-dev-client` added for development builds
- `@kingstinct/react-native-healthkit` and `react-native-nitro-modules` added
- HealthKit config plugin added to `apps/mobile/app.json`
- iOS Health usage descriptions added
- read-only Apple Health helper added at `apps/mobile/lib/apple-health.ts`
- Apple Health setup screen added at `apps/mobile/app/health.tsx`
- Profile now links to the Apple Health setup screen
- a local iPhone development build was compiled, signed, installed, trusted, and launched
- the HealthKit native module successfully bundled in the installed development build

The spike is intentionally defensive:

- Expo Go can still run the app, but the Health screen explains that HealthKit requires a development build
- no OpenAI or Supabase secret keys are exposed to mobile
- no HealthKit write permissions are requested
- no Apple Health data is synced to Supabase yet

Current product decision:

- pause deeper Apple Health tuning while Frankie intelligence, evals, auditability, and Vercel deployment move to the front
- keep the current spike as a working proof that Apple Watch and iPhone workout data can become useful later
- do not add Apple Health writes unless the product direction changes

## Product Scope

In scope for the first Apple Health integration:

- request read access to workouts
- request read access to heart-rate samples
- request read access to active energy and distance samples
- show a local preview of recent workouts
- show a local heart-rate summary for each workout when available
- later let the user explicitly import a workout into Frankie

Out of scope unless explicitly revisited:

- writing workouts or health data back to Apple Health
- background sync
- automatic imports without user review
- medical, diagnostic, or clinical interpretation
- Android Health Connect

## Development Build Requirement

Apple Health requires native iOS capabilities and a native HealthKit module.

That means:

- Expo Go is not enough
- a local development build or EAS development build is required
- after native dependency or app config changes, the dev build must be rebuilt

Useful commands:

```bash
pnpm ios:mobile:dev
pnpm dev:mobile
```

Real-device setup lessons from the first MacBook/iPhone run:

- Xcode, command line tools, CocoaPods, signing identity, iPhone Developer Mode, and trusted developer profile all need to be in place
- the HealthKit path must run in the installed Frankie Fit development build, not Expo Go
- local chat testing still needs the Next.js backend running separately because Frankie intelligence is served through trusted web/API routes

## Current Read Permissions

The first read set is:

- `HKWorkoutTypeIdentifier`
- `HKQuantityTypeIdentifierHeartRate`
- `HKQuantityTypeIdentifierActiveEnergyBurned`
- `HKQuantityTypeIdentifierDistanceWalkingRunning`
- `HKQuantityTypeIdentifierDistanceCycling`

This is enough to validate the main product question:

Can Frankie use real workout summaries plus heart-rate timelines to understand training intensity and recovery context?

## First Data Shape

The local preview maps HealthKit workouts into:

- external workout id
- activity type
- start date
- end date
- duration
- total energy when available
- total distance when available
- heart-rate average, min, max, and sample count when available

This is not persisted yet.

## Future Supabase Shape

When the native preview is confirmed on device, add persistence.

Likely tables:

- `external_health_connections`
- `external_workouts`
- `external_workout_heart_rate_samples`
- `external_workout_imports`

Key fields:

- user id
- provider, starting with `apple_health`
- provider workout id
- workout type
- start/end time
- duration
- energy
- distance
- heart-rate summary
- sample count
- import status
- linked Frankie activity log id

## Frankie Import Flow

The recommended first import flow:

1. User connects Apple Health.
2. Frankie Fit shows recent workouts locally.
3. User picks one workout.
4. Frankie previews the structured log it would create.
5. User confirms import.
6. Backend writes a Frankie activity log linked to the external workout.
7. Frankie can reference the workout in chat and dashboard insights.

This avoids duplicate logging and keeps the user in control.

## Frankie Intelligence Use

Once workouts are persisted, Frankie can use them for:

- confirming workouts the user mentions in chat
- distinguishing lifting, running, cycling, and other activity types
- noticing intensity patterns from heart-rate timelines
- comparing workout load with soreness, stress, energy, and motivation check-ins
- suggesting recovery without overstating certainty

Frankie should keep language careful.

Good:

- "Your heart rate peaked higher than usual during that lift, and soreness was also up the next day. Worth keeping recovery easy today."

Avoid:

- medical diagnosis
- claims about cardiovascular health
- advice that sounds clinical or urgent unless routed to standard safety guidance

## References

- Expo development builds: https://docs.expo.dev/develop/development-builds/introduction/
- Expo custom native code: https://docs.expo.dev/workflow/customizing/
- `@kingstinct/react-native-healthkit`: https://github.com/kingstinct/react-native-healthkit
- Apple HealthKit `HKHealthStore`: https://developer.apple.com/documentation/healthkit/hkhealthstore
- Apple HealthKit quantity types: https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier
