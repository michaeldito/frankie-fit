---
name: adding-a-loggable-pillar
description: Full checklist of everything that has to change to add a new loggable pillar to frankie-fit (like Activity, Diet, Wellness, or Lifestyle) — extraction schema, persistence tool, orchestrator sanitizer, dashboard aggregation, DB migration, eval fixtures, and mobile parity. Use this whenever adding a new category of structured logging (e.g. a new health domain, a new tracked behavior), since it's a wide, easy-to-partially-miss change that's happened before in this codebase.
---

# Adding a loggable pillar (frankie-fit)

Frankie Fit's structured logging is organized into "pillars" — Activity, Diet, Wellness, and Lifestyle (added later, as social/family/entertainment/travel/substance-use logging). Adding a pillar touches a wide, non-obvious set of files across the extraction pipeline, persistence, dashboard, and both the web and mobile apps, and the Lifestyle addition is a real worked example of exactly what a complete rollout looks like — including one thing it missed.

## The checklist, with the Lifestyle pillar as the concrete precedent

1. **Extraction schema** — `lib/ai/schemas/extracted-user-update.ts`. Add the new entry type, its category options, its Zod schema, the array field on the overall extraction schema, and the mapping function that converts a raw extracted entry into the app's internal shape. (Lifestyle's version: `ParsedLifestyleEntry`, `lifestyleCategoryOptions`, `extractedLifestyleSchema`, `lifestyleEntries`, `mapLifestyleCategory`, `mapExtractedLifestyleEntries`.)

2. **Extraction prompt** — `lib/ai/prompts/extract-user-update.ts`. Add a section telling the model what belongs in this pillar and how to distinguish it from adjacent pillars (Lifestyle's prompt update specifically routes alcohol/cannabis mentions to `lifestyleEntries` instead of Diet, since without that steer the model would misclassify them).

3. **Persistence tool** — a new `lib/ai/tools/log-<pillar>.ts` file that actually writes the parsed entries to the database.

4. **Orchestrator sanitizer + evidence-grounding** — `lib/ai/orchestrator/frankie-orchestrator.ts`. Add a `sanitize<Pillar>Entries()` function (dedupe, filter empty/ungrounded entries) and thread the parsed entries through the persist plan and reply-summary building, the same way `sanitizeLifestyleEntries()` and `persistPlan.lifestyleEntries` work.

5. **Coaching/summary prompts** — `lib/ai/prompts/coach-response.ts` and `lib/ai/summaries/frankie-summaries.ts`. Tell Frankie how to talk about this pillar's content (Lifestyle's update specifically instructs the model to stay neutral and not moralize about substance-use entries — a new pillar may need its own tone guidance).

6. **Chat plumbing / API routes** — `lib/chat.ts`, `app/api/chat/route.ts`, `app/api/mobile/chat/route.ts`, a new `app/api/logs/<pillar>/[id]/route.ts` for deletion, and the chat UI components that render a logged entry (`components/chat/chat-transcript.tsx`, `components/chat/logged-entry-format.ts`, `components/chat/quick-start.ts`, `components/chat/web-chat-experience.tsx`).

7. **Dashboard aggregation** — `packages/dashboard-core/dashboard.ts` (row type, empty-state constructor, label/detail formatters, insight builder, dashboard-data builder) plus `lib/dashboard.ts` to query the new table and wire it into `computeDashboardData`.

8. **DB migration(s)** — a migration creating the new table, and expect follow-up migrations for anywhere else the pillar needs to be formally recognized (Lifestyle needed three: the table itself, admin-overview pillar-usage/friction breakdowns, and formalizing it as an eval pillar). Regenerate `types/database.ts` after each schema change (see the migration-checklist skill).

9. **Eval fixtures** — update `lib/evals/intelligence/*.ts` fixtures to include cases for the new pillar, so the eval suite actually exercises it rather than silently not covering it.

10. **Mobile parity — don't skip this one.** When Lifestyle was added, every step above landed except this: `apps/mobile/` itself (e.g. `apps/mobile/lib/dashboard-data.ts`) was never updated, so the mobile app's own dashboard and profile code have no awareness of the new pillar — only the shared `app/api/mobile/chat/route.ts` API route picked it up, because mobile chat happens to call through a route that lives in the web app's codebase. A pillar addition isn't complete until the mobile app's own dashboard/UI code reflects it too, not just the shared API surface it happens to call through.
