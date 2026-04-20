# Frankie Fit V1 Dashboard and Screen Spec

## Purpose

This document defines the initial product surfaces for Frankie Fit version one. It translates the product brief into a concrete set of authenticated app screens for both standard users and the admin experience.

The goal of this spec is clarity, not visual design polish. It answers:

- what screens exist in v1
- what each screen is for
- what each screen needs to show
- what users can do from each screen
- what stays out of scope for now

## Product Surface Model

Frankie Fit has two distinct authenticated experiences:

- user experience: a personal coach and progress companion
- admin experience: a product control tower and oversight surface

These two experiences should share infrastructure and branding, but not the same information architecture.

## Design Principles

- conversation is the center of the product
- dashboards support the conversation rather than replace it
- each screen should answer a small number of user questions clearly
- insights matter more than raw data density
- the interface should feel calm, modern, and low-friction

## Information Architecture

### User Navigation

The v1 user app should include:

- Chat
- Dashboard
- Profile

### Admin Navigation

The v1 admin app should include:

- Overview
- User Insights
- Test Accounts
- Product Suggestions
- Settings

## User Experience

## 1. Chat

### Purpose

This is the primary home of the product. Most user activity should begin here.

This should be the default landing screen after login in version one.

### Primary User Questions

- What should I do today?
- What have I already told Frankie?
- How do I log something quickly?
- What does Frankie recommend next?

### Key Components

- main conversation thread with Frankie
- message composer for free-form text input
- quick actions for:
  - log workout
  - log meal
  - check in
  - ask for a plan
- a compact "today" panel showing:
  - today's suggested focus
  - last logged item
  - pending check-in if relevant
- conversation memory cues, such as:
  - current goal
  - this week's training target
  - recent trend summary

### Core Actions

- send a message to Frankie
- log an activity in natural language
- log food in natural language
- complete a wellness check-in
- ask Frankie for a workout or routine suggestion
- ask Frankie to summarize the week so far

### Empty State

If the user is new or inactive, Frankie should prompt a simple first action:

> Want to get moving? Tell me what you did today, what you ate, or how you are feeling, and I will take it from there.

### Out of Scope for V1

- audio transcription UI
- image upload for food analysis
- multi-agent experiences
- advanced chat customization

## 2. Exercise

### Purpose

The Exercise screen helps the user understand their recent activity, consistency, and next recommended move.

In version one, this should be implemented as a tab inside a shared dashboard shell rather than as a fully separate standalone section.

### Primary User Questions

- How active have I been lately?
- Am I staying consistent?
- What kinds of training have I been doing?
- What should I do next?

### Key Components

- weekly activity summary card
- recent exercise log
- activity trend chart
- consistency view, such as active days per week
- activity breakdown by type
- Frankie insight panel with a short takeaway
- recommended next workout or recovery suggestion

### Core Metrics

- workouts or sessions this week
- active days this week
- total minutes or estimated effort
- distribution across activity types
- streak or consistency trend

### Core Actions

- add workout
- edit recent log
- ask Frankie for today's workout
- view prior activity entries

### Out of Scope for V1

- elite training analytics
- wearable integrations
- route maps
- detailed PR tracking

## 3. Diet

### Purpose

The Diet screen helps users build awareness around eating patterns without forcing precise calorie tracking.

In version one, this should be implemented as a tab inside a shared dashboard shell rather than as a fully separate standalone section.

### Primary User Questions

- Have I been logging meals consistently?
- What patterns is Frankie noticing in my eating?
- Is my current eating aligned with my goals?
- What is one useful improvement to focus on?

### Key Components

- weekly diet summary card
- recent meal log
- meal pattern summary
- consistency view for diet logging
- Frankie nutrition insight panel
- one suggested next step, such as:
  - increase protein awareness
  - improve meal consistency
  - simplify weekday lunches

### Core Metrics

- meals logged this week
- days with at least one food log
- recurring meal patterns or categories
- simple alignment summary against stated goal

### Core Actions

- log meal
- edit meal log
- ask Frankie for food guidance
- ask Frankie to summarize recent diet patterns

### Out of Scope for V1

- barcode scanning
- image-based meal analysis
- exact calorie and macro breakdowns as a required workflow
- highly detailed micronutrient dashboards

## 4. Wellness

### Purpose

The Wellness screen helps users reflect on energy, recovery, mood, stress, and the overall sustainability of their routine.

In version one, this should be implemented as a tab inside a shared dashboard shell rather than as a fully separate standalone section.

### Primary User Questions

- How have I been feeling lately?
- Is my routine helping or draining me?
- What patterns is Frankie seeing in my recovery and consistency?
- What should I adjust?

### Key Components

- weekly wellness summary
- recent check-in history
- simple trend views for:
  - energy
  - soreness
  - mood
  - stress
  - motivation
- Frankie wellness insight panel
- suggested adjustment for the coming days

### Core Metrics

- check-ins completed this week
- average self-reported energy trend
- average self-reported recovery trend
- notable highs or lows flagged by Frankie

### Core Actions

- complete check-in
- edit recent check-in
- ask Frankie for recovery guidance
- ask Frankie to summarize wellness trends

### Out of Scope for V1

- clinical mental health assessments
- sleep device integrations
- therapy-style journaling systems
- crisis handling beyond basic safety language and escalation guidance

## 5. Profile

### Purpose

The Profile area gives users control over the context Frankie uses to coach them.

### Key Components

- personal profile summary
- goals
- preferred activities
- training availability
- dietary preferences or restrictions
- injuries and limitations
- coaching style preferences
- notification and check-in preferences

### Core Actions

- update profile details
- revise goals
- change coaching tone preferences
- adjust check-in frequency

### Out of Scope for V1

- social features
- public profiles
- community leaderboards

## Shared User Experience Rules

- Frankie should always connect dashboard data back to a clear recommendation or observation.
- Each domain screen should have one primary chart and one primary AI-generated insight rather than many competing modules.
- The chat experience should remain the shortest path to logging anything.
- Users should never need to understand data schemas or fitness jargon to use the app.
- Frankie's recommended next action should appear on every main user screen in a compact format outside of Chat.

## Admin Experience

## 1. Overview

### Purpose

The admin overview is a high-level operating view of product health.

### Primary Questions

- Are users engaging with Frankie?
- Which pillar is creating the most value?
- Where are users dropping off?
- What should we investigate next?

### Key Components

- total users by account type
- active users over time
- retention snapshots
- conversation volume
- usage distribution across Exercise, Diet, and Wellness
- onboarding completion rate
- common prompts and requests
- top friction points
- direct navigation to internal test account review
- weekly summary of product observations

### Important Rule

This view should default to aggregate and privacy-conscious reporting.

## 2. User Insights

### Purpose

This screen helps the admin understand user behavior patterns without exposing private real-user details unnecessarily.

### Key Components

- common prompts and requests
- common drop-off points
- commonly requested improvements
- usage patterns by persona or segment
- engagement by pillar
- summary of user friction themes

### V1 Privacy Rule

Real users should appear only through aggregate or appropriately anonymized insights. This screen is for product learning, not surveillance.

## 3. Test Accounts

### Purpose

This area is for inspecting internal test users and synthetic accounts more directly so product behavior can be evaluated safely.

### Key Components

- list of internal test users
- list of synthetic demo users
- visibility into conversation transcripts for approved test accounts
- ability to compare test experiences across versions or prompts
- flags for experiment enrollment

### Important Rule

Detailed inspection is allowed only for designated internal or synthetic accounts, never as the default for real users.

## 4. Product Suggestions

### Purpose

This screen supports the founder-in-the-loop evolution model.

### Primary Questions

- What value are users getting now?
- What value are they asking for next?
- Which improvements should be approved, tested, or rejected?

### Key Components

- system-generated suggestion list
- evidence for each suggestion, such as:
  - repeated user requests
  - drop-off patterns
  - friction signals
  - engagement opportunities
- recommendation status:
  - proposed
  - under review
  - approved
  - rejected

### V1 Scope Note

In version one, this can be a simple recommendation queue rather than a fully autonomous product strategy engine.

## 5. Settings

### Purpose

This area allows the admin to manage high-level operational controls.

### Key Components

- prompt or behavior configuration references
- experiment toggles
- account type management rules
- privacy and access policy settings
- reporting window controls

### Out of Scope for V1

- fully self-serve experimentation platforms
- complex role hierarchies
- full audit exploration tooling

## Permissions Model

### Standard User

- can access personal chat, dashboards, and profile
- can view only their own logs, trends, and insights
- cannot access admin surfaces

### Admin

- can access aggregate product views
- can access test account inspection tools
- can review product suggestions
- should not have unrestricted detailed visibility into real-user data by default

### Internal Test User

- behaves like a user account in the app
- can be flagged for expanded internal inspection and experiment analysis

## MVP Dashboard Requirements

If we need to cut scope aggressively, the minimum viable dashboard set is:

- Chat
- Dashboard shell with Exercise, Diet, and Wellness tabs
- Admin Overview

Profile and deeper admin areas can be simpler in the first build as long as the product foundations support them.

## Nice-To-Have Later

- mobile-specific dashboard variations
- richer chart interactivity
- cross-pillar insights pages
- cohort analysis for admin
- experiment result dashboards
- benchmark comparisons

## Resolved V1 Decisions

- Users should land on Chat by default after login.
- Exercise, Diet, and Wellness should live as tabs within a shared dashboard shell.
- Frankie's recommended next action should appear on every main user screen in a compact form outside of Chat.
- The minimum useful admin overview should include active users, onboarding completion, retention, usage by pillar, common prompts, top friction points, and test account review access.
