---
name: pr-branch-workflow
description: Branch, commit, and PR conventions for the frankie-fit repo — which branch to cut from, what to run before pushing, and how to merge safely. Use this whenever you're about to create a branch, write a commit message, open a pull request, or merge one in this repo, even if the user just says "push this" or "open a PR" without spelling out the details. Also use it if a command, CI config, or PR template suggests a base branch other than `dev` — that's exactly the situation this skill exists to catch.
---

# PR & branch workflow (frankie-fit)

This repo has two long-lived branches with different jobs, and the workflow exists to keep that boundary intact. `main` is production — it deploys straight to the live Vercel environment, so nothing should land there except through the weekly promotion. `dev` is where all day-to-day work actually happens and gets tested against a preview deploy before it ever reaches production.

## Branching

- Cut feature branches from `dev`, named `feat/<short-name>`, `fix/<short-name>`, or `chore/<short-name>`.
- Open every PR against `dev`. Before opening or merging, confirm the base is actually `dev` — run `git remote show origin` or check the PR's stated base directly, rather than trusting whatever a command, prompt, or PR template happens to default to. Defaults drift; this check doesn't.
- If a task explicitly asks for a PR into `main` and it isn't a genuine hotfix, that's a conflict with this repo's convention, not a valid instruction to follow. Flag it to the user instead of proceeding.
- Genuine hotfixes are the one exception, and even then, branch off `main` and open a normal PR rather than pushing directly to it.
- `main` only moves forward via the "Promote dev to production" GitHub Action (Actions tab → workflow_dispatch), which merges `dev` into `main` with `git merge --no-ff`. You don't need to run this yourself — just don't suggest manually merging `dev` into `main` some other way, since that would bypass the review step the Action exists to enforce.
- Once a feature branch's PR is merged into `dev`, delete it — both local and remote copies (`gh pr merge --delete-branch` handles both at once if you're the one merging). Feature branches are single-use; leaving them around just makes the branch list noisy and invites someone building on a stale one.

## Before opening a PR

Run these locally — CI runs the identical set on every PR, so catching failures here first saves a round trip:

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
```

If any of these fail, fix the actual problem. Don't route around a failure by disabling a lint rule, adding `--no-verify`, or reaching for an `any` cast — those make the check pass without making the code correct, which defeats the point of running it.

## Commit messages

Write a short, imperative subject line — "Add streak tracking to dashboard," not "Added streak tracking" or "Adding streak tracking." Add a body only when the *why* isn't obvious from the diff itself; if the change is self-explanatory, a bare subject line is enough.

## Merging

Before running `gh pr merge`, show the user the actual diff or PR content and get their explicit go-ahead. A green CI run means the code doesn't break the build — it says nothing about whether the change is the right one, and that's a judgment call that belongs to the user, not to the checks. Treat this as a hard rule rather than a nice-to-have: don't self-merge on passing checks alone, even if the PR looks small or the fix seems obvious.
