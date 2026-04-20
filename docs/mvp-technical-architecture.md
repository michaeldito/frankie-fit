# Frankie Fit MVP Technical Architecture

## Purpose

This document defines a recommended technical architecture for Frankie Fit version one. It translates the current product, UX, and content decisions into a concrete build plan for the MVP.

The goal is not to design the final forever-system. The goal is to choose a technical path that is:

- simple enough to build and learn from
- strong enough to support the core product experience
- structured enough to evolve cleanly later

## Architecture Summary

Frankie Fit v1 should be built as a single full-stack TypeScript application using:

- Next.js for the web app
- React for the UI
- Supabase for database, auth, and storage
- OpenAI for Frankie's conversational intelligence
- Vercel for web deployment

This gives the project:

- one codebase
- a fast path to auth and data storage
- good ergonomics for building AI-assisted product flows
- a clean path to responsive web now and mobile later

## Recommended Stack

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui or a similar lightweight component layer

### Backend

- Next.js server actions and route handlers for most application logic
- Supabase Postgres as the primary database
- Supabase Auth for user authentication
- Supabase Storage for future file and media storage needs

### AI Layer

- OpenAI API
- a single Frankie conversation interface
- structured backend tools/functions for:
  - activity logging
  - diet logging
  - wellness check-ins
  - plan generation
  - reporting summaries

### Hosting and Infrastructure

- Vercel for the Next.js app
- Supabase managed services for database/auth/storage

## High-Level System Shape

```text
User Browser
    |
    v
Next.js Web App
    |
    +--> UI routes and components
    +--> server actions / route handlers
              |
              +--> Supabase Auth
              +--> Supabase Postgres
              +--> OpenAI API
              +--> future background jobs / storage
```

## Core Architectural Decisions

## 1. One Full-Stack Repo

Frankie Fit should start as one repository containing:

- marketing site
- authenticated app
- server-side app logic
- AI orchestration layer
- shared types and domain utilities

### Why

- easier for a single builder or small team
- less boilerplate and fewer cross-repo coordination problems
- simpler learning and debugging experience

## 2. Responsive Web First

The MVP should target web first, with responsive behavior for mobile-sized screens, but not a separate native mobile app.

### Why

- faster to ship
- avoids splitting product effort too early
- preserves a path to native mobile later once the product proves itself

## 3. Single Frankie Interface, Structured Tools Behind It

Users should feel like they are talking to one Frankie. Under the hood, the system can route requests through structured backend tools.

### Why

- preserves the product simplicity
- keeps implementation modular
- allows later expansion into more specialized subsystems without changing the user experience

## 4. Product Data Should Be Structured, Even If Input Is Conversational

Even though users type in natural language, the system should convert that input into structured domain records.

### Why

- enables dashboards and trends
- makes reporting reliable
- supports future analytics and product evolution features

## Core Product Flows

## 1. Onboarding Flow

### Flow

1. user signs up or logs in
2. user completes onboarding conversation with Frankie
3. onboarding answers are saved as structured profile data
4. Frankie generates a short onboarding summary
5. user is taken to Chat as the default authenticated landing experience

### Key Data Produced

- user profile
- goals
- preferences
- schedule context
- diet and wellness context
- coaching preferences
- safety acknowledgement

## 2. Chat and Logging Flow

### Flow

1. user sends a message to Frankie
2. backend classifies the message intent
3. the system decides whether the message is:
   - general conversation
   - activity log
   - diet log
   - wellness check-in
   - planning/coaching request
4. the system extracts structured fields when applicable
5. records are stored in Postgres
6. Frankie responds with confirmation, insight, or next guidance

### Example

User message:

> I did upper body yesterday and walked 35 minutes this morning.

Potential stored results:

- activity log 1: upper body session
- activity log 2: 35-minute walk
- updated conversation message records

## 3. Dashboard Flow

### Flow

1. user opens Dashboard
2. app queries structured records by domain
3. server computes summaries and trends
4. Frankie-style insights are generated from summary data
5. UI renders the selected tab

### Design Principle

The dashboard should not depend on the raw chat transcript alone. It should be driven by structured records and computed summaries.

## 4. Admin Overview Flow

### Flow

1. admin opens admin route
2. system checks admin role
3. app queries aggregate metrics and anonymized summaries
4. test account inspection tools are made available only where appropriate
5. admin reviews product signals, friction, and suggested improvements

## Core Domain Model

Below is a practical v1 domain model. These are conceptual entities, not final SQL definitions.

## 1. User

Represents an authenticated person using the app.

Suggested fields:

- id
- email
- full_name
- role
- account_type
- created_at
- updated_at

### Notes

- `role` can distinguish standard users and admins
- `account_type` can distinguish real users, internal test users, and synthetic demo users

## 2. User Profile

Stores onboarding-derived coaching context.

Suggested fields:

- user_id
- age_range
- primary_goal
- secondary_goals
- activity_level
- fitness_experience
- preferred_activities
- available_equipment
- training_environment
- target_training_days
- typical_session_length
- preferred_schedule
- diet_preferences
- diet_restrictions
- nutrition_goal
- energy_baseline
- stress_baseline
- wellness_support_focus
- wellness_checkin_opt_in
- injuries_limitations
- health_considerations
- avoidances
- coaching_style
- preferred_checkin_style
- safety_acknowledged

## 3. Conversation Thread

Represents a chat thread between the user and Frankie.

Suggested fields:

- id
- user_id
- title
- created_at
- updated_at

## 4. Conversation Message

Stores individual messages exchanged with Frankie.

Suggested fields:

- id
- thread_id
- user_id
- role
- content
- message_type
- created_at

### Notes

- `role` might be `user`, `assistant`, or `system`
- `message_type` can help distinguish ordinary chat from structured confirmations or summaries

## 5. Activity Log

Represents a structured exercise or movement entry.

Suggested fields:

- id
- user_id
- source_message_id
- activity_type
- description
- duration_minutes
- intensity
- logged_for_date
- metadata_json
- created_at

## 6. Diet Log

Represents a structured food entry.

Suggested fields:

- id
- user_id
- source_message_id
- description
- meal_type
- logged_for_date
- confidence
- metadata_json
- created_at

## 7. Wellness Check-In

Represents a structured wellness signal entry.

Suggested fields:

- id
- user_id
- source_message_id
- energy_score
- soreness_score
- mood_score
- stress_score
- motivation_score
- notes
- logged_for_date
- created_at

## 8. Recommendation

Represents a next-step recommendation shown to the user.

Suggested fields:

- id
- user_id
- recommendation_type
- title
- body
- status
- generated_from_date
- created_at

### Notes

- useful for powering the compact `Next best step` surface

## 9. Weekly Summary

Represents a generated summary of progress.

Suggested fields:

- id
- user_id
- week_start
- domain
- summary_text
- structured_metrics_json
- created_at

## 10. Product Suggestion

Represents a system-suggested product insight for admin review.

Suggested fields:

- id
- suggestion_type
- title
- summary
- evidence_json
- status
- created_at
- reviewed_at

## Role and Access Model

## Standard User

- can access only their own data
- can access Chat, Dashboard, and Profile
- cannot access admin routes

## Admin

- can access aggregate admin views
- can access test-account inspection tooling
- should not have default unrestricted access to detailed real-user data

## Internal Test User

- behaves like a normal user in product flows
- can be flagged as reviewable for internal QA and experimentation

## AI Orchestration Model

## Core Principle

Frankie should behave like one coach, but use structured system capabilities under the hood.

## Suggested Request Pipeline

1. receive user message
2. load minimal relevant user context
3. decide whether a structured tool should run
4. run tool(s) if needed
5. persist structured records
6. generate Frankie response
7. save assistant message

## Suggested Backend Tool Surface

### Tool: `log_activity`

Responsibilities:

- extract exercise entries from natural language
- normalize into structured activity records
- persist activity logs

### Tool: `log_diet`

Responsibilities:

- extract meal or food information
- create structured diet log records
- mark confidence if details are fuzzy

### Tool: `log_wellness_checkin`

Responsibilities:

- extract wellness indicators
- create structured check-in records

### Tool: `generate_recommendation`

Responsibilities:

- produce the user's next best step
- power compact recommendation UI

### Tool: `generate_weekly_summary`

Responsibilities:

- aggregate domain data
- produce domain summaries for Exercise, Diet, and Wellness

## Important MVP Constraint

Avoid trying to build a fully agentic multi-agent system on day one. Start with one Frankie orchestration layer and simple, explicit tool paths.

## Data Access Patterns

## Chat Screen

Needs:

- current thread messages
- current goal snapshot
- latest recommendation
- recent structured logging context

## Dashboard

Needs:

- activity summaries
- diet summaries
- wellness summaries
- recent records
- generated Frankie insights

## Profile

Needs:

- user profile and editable coaching context

## Admin Overview

Needs:

- aggregate usage metrics
- onboarding completion rates
- domain usage distribution
- common request categories
- top friction categories
- test account list access

## Suggested Route Structure

### Public Routes

- `/`
- `/privacy`
- `/early-access`

### Auth Routes

- `/login`
- `/signup`
- `/onboarding`

### User App Routes

- `/app/chat`
- `/app/dashboard`
- `/app/profile`

### Admin Routes

- `/app/admin`
- `/app/admin/test-accounts`
- `/app/admin/suggestions`

## Suggested Codebase Shape

```text
frankie-fit/
  app/
    (marketing)/
    (auth)/
    app/
      chat/
      dashboard/
      profile/
      admin/
  components/
    marketing/
    app-shell/
    chat/
    dashboard/
    profile/
    admin/
    ui/
  lib/
    auth/
    db/
    ai/
    domain/
    summaries/
    permissions/
  types/
  supabase/
    migrations/
    seed/
  docs/
```

## Suggested `lib` Responsibilities

### `lib/ai`

- prompt construction
- structured tool routing
- Frankie response generation

### `lib/domain`

- activity logic
- diet logic
- wellness logic
- recommendation generation rules

### `lib/summaries`

- weekly summary computation
- dashboard metric shaping

### `lib/permissions`

- route guards
- admin vs user visibility rules

## MVP Feature Slices

The product should be built in vertical slices rather than all layers at once.

## Slice 1: Auth + Onboarding

Includes:

- signup/login
- onboarding conversation
- user profile persistence
- post-onboarding redirect to Chat

## Slice 2: Chat + Activity Logging

Includes:

- Chat screen
- conversation persistence
- activity extraction
- activity log storage
- simple Frankie confirmation and next-step guidance

## Slice 3: Diet Logging

Includes:

- diet extraction and storage
- diet confirmations
- diet dashboard tab

## Slice 4: Wellness Check-Ins

Includes:

- wellness check-in extraction
- wellness dashboard tab
- lightweight proactive check-in support

## Slice 5: Dashboard Summaries

Includes:

- shared dashboard shell
- Exercise, Diet, and Wellness tabs
- summary metrics
- Frankie insights
- compact `Next best step`

## Slice 6: Admin Overview

Includes:

- admin auth/authorization
- aggregate metrics
- common request summaries
- friction view
- test account access

## Security and Privacy Notes

## Privacy Principles

- default all user-level access to owner-only
- default admin insights to aggregate views
- isolate test-account inspection from real-user inspection
- keep role checks explicit in server-side code

## Sensitive Areas

- profile health-related context
- chat transcripts
- wellness check-ins
- admin access tooling

## MVP Security Requirements

- auth required for app routes
- server-side authorization checks for admin routes
- row-level protections or equivalent access controls in Supabase
- clear separation of real users and internal test users

## Observability and Product Learning

V1 should keep observability simple but useful.

Suggested tracking areas:

- signup completion
- onboarding completion
- first log created
- logs by pillar
- dashboard visits
- weekly summary views
- drop-off points during onboarding

### Important Principle

Product analytics should support learning without undermining user trust.

## Future-Friendly Extension Points

This architecture should leave room for:

- food image analysis
- richer recommendation systems
- mobile app clients
- background jobs for summaries and nudges
- more advanced experimentation and product suggestion logic

## What Not To Overbuild In V1

- multi-agent architecture
- overly complex event buses
- microservices
- advanced nutrition science engines
- real-time collaboration systems
- full autonomous product recommendation loops

## Environment Variables

Likely environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL`

## Deployment Recommendation

See also:

- [Deployment Strategy](C:/Users/mcdit/Code/frankie-fit/docs/deployment-strategy.md)

## Web App

- deploy Next.js app to Vercel

## Database/Auth/Storage

- use Supabase hosted project

## Local Development

- run Next.js locally
- use Supabase local or hosted dev environment

## Recommended MVP Default Decisions

- Next.js App Router
- TypeScript everywhere
- one full-stack repo
- Supabase Postgres + Auth
- OpenAI-backed Frankie orchestration
- responsive web first
- Vercel deployment

### Deployment Note

This MVP architecture intentionally optimizes for the easiest first deploy. The phased cloud-learning plan lives in [Deployment Strategy](C:/Users/mcdit/Code/frankie-fit/docs/deployment-strategy.md).

## Open Architecture Questions

- Should weekly summaries be generated on demand at first, or precomputed on a schedule?
- Should recommendations be regenerated every time relevant data changes, or fetched lazily?
- How much conversation history should Frankie receive on each request versus summary memory?

## Practical Next Step

The next build-focused artifact should be a database schema plan and implementation backlog based on this architecture.
