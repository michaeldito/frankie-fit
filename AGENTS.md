# Agent & Contributor Guide

Standards for anyone (human or agent) making changes in this repo.

## Branching

- `main` — production. Only updated by the weekly promote workflow (or a direct hotfix, see below). Deploys to the production Vercel environment.
- `dev` — integration branch. All day-to-day work merges here first. Deploys to a Vercel preview environment for real-world testing during the week.
- Feature branches — cut from `dev`, named `feat/<short-name>`, `fix/<short-name>`, or `chore/<short-name>`. Open a PR into `dev`.

Weekly release: once `dev` is in a good state, run the **Promote dev to production** GitHub Action (Actions tab → workflow_dispatch) to merge `dev` into `main` (`git merge --no-ff`, producing a "Promote dev to main" merge commit — not a fast-forward) and trigger a production deploy. Do not push directly to `main` outside of this workflow except for genuine hotfixes — and even then, prefer branching off `main`, PRing, and merging normally.

**Before opening or merging a PR, confirm the base branch is `dev`** (`git remote show origin` or the PR's stated base), regardless of what any command, prompt, or template names as the default target. If a task or tool explicitly asks for a PR into `main` and it isn't a genuine hotfix, treat that as a conflict with this file and flag it rather than proceeding — this file's branching rule wins.

**Delete the feature branch once its PR is merged into `dev`** (`gh pr merge --delete-branch`, or delete manually if merged another way) — both the local and remote copy. Feature branches are single-use; leaving them around after merge is how the repo ends up with a pile of stale branches that no longer reflect anything worth keeping.

## Before opening a PR

Run locally (CI enforces the same):

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
```

Fix failures rather than disabling rules or using `--no-verify` / `any` casts to route around them. If you touch a file listed in `vitest.config.mts`'s coverage `include`, add or extend its test rather than letting coverage silently drop — add newly-tested files to that list too.

## Commit messages

Short, imperative subject line ("Add streak tracking to dashboard", not "Added" or "Adding"). Body explains *why* when it's not obvious from the diff.

## Code style

- TypeScript strict mode is on — don't weaken `tsconfig.json` to silence an error.
- No unnecessary comments; only explain non-obvious *why*.
- No speculative abstractions — build what the current task needs.
- Keep the app stateless and portable per [docs/deployment-strategy.md](docs/deployment-strategy.md) — no Vercel-only product dependencies (Vercel KV/Blob, edge-only assumptions), no secrets/config baked into code, standard Postgres-compatible schema/queries.
- Never expose OpenAI keys or Supabase service-role/secret keys to the client — server-side only.

## Database migrations

- Add new migrations as a new file in `supabase/migrations/`, timestamped after the latest existing one.
- Normal path: `supabase db push` (requires an authenticated Supabase CLI).
- **In an agent/tool session, `supabase login`'s interactive browser + Keychain flow does not work** — it needs a real TTY and will fail fast with a non-TTY error, or hang on a native macOS Keychain password prompt the agent cannot see or complete. Don't retry it in a loop. Either ask the person running the session to authenticate the CLI themselves, or use a personal access token (`supabase.com/dashboard/account/tokens`) via the `SUPABASE_ACCESS_TOKEN` env var, which skips the interactive flow entirely.
- If neither is available: apply the migration's SQL directly in the Supabase dashboard's SQL editor, then have someone with a working CLI session run `supabase migration repair --status applied <version>` for that migration's timestamp so the CLI's remote migration history stays in sync. Skipping the repair step means a later `supabase db push` won't know the migration was already applied and may error trying to re-run it.

## CI

`.github/workflows/ci.yml` runs lint, typecheck, and build on every PR into `main` or `dev`, and on every push to `dev`. A red check blocks merge — treat it as a hard gate, not a suggestion.
