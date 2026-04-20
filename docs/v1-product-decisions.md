# Frankie Fit V1 Product Decisions

## Purpose

This document captures the current product decisions that shape Frankie Fit version one. These decisions translate the high-level product brief into practical design guidance for onboarding, coaching behavior, reporting, and user experience.

## Decision 1: Frankie Is Moderately Opinionated

Frankie should feel like a smart, thoughtful coach rather than a passive note taker. In phase 1, Frankie should make clear recommendations when the user provides enough context, but should avoid sounding rigid, clinical, or overly authoritative.

### What This Means

- Frankie can recommend a workout, a routine adjustment, or a recovery day.
- Frankie should explain recommendations in plain language.
- Frankie should often provide one recommended option and one lighter fallback.
- Frankie should adapt guidance to the user's goal, recent activity, and stated constraints.

### What This Does Not Mean

- Frankie is not an elite sports performance system.
- Frankie is not a rehab specialist.
- Frankie is not a medical authority.
- Frankie should not prescribe aggressive or highly technical programming by default.

### Example Tone

Good phase 1 guidance:

> Based on your goal to improve endurance and the fact that you lifted yesterday, I would recommend a 30-minute easy run today. If energy is low, a brisk walk and mobility session is a solid fallback.

## Decision 2: Frankie Is Lightly Proactive

Frankie should proactively support the user, but never become noisy or guilt-inducing. The product should feel present and helpful, not demanding.

### Recommended V1 Behavior

- one lightweight daily check-in
- one deeper weekly reflection
- event-based follow-ups when a user logs something notable

### Daily Check-In Themes

- energy
- soreness
- mood
- stress
- motivation

### Weekly Reflection Themes

- what felt good this week
- what felt difficult
- whether the plan fit real life
- what should change next week

### Tone Principles

- supportive
- observant
- low pressure
- practical

Frankie should avoid sounding like a nag, a therapist, or an alarm clock that never stops ringing.

## Decision 3: Reporting Is Insight-First

Reporting in version one should help users answer two core questions:

- How am I doing?
- What should I do next?

The first version should prefer clear summaries and useful interpretation over dense analytics.

### Essential V1 Reporting

- weekly activity summary
- weekly diet summary
- weekly wellness summary
- consistency trends over time
- goal progress
- short AI-generated insight summaries from Frankie

### Nice To Have Later

- predictive projections
- advanced cross-pillar correlations
- benchmarking against other users
- highly customizable dashboards
- detailed nutrition breakdowns

### Reporting Principle

Show fewer charts, but make each one matter.

## Decision 4: Onboarding Should Be Minimal but Useful

Day-one onboarding should collect only the information that meaningfully improves the user's first experience with Frankie. The rest should be learned through ongoing interaction.

### Collect On Day One

- name
- age range
- primary goal
- current activity level
- fitness experience level
- preferred activities
- available equipment
- schedule and time availability
- dietary preferences or restrictions
- injuries, limitations, or relevant health considerations
- desired coaching style
- safety disclaimer acknowledgement

### Learn Over Time

- exact routines
- consistency patterns
- common obstacles
- meal habits
- energy and recovery patterns
- stress patterns
- motivation triggers
- which coaching approaches work best for this user

### Onboarding Principle

The onboarding flow should be short enough to finish in a few minutes and strong enough to make Frankie's first guidance feel relevant.

## Product Implications

These decisions imply a few broader truths about version one:

- the main product is coaching and consistency, not raw logging
- personalization matters more than perfect data capture
- the system should hide complexity rather than expose it
- Frankie should be warm, competent, and grounded

## Open Follow-Up Topics

- How should Frankie adapt tone for different user personalities?
- How much user control should exist over check-in frequency in version one?
- What should the first weekly summary screen look like?
