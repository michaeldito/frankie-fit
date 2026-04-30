# Frankie Fit Product Brief

## Product Summary

Frankie Fit is an AI-native wellness app that helps people improve their health without the friction of traditional tracking. Users interact with Frankie through a simple conversational interface, and the system turns those conversations into structured logging, personalized coaching, and meaningful progress insights.

Frankie Fit is designed to feel simple on the surface while doing sophisticated work behind the scenes. The product should reduce manual effort, increase consistency, and help users make steady progress across movement, nutrition, and mental wellness.

Related planning docs:

- [V1 Product Decisions](v1-product-decisions.md)
- [Onboarding Flow](onboarding-flow.md)
- [V1 Dashboard and Screen Spec](v1-dashboard-spec.md)
- [Frankie Voice and UI Decisions](frankie-voice-and-ui-decisions.md)
- [Frankie First-Run and In-App Copy](frankie-first-run-copy.md)
- [Landing Page Copy](landing-page-copy.md)
- [Wireframe Content Map](wireframe-content-map.md)
- [Low-Fidelity Wireframes](low-fi-wireframes.md)
- [MVP Technical Architecture](mvp-technical-architecture.md)
- [Database Schema Plan](database-schema-plan.md)
- [AI-Native Architecture Review](ai-native-architecture-review.md)
- [Mobile Architecture Plan](mobile-architecture-plan.md)
- [Mobile V1 Screen Spec](mobile-v1-screen-spec.md)
- [Mobile Repo Structure Plan](mobile-repo-structure-plan.md)
- [Mobile UI Direction](mobile-ui-direction.md)
- [Implementation Backlog](implementation-backlog.md)
- [Deployment Strategy](deployment-strategy.md)

## Motivation

Many people want to improve their health and overall well-being, but the process of doing so is often tedious. Traditional apps require detailed manual entry, repetitive note taking, and too much discipline just to capture what happened in a day.

Frankie Fit exists to lower that burden. The goal is to empower people to become who they want to be in health, wellness, and life by giving them a supportive, intelligent coach that helps them reflect, plan, and improve with minimal friction.

## Vision

Frankie Fit is a web and mobile product centered on a conversation with an AI coach named Frankie. Users should be able to interact naturally through text and voice, with image-based food analysis reserved for a later phase.

Frankie is not just a logger. Frankie is a multidisciplinary wellness coach who helps users:

- capture what they did
- understand how they are doing
- identify patterns and trends
- decide what to do next
- stay consistent over time

The experience should feel like having a thoughtful coach by your side, one who wants you to be fit, happy, and healthy.

## Core Pillars

### 1. Activity Logging

Users can describe any form of physical activity in natural language. Frankie should help them record and reason about activities such as:

- running
- biking
- rowing
- walking
- weight training
- stretching
- yoga
- mobility work

The user should not need to navigate complex forms just to log a workout.

### 2. Diet Logging

Users can tell Frankie what they ate in plain language. Frankie should help transform that into useful dietary awareness without forcing users to manually enter nutrition labels, exact calorie counts, or detailed macro breakdowns.

Food image analysis is intentionally deferred to a later phase. Phase 1 should prove the core conversational logging experience first.

### 3. Mental Wellness Coaching

Frankie should support the user's broader wellness journey with lightweight check-ins around areas such as:

- mood
- motivation
- energy
- soreness
- stress
- recovery
- overall sense of well-being

This is not clinical mental health care. The product should stay grounded in wellness, mindset, recovery, and habit support.

## Positioning

Frankie Fit should be positioned as simple to use, not simple in capability. The product magic comes from how much thoughtful work happens behind the scenes:

- extracting structured information from conversation
- remembering context over time
- identifying patterns across the three pillars
- offering personalized guidance
- surfacing trends, reports, and projections in a useful way

The product promise is not "track everything manually." The product promise is "log less, understand more, and stay consistent."

## Target User

### Phase 1 Primary Persona

Young adults who already care about fitness and want to level up. They may already work out regularly, understand basic health habits, and want a more intelligent and less tedious way to stay accountable, improve performance, and connect their routines across activity, nutrition, and wellness.

### Phase 2 Expansion Persona

Older adults and grandparents who want to improve health after years of sedentary routines. This audience would require gentler coaching, mobility-friendly activity guidance, and a more conservative approach to progression.

## User Experience Principles

- Conversation first: the main experience is talking with Frankie.
- Low friction: users should not need to fill out complex forms for ordinary logging.
- Helpful structure: the system organizes the conversation into meaningful records and insights.
- Supportive tone: Frankie should feel encouraging, thoughtful, and practical.
- Personal relevance: coaching should reflect the user's goals, constraints, preferences, and stage of life.

## Product Surfaces

### User Experience

Users log in and primarily interact with Agent Frankie through chat. The user-facing interface should include:

- a primary chat experience
- simple drill-down areas for Exercise, Diet, and Wellness
- reports and dashboards inside each domain
- trend analysis and projections based on user history

The user experience should feel personal and calm, not cluttered or overly technical.

### Admin Experience

The admin experience is intentionally different from the user experience. It is a control surface for understanding product health, product value, and future direction.

Admin capabilities should eventually include:

- aggregate product usage visibility
- insights into what users are asking for and where they struggle
- review of system-suggested enhancements
- approval authority for future product changes
- controls for experiments, prompts, and feature rollouts

Users see "my coach and my progress." Admin sees "the health of the product and where it should evolve next."

## Product Evolution Philosophy

Frankie Fit should routinely assess the value it is providing to users and identify what value users may want next. The system can suggest opportunities for improvement, new features, or workflow changes, but executive approval remains human-driven.

The product can recommend. The founder decides.

## Privacy and Testing Model

Privacy should be a core trust feature.

Real users should have strong privacy protections and production-safe visibility boundaries. Internal product analysis should default to aggregate, privacy-conscious views wherever possible.

To support product iteration without compromising real user trust, the system should support three account types:

- real users with strict privacy protections
- internal test users that are explicitly designated for QA, prompt tuning, and experiment review
- synthetic or demo users used to test flows, dashboards, and seeded behaviors

Internal inspection should be limited to accounts intentionally created for testing and product development.

## Safety and Boundaries

Frankie Fit is not a licensed doctor, therapist, dietitian, or medical professional. The product should clearly communicate that its guidance is informational and supportive, not a substitute for professional medical advice, diagnosis, or treatment.

The app should encourage users to consult qualified medical professionals where appropriate.

## Phase 1 Scope

- conversational logging for activity, diet, and wellness
- onboarding that captures user context, preferences, and goals
- personalized coaching from Frankie
- simple reports and dashboards for the three pillars
- trends and lightweight projections based on user data
- web application with a simple, conversation-centered interface

## Phase 2 Candidates

- image-based food analysis
- support for older adults and grandparents as a dedicated persona
- more advanced admin experimentation and product recommendation systems
- broader input/output modalities beyond the initial core experience

## Working Product Statement

Frankie Fit is your AI-native wellness coach that helps you log less, understand more, and make steady progress across activity, diet, and mental wellness.

## Next Questions

- What should the first user-facing dashboard look like inside Exercise, Diet, and Wellness?
- What should the admin dashboard show in version one versus later phases?
- What exact voice and personality should Frankie have in conversation?
