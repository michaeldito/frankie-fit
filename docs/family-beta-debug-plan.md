# Frankie Fit Family Beta Debug Plan

## Purpose

This document defines the shortest practical path from a local Frankie Fit prototype to a private family beta that is:

- easy to deploy
- easy for 5 family members to use
- debuggable when Frankie behaves strangely
- lightweight enough to run from the existing Supabase project

This is not a large-scale production plan.

It is a focused plan for a small trusted beta where fast feedback and fast debugging matter more than perfect infrastructure separation.

## Decision Summary

For the first family beta, Frankie Fit should use:

- the existing Supabase project
- a deployed Vercel web app
- a small set of real beta users
- the existing admin overview
- a new admin `Debug` tab for conversation tracing and post-mortem analysis

This keeps setup friction low while giving the product enough observability to improve quickly.

## Why Reuse The Existing Supabase Project

For this stage, reusing the current Supabase project is a reasonable choice.

Benefits:

- less setup overhead
- faster path to testing with real people
- existing seed and reset workflows remain useful
- current auth, RLS, profiles, logs, and admin reporting all stay in one place

Tradeoffs:

- family beta data lives beside existing development and seeded data
- admin/debug queries need to be explicit about what data they show
- careless seeding or cleanup could affect beta users if done without guardrails

## Guardrails For Using One Supabase Project

To make one Supabase project workable, Frankie Fit should add a few simple guardrails.

### Guardrail 1: Keep Family Users Clearly Tagged

Add a lightweight way to identify beta users distinctly from:

- seeded internal accounts
- seeded synthetic accounts
- your own admin account

Recommended approaches:

- add a `beta_family` account type later
- or add a boolean/profile flag like `is_family_beta`

For the first pass, a profile flag is probably the smallest change.

### Guardrail 2: Never Seed Over Real Beta Accounts

The seed script should continue targeting only the known seeded account emails and account types.

Family beta accounts should never be touched by:

- reset scripts
- demo reseeds
- synthetic data cleanup

### Guardrail 3: Keep Admin Debug Intentional

The admin surface should default to:

- aggregate reporting
- explicit debug views
- explicit user/thread selection

It should not quietly become a raw surveillance interface.

## Family Beta Goal

The goal is not just "put the app online."

The goal is:

1. family members can sign in and use Frankie Fit normally
2. you can reproduce weird chat outcomes when they report them
3. you can inspect what Frankie extracted, logged, and replied with
4. you can improve prompt/tool behavior quickly without guessing

## Recommended Rollout Shape

### Phase 1: Deploy The Existing Web App

Deploy the web app to Vercel with:

- production Supabase URL
- production Supabase publishable key
- service-role key server-side only
- OpenAI API key server-side only
- production app URL and auth callbacks configured

Family beta can begin on web only.

Mobile can stay separate until the web beta loop is more stable.

### Phase 2: Create Real Family Accounts

Have the 5 family members create normal accounts through the deployed web app.

Recommended:

- keep them as real users
- optionally mark them with a beta flag for filtering and support

### Phase 3: Add Admin Debug Surface

Extend the current admin portal with a dedicated `Debug` tab.

This is the most important missing piece before relying on real-user feedback.

## Admin Debug Tab

The debug tab should let you answer:

- what did the user send
- what did Frankie think they meant
- what structured data was extracted
- what tool/logging writes happened
- what assistant reply was produced
- whether the turn used the model path or fallback path
- whether clarification should have happened
- what likely went wrong

### Debug Tab V1 Features

Keep the first version lean and useful.

Recommended sections:

1. `Recent conversations`
   - recent user threads
   - filter by beta users first

2. `User search`
   - search by email or name

3. `Thread timeline`
   - list turns in a selected conversation

4. `Turn inspector`
   - raw user message
   - assistant reply
   - created time
   - source path: `model` or `fallback`

5. `Structured extraction view`
   - activities
   - diet entries
   - wellness payload
   - resolved dates like `loggedForDate`

6. `Persistence result view`
   - what activity logs were written
   - what diet logs were written
   - what wellness check-ins were written
   - whether the turn was clarification-only

7. `Admin analysis`
   - a short generated or rule-based explanation of likely failure mode

### Good Examples Of Admin Analysis

- The message blended two day references with one total count, so Frankie should have asked for clarification.
- The model interpreted `this past Sunday` incorrectly as a recent relative day.
- The fallback parser handled the turn because the model path failed.
- The user mentioned alcohol and motivation together, but no cross-signal reasoning was added yet.

## Trace Logging Layer

The admin debug tab will be weak unless Frankie stores trace data for each turn.

### Recommended New Table

Add a table such as:

- `ai_trace_runs`

Recommended fields:

- `id`
- `user_id`
- `thread_id`
- `source_message_id`
- `assistant_message_id`
- `used_model`
- `model_name`
- `prompt_version`
- `raw_user_message`
- `profile_snapshot`
- `recent_context_snapshot`
- `extracted_payload`
- `tool_calls`
- `tool_results`
- `persisted_log_ids`
- `needs_clarification`
- `fallback_reason`
- `final_reply`
- `latency_ms`
- `created_at`

### Why This Matters

Without trace logging, you can inspect messages and logs, but you cannot reliably explain:

- why a logging mistake happened
- whether it was model logic or fallback logic
- whether the extraction was correct but the tool write was wrong
- whether the reply was wrong even though the structured logging was right

## Minimal Beta Support Workflow

This is the founder workflow the app should support.

1. Family member says:
   - Frankie logged something weird
   - Frankie answered in a strange way

2. You open Admin -> Debug.

3. You search their account or recent thread.

4. You inspect the exact turn.

5. You review:
   - raw message
   - structured extraction
   - logging writes
   - assistant reply
   - model vs fallback

6. You decide:
   - prompt fix
   - extraction/schema fix
   - tool-write fix
   - clarification behavior fix
   - UI copy fix

This should turn vague family feedback into actionable engineering work.

## Nice-To-Have Beta Features After V1

These are useful, but not required before the first family rollout.

### User-Reported Feedback Flag

Add a lightweight in-product action like:

- `Something felt off`

This could create a simple row that links:

- user
- thread
- message
- optional free-text note

### Dry-Run Retrace

For a selected turn, let admin re-run Frankie analysis without persisting writes.

That would help answer:

- what would the current prompt/model do now
- how does the current behavior differ from the original run

### Beta Filters In Admin

Later, add admin filters like:

- all tracked accounts
- family beta only
- test accounts only
- real users only

## Privacy And Trust Note

Even though this is a family beta, Frankie Fit should still treat debug access intentionally.

Recommended stance:

- keep the debug surface admin-only
- inspect individual conversations only when needed for support or product improvement
- be transparent with beta users that conversation traces may be reviewed during the beta period

This does not need a heavy compliance layer yet, but it should be deliberate.

## Recommended Build Order

1. Deploy the current web app to Vercel
2. Confirm auth callbacks and production env vars
3. Create family beta accounts
4. Add beta-user flagging or filtering
5. Add `ai_trace_runs`
6. Capture traces from Frankie orchestration
7. Build `Admin -> Debug`
8. Add optional feedback flagging
9. Invite the 5 family members

## Immediate Recommendation

The next strongest implementation slice is:

- `family beta observability`

That means:

1. add `ai_trace_runs`
2. write traces from the Frankie orchestration path
3. build an admin debug page

That is the cleanest bridge between "the app works for me" and "the app is ready for real people to help shape it."
