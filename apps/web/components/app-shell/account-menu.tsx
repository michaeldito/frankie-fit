"use client";

import Link from "next/link";
import { Bell, ChevronLeft, ChevronRight, LogOut, UserRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { signOut } from "@/app/app/actions";
import { NotificationModal } from "@/components/app-shell/notification-modal";
import { NotificationsList, UnreadBadge, type NotificationItem } from "@/components/app-shell/notifications-list";
import { ThemeToggle } from "@/components/app-shell/theme-toggle";
import type { UserAppShellUser } from "@/components/app-shell/user-app-shell";

// "up" opens above the trigger (sidebar footer), "down" below it (small-screen header). Either way
// the panel caps its height to the viewport and scrolls, so nothing is cut off.
const PANEL_PLACEMENT = {
  up: "bottom-full left-0 mb-2 origin-bottom-left",
  down: "right-0 top-full mt-2 origin-top-right"
} as const;

const menuItemClass =
  "rounded-[0.5rem] px-2.5 py-2 text-sm font-medium text-foreground transition hover:bg-surface-contrast";

export function AccountMenu({
  user,
  unreadCount,
  setUnreadCount,
  placement,
  className = ""
}: {
  user: UserAppShellUser;
  unreadCount: number;
  setUnreadCount: Dispatch<SetStateAction<number>>;
  placement: "up" | "down";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [menuView, setMenuView] = useState<"main" | "notifications">("main");
  const [openNotification, setOpenNotification] = useState<NotificationItem | null>(null);
  const closeNotification = useCallback(() => setOpenNotification(null), []);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handlePointerDown);
      return () => document.removeEventListener("mousedown", handlePointerDown);
    }
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Account menu, ${unreadCount} unread notifications` : "Account menu"}
        className={`group flex cursor-pointer items-center gap-2.5 rounded-xl text-left transition ${
          placement === "up"
            ? "w-full p-1.5 hover:bg-surface-contrast/60 sidebar-collapsed:justify-center sidebar-collapsed:p-0 sidebar-collapsed:hover:bg-transparent"
            : ""
        }`}
        onClick={() => {
          setMenuView("main");
          setOpen((current) => !current);
        }}
        type="button"
      >
        <span className="relative flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent-strong text-sm font-semibold text-accent-foreground shadow-[var(--shadow-card)] transition group-hover:brightness-110">
          {user.initials}
          <UnreadBadge className="absolute -right-1 -top-1" count={unreadCount} />
        </span>
        {placement === "up" ? (
          <span className="min-w-0 flex-1 sidebar-collapsed:hidden">
            <span className="block truncate text-sm font-medium text-foreground">{user.displayName}</span>
            <span className="block truncate text-xs text-muted">{user.subtitle}</span>
          </span>
        ) : null}
      </button>

      <div
        aria-hidden={!open}
        className={`ff-card ff-scroll absolute z-50 max-h-[calc(100vh-5rem)] overflow-y-auto p-2 transition-all duration-200 ease-out ${PANEL_PLACEMENT[placement]} ${
          menuView === "notifications" ? "w-80" : "w-64"
        } ${
          open
            ? "translate-y-0 scale-100 opacity-100"
            : `pointer-events-none scale-95 opacity-0 ${placement === "up" ? "translate-y-1" : "-translate-y-1"}`
        }`}
      >
        {menuView === "notifications" ? (
          <>
            <button
              className="flex w-full cursor-pointer items-center gap-1.5 rounded-[0.5rem] px-2 py-1.5 text-sm font-semibold transition hover:bg-surface-contrast"
              onClick={() => setMenuView("main")}
              type="button"
            >
              <ChevronLeft aria-hidden className="h-4 w-4" />
              Notifications
            </button>
            <div className="my-1.5 border-t border-border" />
            {open ? (
              <NotificationsList
                onOpen={(notification) => {
              setOpen(false);
              setOpenNotification(notification);
            }}
                onUnreadCountChange={setUnreadCount}
                unreadCount={unreadCount}
              />
            ) : null}
          </>
        ) : (
          <>
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
            {user.authConfigured ? (
              <button
                className={`${menuItemClass} flex w-full cursor-pointer items-center justify-between gap-2 text-left`}
                onClick={() => setMenuView("notifications")}
                type="button"
              >
                <span className="flex items-center gap-2">
                  <Bell aria-hidden className="h-4 w-4 text-muted" />
                  Notifications
                </span>
                <span className="flex items-center gap-1.5">
                  <UnreadBadge count={unreadCount} />
                  <ChevronRight aria-hidden className="h-4 w-4 text-muted" />
                </span>
              </button>
            ) : null}
            <Link className={`${menuItemClass} flex items-center gap-2`} href="/app/profile" onClick={() => setOpen(false)}>
              <UserRound aria-hidden className="h-4 w-4 text-muted" />
              Profile
            </Link>
            {user.isAdmin ? (
              <div className="lg:hidden">
                {[
                  ["/app/admin", "Insights"],
                  ["/app/admin/debug", "Debug"],
                  ["/app/admin/evals", "Evals"]
                ].map(([href, label]) => (
                  <Link className={`${menuItemClass} block`} href={href} key={href} onClick={() => setOpen(false)}>
                    {label}
                  </Link>
                ))}
              </div>
            ) : null}
            <div className="my-1.5 border-t border-border" />
            <p className="px-2.5 pb-1.5 pt-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted">
              Theme
            </p>
            <ThemeToggle className="mx-1" />
            {user.authConfigured ? (
              <>
                <div className="my-1.5 border-t border-border" />
                <form action={signOut}>
                  <button className={`${menuItemClass} flex w-full cursor-pointer items-center gap-2 text-left`} type="submit">
                    <LogOut aria-hidden className="h-4 w-4 text-muted" />
                    Log out
                  </button>
                </form>
              </>
            ) : null}
          </>
        )}
      </div>
      {openNotification ? (
        <NotificationModal notification={openNotification} onClose={closeNotification} />
      ) : null}
    </div>
  );
}
