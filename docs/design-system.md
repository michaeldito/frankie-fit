# Frankie Fit Design System

Frankie is the user's dog, and in the app he's the coach. The design system exists to make that feel literal: the app is Frankie's, and every screen has a little of him in it.

The source boards are in [`docs/design/`](design/): `style-guide-cream.webp` (light) and `style-guide-midnight.webp` (dark).

## Where it lives

| Piece | Location |
|---|---|
| Tokens, themes, moods, Frankie's lines | `packages/brand-core` (`@frankie-fit/brand-core`), shared by web and mobile |
| Mood art and stickers | `packages/brand-core/assets/frankie/` |
| Web CSS variables | `apps/web/app/brand-tokens.css`, **generated**; see below |
| Web Frankie components | `apps/web/components/frankie/` |
| Mobile theme provider | `apps/mobile/lib/theme.tsx` (`FrankieThemeProvider`, `useTheme`, `createThemedStyles`) |
| Mobile Frankie components | `apps/mobile/components/frankie.tsx` |

## Experience principles

1. **Frankie shows up once per screen, on purpose.** Each screen gets one Frankie moment, such as an avatar, a "Frankie says" card or an empty-state sticker. They shouldn't compete with each other.
2. **Short Frankie lines use Frankie's handwriting** (`font-frankie` on web, `fonts.frankie` on mobile; Caveat Brush). Quotes, greetings, captions and empty-state lines use it. Chat paragraphs, data and controls never do.
3. **Frankie reacts to what you do.** His mood is derived from data the app already has: message type, what was just logged, time of day. The LLM doesn't choose it.
4. **Warm, never guilt-driven.** Humor is light and dog-flavored ("so polite", naps count). Never shame, nag or moralize. See `frankie-voice-and-ui-decisions.md`.
5. **Each pillar has one color everywhere.** Exercise, diet, wellness and lifestyle each use the same color on chips, tabs, chart bars and logged-entry cards.

## Themes

Two themes share one set of semantic keys:

- **Cream (light):** the default.
- **Midnight (dark):** used when the OS prefers dark or the user picks it.

On web, the System / Light / Dark choice is stored in `localStorage` (`ff-theme`). An inline script in `app/layout.tsx` applies it before first paint, so there's no flash. On mobile, `FrankieThemeProvider` stores it under the same key.

| Semantic key | Use |
|---|---|
| `background`, `foreground` | page and body text |
| `surface`, `surfaceStrong`, `surfaceElevated`, `surfaceContrast` | cards, inset areas such as inputs and soft cards, panel tops, hover/skeleton highlights |
| `border`, `borderStrong` | hairlines |
| `muted`, `mutedStrong` | secondary text |
| `brand`, `brandStrong`, `brandForeground` | primary actions and active state (sage green) |
| `accent`, `accentStrong`, `accentForeground` | links and info (`accent`); the user's chat bubble (`accentStrong` with `accentForeground`) |
| `frankie`, `frankieSoft` | Frankie's moments: handwriting color, avatar ring, quote-card fill |
| `celebrate`, `success`, `danger` | sunshine highlights, success marks, errors |
| `pillarExercise`, `pillarDiet`, `pillarWellness`, `pillarLifestyle` | pillar color coding |

**Contrast is enforced by tests.** `packages/brand-core/contrast.test.ts` asserts WCAG AA for every text pairing (4.5:1) and 3:1 for UI marks, in both themes. If you change a color and that test fails, the color is wrong.

**The sidebar is always Midnight**, and so is admin, which still hardcodes the old dark palette. The generated CSS scopes the dark tokens to any `[data-theme="dark"]` element, so wrapping a subtree in that attribute flips it.

### Changing tokens

1. Edit `packages/brand-core/themes.ts`.
2. Regenerate the web CSS with `pnpm vitest run -u packages/brand-core`. It's a file snapshot, so CI fails if the TS and the CSS drift.
3. On web, prefer the Tailwind utilities registered in `globals.css`'s `@theme inline` block (`bg-surface`, `text-muted`, `bg-brand`, `text-frankie`, `border-l-pillar-diet`, …). Older code uses `[var(--x)]`, which still works.

## Typography

- **Inter** for everything on web (`next/font`). Mobile keeps the system font (SF Pro), which is close to Inter.
- **Caveat Brush** is Frankie's handwriting, only for his short lines (see principle 2).

## Frankie's moods

`frankieMoodFor()` (in `moods.ts`) and `moodForMessage()` (in `message-mood.ts`) pick the mood. The first matching rule wins:

| Mood | When |
|---|---|
| `focused` | Frankie is thinking; workout drafts; "Frankie's read" insights |
| `waiting` (so polite) | clarification requests; empty exercise state |
| `bikeRide` | a logged activity mentions bike, cycling, spin or Peloton |
| `stretching` | a logged activity mentions stretch, yoga, mobility, Pilates or foam rolling; empty lifestyle state (it reads as a play bow) |
| `running` (zoomies) | any other logged exercise |
| `hungry` | a logged meal; empty diet state |
| `snuggle` | a wellness check-in; chat late at night (9pm–5am PT); empty wellness state |
| `happy` | lifestyle logs, daytime chat, the default |

**Personas:** Frankie's art and dog copy only appear when the coach is the default Frankie. Arnold, Michael Scott and the other personas get a plain initial badge.

### Adding a mood

1. Add it to `FRANKIE_MOODS` and `FRANKIE_MOOD_LABELS`.
2. Add the art to `assets/frankie/`, and to the web map (`components/frankie/frankie-art.ts`) and the mobile map (`components/frankie.tsx`).
3. Add a rule and a test row in `moods.test.ts`.

## Frankie's lines

`lines.ts` holds the daily quotes, thinking lines, per-pillar empty-state lines and `greetingFor()`.

- `dailyLine(dateKey)` is deterministic per Pacific day, so web and mobile show the same line.
- Keep new lines short, warm and lightly funny. Never guilt.

## Art spec (for final assets)

Today's art is placeholder: about 130px crops cut from the style board. Final assets should be:

- 1024×1024 transparent PNG, with Frankie centered and about 8% padding, in the same framing and light direction across moods.
- Filenames matching the current ones: `happy`, `focused`, `stretching`, `waiting`, `hungry`, `running`, `bike-ride`, `snuggle`, `portrait`, and `stickers/{paw,heart,ball,water,biscuit,bowl,crown,zzz}`.
- `icon.png`: 1024×1024, opaque, no transparency (the iOS App Store requires it).

Dropping files in with the same names updates both apps. The mobile app icon and splash (`apps/mobile/assets/images/`) need a native rebuild.

## Frankie's Day (biscuits)

Logging real life earns 🦴 biscuits, and biscuits are spent on time with Frankie. The game logic lives in `packages/companion-core` and is shared by web and mobile. The database enforces it in `supabase/migrations/20261021072622_frankie_biscuits.sql`.

**Earning** (`award_biscuits`, safe to call repeatedly):

- +1 for the first log in each pillar on a Pacific day.
- +1 "full bowl" bonus when all four pillars are logged.
- Only days within the last 7 can earn, so back-dated or future-dated logs can't farm biscuits.
- Deleting a log never takes a biscuit back.

**Spending** (`redeem_frankie_action`):

- Feed, walk, play and snuggle cost 1 each, and each fills one of Frankie's needs for the day.
- All four filled makes a **Good Boy Day**.
- A belly rub is free.
- Spends are serialized per user, so a double tap can't double-spend.

**Integrity:** `biscuit_ledger` is read-only to clients. Every write goes through the two `security definer` functions.

**Whines:** `pickNudge` decides when Frankie asks for something.

- Each need has its own time window, with quiet hours before 8am and after 9pm PT and at most 2 nudges a day.
- Users choose a nudge level: Off, Polite or Full whine mode.
- `/api/cron/frankie-nudges` runs hourly from `.github/workflows/frankie-nudges.yml`, which needs the `FRANKIE_APP_URL` and `CRON_SECRET` repo secrets.
- Users with nudges on get these instead of the generic check-in reminder.

**Guardrails:**

- Feed whines ask to *hear about* food, never to eat more or less.
- Rest-day check-ins count like any other pillar.
- Frankie never gets sick or sad, and never runs away.
- Care streaks forgive one missed day per week.
