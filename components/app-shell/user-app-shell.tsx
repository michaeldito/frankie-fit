import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/app/actions";
import { NavLink } from "@/components/app-shell/nav-link";

export type UserAppShellUser = {
  displayName: string;
  subtitle: string;
  initials: string;
  primaryGoal: string;
  goalDescription: string;
  authConfigured: boolean;
  isAdmin: boolean;
  nextStepTitle: string;
  nextStepDescription: string;
  nextStepHref: string;
  nextStepCtaLabel: string;
};

type UserAppShellProps = {
  children: ReactNode;
  user: UserAppShellUser;
};

export function UserAppShell({ children, user }: UserAppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
              Frankie Fit
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Your coach, your dashboard, your pace.
            </h1>
          </div>

          <nav className="flex flex-col gap-2">
            <NavLink href="/app/chat">Chat</NavLink>
            <NavLink href="/app/dashboard">Dashboard</NavLink>
            <NavLink href="/app/profile">Profile</NavLink>
            {user.isAdmin ? <NavLink href="/app/admin">Admin</NavLink> : null}
          </nav>

          <div className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Goal
            </p>
            <p className="mt-3 text-lg font-semibold">{user.primaryGoal}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {user.goalDescription}
            </p>
          </div>

          <Link
            className="mt-4 block rounded-[1.5rem] bg-[var(--brand)] p-4 text-white transition hover:bg-[var(--brand-strong)]"
            href={user.nextStepHref}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">
              Next best step
            </p>
            <p className="mt-3 text-lg font-semibold">{user.nextStepTitle}</p>
            <p className="mt-2 text-sm leading-6 text-white/80">
              {user.nextStepDescription}
            </p>
            <p className="mt-4 text-sm font-medium text-white/90">{user.nextStepCtaLabel}</p>
          </Link>

          <div className="mt-8 flex items-center gap-3 rounded-[1.5rem] border border-[var(--border)] p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-strong)] text-sm font-semibold text-white">
              {user.initials}
            </div>
            <div className="min-w-0">
              <p className="font-medium">{user.displayName}</p>
              <p className="break-words text-sm text-[var(--muted)]">
                {user.subtitle}
              </p>
            </div>
          </div>

          {user.authConfigured ? (
            <form action={signOut} className="mt-4">
              <button
                className="w-full rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--brand)] hover:bg-[var(--brand)] hover:text-white"
                type="submit"
              >
                Log out
              </button>
            </form>
          ) : (
            <p className="mt-4 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
              Preview mode is active until Supabase env vars are connected.
            </p>
          )}
        </aside>

        <main className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
