# Frankie Fit Database Schema Plan

## Purpose

This document turns the MVP architecture into a concrete database plan for Frankie Fit version one. It explains the schema choices behind the first Supabase migration and gives us a stable reference for implementation.

## Design Principles

- use Supabase Auth as the source of truth for authentication
- keep product data in structured tables even when user input is conversational
- optimize for the MVP first, not a perfect long-term normalized model
- default real-user privacy to strict owner-only access
- allow deeper review only for internal test and synthetic demo accounts
- keep flexible or evolving fields in `jsonb` only where the shape is likely to change

## Core Design Decisions

## 1. `auth.users` owns authentication, `public.profiles` owns product context

We do not need a duplicate application users table for auth credentials. Supabase already provides `auth.users`. The application-specific user record should live in `public.profiles`.

This means:

- auth identity lives in `auth.users`
- role, account type, onboarding context, and coaching preferences live in `public.profiles`

## 2. Keep onboarding data in one wide profile table for v1

For the MVP, onboarding and coaching context belong in a single `profiles` table instead of being split across many smaller tables.

Why:

- simpler reads for Chat and Profile
- easier onboarding implementation
- fewer joins early in development

If the product grows in complexity later, this can be decomposed.

## 3. Chat transcript and structured logs should both exist

Frankie Fit needs both:

- conversation history for the user experience
- structured records for dashboards, trends, and summaries

That leads to:

- `conversation_threads`
- `conversation_messages`
- `activity_logs`
- `diet_logs`
- `wellness_checkins`

Structured logs can reference the source message that produced them.

## 4. Admin insight is aggregate-first

The schema should support:

- aggregate admin reporting
- product suggestions
- internal test account inspection

The schema should not imply broad default admin access to all real-user row data.

## Table Overview

## 1. `profiles`

Stores app-specific user context.

Key responsibilities:

- role and account type
- onboarding answers
- goals and preferences
- coaching context

Important fields:

- `id` referencing `auth.users(id)`
- `role`
- `account_type`
- `primary_goal`
- `secondary_goals`
- `preferred_activities`
- `diet_preferences`
- `coaching_style`
- `onboarding_completed`
- `onboarding_summary`

## 2. `conversation_threads`

Stores user chat threads with Frankie.

Important fields:

- `id`
- `user_id`
- `title`
- `created_at`
- `updated_at`

## 3. `conversation_messages`

Stores individual chat messages.

Important fields:

- `thread_id`
- `user_id`
- `role`
- `message_type`
- `content`
- `structured_payload`

## 4. `activity_logs`

Stores structured activity entries extracted from chat or quick logging.

Important fields:

- `user_id`
- `source_message_id`
- `activity_type`
- `description`
- `duration_minutes`
- `intensity`
- `logged_for_date`

## 5. `diet_logs`

Stores structured diet entries.

Important fields:

- `user_id`
- `source_message_id`
- `description`
- `meal_type`
- `logged_for_date`
- `confidence`

## 6. `wellness_checkins`

Stores structured wellness signals.

Important fields:

- `user_id`
- `source_message_id`
- `energy_score`
- `soreness_score`
- `mood_score`
- `stress_score`
- `motivation_score`
- `notes`
- `logged_for_date`

## 7. `recommendations`

Stores the user's current or historical next-step guidance.

Important fields:

- `user_id`
- `recommendation_type`
- `title`
- `body`
- `status`
- `generated_from_date`

## 8. `weekly_summaries`

Stores generated weekly summaries by domain.

Important fields:

- `user_id`
- `week_start`
- `domain`
- `summary_text`
- `structured_metrics_json`

## 9. `product_suggestions`

Stores admin-facing product suggestions and evidence.

Important fields:

- `suggestion_type`
- `title`
- `summary`
- `evidence_json`
- `status`
- `created_by`
- `reviewed_at`

## Enum Plan

The MVP migration should define these enums:

- `app_role`
  - `user`
  - `admin`
- `account_type`
  - `real_user`
  - `internal_test`
  - `synthetic_demo`
- `message_role`
  - `user`
  - `assistant`
  - `system`
- `message_type`
  - `chat`
  - `onboarding`
  - `log_confirmation`
  - `summary`
  - `recommendation`
  - `checkin_prompt`
  - `system_event`
- `recommendation_type`
  - `general`
  - `activity`
  - `diet`
  - `wellness`
- `recommendation_status`
  - `active`
  - `completed`
  - `dismissed`
  - `expired`
- `summary_domain`
  - `overall`
  - `exercise`
  - `diet`
  - `wellness`
- `product_suggestion_status`
  - `proposed`
  - `under_review`
  - `approved`
  - `rejected`

## Relationship Summary

```text
auth.users
  |
  v
profiles
  |
  +--> conversation_threads
  |       |
  |       v
  |     conversation_messages
  |
  +--> activity_logs
  +--> diet_logs
  +--> wellness_checkins
  +--> recommendations
  +--> weekly_summaries

profiles (admin users only)
  |
  v
product_suggestions.created_by
```

## Field Shape Decisions

## Arrays

Use `text[]` for simple multi-select or list-style profile fields such as:

- `secondary_goals`
- `current_activities`
- `preferred_activities`
- `available_equipment`
- `diet_preferences`
- `diet_restrictions`
- `wellness_support_focus`
- `injuries_limitations`
- `health_considerations`
- `avoidances`

Why:

- easy to read and write
- enough structure for v1 filters and rendering
- lower complexity than introducing multiple join tables immediately

## JSONB

Use `jsonb` for fields with likely shape variation:

- `preferred_schedule`
- `structured_payload`
- `metadata_json`
- `structured_metrics_json`
- `evidence_json`

Why:

- preserves flexibility
- avoids premature normalization
- supports evolving AI and analytics payloads

## Index Plan

The first migration should include indexes for the most common access patterns.

Recommended indexes:

- `profiles(role)`
- `profiles(account_type)`
- `conversation_threads(user_id, updated_at desc)`
- `conversation_messages(thread_id, created_at)`
- `conversation_messages(user_id, created_at desc)`
- `activity_logs(user_id, logged_for_date desc)`
- `diet_logs(user_id, logged_for_date desc)`
- `wellness_checkins(user_id, logged_for_date desc)`
- `recommendations(user_id, status, created_at desc)`
- `weekly_summaries(user_id, week_start desc, domain)`
- `product_suggestions(status, created_at desc)`

Recommended uniqueness:

- `weekly_summaries(user_id, week_start, domain)` should be unique

## Trigger and Function Plan

The MVP migration should include:

- `set_updated_at()` trigger helper
- `handle_new_user()` trigger to create a `profiles` row after signup
- `touch_conversation_thread()` trigger so new messages refresh thread ordering
- helper functions for RLS:
  - `current_app_role()`
  - `is_admin()`
  - `is_reviewable_account(target_user_id uuid)`

## Row-Level Security Strategy

## Standard User Access

Users should be able to:

- read and update their own profile
- read and write only their own threads, messages, logs, recommendations, and summaries

## Admin Access

Admins should be able to:

- read admin-facing product suggestions
- review rows for internal test and synthetic demo accounts where needed

Admins should not automatically gain open row-level access to all real-user data.

## Product Suggestions

`product_suggestions` should be admin-only.

## Migration Scope

The first schema migration should include:

- extensions
- enums
- core tables
- timestamps and triggers
- indexes
- RLS functions
- RLS policies

It should not include:

- advanced analytics views
- scheduled jobs
- food image analysis tables
- experimental feature-flag systems

## Implementation Notes

- keep most date/time fields in UTC
- use `date` for user-facing logged entries such as `logged_for_date`
- use `timestamptz` for creation and system timestamps
- keep AI-derived details in structured tables, not only in raw chat transcripts

## Open Modeling Questions

- Should weekly summaries be stored immediately, or only once we add scheduled jobs?
- Should we eventually split coaching preferences into a separate table if they become more complex?
- Do we want a separate event table later for product analytics, or keep analytics outside the transactional schema?

## Practical Next Step

After this schema plan, the next natural artifact is an implementation backlog tied directly to the first migration and app slices.
