---
name: docs-sync-nudge
description: Reminds you to check frankie-fit's architecture docs for staleness after a change touches AI orchestration, the extraction schema, or overall system architecture. Use this whenever you finish a change to lib/ai/orchestrator, lib/ai/schemas, lib/ai/prompts, the pillar structure, or the shared-package layout, even if the user didn't ask about documentation — these docs are easy to forget and have gone stale before.
---

# Docs-sync nudge (frankie-fit)

The docs in `docs/` describe intent and architecture, and they don't update themselves when the code moves on. They've gone stale before without anyone noticing until a review turned it up — not wrong in spirit, just no longer describing current behavior. A cheap check right after the change that caused the drift is far easier than a periodic audit later.

## When to check

After a change that meaningfully touches AI orchestration, the extraction schema, or overall architecture — adding or removing a pillar, changing how the orchestrator routes or sanitizes extracted data, restructuring `packages/` or `apps/`, or anything that changes what the system does at a level these docs describe.

## What to check

Skim whichever of these docs describes the area you just touched, and see if even a one-line update keeps it accurate:

- `docs/product-brief.md`
- `docs/ai-native-architecture-review.md`
- `docs/mobile-repo-structure-plan.md`
- `docs/open-vocabulary-activity-plan.md`
- `docs/frankie-eval-loop-design.md`

You don't need to rewrite a doc wholesale — the goal is catching the sentence that's now wrong, not a full audit. Concrete examples of the kind of drift this catches: a doc that says "the three pillars" after a fourth pillar was added, or one that describes a package layout (like a planned `packages/shared/*` structure) that was never actually adopted in favor of something else. Both are the kind of small, easy-to-miss inaccuracy that compounds if nobody catches it at the moment it happens.

If nothing in the docs is affected by your change, there's nothing to do here — this is a nudge to check, not a mandate to edit something every time.
