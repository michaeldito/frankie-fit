---
name: supabase-migration-checklist
description: Step-by-step process for adding or applying a Supabase database migration in the frankie-fit repo — file naming, applying it, regenerating types/database.ts, and what to do when the CLI can't authenticate interactively in an agent session. Use this whenever you're about to create a new migration file, change the DB schema, or run `supabase db push`, even if the user just says "add a column" or "create a table" without mentioning migrations by name.
---

# Supabase migration checklist (frankie-fit)

Schema changes in this repo go through versioned migration files rather than ad hoc changes in the Supabase dashboard, so the schema history stays reproducible and `types/database.ts` stays in sync with what's actually deployed.

## Creating the migration

Add a new file in `supabase/migrations/`, named:

```
<YYYYMMDDHHMMSS>_<snake_case_description>.sql
```

Timestamp it *after* the latest existing migration in that directory — the timestamp is the ordering mechanism, so an out-of-order one will apply in the wrong sequence. Check the most recent file in `supabase/migrations/` before picking a timestamp.

Write the migration as plain SQL DDL (create table, alter table, add/drop constraint, etc.) — see any existing file in that directory for the shape.

## Applying it

Normal path:

```bash
supabase db push
```

This requires an authenticated Supabase CLI session. In an agent-driven session, the interactive `supabase login` flow (browser + OS Keychain) generally won't work — it needs a real TTY and either fails fast on a non-TTY error or hangs waiting on a native Keychain password prompt the agent can't see or complete. Don't retry it in a loop; retrying doesn't fix an interactive-only flow. Instead, either:

- Ask the person running the session to authenticate the CLI themselves, or
- Use a personal access token via `SUPABASE_ACCESS_TOKEN` (generated at `supabase.com/dashboard/account/tokens`), which skips the interactive flow entirely.

If neither is available, apply the migration's SQL directly in the Supabase dashboard's SQL editor as a fallback. In that case, have someone with a working CLI session run `supabase migration repair --status applied <version>` for that migration's timestamp afterward — otherwise the CLI's remote migration history won't know the migration was already applied, and a later `supabase db push` may error trying to re-run it.

## Regenerating types

After any schema change, regenerate `types/database.ts` so the TypeScript types match the new schema:

```bash
supabase gen types typescript --local > types/database.ts
```

Do this in the same change as the migration — a schema change without a matching type update means the rest of the codebase is working against a stale type definition, which defeats the purpose of generating types from the schema in the first place.
