# Agent & Contributor Guide

Standards for anyone (human or agent) making changes in this repo.

## Branching

- `main` — production. Only updated by the weekly promote workflow (or a direct hotfix, see below). Deploys to the production Vercel environment.
- `dev` — integration branch. All day-to-day work merges here first. Deploys to a Vercel preview environment for real-world testing during the week.
- Feature branches — cut from `dev`, named `feat/<short-name>`, `fix/<short-name>`, or `chore/<short-name>`. Open a PR into `dev`.

Weekly release: once `dev` is in a good state, run the **Promote dev to production** GitHub Action (Actions tab → workflow_dispatch) to fast-forward `main` and trigger a production deploy. Do not push directly to `main` outside of this workflow except for genuine hotfixes — and even then, prefer branching off `main`, PRing, and merging normally.

## Before opening a PR

Run locally (CI enforces the same):

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Fix failures rather than disabling rules or using `--no-verify` / `any` casts to route around them.

## Commit messages

Short, imperative subject line ("Add streak tracking to dashboard", not "Added" or "Adding"). Body explains *why* when it's not obvious from the diff.

## Code style

- TypeScript strict mode is on — don't weaken `tsconfig.json` to silence an error.
- No unnecessary comments; only explain non-obvious *why*.
- No speculative abstractions — build what the current task needs.
- Keep the app stateless and portable per [docs/deployment-strategy.md](docs/deployment-strategy.md) — no Vercel-only product dependencies (Vercel KV/Blob, edge-only assumptions), no secrets/config baked into code, standard Postgres-compatible schema/queries.
- Never expose OpenAI keys or Supabase service-role/secret keys to the client — server-side only.

## CI

`.github/workflows/ci.yml` runs lint, typecheck, and build on every PR into `main` or `dev`, and on every push to `dev`. A red check blocks merge — treat it as a hard gate, not a suggestion.
