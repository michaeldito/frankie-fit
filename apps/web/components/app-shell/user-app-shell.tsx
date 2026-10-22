"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
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
import { NavLink } from "@/components/app-shell/nav-link";
import { AccountMenu } from "@/components/app-shell/account-menu";
import { FrankieAvatar } from "@/components/frankie/frankie-avatar";
import { FrankieWordmark } from "@/components/frankie/frankie-wordmark";
import { FrankieDayProvider } from "@/components/frankie-day/frankie-day-context";
import { FrankieDaySheet } from "@/components/frankie-day/frankie-day-sheet";
import { SidebarFrankieDock } from "@/components/frankie-day/sidebar-frankie-card";
import { HoverLabel } from "@/components/app-shell/hover-label";
import { SidebarCollapseButton, SidebarResizeHandle } from "@/components/app-shell/sidebar-controls";

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
  const isChatRoute = pathname.startsWith("/app/chat");
  const isProfileRoute = pathname.startsWith("/app/profile");
  const managesOwnScroll = isChatRoute || isProfileRoute;
  const contentWidthClass = isProfileRoute ? "w-full h-full" : `w-full ${managesOwnScroll ? "h-full" : ""} max-w-[1180px] mx-auto`;
  const [overlayPanel, setOverlayPanel] = useState<OverlayPanel>(null);
  const [unreadCount, setUnreadCount] = useState(user.unreadNotificationCount);

  const sidebarActionClass =
    "group relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted transition hover:bg-surface-contrast/60 hover:text-foreground sidebar-collapsed:justify-center sidebar-collapsed:px-0";
  // Collapsed to the rail, section labels turn into a thin divider.
  const sectionLabelClass =
    "px-3 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted sidebar-collapsed:mx-2 sidebar-collapsed:h-px sidebar-collapsed:overflow-hidden sidebar-collapsed:bg-border sidebar-collapsed:p-0 sidebar-collapsed:text-transparent";

  return (
    <FrankieDayProvider enabled={user.authConfigured}>
      <div className="min-h-screen bg-background">
        <div className="flex h-screen overflow-hidden">
          <aside
            className="relative hidden w-[var(--sidebar-width,240px)] flex-none flex-col border-r border-border bg-[color-mix(in_srgb,var(--background)_82%,black_18%)] p-3 text-foreground lg:flex sidebar-collapsed:w-[68px] sidebar-collapsed:px-2"
            data-theme="dark"
          >
            <div className="flex flex-none items-center gap-1 sidebar-collapsed:flex-col sidebar-collapsed:gap-2">
              <Link aria-label="Frankie Fit home" className="min-w-0 flex-1 px-1 py-1.5 sidebar-collapsed:flex-none sidebar-collapsed:px-0" href="/app/chat">
                <span className="block truncate sidebar-collapsed:hidden">
                  <FrankieWordmark />
                </span>
                <span className="hidden sidebar-collapsed:block">
                  <FrankieAvatar mood="happy" size={36} />
                </span>
              </Link>
              <SidebarCollapseButton />
            </div>

            <div className="ff-scroll -mx-1 mt-4 min-h-0 flex-1 overflow-y-auto px-1 sidebar-collapsed:overflow-visible">
              <nav aria-label="Main" className="flex flex-col gap-0.5">
                <NavLink href="/app/chat" icon={MessageCircleHeart} label="Frankie">Frankie</NavLink>
                <NavLink href="/app/dashboard" icon={ChartColumn} label="Progress">Progress</NavLink>
                <NavLink href="/app/workouts" icon={Dumbbell} label="Workouts">Workouts</NavLink>
                <NavLink href="/app/programs" icon={CalendarDays} label="Programs">Programs</NavLink>
                <NavLink href="/app/profile" icon={UserRound} label="Profile">Profile</NavLink>
              </nav>

              <div className="mt-6 sidebar-collapsed:mt-3">
                <p className={sectionLabelClass}>Focus</p>
                <div className="mt-2 flex flex-col gap-0.5">
                  <button className={sidebarActionClass} onClick={() => setOverlayPanel("goal")} type="button">
                    <Target aria-hidden className="h-[1.1rem] w-[1.1rem] flex-none" strokeWidth={1.8} />
                    <span className="truncate sidebar-collapsed:sr-only">Your goal</span>
                    <HoverLabel className="hidden sidebar-collapsed:block" side="right" text="Your goal" />
                  </button>
                  <button className={sidebarActionClass} onClick={() => setOverlayPanel("next-step")} type="button">
                    <Footprints aria-hidden className="h-[1.1rem] w-[1.1rem] flex-none" strokeWidth={1.8} />
                    <span className="truncate sidebar-collapsed:sr-only">Next step</span>
                    <HoverLabel className="hidden sidebar-collapsed:block" side="right" text="Next step" />
                  </button>
                </div>
              </div>

              {user.isAdmin ? (
                <div className="mt-6 sidebar-collapsed:mt-3">
                  <p className={sectionLabelClass}>Admin</p>
                  <nav aria-label="Admin" className="mt-2 flex flex-col gap-0.5">
                    <NavLink href="/app/admin" icon={ShieldCheck} label="Insights" match="exact">Insights</NavLink>
                    <NavLink href="/app/admin/debug" icon={Bug} label="Debug">Debug</NavLink>
                    <NavLink href="/app/admin/evals" icon={FlaskConical} label="Evals">Evals</NavLink>
                  </nav>
                </div>
              ) : null}
            </div>

            <div className="flex-none space-y-3 pt-3">
              {!user.authConfigured ? (
                <p className="rounded-xl bg-surface px-3 py-2.5 text-xs leading-5 text-muted sidebar-collapsed:hidden">
                  Preview mode is active until Supabase env vars are connected.
                </p>
              ) : null}
              <SidebarFrankieDock fallbackLine={user.frankieLine} />
              <AccountMenu placement="up" setUnreadCount={setUnreadCount} unreadCount={unreadCount} user={user} />
            </div>

            <SidebarResizeHandle />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
            <header className="flex flex-none items-center justify-between gap-3 px-4 pt-3 sm:px-5 lg:hidden">
              <Link aria-label="Frankie Fit home" href="/app/chat">
                <FrankieAvatar mood="happy" size={36} />
              </Link>

              <AccountMenu placement="down" setUnreadCount={setUnreadCount} unreadCount={unreadCount} user={user} />
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
