# Frankie Fit Seed Data Plan

## Purpose

This document defines the first meaningful demo-data pack for Frankie Fit.

The goal is to seed data that feels realistic enough to:

- make the chat, dashboard, and admin surfaces look alive
- support product demos and QA
- give us safe, reviewable accounts with varied coaching context
- keep the seeded chat history aligned with the structured logs

## Quick Answer

Yes, Frankie responses are stored today.

The current app persists:

- `conversation_threads`
- `conversation_messages`
- `activity_logs`
- `diet_logs`
- `wellness_checkins`

So a good seed script should create both:

- structured rows for each pillar
- matching user and assistant chat messages

## Scope For Seed Pack V1

Seed **10 non-admin reviewable accounts** with:

- varied `profiles` settings
- `onboarding_completed = true`
- a realistic `onboarding_summary`
- 1 primary `conversation_thread` each
- 7 days of history per account
- 1 activity log per day
- 1 diet log per day
- 1 wellness check-in per day
- matching user and Frankie messages for each of those daily events

Keep the founder/admin account separate and manual for now.

## Why These Accounts Should Be Reviewable

The admin surface is intentionally privacy-conscious for real users.

That means the best seed accounts for demos and QA are:

- `internal_test`
- `synthetic_demo`

Recommendation for the first pack:

- 5 `internal_test`
- 5 `synthetic_demo`

That gives the admin test-account panel something useful to show without mixing in real-user data.

## What We Should Seed

### Per Account

For each seeded account, create:

- 1 auth user
- 1 `profiles` row
- 1 `conversation_threads` row
- 21 structured log rows
  - 7 `activity_logs`
  - 7 `diet_logs`
  - 7 `wellness_checkins`
- 42 `conversation_messages`
  - 21 user messages
  - 21 assistant confirmations

This first implementation should also include:

- 1 seeded first Frankie summary message at the top of the thread

### Dataset Totals

For 10 accounts, this gives us:

- 10 auth users
- 10 profiles
- 10 conversation threads
- 70 activity logs
- 70 diet logs
- 70 wellness check-ins
- 430 conversation messages
  - 420 daily user and assistant messages
  - 10 seeded Frankie opener messages

## What We Should Not Seed Yet

Do not seed these in the first pass unless we have a specific demo need:

- `weekly_summaries`
- `recommendations`
- admin account(s)

Reason:

- the dashboard is currently computed from raw logs
- `Next best step` is already rule-based from current data
- keeping v1 seed data minimal makes it easier to rerun and debug

## Optional Add-Ons After V1

These are useful later, but not required for the first seed pack:

- 2 to 4 `product_suggestions` rows so the admin page looks fuller
- 2 or 3 intentionally imperfect accounts for friction testing
- one account with sparse diet logging
- one account with sparse wellness logging
- one account with onboarding incomplete

Important note:

If all 10 seeded users have perfect behavior, the admin friction panels will look unusually healthy.

That is acceptable for the first pass, but we should probably add an imperfect seed pack after this one.

## Account Archetypes

These should feel like believable v1 users rather than fake placeholder personas.

| Key | Account Type | Name | Primary Goal | Activity Level | Experience | Preferred Activities | Diet Preferences | Coaching Style |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ava-endurance-lifter` | `internal_test` | Ava Torres | Improve endurance without losing strength | Consistently active | Experienced | Lifting, Running | High-protein, Flexible | Direct but warm |
| `jordan-busy-consistency` | `internal_test` | Jordan Lee | Rebuild consistency around a busy schedule | Moderately active | Intermediate | Walking, Lifting, Mobility | High-protein, Flexible | Balanced mix |
| `maya-strength-regular` | `internal_test` | Maya Patel | Push strength and body composition | Consistently active | Experienced | Lifting, Walking | High-protein, Low-carb | Motivating |
| `chris-runner-recovery` | `internal_test` | Chris Alvarez | Improve running while managing stress and recovery | Consistently active | Intermediate | Running, Walking, Mobility | Mediterranean, Flexible | Gentle and steady |
| `nina-hybrid-bodycomp` | `internal_test` | Nina Brooks | Improve body composition with a balanced routine | Moderately active | Intermediate | Lifting, Cycling, Walking | High-protein, Mediterranean | Balanced mix |
| `leo-home-workouts` | `synthetic_demo` | Leo Martinez | Stay consistent with short home sessions | Lightly active | Getting back into it | Bodyweight-style Lifting, Mobility, Walking | Flexible | Gentle and steady |
| `priya-vegetarian-energy` | `synthetic_demo` | Priya Shah | Improve daily energy and training consistency | Moderately active | Intermediate | Classes, Walking, Yoga | Vegetarian, High-protein | Balanced mix |
| `marcus-recovery-first` | `synthetic_demo` | Marcus Reed | Reduce stress and rebuild sustainable momentum | Lightly active | Getting back into it | Walking, Mobility, Cycling | Flexible | Gentle and steady |
| `elena-analytical-planner` | `synthetic_demo` | Elena Kim | Build a structured training rhythm with useful insight | Moderately active | Experienced | Running, Lifting, Cycling | Mediterranean | Analytical |
| `sam-gentle-builder` | `synthetic_demo` | Sam Rivera | Build consistency and feel better week to week | Lightly active | Beginner | Walking, Mobility, Yoga | Flexible | Gentle and steady |

## Shared Profile Shape

Every seeded user should also have:

- `role = 'user'`
- `onboarding_completed = true`
- `safety_acknowledged = true`
- `wellness_checkin_opt_in = true`
- a realistic `preferred_schedule.notes`
- realistic `target_training_days`
- realistic `typical_session_length`
- realistic `energy_baseline` and `stress_baseline`
- realistic `secondary_goals`
- realistic `wellness_support_focus`
- a generated `onboarding_summary`

## Weekly Rhythm Model

To keep the data believable and scriptable, use a 7-day rhythm rather than pure randomness.

### Day 1: Strong Start

- activity: goal-aligned training session
- diet: anchored, intentional meal log
- wellness: decent energy, solid motivation

### Day 2: Steady Day

- activity: normal session or cardio
- diet: simple, practical meal log
- wellness: moderate stress or soreness begins to show up

### Day 3: Life Gets Busy

- activity: shorter or lighter movement
- diet: quicker, more convenience-based meal
- wellness: lower energy or higher stress for some accounts

### Day 4: Recovery-Oriented Day

- activity: walking, mobility, or light session
- diet: simple recovery-focused meal
- wellness: soreness or fatigue becomes more visible

### Day 5: Momentum Returns

- activity: stronger session again
- diet: more on-plan meal
- wellness: motivation trends back up

### Day 6: Longer Or More Enjoyable Session

- activity: weekend-style longer effort, class, run, ride, or bigger lift
- diet: slightly more relaxed meal language is okay
- wellness: energy often higher, stress often lower

### Day 7: Reset Day

- activity: walk, yoga, mobility, or very light training
- diet: simple meal log
- wellness: reflection-oriented, lower-pressure language

## Daily Data Pattern

For each day, each account should have:

### Wellness

- 1 user message
- 1 `wellness_checkins` row
- 1 Frankie confirmation

Recommended timestamp:

- morning, around `7:30 AM` to `9:00 AM`

### Diet

- 1 user message
- 1 `diet_logs` row
- 1 Frankie confirmation

Recommended timestamp:

- midday or evening, around `12:00 PM` to `7:00 PM`

### Activity

- 1 user message
- 1 `activity_logs` row
- 1 Frankie confirmation

Recommended timestamp:

- late afternoon or evening, around `4:30 PM` to `8:30 PM`

## Message Style Rules

Seeded user messages should sound like real app usage, not test fixtures.

Use:

- natural first-person phrasing
- short-to-medium messages
- some variation in clarity and structure
- occasional combined details like duration plus intensity
- occasional casual phrasing like `just`, `pretty`, `a bit`, `solid`, `rough`

Avoid in v1 seed data:

- extreme typos everywhere
- clinically sensitive phrasing
- highly ambiguous mixed-domain messages
- edge cases we do not parse well yet

This first seed pack should validate the happy path.

## Example Message Shapes

### Activity

- `I ran for 35 minutes today and kept it pretty easy.`
- `Lifted for about 45 minutes after work.`
- `Did a longer walk tonight, around an hour.`
- `Got a cycling session in for 50 minutes.`

### Diet

- `Breakfast was eggs, fruit, and toast.`
- `Lunch was chicken, rice, and vegetables.`
- `Dinner was salmon, potatoes, and salad.`
- `Snack was a protein bar and a shake.`

### Wellness

- `Energy feels solid, stress is moderate, and motivation is good today.`
- `A little sore, energy is okay, mood is fine.`
- `Stress is high today and I feel a little tired.`
- `Energy 4/5, soreness 2/5, motivation 4/5.`

## Structured Data Expectations

The seeded structured rows should stay consistent with the chat copy.

### Activity Logs

Include:

- `activity_type`
- `description`
- `duration_minutes` when the user message implies it
- `intensity` when the user message implies it
- `logged_for_date`
- `source_message_id`
- `metadata_json`

Recommendation:

Store metadata like:

- `seeded: true`
- `seedPack: 'demo-v1'`
- `dayOffset`
- `archetypeKey`

### Diet Logs

Include:

- `description`
- `meal_type`
- `confidence`
- `logged_for_date`
- `source_message_id`
- `metadata_json`

Recommendation:

Use realistic meal types:

- `breakfast`
- `lunch`
- `dinner`
- `snack`

### Wellness Check-Ins

Include:

- `energy_score`
- `soreness_score`
- `mood_score`
- `stress_score`
- `motivation_score`
- `notes`
- `logged_for_date`
- `source_message_id`

Keep scores mostly in the `2` to `4` range unless the archetype or day theme really calls for a stronger value.

## Thread And Message Strategy

Use one main thread per account for the first pack.

Recommended thread title shape:

- `Ava's Frankie chat`
- `Jordan's Frankie chat`

Recommended message ordering:

1. optional seeded Frankie opener
2. daily wellness pair
3. daily diet pair
4. daily activity pair

This keeps the thread easy to read and makes the dashboard/admin surfaces line up with visible chat history.

## Time And Date Strategy

The data should be backdated across the previous 7 calendar days.

Recommendation:

- `logged_for_date` should match the intended day exactly
- `created_at` should match a believable time on that day
- timestamps should increase in natural order inside each thread

Use local-feeling spacing rather than exact identical timestamps for every user.

## Script Shape

Recommendation:

- build this as a rerunnable script, not a one-off SQL blob

Actual file layout:

```text
scripts/
  seed-demo-data.mjs
  seed-data/
    archetypes.mjs
    weekly-rhythm.mjs
    message-builders.mjs
```

## Required Environment For Seeding

The seed script should use:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `FF_DEMO_ACCOUNT_PASSWORD`

Reason:

- creating auth users cleanly requires the service role
- the script should be able to create login-capable accounts directly

## Rerun Strategy

The script should be safe to rerun.

Recommendation:

1. define the full list of seeded account emails in code
2. look up existing seeded users by those emails
3. delete those auth users first
4. let cascading deletes remove related profile/log/thread/message data
5. recreate the full seed pack deterministically

This is much cleaner than trying to incrementally patch old demo data.

## Email And Password Pattern

Use short, deterministic seeded email addresses:

- `internal1@frankiefit.com` through `internal5@frankiefit.com`
- `synthetic1@frankiefit.com` through `synthetic5@frankiefit.com`

Keep the underlying `account_type` values as:

- `internal_test`
- `synthetic_demo`

That gives us short login credentials without changing the actual product-side account classification.

Use one shared demo password via env for the first pass.

This keeps the accounts:

- login-capable
- easy to document
- easy to reset

## Developer Commands

Use:

- `pnpm seed:demo:dry`
- `pnpm seed:demo`

The dry run is useful for validating the account list and dataset counts before touching Supabase.

## Recommended First Build Order

1. define the 10 archetypes in code
2. define the 7-day weekly rhythm template
3. generate profile payloads and onboarding summaries
4. create auth users
5. upsert profile details
6. create one thread per user
7. insert user messages and Frankie confirmations
8. insert matching structured logs with `source_message_id`
9. verify dashboard and admin views against the seeded accounts

## Practical Decisions To Keep

- keep the seeded accounts non-admin
- keep the founder/admin account separate
- keep the first pack mostly happy-path
- keep chat and structured records aligned
- keep seed data reviewable through existing admin privacy rules

## Follow-Up Seed Pack

After this first seed pack is working, the next best dataset is an edge-case pack with:

- imperfect adherence
- mixed-domain messages
- sparse logging
- a few alcohol or hydration mentions
- a few time-shifted phrases like `yesterday` and `last night`

That second pack will be much more useful once we start Frankie intelligence refinement.
