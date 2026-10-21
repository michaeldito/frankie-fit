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
import {
  Bug,
  CalendarDays,
  ChartColumn,
  Dumbbell,
  FlaskConical,
  Footprints,
  MessageCircleHeart,
  ShieldCheck,
  Target,
  UserRound,
  X
} from "lucide-react";
import { signOut } from "@/app/app/actions";
import { NavLink } from "@/components/app-shell/nav-link";
import { NotificationBell } from "@/components/app-shell/notification-bell";
import { ThemeToggle } from "@/components/app-shell/theme-toggle";
import { FrankieAvatar } from "@/components/frankie/frankie-avatar";
import { FrankieWordmark } from "@/components/frankie/frankie-wordmark";
import { FrankieDayProvider } from "@/components/frankie-day/frankie-day-context";
import { FrankieDaySheet } from "@/components/frankie-day/frankie-day-sheet";
import { SidebarFrankieCard } from "@/components/frankie-day/sidebar-frankie-card";

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
  unreadNotificationCount: number;
  frankieLine: string;
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
      title: "Chat with Frankie",
      subtitle: "Tell me what you did, ate, or how you feel. I'll take it from there."
    };
  }

  if (pathname.startsWith("/app/dashboard")) {
    return {
      eyebrow: "",
      title: "Progress",
      subtitle: ""
    };
  }

  if (pathname.startsWith("/app/workouts")) {
    return {
      eyebrow: "",
      title: "Workouts",
      subtitle: "Log a strength or conditioning session set by set."
    };
  }

  if (pathname.startsWith("/app/programs")) {
    return {
      eyebrow: "",
      title: "Programs",
      subtitle: "Follow a structured program day by day."
    };
  }

  if (pathname.startsWith("/app/profile")) {
    return {
      eyebrow: "",
      title: "Profile",
      subtitle: "Tune the information Frankie uses to coach you."
    };
  }

  if (pathname.startsWith("/app/admin/debug")) {
    return {
      eyebrow: "Founder View",
      title: "Debug",
      subtitle: "Inspect individual Frankie turns when behavior gets weird."
    };
  }

  if (pathname.startsWith("/app/admin/evals")) {
    return {
      eyebrow: "Founder View",
      title: "Evals",
      subtitle: "Benchmark, review, and tune Frankie intelligence over time."
    };
  }

  if (pathname.startsWith("/app/admin")) {
    return {
      eyebrow: "Founder View",
      title: "Insights",
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
            className="ff-button-secondary h-10 w-10 cursor-pointer p-0 text-base"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-5 max-w-2xl leading-7 text-[var(--muted)]">{body}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {ctaHref && ctaLabel ? (
            <Link
              className="ff-button-primary cursor-pointer px-4 py-2.5 text-sm"
              href={ctaHref}
              onClick={onClose}
            >
              {ctaLabel}
            </Link>
          ) : null}
          <button
            className="ff-button-secondary cursor-pointer px-4 py-2.5 text-sm"
            onClick={onClose}
            type="button"
          >
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

  const sidebarActionClass =
    "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted transition hover:bg-surface-contrast/60 hover:text-foreground";
  const sectionLabelClass = "px-3 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted";

  return (
    <FrankieDayProvider enabled={user.authConfigured}>
      <div className="min-h-screen bg-background">
        <div className="flex h-screen overflow-hidden">
          <aside
            className="hidden w-[240px] flex-none flex-col border-r border-border bg-[color-mix(in_srgb,var(--background)_82%,black_18%)] p-3 text-foreground lg:flex"
            data-theme="dark"
          >
            <Link className="px-2 py-2" href="/app/chat">
              <FrankieWordmark />
            </Link>

            <nav aria-label="Main" className="mt-5 flex flex-col gap-0.5">
              <NavLink href="/app/chat" icon={MessageCircleHeart}>Frankie</NavLink>
              <NavLink href="/app/dashboard" icon={ChartColumn}>Progress</NavLink>
              <NavLink href="/app/workouts" icon={Dumbbell}>Workouts</NavLink>
              <NavLink href="/app/programs" icon={CalendarDays}>Programs</NavLink>
              <NavLink href="/app/profile" icon={UserRound}>Profile</NavLink>
            </nav>

            <div className="mt-6">
              <p className={sectionLabelClass}>Focus</p>
              <div className="mt-2 flex flex-col gap-0.5">
                <button className={sidebarActionClass} onClick={() => setOverlayPanel("goal")} type="button">
                  <Target aria-hidden className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} />
                  Your goal
                </button>
                <button className={sidebarActionClass} onClick={() => setOverlayPanel("next-step")} type="button">
                  <Footprints aria-hidden className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} />
                  Next step
                </button>
              </div>
            </div>

            {user.isAdmin ? (
              <div className="mt-6">
                <p className={sectionLabelClass}>Admin</p>
                <nav aria-label="Admin" className="mt-2 flex flex-col gap-0.5">
                  <NavLink href="/app/admin" icon={ShieldCheck} match="exact">Insights</NavLink>
                  <NavLink href="/app/admin/debug" icon={Bug}>Debug</NavLink>
                  <NavLink href="/app/admin/evals" icon={FlaskConical}>Evals</NavLink>
                </nav>
              </div>
            ) : null}

            <div className="mt-auto space-y-3 pt-6">
              {!user.authConfigured ? (
                <p className="rounded-xl bg-surface px-3 py-2.5 text-xs leading-5 text-muted">
                  Preview mode is active until Supabase env vars are connected.
                </p>
              ) : null}
              <SidebarFrankieCard fallbackLine={user.frankieLine} />
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
            <header className="border-b border-border px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Link aria-label="Frankie Fit home" className="lg:hidden" href="/app/chat">
                    <FrankieAvatar mood="happy" size={36} />
                  </Link>
                  <div className="min-w-0">
                    {pageMeta.eyebrow ? <p className="ff-kicker">{pageMeta.eyebrow}</p> : null}
                    <h1 className={`truncate text-base font-semibold tracking-[-0.02em] sm:text-lg ${pageMeta.eyebrow ? "mt-1" : ""}`}>
                      {pageMeta.title}
                    </h1>
                    {pageMeta.subtitle ? (
                      <p className="mt-0.5 hidden max-w-3xl text-sm leading-6 text-muted sm:block">{pageMeta.subtitle}</p>
                    ) : null}
                    {isDashboardRoute ? (
                      <p className="mt-0.5 hidden max-w-3xl text-sm leading-6 text-muted sm:block">{dashboardBody}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-none items-center justify-end gap-2 sm:gap-3">
                  {user.authConfigured ? (
                    <NotificationBell initialUnreadCount={user.unreadNotificationCount} />
                  ) : null}
                  <div className="relative" ref={profileMenuRef}>
                    <button
                      aria-expanded={profileMenuOpen}
                      aria-label="Account menu"
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-accent-strong text-sm font-semibold text-accent-foreground shadow-[var(--shadow-card)] transition hover:brightness-110"
                      onClick={() => setProfileMenuOpen((current) => !current)}
                      type="button"
                    >
                      {user.initials}
                    </button>

                    <div
                      aria-hidden={!profileMenuOpen}
                      className={`ff-card absolute right-0 z-30 mt-2 w-64 origin-top-right overflow-hidden p-2 transition-all duration-200 ease-out ${
                        profileMenuOpen
                          ? "translate-y-0 scale-100 opacity-100"
                          : "pointer-events-none -translate-y-1 scale-95 opacity-0"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 px-2 py-1.5">
                        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent-strong text-sm font-semibold text-accent-foreground">
                          {user.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium tracking-[-0.01em]">{user.displayName}</p>
                          <p className="truncate text-xs text-muted">{user.subtitle}</p>
                        </div>
                      </div>
                      <div className="my-1.5 border-t border-border" />
                      <p className="px-2.5 pb-1.5 pt-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted">
                        Theme
                      </p>
                      <ThemeToggle className="mx-1" />
                      <div className="my-1.5 border-t border-border" />
                      {user.isAdmin ? (
                        <div className="lg:hidden">
                          {[
                            ["/app/admin", "Insights"],
                            ["/app/admin/debug", "Debug"],
                            ["/app/admin/evals", "Evals"]
                          ].map(([href, label]) => (
                            <Link
                              className="block rounded-[0.5rem] px-2.5 py-2 text-sm font-medium text-foreground transition hover:bg-surface-contrast"
                              href={href}
                              key={href}
                              onClick={() => setProfileMenuOpen(false)}
                            >
                              {label}
                            </Link>
                          ))}
                          <div className="my-1.5 border-t border-border" />
                        </div>
                      ) : null}
                      <Link
                        className="block rounded-[0.5rem] px-2.5 py-2 text-sm font-medium text-foreground transition hover:bg-surface-contrast"
                        href="/app/profile"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      {user.authConfigured ? (
                        <form action={signOut}>
                          <button
                            className="mt-1 block w-full cursor-pointer rounded-[0.5rem] px-2.5 py-2 text-left text-sm font-medium text-foreground transition hover:bg-surface-contrast"
                            type="submit"
                          >
                            Log out
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <main
              className={`min-h-0 flex-1 px-4 py-3 sm:px-5 sm:py-4 ${
                managesOwnScroll ? "overflow-hidden" : "ff-scroll overflow-y-auto"
              }`}
            >
              <div className={contentWidthClass}>{children}</div>
            </main>
          </div>
        </div>

        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        >
          <div className="mx-auto flex max-w-md items-end justify-between gap-1 pt-1.5 pb-1.5">
            <NavLink href="/app/dashboard" icon={ChartColumn} variant="tab">Progress</NavLink>
            <NavLink href="/app/workouts" icon={Dumbbell} variant="tab">Workouts</NavLink>
            <Link
              aria-current={isChatRoute ? "page" : undefined}
              aria-label="Chat with Frankie"
              className="flex flex-1 flex-col items-center gap-0.5 text-[0.68rem] font-semibold text-frankie"
              href="/app/chat"
            >
              <span className={`-mt-6 rounded-full bg-surface p-1 shadow-[var(--shadow-card)] ${isChatRoute ? "ring-2 ring-brand" : ""}`}>
                <FrankieAvatar mood="happy" size={48} />
              </span>
              Frankie
            </Link>
            <NavLink href="/app/programs" icon={CalendarDays} variant="tab">Programs</NavLink>
            <NavLink href="/app/profile" icon={UserRound} variant="tab">Profile</NavLink>
          </div>
        </nav>
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
      <FrankieDaySheet />
    </FrankieDayProvider>
  );
}
