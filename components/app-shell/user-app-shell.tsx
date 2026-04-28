"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
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

type OverlayPanel = "goal" | "next-step" | null;

function getPageMeta(pathname: string) {
  if (pathname.startsWith("/app/chat")) {
    return {
      eyebrow: "",
      title: "Chat",
      subtitle: "Log, reflect, and plan from one running conversation."
    };
  }

  if (pathname.startsWith("/app/dashboard")) {
    return {
      eyebrow: "",
      title: "Dashboard",
      subtitle: ""
    };
  }

  if (pathname.startsWith("/app/profile")) {
    return {
      eyebrow: "",
      title: "Profile",
      subtitle: "Tune the information Frankie uses to coach you."
    };
  }

  if (pathname.startsWith("/app/admin")) {
    return {
      eyebrow: "Founder View",
      title: "Admin",
      subtitle: "Aggregate product health, safely surfaced."
    };
  }

  if (pathname.startsWith("/app/onboarding")) {
    return {
      eyebrow: "Welcome",
      title: "Onboarding",
      subtitle: "Set the first layer of context before Frankie starts coaching."
    };
  }

  return {
    eyebrow: "Frankie Fit",
    title: "Workspace",
    subtitle: "A calmer command center for movement, meals, and wellness."
  };
}

function ActionModal({
  open,
  title,
  eyebrow,
  body,
  ctaHref,
  ctaLabel,
  onClose
}: {
  open: boolean;
  title: string;
  eyebrow: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="ff-panel-strong w-full max-w-xl p-6 sm:p-7" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="ff-kicker">{eyebrow}</p>
            <h2 className="text-2xl font-semibold tracking-[-0.04em]">{title}</h2>
          </div>
          <button
            aria-label="Close panel"
            className="ff-button-secondary h-10 w-10 p-0 text-base"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>
        <p className="mt-5 max-w-2xl leading-7 text-[var(--muted)]">{body}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {ctaHref && ctaLabel ? (
            <Link className="ff-button-primary px-4 py-2.5 text-sm" href={ctaHref} onClick={onClose}>
              {ctaLabel}
            </Link>
          ) : null}
          <button className="ff-button-secondary px-4 py-2.5 text-sm" onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserAppShell({ children, user }: UserAppShellProps) {
  const pathname = usePathname();
  const pageMeta = useMemo(() => getPageMeta(pathname), [pathname]);
  const isChatRoute = pathname.startsWith("/app/chat");
  const isProfileRoute = pathname.startsWith("/app/profile");
  const isDashboardRoute = pathname.startsWith("/app/dashboard");
  const managesOwnScroll = isChatRoute || isProfileRoute;
  const contentWidthClass = isProfileRoute ? "w-full h-full" : `w-full ${managesOwnScroll ? "h-full" : ""} max-w-[1180px] mx-auto`;
  const [overlayPanel, setOverlayPanel] = useState<OverlayPanel>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const dashboardBody = user.primaryGoal
    ? `A simple read on how your current rhythm is supporting ${user.primaryGoal.toLowerCase()}.`
    : "A simple read on how your current rhythm is supporting your goals.";

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handlePointerDown);
      return () => document.removeEventListener("mousedown", handlePointerDown);
    }
  }, [profileMenuOpen]);

  return (
    <>
      <div className="min-h-screen bg-[var(--background)]">
        <div className="flex h-screen overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_20%),linear-gradient(180deg,var(--surface)_0%,color-mix(in_srgb,var(--surface-strong)_72%,black_28%)_100%)]">
          <aside className="hidden w-[246px] flex-col border-r border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_90%,black_10%)] p-4 lg:flex">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[linear-gradient(180deg,rgba(96,165,250,0.98)_0%,rgba(37,99,235,0.98)_100%)] text-sm font-semibold text-white shadow-[0_14px_28px_rgba(29,78,216,0.32)]">
                FF
              </div>
              <div>
                <p className="ff-kicker">Frankie Fit</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Calm performance coach</p>
              </div>
            </div>

            <div className="mt-8">
              <p className="px-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                Navigate
              </p>
              <nav className="mt-3 flex flex-col gap-2">
                <NavLink href="/app/chat">Chat</NavLink>
                <NavLink href="/app/dashboard">Dashboard</NavLink>
                {user.isAdmin ? <NavLink href="/app/admin">Admin</NavLink> : null}
              </nav>
            </div>

            <div className="mt-8">
              <p className="px-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                Actions
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  className="ff-button-secondary justify-start px-4 py-3 text-sm"
                  onClick={() => setOverlayPanel("goal")}
                  type="button"
                >
                  Open goal
                </button>
                <button
                  className="ff-button-secondary justify-start px-4 py-3 text-sm"
                  onClick={() => setOverlayPanel("next-step")}
                  type="button"
                >
                  Open next step
                </button>
              </div>
            </div>

            {!user.authConfigured ? (
              <div className="mt-auto">
                <p className="ff-card-soft px-4 py-3 text-sm leading-6 text-[var(--muted)]">
                  Preview mode is active until Supabase env vars are connected.
                </p>
              </div>
            ) : null}
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="border-b border-[var(--border)] px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  {pageMeta.eyebrow ? <p className="ff-kicker">{pageMeta.eyebrow}</p> : null}
                  <div className={pageMeta.eyebrow ? "mt-2" : ""}>
                    <h1 className="text-lg font-semibold tracking-[-0.03em] sm:text-xl">
                      {pageMeta.title}
                    </h1>
                  </div>
                  {pageMeta.subtitle ? (
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                      {pageMeta.subtitle}
                    </p>
                  ) : null}
                  {isDashboardRoute ? (
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                      {dashboardBody}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                  {user.authConfigured ? (
                    <div className="relative" ref={profileMenuRef}>
                      <button
                        className="ff-card flex items-center gap-3 px-3 py-2.5"
                        onClick={() => setProfileMenuOpen((current) => !current)}
                        type="button"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(96,165,250,0.98)_0%,rgba(37,99,235,0.98)_100%)] text-sm font-semibold text-white shadow-[0_10px_22px_rgba(29,78,216,0.32)]">
                          {user.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium tracking-[-0.01em]">
                            {user.displayName}
                          </p>
                          <p className="truncate text-xs text-[var(--muted)]">{user.subtitle}</p>
                        </div>
                      </button>

                      {profileMenuOpen ? (
                        <div className="ff-card absolute right-0 z-30 mt-3 min-w-[13rem] overflow-hidden p-2">
                          <Link
                            className="block rounded-[1rem] px-3 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[color:color-mix(in_srgb,var(--surface-contrast)_72%,black_28%)]"
                            href="/app/profile"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            Profile
                          </Link>
                          <form action={signOut}>
                            <button
                              className="mt-1 block w-full rounded-[1rem] px-3 py-2.5 text-left text-sm font-medium text-[var(--foreground)] transition hover:bg-[color:color-mix(in_srgb,var(--surface-contrast)_72%,black_28%)]"
                              type="submit"
                            >
                              Log out
                            </button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
                <NavLink href="/app/chat">Chat</NavLink>
                <NavLink href="/app/dashboard">Dashboard</NavLink>
                {user.isAdmin ? <NavLink href="/app/admin">Admin</NavLink> : null}
              </div>
            </header>

            <main
              className={`min-h-0 flex-1 px-4 py-4 sm:px-6 sm:py-5 ${
                managesOwnScroll ? "overflow-hidden" : "ff-scroll overflow-y-auto"
              }`}
            >
              <div className={contentWidthClass}>{children}</div>
            </main>
          </div>
        </div>
      </div>

      <ActionModal
        body={user.goalDescription}
        ctaHref="/app/profile"
        ctaLabel="Adjust in profile"
        eyebrow="Current goal"
        onClose={() => setOverlayPanel(null)}
        open={overlayPanel === "goal"}
        title={user.primaryGoal}
      />
      <ActionModal
        body={user.nextStepDescription}
        ctaHref={user.nextStepHref}
        ctaLabel={user.nextStepCtaLabel}
        eyebrow="Next best step"
        onClose={() => setOverlayPanel(null)}
        open={overlayPanel === "next-step"}
        title={user.nextStepTitle}
      />
    </>
  );
}
