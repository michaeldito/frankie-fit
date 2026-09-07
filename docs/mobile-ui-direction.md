# Frankie Fit Mobile UI Direction

## Purpose

This document defines the design direction for the Frankie Fit iPhone app as it moves from first implementation into UI/UX refinement.

It is meant to keep the mobile app visually and experientially aligned with the web product while still feeling native to iPhone.

The goal is to answer:

- what the mobile app should feel like
- what visual language should carry over from web
- what should change for mobile
- what UI principles should guide screen design

## Current Status - May 1, 2026

The first mobile app now exists in `apps/mobile`, and real-device testing has moved the feedback from abstract parity into actual iPhone behavior.

Design and UX decisions from device testing:

- use `Dashboard` as the user-facing bottom-tab label for web/mobile parity
- keep the internal `progress` route name until a rename is worth the churn
- preserve web onboarding semantics, including multi-select answers
- use `Finish onboarding` only for first-time onboarding
- use `Save profile changes` when an onboarded user edits their profile
- avoid keyboard-blocked primary actions on auth and onboarding screens
- keep the chat keyboard close action centered and visually separate from `Send`
- show `Sending` while the user message is being saved
- show Frankie's thinking state only after the saved message is ready for response generation
- order the wellness trend newest-first so Today is visible before older entries
- make mobile network errors more actionable because chat depends on both the native app bundle and the trusted web/API backend
- keep HealthKit UI guarded so Expo Go remains usable while development builds can use Apple Health

## Current Status - September 5, 2026

Mobile moved from a 3-tab bottom bar to a chat-first shell: Chat is the only screen shown by default, and a hamburger button opens a slide-in drawer for Dashboard, Workouts (placeholder), Profile, and sign-out. This supersedes the "Bottom Tabs" direction below — the bottom tab bar section is kept for historical context but no longer reflects the shipped nav.

Other changes from this pass:

- Dashboard gained a fourth `Lifestyle` segment, matching web's four-pillar parity (Exercise, Diet, Lifestyle, Wellness)
- Onboarding moved from one long scrolling form to a paginated, left-to-right step flow (6 steps) with a step-dot progress indicator (ported from the admin eval-replay `StepBullet` pattern) and a `Continue`/`Back` footer instead of one long scroll-to-submit form
- Push notifications are scaffolded (Expo push token registration, a `push_tokens` table, and best-effort dispatch from the existing notification cron job) but need an EAS project id (`eas init`) before device tokens can actually be issued

Current product direction:

- focus near-term mobile refinement on chat reliability, profile/dashboard parity, and production API behavior
- pause Apple Health polish and Apple Watch exploration until Frankie intelligence and deployment are stronger

## Core Direction

Frankie Fit mobile should feel like:

- calm
- modern
- focused
- coach-like
- quietly premium

It should not feel like:

- a dense analytics app
- a loud fitness brand
- a clinical health portal
- a generic chat app with fitness colors

The product should feel like a steady coach in your pocket.

## Working Visual Theme

### Theme Name

**Modern calm performance**

This continues the strongest direction that has already emerged in the web app.

### Key Characteristics

- dark blue foundation
- soft contrast rather than harsh black
- bright but controlled blue accents
- calm spacing
- strong readability
- compact but not cramped surfaces

## Relationship To Web

The mobile app should feel like it belongs to the same Frankie Fit system as the web app.

Shared elements:

- dark blue palette
- succinct headers
- low-fluff copy
- rounded, soft-edged surfaces
- compact recommendation surfaces
- Frankie-first product tone

What should change:

- mobile should use fewer permanent panels
- mobile should rely more on sheets and stacked cards
- mobile spacing should be tighter than web, but never cramped
- mobile should feel more direct and thumb-friendly

## Color Direction

The web app has already moved into a Tailwind-style blue palette.

That same family should guide mobile.

### Core Palette Feel

- deep navy / indigo base
- medium blue brand accents
- pale blue support text and borders
- white used sparingly for strong contrast moments

### Mobile Color Principles

- backgrounds should be layered, not flat
- primary actions should stand out clearly
- cards should be visually separable from the background
- muted text should still remain readable

### Avoid

- neon blue overload
- pure black everywhere
- too many competing accent colors
- gym-brand green or red as primary product colors

## Typography Direction

Typography should feel:

- strong
- readable
- slightly editorial
- not overly playful

### Principles

- headings should be short and specific
- supporting text should be minimal
- cards should have consistent internal spacing regardless of text length
- avoid stacked labels and repetitive helper lines

### Tone Reminder

Less is more.

What is shown should be:

- specific
- succinct
- useful

The UI should not overwhelm people with extra explanation.

## Layout Direction

## App-Level Structure

Recommended mobile structure:

- top app bar
- main content area
- bottom tab bar

Inside screens:

- strong top title
- short supporting line only when needed
- vertically stacked cards
- sticky composer or sticky action areas where appropriate

## Card Style

Cards should feel:

- soft-edged
- layered
- slightly elevated
- not glassy for the sake of it

Use cards for:

- summary blocks
- Frankie insight blocks
- next best step
- settings groups
- onboarding steps

Avoid:

- too many nested cards inside cards
- too many side-by-side tiny cards
- visually noisy borders

## Navigation Direction

## Chat-First Drawer (current)

Chat is the only screen shown by default — there is no persistent tab bar. A small hamburger button in the header opens a slide-in drawer listing the other destinations:

- Chat
- Dashboard
- Workouts (placeholder for now)
- Profile
- Sign out

### Design Principles

- the drawer is the only way to reach non-chat screens, so its items must be unambiguous at a glance (icon + label)
- labels should stay short
- the active destination should feel clearly selected without being loud
- dismiss by tapping outside or swiping, matching the platform-native drawer gesture

## Bottom Tabs (superseded)

The original direction used a 3-item bottom tab bar (Chat, Dashboard, Profile). This has been replaced by the chat-first drawer above; kept here only for historical context.

## Header Behavior

Headers should stay clean and compact.

Good mobile header behavior:

- title only
- optional one-line support text below
- optional small action on the right

Avoid:

- eyebrow labels everywhere
- long descriptive blocks at the top of every screen
- repeated messaging that already exists inside the screen

## Screen-Specific Direction

## 1. Chat

This should feel like the most refined screen in the app.

Desired feel:

- focused
- breathable
- intimate
- very usable

### Visual Priorities

- readable conversation transcript
- strong contrast between user and Frankie messages
- sticky composer that feels native and stable
- compact contextual surfaces above the composer or near the top

### Avoid

- too many helper chips
- bulky permanent recommendation cards
- large empty-state illustrations unless they are truly strong

## 2. Dashboard

This should be lighter than the web dashboard while still using the same user-facing name.

Desired feel:

- summary-first
- less noisy
- reassuring rather than analytical

### Visual Priorities

- one strong summary card at the top
- segmented control for pillar switching across all four pillars (Exercise, Diet, Lifestyle, Wellness)
- 2 to 4 meaningful blocks per pillar
- plenty of spacing between sections

### Avoid

- desktop-grid compression
- dense chart farms
- lots of competing micro-metrics

## 3. Profile

This should feel like a calm settings screen, not a back-office form.

Desired feel:

- structured
- editable
- stable

### Visual Priorities

- grouped settings sections
- anchored save action
- clear separation between editable blocks
- good spacing around labels and values

### Avoid

- giant all-at-once form walls
- tiny helper text under every field
- users needing to scroll forever to save

## 4. Onboarding

This should feel warm and guided, not like tax software.

Desired feel:

- conversational
- encouraging
- fast

### Visual Priorities

- one step at a time
- visible progress
- clean choice controls
- strong continue action

### Avoid

- long multi-field forms
- stacked legal disclaimers
- too much text from Frankie at once

## Interaction Direction

## Sheets Over Permanent Chrome

Mobile should prefer bottom sheets or modals for secondary detail.

Good sheet use cases:

- goal detail
- next-step detail
- small edit flows
- future HealthKit connection setup

## Sticky Actions

Sticky actions are good when they reduce friction.

Use them for:

- chat composer
- profile save
- maybe onboarding continue button if helpful

Do not overuse sticky surfaces to the point that screens feel crowded.

## Motion

Keep motion subtle and functional.

Good:

- smooth tab transitions
- gentle sheet presentation
- nice keyboard-safe transitions
- soft loading skeletons or fades

Avoid:

- flashy fitness-app motion
- bouncing, gamified movement everywhere
- too much animation around logging

## Frankie Presence In UI

Frankie should be felt more through:

- tone
- pacing
- suggestions
- message quality

than through:

- mascot overload
- repeated branding blocks
- constant explanatory coach boxes

This means:

- Frankie can have a small visual identity
- but the app should not keep yelling "coach" on every screen

## Accessibility And Readability

This app deals with daily habits and wellness. It should be comfortable to use.

Mobile design should prioritize:

- large enough text
- strong enough contrast
- clear tap targets
- safe spacing near screen edges
- readable message bubbles

## What To Carry Forward From Web

- dark blue system
- edge-to-edge confidence where appropriate
- cleaner, shorter headers
- less duplication
- quieter UI language
- cards with enough breathing room

## What To Improve Beyond Web

- more native-feeling navigation
- cleaner keyboard behavior
- even tighter copy discipline
- stronger one-thumb ergonomics
- fewer dense information blocks

## Strong Recommendation

If the mobile app has one clear design rule, it should be this:

**show less, but make what remains feel more intentional.**

That fits the Frankie Fit product better than trying to prove value through more panels, more labels, or more data on screen.

## Suggested Next Step

After the first mobile implementation, the strongest next design work is:

- tighten the dashboard and profile screens against web parity
- keep testing keyboard and tab-bar behavior on device
- refine the read-only HealthKit permission and import flow after the first native spike
