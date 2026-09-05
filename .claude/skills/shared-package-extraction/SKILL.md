---
name: shared-package-extraction
description: When and how to extract duplicated logic between the frankie-fit web app and apps/mobile into a shared packages/*-core module, following the pattern already proven by packages/dashboard-core and packages/workout-core. Use this whenever you notice the same formatting, calculation, or business logic implemented separately in a lib/ file and its apps/mobile equivalent, even if each copy looks small on its own.
---

# Shared-package extraction checklist (frankie-fit)

This repo already has a proven answer for web/mobile duplication — `packages/dashboard-core` and `packages/workout-core` — but the pattern only helps if it gets *recognized* and applied when duplication actually shows up. `lib/profile.ts` and `apps/mobile/lib/profile-data.ts` are a concrete example of where it didn't: `getAccountLabel`, `getDisplayName`, `formatList`, and `formatScheduleNotes` exist as near-byte-identical copies in both files, purely because nobody flagged the duplication as "real" at the time.

## Recognizing when duplication is worth extracting

Not all overlap needs to become a package — a couple of similar lines is normal and fine. It's worth extracting when the logic is:

- **Pure** — no Supabase call, no runtime/environment dependency, just a function of its inputs (formatting, calculations, business rules).
- **Duplicated near-verbatim** — not just conceptually similar, but the same logic reimplemented in both the web app and `apps/mobile`, the kind of thing where a bug fix in one copy needs the same fix applied to the other by hand.

If a helper touches Supabase or another runtime boundary, it isn't a good extraction candidate as-is — pull out the pure formatting/calculation core (like `formatScheduleNotes`'s actual formatting logic) rather than the whole function including its data fetching.

## How to structure the extraction

Follow the existing pattern rather than inventing a new one:

- Create `packages/<name>-core/` with the pure logic as plain `.ts` files, plus a `.test.ts` file per module and an `index.ts` that re-exports what other code should import.
- Note that these packages aren't wired up as `package.json` workspace dependencies in this repo — both the web app and `apps/mobile` import them via relative or `@/`-aliased filesystem paths (e.g. `apps/mobile` reaches across into the repo-root `packages/` directory with a relative import). Match that existing wiring rather than introducing a workspace dependency mechanism that doesn't exist yet elsewhere in the repo.
- Update both the web app call site and the `apps/mobile` call site to import from the new shared module, and delete the duplicated code from both original locations — the extraction isn't done until both copies are gone, not just one.
