"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
};

type NotificationBellProps = {
  initialUnreadCount: number;
};

function formatNotificationTime(createdAt: string) {
  const date = new Date(createdAt);

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function NotificationBell({ initialUnreadCount }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState<NotificationItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handlePointerDown);
      return () => document.removeEventListener("mousedown", handlePointerDown);
    }
  }, [isOpen]);

  async function handleToggle() {
    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);

    if (nextIsOpen && notifications === null) {
      setIsLoading(true);

      try {
        const response = await fetch("/api/notifications");
        const data = (await response.json()) as { notifications?: NotificationItem[] };
        setNotifications(data.notifications ?? []);
      } finally {
        setIsLoading(false);
      }
    }
  }

  async function handleMarkRead(notificationId: string) {
    setNotifications(
      (current) =>
        current?.map((item) =>
          item.id === notificationId && !item.read_at
            ? { ...item, read_at: new Date().toISOString() }
            : item
        ) ?? current
    );
    setUnreadCount((current) => Math.max(0, current - 1));

    await fetch(`/api/notifications/${notificationId}/read`, { method: "POST" });
  }

  async function handleMarkAllRead() {
    setNotifications(
      (current) =>
        current?.map((item) => (item.read_at ? item : { ...item, read_at: new Date().toISOString() })) ??
        current
    );
    setUnreadCount(0);

    await fetch("/api/notifications/read-all", { method: "POST" });
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-label="Notifications"
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-strong)] text-[var(--muted-strong)] transition hover:border-[rgba(147,197,253,0.4)] hover:text-[var(--foreground)]"
        onClick={handleToggle}
        type="button"
      >
        <svg fill="none" height="18" viewBox="0 0 20 20" width="18">
          <path
            d="M5 8a5 5 0 0 1 10 0v3.2c0 .5.16.98.46 1.38l.9 1.2a1 1 0 0 1-.8 1.6H4.44a1 1 0 0 1-.8-1.6l.9-1.2c.3-.4.46-.88.46-1.38V8Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path
            d="M8 16.5a2 2 0 0 0 4 0"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[rgba(248,113,113,0.95)] px-1 text-[0.6rem] font-semibold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      <div
        aria-hidden={!isOpen}
        className={`ff-card absolute right-0 z-30 mt-2 w-80 origin-top-right overflow-hidden p-2 transition-all duration-200 ease-out ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <p className="ff-kicker">Notifications</p>
          {unreadCount > 0 ? (
            <button
              className="cursor-pointer text-xs font-semibold text-[var(--accent,#93c5fd)] hover:underline"
              onClick={handleMarkAllRead}
              type="button"
            >
              Mark all read
            </button>
          ) : null}
        </div>

        <div className="ff-scroll max-h-96 overflow-y-auto">
          {isLoading ? (
            <p className="px-2 py-4 text-sm text-[var(--muted)]">Loading…</p>
          ) : !notifications || notifications.length === 0 ? (
            <p className="px-2 py-4 text-sm text-[var(--muted)]">You&apos;re all caught up.</p>
          ) : (
            notifications.map((notification) => {
              const content = (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{notification.title}</p>
                    {!notification.read_at ? (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[rgba(147,197,253,0.9)]" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{notification.body}</p>
                  <p className="mt-1.5 text-[0.68rem] text-[var(--muted)]">
                    {formatNotificationTime(notification.created_at)}
                  </p>
                </>
              );

              const className = `block rounded-[0.6rem] px-2.5 py-2 transition hover:bg-[color:color-mix(in_srgb,var(--surface-contrast)_72%,black_28%)] ${
                notification.read_at ? "" : "bg-[rgba(147,197,253,0.06)]"
              }`;

              return notification.action_url ? (
                <Link
                  className={className}
                  href={notification.action_url}
                  key={notification.id}
                  onClick={() => {
                    if (!notification.read_at) {
                      handleMarkRead(notification.id);
                    }
                    setIsOpen(false);
                  }}
                >
                  {content}
                </Link>
              ) : (
                <button
                  className={`w-full cursor-pointer text-left ${className}`}
                  key={notification.id}
                  onClick={() => handleMarkRead(notification.id)}
                  type="button"
                >
                  {content}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
