# Frankie Fit Mobile V1 Screen Spec

## Purpose

This document defines the initial iPhone product surfaces for Frankie Fit version one.

It translates the mobile architecture plan into a concrete set of mobile screens, navigation rules, and scope boundaries.

The goal is clarity, not pixel-perfect design.

It answers:

- what screens exist in mobile v1
- what each screen is for
- what each screen needs to show
- what actions matter most on each screen
- what stays out of scope for the first iPhone build

## Product Model

Frankie Fit mobile v1 should feel like the same product as the web app, but not the same layout.

The mobile version should prioritize:

- speed
- clarity
- one-handed usability
- fewer competing surfaces on screen at once
- chat as the center of the experience

## Current Build Status - May 1, 2026

The first mobile build now exists in `apps/mobile`, and a signed development build has been installed and launched on a connected iPhone.

Implemented so far:

- login and signup
- Supabase session handling
- auth redirects for incomplete onboarding
- onboarding/profile editor flow using the same core fields as web
- multi-select onboarding answers where web supports multiple selections
- chat transcript loading and sending through the mobile Frankie API
- two-stage chat status: `Sending` while saving the message, then Frankie's thinking state after the message is sent
- keyboard accessory with centered `Close` action in chat
- dashboard tabs for exercise, diet, and wellness backed by saved data
- newest-first wellness trend ordering
- profile summary and editable profile context
- read-only Apple Health setup screen bundled in a native development build

Still being refined:

- tighter mobile UI polish
- deeper dashboard/profile parity with the web app
- production-ready error handling for local/prod API connectivity

Paused for now:

- Apple Health persistence and import flows
- baseline Apple Watch app exploration

## Core Mobile Principles

- Chat is the primary home of the app.
- The app should feel calm, lightweight, and low-friction.
- Mobile should show less at once than desktop, not the same amount compressed.
- Frankie should stay present through short, specific guidance rather than lots of persistent UI chrome.
- The mobile app should be designed for short interactions throughout the day.

## Mobile Information Architecture

### Bottom Tab Navigation

The v1 mobile app should use three main tabs:

- Chat
- Dashboard
- Profile

### App Entry Rules

- After login, users land on `Chat`.
- If onboarding is incomplete, users are routed into onboarding before the main tabs.
- Admin should remain web-only in phase 1.

## Route Groups

A practical mobile route model would be:

```text
app/
  (auth)/
    login
    signup
  onboarding/
    ...
  (tabs)/
    chat
    progress
    profile
```

Note: the current implementation may keep the internal file route named `progress`, while the user-facing tab label is `Dashboard`.

## Screen 1: Welcome / Auth

## 1. Login

### Purpose

Allow an existing user to sign in quickly.

### Key Components

- Frankie Fit wordmark
- short welcome line
- email field
- password field
- primary login action
- link to signup

### Design Notes

- keep this screen minimal
- no heavy marketing content inside the app shell
- the experience should feel quiet and direct

## 2. Signup

### Purpose

Allow a new user to create an account and start onboarding.

### Key Components

- Frankie Fit wordmark
- short trust-setting line
- email field
- password field
- confirm password field
- primary signup action
- link to login

### Design Notes

- keep signup friction low
- safety and coaching boundaries belong in onboarding, not as a wall of text here

## Screen 2: Onboarding

### Purpose

Collect enough context for Frankie to be useful on day one without making mobile onboarding feel like a form marathon.

### Flow Style

Recommendation:

- a step-by-step conversational card flow
- one question or grouped mini-step at a time
- progress indicator at the top
- back and continue controls

### Core Onboarding Steps

- welcome and framing
- primary goal
- activity baseline
- preferences and equipment
- schedule and routine reality
- diet context
- wellness context
- injuries / limitations / health considerations
- coaching style
- safety acknowledgement
- Frankie summary and first next step

### Mobile-Specific UX Notes

- use large touch targets
- avoid long dense forms
- allow keyboard-safe layout behavior
- use sheets or stacked cards for choice-heavy questions if needed

### End State

On completion:

- save profile data
- mark onboarding complete
- show a short Frankie summary
- route the user into `Chat`

## Screen 3: Chat

### Purpose

This is the primary home of the mobile product.

Most mobile value should come from the user being able to quickly open the app, tell Frankie what happened, and move on.

### Primary User Questions

- What should I do next?
- What have I already told Frankie?
- How do I log something quickly?
- Can Frankie help me make sense of what I just did or how I feel?

### Key Components

- top app bar with `Chat`
- conversation transcript
- sticky composer at the bottom
- compact contextual strip or card for:
  - next best step
  - current goal
  - optional lightweight reminder
- optional quick actions above the keyboard/composer:
  - log workout
  - log meal
  - check in

### Core Actions

- send a message to Frankie
- log activity in natural language
- log food in natural language
- log wellness in natural language
- ask for a plan
- ask for a summary

### Mobile-Specific Behavior

- transcript should auto-scroll to the latest message
- keyboard handling must be smooth and predictable
- composer should remain easy to use with one thumb
- avoid heavy permanent side context; use compact cards or sheets instead
- show the sending state while the user message is being saved
- show Frankie's thinking state only after the user message has actually been sent to the backend
- keep the keyboard close action centered and visually separate from the send action

### Empty State

Frankie should offer a simple first action such as:

> Tell me what you did today, what you ate, or how you are feeling, and I will take it from there.

### Out Of Scope For Phase 1

- voice input UI
- photo-based food logging
- watch import UI
- advanced chat settings

## Screen 4: Dashboard

### Purpose

This is the mobile version of the web dashboard.

It should help users understand how the week is going without feeling like a dense analytics screen.

### Naming

Current recommendation:

- use `Dashboard` as the user-facing tab label to stay in parity with the web app
- keep the internal `progress` route name only if renaming it would add avoidable churn

### Primary User Questions

- How has my week been going?
- Am I staying consistent?
- What patterns is Frankie noticing?
- What should I focus on next?

### Structure

Use a segmented control or top tabs inside the screen for:

- Exercise
- Diet
- Wellness

### Shared Screen Components

- screen title
- short supporting line if needed
- compact next best step card
- segmented control
- summary content for the selected domain

## 4A. Exercise Tab

### Key Components

- weekly summary card
- active days this week
- total sessions or total minutes
- recent exercise logs
- one Frankie insight

### Core Actions

- tap recent entries to view more detail later
- jump back to chat to log more

### Out Of Scope

- route maps
- advanced training analytics
- performance benchmarking

## 4B. Diet Tab

### Key Components

- meals logged this week
- days with food logs
- recent meal entries
- one Frankie pattern insight

### Core Actions

- jump back to chat to log food

### Out Of Scope

- calorie-counting dashboards
- barcode scanning
- macro detail systems

## 4C. Wellness Tab

### Key Components

- check-ins this week
- trend summary for energy / stress / soreness / motivation
- recent wellness entries ordered newest-first, with Today and Yesterday before older days
- one Frankie wellness insight

### Core Actions

- jump back to chat to check in

### Out Of Scope

- clinical assessments
- deep journaling experiences
- therapy-style flows

## Mobile Dashboard Design Notes

- keep cards taller and simpler than web
- avoid too many small side-by-side metrics
- prefer a strong top summary plus a few meaningful supporting blocks
- do not recreate a desktop dashboard grid on a phone

## Screen 5: Profile

### Purpose

Allow the user to review and update the most important context Frankie uses.

### Primary User Questions

- What does Frankie know about me?
- Can I change my goal or coaching style?
- Can I update my preferences without redoing onboarding?

### Key Components

- profile summary area
- grouped editable sections for:
  - primary goal
  - secondary goals
  - preferred activities
  - equipment / environment
  - diet preferences / restrictions
  - wellness focus
  - coaching style
  - check-in preferences
- anchored save action at the bottom

### Mobile-Specific UX Notes

- use grouped list-style sections or stacked cards
- keep fields scannable
- keep the save action visible and thumb-reachable
- do not overload this screen with every possible profile field at once

### Out Of Scope For Phase 1

- full settings center
- notification tuning matrix
- account management complexity beyond basics

## Mobile Header / Navigation Rules

- keep top bars short and specific
- avoid repeating explanatory copy at the top of every screen
- rely on spacing and hierarchy more than extra labels
- keep bottom tab labels short and obvious

## Sheets / Modals

Phase 1 mobile should prefer sheets for secondary interactions such as:

- compact goal detail
- next-step detail
- small confirmations
- future Apple Health connection setup

Avoid too many nested full-screen modal flows unless the task truly needs it.

## What Stays Web-Only In Phase 1

- admin overview
- founder product controls
- test account inspection
- marketing landing page

## Mobile V1 Success Criteria

The mobile app is successful when a user can:

1. sign up or log in
2. finish onboarding
3. land in Chat
4. log activity, diet, and wellness naturally
5. view a simple weekly read in Dashboard
6. update their coaching context in Profile

That is enough for the first real iPhone Frankie Fit experience.

## Nice-To-Have Later

- push reminders
- Apple Health permission and workout preview flow
- Apple Watch workout import confirmation
- richer log detail views
- saved plans or routines
- voice input

## Strong Recommendation

The mobile v1 app should be treated as:

- a chat-first companion
- a lighter progress view
- a cleaner profile editor

If the team keeps that scope tight, the iPhone version will feel focused and credible without trying to do everything the web app does on day one.
