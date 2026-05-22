# Frankie Fit Open-Vocabulary Activity Plan

## Purpose

This document defines how Frankie Fit should evolve from a partially regex-driven activity system into an open-vocabulary activity understanding system.

The goal is simple:

- Frankie should understand far more than a short built-in list like `run`, `walk`, `lift`, and `yoga`
- Frankie should behave consistently when users mention unfamiliar or niche activities
- clarification logic should be driven by structured meaning, not by hard-coded word lists wherever possible

This matters because real users will say things like:

- hiking
- pilates
- boxing
- soccer
- pickleball
- spin class
- climbing
- CrossFit
- Muay Thai
- jiu-jitsu
- orange theory
- dance cardio
- sled pushes
- swimming

The world of activity language is effectively open-ended.

## Direct Answer

Today, Frankie can often understand open-ended activities on the model path, but the surrounding orchestration logic is still partly optimized for a narrower known set of activities.

That means:

- extraction is more flexible than the fallback parser
- logging can work for unknown activities
- clarification and ambiguity handling can still be inconsistent

The next architectural step is to make activity handling:

- open-vocabulary
- category-aware
- ambiguity-aware
- less regex-dependent

## Current State

The current activity stack has three layers.

### 1. Model extraction

This is the strongest and most general part.

In [lib/ai/schemas/extracted-user-update.ts](../lib/ai/schemas/extracted-user-update.ts), `activityType` is an unrestricted string, not a small enum.

That means the model can already produce entries like:

- `Hiking`
- `Pilates`
- `Boxing`
- `Soccer`

### 2. Orchestrator guardrails

In [lib/ai/orchestrator/frankie-orchestrator.ts](../lib/ai/orchestrator/frankie-orchestrator.ts), there are several helper rules that still depend on surface text patterns:

- time-window detection
- count detection
- weekly-summary detection
- clarification triggers

Examples:

- `getActivityCountMentions(...)`
- `hasExplicitTodayYesterdaySplit(...)`
- `shouldForceActivityClarification(...)`
- `shouldForceWeeklyMixedSummaryClarification(...)`

These are not the primary extraction logic, but they do influence how Frankie behaves around ambiguity.

### 3. Rule-based fallback

In [lib/chat.ts](../lib/chat.ts), the fallback parser still uses a small keyword map:

- `Running`
- `Walking`
- `Strength training`
- `Cycling`
- `Rowing`
- `Yoga`
- `Mobility`

This fallback is intentionally limited and will miss many activities unless they happen to map cleanly to those buckets.

## The Core Problem

Right now, activity recognition and activity behavior are not equally general.

Frankie may extract:

- `Soccer`

but then clarification rules may still behave as if they were mainly designed around:

- runs
- rides
- walks
- lifts

That creates a gap:

- the model knows more activity language than the orchestrator fully reasons about

## Target Direction

Frankie should move from activity-name-driven logic to activity-metadata-driven logic.

Instead of asking:

- does the text contain `run`, `ride`, `walk`, or `lift`?

Frankie should ask:

- what activity was extracted?
- what category does it belong to?
- how many sessions are implied?
- what detail is missing?
- is the date assignment ambiguous?
- is clarification required before logging?

## Recommended Schema Expansion

The current extracted activity shape is roughly:

- `activityType`
- `description`
- `durationMinutes`
- `intensity`
- `loggedForDate`

The target activity shape should expand to include:

- `activityType`
- `activityCategory`
- `description`
- `sessionCount`
- `durationMinutes`
- `intensity`
- `loggedForDate`
- `timePrecision`
- `confidence`
- `missingFields`
- `ambiguityFlags`

### Example target shape

```json
{
  "activityType": "Soccer",
  "activityCategory": "sport",
  "description": "pickup soccer",
  "sessionCount": 1,
  "durationMinutes": 0,
  "intensity": "unknown",
  "loggedForDate": "2026-05-05",
  "timePrecision": "explicit_day",
  "confidence": 0.92,
  "missingFields": ["durationMinutes"],
  "ambiguityFlags": []
}
```

### Example ambiguous shape

```json
{
  "activityType": "Cycling",
  "activityCategory": "cardio",
  "description": "bike rides",
  "sessionCount": 2,
  "durationMinutes": 0,
  "intensity": "unknown",
  "loggedForDate": "2026-05-05",
  "timePrecision": "multi_day_window",
  "confidence": 0.79,
  "missingFields": ["loggedForDate"],
  "ambiguityFlags": ["multi_day_split_unclear"]
}
```

## Recommended Activity Categories

The exact label set is less important than using a stable, broad set of categories.

Recommended categories:

- `cardio`
- `strength`
- `sport`
- `mobility`
- `mind_body`
- `outdoor_recreation`
- `conditioning`
- `other`

Examples:

- hiking -> `outdoor_recreation`
- pilates -> `mind_body`
- boxing -> `sport` or `conditioning`
- soccer -> `sport`
- yoga -> `mind_body`
- lifting -> `strength`
- rowing -> `cardio`
- mobility work -> `mobility`

The product should preserve the original `activityType` while also giving Frankie a higher-level category to reason with.

## Recommended Missing Fields Model

Frankie should stop inferring what detail is missing from activity names alone.

Instead, the extractor should tell the orchestrator what is incomplete.

Useful `missingFields` examples:

- `loggedForDate`
- `durationMinutes`
- `intensity`
- `movementFocus`
- `sessionSplit`

This lets Frankie ask more targeted questions like:

- `How were those 2 sessions split across the days?`
- `How long was the hike?`
- `For the lifting, what was the main focus?`
- `Roughly how hard did soccer feel?`

## Recommended Ambiguity Flags

Useful ambiguity flags:

- `multi_day_split_unclear`
- `weekly_summary_needs_breakdown`
- `multiple_activities_single_time_reference`
- `unclear_date_reference`
- `partial_clarification`
- `grouped_session_count_without_distribution`

This gives the orchestrator structured reasons to pause, instead of recreating reasoning from regex.

## Orchestrator Refactor Plan

The current orchestrator should evolve in phases.

### Phase 1: enrich extraction output

Update the activity extraction contract to include:

- `activityCategory`
- `sessionCount`
- `missingFields`
- `ambiguityFlags`
- `confidence`

This is the minimum change that makes later orchestration much smarter.

### Phase 2: move clarification logic onto structured fields

Refactor [lib/ai/orchestrator/frankie-orchestrator.ts](../lib/ai/orchestrator/frankie-orchestrator.ts) so that clarification decisions come from structured metadata first.

Example:

- if `ambiguityFlags` contains `multi_day_split_unclear`
  - ask for the split

- if `missingFields` contains `movementFocus` and `activityCategory === "strength"`
  - ask what lifts or muscle groups were trained

- if `activityCategory === "sport"` and only duration is missing
  - do not always force clarification

### Phase 3: simplify regex guardrails

Keep regex helpers only for:

- broad time-reference detection
- light fallback safety
- emergency heuristics when structured output is clearly broken

Regex should no longer be the main source of truth for activity meaning.

### Phase 4: narrow the fallback parser

The fallback parser in [lib/chat.ts](../lib/chat.ts) should remain intentionally conservative.

Its role is:

- provide graceful degradation
- recognize a modest known set
- avoid pretending to support every possible activity

This is better than trying to force the fallback into being a second full intelligence layer.

## What This Means For Unknown Activities

With the target design, unfamiliar activities should work like this:

### Hiking

- extracted as `activityType = "Hiking"`
- categorized as `outdoor_recreation`
- Frankie may ask for duration if useful
- Frankie should not treat it as generic walking unless fallback is in control

### Pilates

- extracted as `activityType = "Pilates"`
- categorized as `mind_body`
- Frankie should not ask lifting-style follow-up questions

### Boxing

- extracted as `activityType = "Boxing"`
- categorized as `sport` or `conditioning`
- Frankie should support boxing without needing a hard-coded keyword branch

### Soccer

- extracted as `activityType = "Soccer"`
- categorized as `sport`
- ambiguity handling should work the same way as other activities if the time split is unclear

## Examples Of Better Future Behavior

### Example 1

User:

`I got 2 bike rides yesterday and today`

Frankie should infer:

- activity type: `Cycling`
- session count: `2`
- ambiguity: `multi_day_split_unclear`

Frankie should ask:

`I’ve got 2 bike sessions total across yesterday and today. How were they split?`

### Example 2

User:

`This week I hiked, boxed, and ate out twice`

Frankie should infer:

- multiple activity types
- weekly-summary ambiguity
- mixed activity + diet

Frankie should ask for breakdown instead of logging immediately.

### Example 3

User:

`Played soccer for an hour on Sunday`

Frankie should infer:

- `activityType = "Soccer"`
- `activityCategory = "sport"`
- `durationMinutes = 60`
- `loggedForDate = exact Sunday date`

No clarification needed.

## Evaluation Plan

This work should be paired with a stronger eval set.

Suggested activity eval set:

- hiking
- pilates
- boxing
- soccer
- pickleball
- spin class
- climbing
- CrossFit
- dance cardio
- martial arts
- swimming
- ski training
- orange theory
- hot yoga
- rucking

For each example, record:

- raw user message
- expected activity type(s)
- expected category
- expected date handling
- expected ambiguity flags
- whether clarification should happen

## Why This Matters

This is one of the clearest places where Frankie Fit either becomes:

- a narrow tracker with a flexible chat skin

or

- a genuinely intelligent activity-aware coach

The model path already gives us a strong base.

The next step is to stop making open-ended activity understanding depend on logic that was originally written for a much smaller activity universe.

## Recommended Next Implementation Slice

If we choose to build this, the best first slice is:

1. expand the extraction schema for activity metadata
2. update the extraction prompt to emit categories, missing fields, and ambiguity flags
3. teach the orchestrator to use those fields before regex helpers
4. add evaluation cases for at least 10 non-core activities

That would meaningfully reduce hard-coded behavior while keeping the current app architecture intact.
