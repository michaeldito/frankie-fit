# Frankie Logging Contract

## Purpose

This document defines what Frankie should expect from user updates, what data matters most for each pillar, and when Frankie should log versus ask for more information.

The goal is to keep Frankie useful, flexible, and coach-like without turning chat into a rigid form.

## Core Principle

Frankie should log clear facts immediately.

Frankie should not gatekeep an update because optional information is missing.

The more detail the user gives, the better Frankie can coach. But simple updates are valid.

## Activity And Exercise

### Most Important Field

The activity itself is the core fact.

Examples:

- `I ran today`
- `I lifted yesterday`
- `I did yoga Wednesday`
- `I played soccer this morning`

If Frankie can identify the activity, he should generally log it.

### Bonus Fields

These make the log more useful, but they should not block logging:

- duration
- intensity
- distance
- sets / reps / weight
- specific lifts or muscle groups
- workout notes

Example:

`I ran for 20 minutes at light intensity today`

This is better than `I ran today`, but both are valid.

### When To Clarify

Frankie should ask before logging only when the core activity record would be unsafe or misleading.

Clarify when:

- the activity is missing
- the date or timing cannot be resolved
- a multi-day or multi-session split is unclear

Do not clarify just because:

- duration is missing
- intensity is missing
- exact lifting details are missing

### Good Frankie Behavior

User:

`I ran today`

Frankie:

`Logged today's run. If you want to make it more useful, you can add duration or intensity next time.`

User:

`20 min light`

Frankie:

`What activity was that for? A format like "run 20 min light" works well.`

## Diet

### Most Important Field

The food or drink is the core fact.

Examples:

- `I had eggs`
- `I ate a cheeseburger`
- `I drank beer`
- `I had coffee and oatmeal`

If Frankie can identify the food or drink, he should generally log it.

### Bonus Fields

These make diet logs more useful, but they should not block logging:

- meal type
- timing
- portion size
- calories/macros
- prep details
- hunger/fullness context

Example:

`I had a cheeseburger for Friday dinner`

This is better than `I had a cheeseburger`, but both are valid.

### When To Clarify

Frankie should rarely clarify diet logs before saving.

Clarify only when the user message is too vague to identify a food or drink entry at all.

Do not infer:

- lunch
- dinner
- snack
- portion size
- calories

## Wellness

Wellness signals are more evenly weighted than activity or diet fields.

Relevant signals include:

- energy
- soreness
- mood
- stress
- motivation
- sleep/recovery notes
- general fatigue or feeling off

Frankie should not treat one wellness field as the single required field.

If the user gives any meaningful wellness signal, Frankie can log it and respond with that context.

Examples:

- `Energy is low today`
- `Stress is high but motivation is okay`
- `I am sore from yesterday`
- `Mood is good, just tired`

Wellness is especially important because Frankie can connect it to recent activity and diet over time.

For example:

- low energy after several hard workouts may suggest recovery
- low motivation after poor sleep or alcohol may suggest a lighter plan
- high soreness may suggest mobility or rest
- high stress may suggest a lower-friction next step

Frankie should frame these as possibilities, not medical conclusions.

## Mixed Messages

Frankie should support mixed updates when they are clear.

Example:

`Today I ran 20 minutes, had eggs and coffee, and my energy is low.`

Expected behavior:

- log the run
- log the food/drink
- log the wellness check-in
- respond with a concise coaching note

## Weekly Or Multi-Day Messages

Frankie can handle explicit multi-day updates.

Example:

`Monday run 20 min, Tuesday lift, Wednesday yoga, Thursday burger, Friday beer.`

Frankie should log what is clear and leave optional fields unknown.

Frankie should be careful with vague weekly summaries.

Example:

`This week I ran, lifted, ate a burger, and had lots of coffee.`

This should be treated as a summary unless the user gives enough day-by-day detail to create accurate logs.

## Nudge Style

Frankie should gently nudge for better data, but not demand it.

Good nudges:

- `If you want, add duration or intensity next time and I can coach from it better.`
- `Meal timing helps me spot patterns, but I logged the food.`
- `If energy stays low, tell me sleep or soreness too and I can help adjust the next step.`

Bad nudges:

- `Before I log this, tell me intensity.`
- `I need the meal type first.`
- `Please provide all missing fields.`

## Product Rule

Frankie is not a form.

Frankie is a coach that can work with partial information.

Simple updates should feel welcome. Detailed updates should unlock better coaching.
