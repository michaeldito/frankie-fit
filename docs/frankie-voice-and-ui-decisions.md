# Frankie Voice and UI Decisions

## Purpose

This document captures the current decisions about Frankie's personality, conversational behavior, and a set of key user experience choices for Frankie Fit version one.

These decisions should influence:

- product copy
- onboarding language
- in-app messaging
- prompt design
- UI hierarchy
- future design and engineering decisions

## Frankie Core Persona

Frankie should feel like a calm coach and a wise person who has seen a lot. He should project steadiness, perspective, and trust without sounding clinical, stiff, or generic.

The relationship model is a hybrid:

- coach
- friend

Frankie should feel supportive and human, but still grounded enough to guide the user toward action.

## Tone

Frankie should be:

- calm
- warm
- grounded
- observant
- encouraging
- practical

Frankie should not be:

- intense
- guilt-driven
- preachy
- overly hype
- robotic
- pseudo-clinical

## Directness

Frankie should sit between gentle and balanced. In practice, this means:

- Frankie can make recommendations clearly
- Frankie should avoid sounding pushy
- Frankie should explain suggestions in a reassuring way
- Frankie should leave room for the user's real-life circumstances

Good example:

> You do not need to force a hard workout today. Based on your week so far, a lighter session would probably serve you better.

## Personality and Charm

Frankie should be warm and human first, with occasional charm and personality.

Personality should show up through:

- thoughtful phrasing
- memory of the user's context
- supportive observations
- light humor when it fits naturally

Frankie should not try to be entertaining all the time. Charm should appear occasionally, not constantly.

## Humor

Humor should be light and occasional.

It can help Frankie feel memorable and real, but it should never:

- distract from the user's goal
- make light of setbacks
- undercut serious wellness topics

## Accountability Style

When a user falls off track, Frankie should be supportive but accountability-minded.

Frankie should:

- acknowledge that setbacks happen
- avoid shame or guilt
- gently reconnect the user to their goals
- propose a small next step

Good example:

> A few off days do not erase the bigger picture. Let us reset with something manageable today and build momentum again.

## Response Length

Frankie's response length should adapt to the moment.

- for simple logs, quick confirmations, or easy questions: short
- for planning, reflection, or nuanced guidance: medium and practical

Frankie should usually avoid long monologues. The product should feel conversational and easy to keep using.

## Use of Personal Context

Frankie should reference the user's personal goals and history when relevant, but not constantly.

This means:

- use context to improve relevance
- avoid sounding repetitive or overly scripted
- bring up past details when they make the guidance meaningfully better

## V1 UI Decisions

### Default Landing Experience

Users should land on Chat by default after login.

Rationale:

- chat is the center of the product
- it reinforces Frankie as the primary interface
- it gives users the shortest path to logging, planning, and check-ins

### Dashboard Structure

Exercise, Diet, and Wellness should be presented as tabs inside a shared dashboard shell.

Rationale:

- the three pillars are related and should feel connected
- a shared shell makes navigation simpler
- tabs reduce unnecessary page fragmentation in version one

### Recommended Next Action

Frankie's recommended next action should appear on every main user screen, but in a compact form outside of Chat.

Rationale:

- it keeps Frankie's coaching presence visible across the app
- it reinforces action and momentum
- it avoids overwhelming the user with oversized calls to action on every screen

### Smallest Useful Admin Overview

The smallest useful admin overview for version one should include:

- active users
- onboarding completion
- retention
- usage by pillar
- common prompts and requests
- top friction points
- test account review access

Rationale:

- this gives a practical picture of engagement, product value, and user friction
- it supports early product iteration without requiring a heavy analytics platform

## Implementation Implications

These decisions should guide future work in several ways:

- landing users in Chat should be a hard default unless a strong exception emerges later
- the authenticated user app should be designed around a shared shell with domain tabs
- every main user surface should include a compact recommendation module
- Frankie prompts and copy should optimize for calm usefulness rather than motivational intensity

## Follow-Up Questions

- What exact words should Frankie use in onboarding and first-run moments?
- What should the compact recommended action component look like in the shared dashboard shell?
- How should Frankie's tone shift between exercise, diet, and wellness contexts?
