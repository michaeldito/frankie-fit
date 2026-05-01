# Frankie Fit Deployment Strategy

## Purpose

This document defines a deployment strategy for Frankie Fit that balances two goals:

- keep the MVP simple enough to ship and learn from
- create a clean path to deeper cloud deployment learning later

The point is not to lock into a forever hosting choice today. The point is to make a good first decision and avoid accidental coupling that would make a later move painful.

## Recommendation Summary

Frankie Fit should use a phased deployment strategy.

### Phase 1

Start with:

- Vercel for the Next.js app
- Supabase for database, auth, and storage

### Phase 2

Once the core product is working, move app hosting to either:

- AWS
- GCP

while keeping Supabase in place initially.

### Phase 3

Only later, if it is truly valuable, consider migrating database and auth into a fuller cloud-native stack.

## Why This Is the Recommended Path

This approach keeps the first version manageable while still giving you meaningful cloud deployment learning later.

Benefits:

- the MVP is faster to build and deploy
- the product gets real before infrastructure gets complex
- the later cloud move becomes a focused learning project, not an accidental blocker
- database and auth migrations are deferred until they are worth the cost

## Phase 1: Easiest MVP Path

### Hosting Shape

- frontend and backend routes on Vercel
- Supabase Postgres
- Supabase Auth
- OpenAI API

### What You Learn

- how to deploy a modern full-stack web app
- how environment variables and production config work
- how auth callbacks and protected routes behave in production
- how to reason about staging versus production
- how the app behaves outside local development

### Why This Is Worth Doing First

Even though Vercel is the easy path, it still teaches important deployment fundamentals without forcing containerization, cloud networking, IAM, or platform-specific services too early.

## Phase 2: Cloud Learning Path

After the app has real product value, move the app hosting layer to a cloud platform while keeping Supabase for the data layer.

This is the sweet spot for learning because:

- you learn cloud deployment for the app itself
- you keep the database and auth stable
- the migration scope stays understandable

## Option A: AWS Learning Path

Recommended shape:

- host the Next.js app as a container
- deploy on AWS App Runner or ECS/Fargate
- store secrets in AWS Secrets Manager or SSM Parameter Store
- use Route 53 for DNS when ready
- use CloudWatch for logs and monitoring

### Why AWS Later

- strongest breadth of cloud concepts
- valuable for learning broader infrastructure patterns
- good long-term exposure if you want deeper cloud fluency

### Tradeoff

AWS will teach you more infrastructure, but it will also ask more of you operationally.

## Option B: GCP Learning Path

Recommended shape:

- host the Next.js app as a container
- deploy on Cloud Run
- store secrets in Secret Manager
- use Cloud DNS when ready
- use Cloud Logging and Monitoring

### Why GCP Later

- simpler mental model for container deployment
- smoother learning curve for a small web app
- strong fit if your goal is modern serverless app hosting with less operational overhead

### Tradeoff

GCP is often simpler for this style of app, but AWS usually gives broader market exposure.

## Recommended Choice Later

If your main goal is:

- easiest cloud learning migration: GCP
- broader cloud platform exposure: AWS

If you do not yet have a strong preference, keep that choice open until the app is real enough to deploy.

## Phase 3: Deeper Cloud-Native Migration

This phase is optional and should happen only if the project has enough maturity to justify it.

Possible later moves:

- move Postgres from Supabase to RDS or Cloud SQL
- move storage concerns to S3 or Google Cloud Storage
- adopt a cloud-native auth layer if there is a strong reason
- add scheduled jobs, queues, and deeper observability

### Important Caution

Database and auth migrations are much heavier than app-hosting migrations.

That is why this strategy recommends:

- move the app host first
- move the data/auth layer only later, if needed

## Portability Guardrails

To keep future deployment changes smooth, Frankie Fit should follow a few rules from day one.

### Guardrail 1: Avoid Vercel-Only Product Dependencies

Do not build core product behavior around:

- Vercel KV
- Vercel Blob
- Vercel-specific cron features
- Edge-only assumptions unless clearly needed

Using these too early would make a later AWS or GCP move unnecessarily harder.

### Guardrail 2: Keep the App Stateless

The web app should not depend on local disk or sticky sessions. That keeps deployment portable across Vercel, containers, Cloud Run, App Runner, and ECS.

### Guardrail 3: Keep Secrets and Config External

All environment-specific config should live in environment variables and deployment configuration, not in code.

### Guardrail 4: Keep Postgres Compatibility

Use standard Postgres-friendly schema and query patterns. That keeps a future move from Supabase Postgres to RDS or Cloud SQL realistic.

### Guardrail 5: Keep Storage Abstractions Clean

If file uploads arrive later, wrap storage access behind a simple interface so Supabase Storage can be swapped more easily if needed.

### Guardrail 6: Keep Auth Boundaries Explicit

Let the app depend on clear user identity and role data, not on Supabase-specific implementation details bleeding everywhere through the codebase.

## What Changes If Hosting Changes Later

If we move from Vercel to AWS or GCP later, these areas change:

### App Hosting

- deployment target
- build pipeline
- runtime configuration

### Secrets Management

- where environment variables live
- how production secrets are rotated and accessed

### Domains and Environments

- DNS provider setup
- preview environment strategy
- auth callback URLs

### Logging and Monitoring

- Vercel logs become CloudWatch or Cloud Logging
- alerting and observability setup changes

### Background Jobs

- if later added, these may move to cloud-native schedulers or workers

## What Stays the Same

If we keep the architecture portable, these things should remain mostly unchanged:

- Next.js application code
- UI components
- Frankie prompt and tool logic
- OpenAI integration
- Supabase schema and tables
- product routes and user flows

## Decision Gates

We do not need to choose AWS or GCP immediately. We should choose at a smart point.

### Gate 1: After Milestone 3

Once Chat plus activity logging works, decide whether:

- to stay on Vercel through the first real MVP
- or to start the cloud-hosting learning migration

### Gate 2: After Milestone 6

Once dashboard summaries exist, decide whether:

- to keep Supabase as the long-term data layer for now
- or to plan a deeper cloud-native move later

## Recommended Immediate Decision

As of May 1, 2026, the immediate deployment decision is:

- deploy the first working version with Vercel and Supabase
- keep Supabase as the database/auth layer
- keep OpenAI and Supabase privileged keys server-side only
- point the mobile app at the deployed trusted API route when testing against production-like behavior
- keep the codebase portable
- revisit AWS versus GCP after the Vercel MVP is live and the core Frankie workflow is stronger

This gives you:

- a real shipped product baseline
- a cleaner cloud migration project later
- less overload in the earliest build phase

## Vercel MVP Readiness Checklist

Before treating the Vercel deployment as the MVP baseline, verify:

- production environment variables are configured in Vercel
- OpenAI keys and Supabase service-role or secret keys are never exposed to the mobile client
- Supabase auth callback URLs include the Vercel production URL
- signup, login, onboarding, chat, dashboard, profile, and admin routes work outside localhost
- `/api/mobile/chat` works from a mobile build using the deployed API base URL
- RLS and admin access rules are reviewed after deployment
- logs are useful enough to debug failed chat requests
- demo or seed data is not inserted into production unless explicitly intended

The next deployment pass should prefer a boring, inspectable Vercel launch over introducing GCP or AWS too early. The later cloud migration is still valuable, but it should become a focused learning project after the product baseline is real.

## Suggested Next Artifact

When the time comes, the next deployment-focused artifact should be a concrete environment and deployment plan covering:

- local
- preview
- production
- secrets
- DNS
- auth callback URLs
- monitoring
- CI/CD
