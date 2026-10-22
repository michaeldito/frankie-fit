"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
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

// Lives inside the account menu: loads on mount, and reports unread changes so the menu's
// badge stays in sync.
export function NotificationsList({
  unreadCount,
  onUnreadCountChange,
  onNavigate
}: {
  unreadCount: number;
  onUnreadCountChange: (updater: (current: number) => number) => void;
  onNavigate: () => void;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/notifications")
      .then((response) => response.json() as Promise<{ notifications?: NotificationItem[] }>)
      .then((data) => {
        if (!cancelled) setNotifications(data.notifications ?? []);
      })
      .catch(() => {
        if (!cancelled) setNotifications([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleMarkRead(notificationId: string) {
    setNotifications(
      (current) =>
        current?.map((item) =>
          item.id === notificationId && !item.read_at
            ? { ...item, read_at: new Date().toISOString() }
            : item
        ) ?? current
    );
    onUnreadCountChange((current) => Math.max(0, current - 1));

    await fetch(`/api/notifications/${notificationId}/read`, { method: "POST" });
  }

  async function handleMarkAllRead() {
    setNotifications(
      (current) =>
        current?.map((item) => (item.read_at ? item : { ...item, read_at: new Date().toISOString() })) ??
        current
    );
    onUnreadCountChange(() => 0);

    await fetch("/api/notifications/read-all", { method: "POST" });
  }

  return (
    <div>
      {unreadCount > 0 ? (
        <div className="flex justify-end px-2 pb-1">
          <button
            className="cursor-pointer text-xs font-semibold text-accent hover:underline"
            onClick={handleMarkAllRead}
            type="button"
          >
            Mark all read
          </button>
        </div>
      ) : null}

      <div className="ff-scroll max-h-96 overflow-y-auto">
        {notifications === null ? (
          <p className="px-2 py-4 text-sm text-[var(--muted)]">Loading…</p>
        ) : notifications.length === 0 ? (
          <p className="px-2 py-4 text-sm text-[var(--muted)]">You&apos;re all caught up.</p>
        ) : (
          notifications.map((notification) => {
            const content = (
              <>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{notification.title}</p>
                  {!notification.read_at ? (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{notification.body}</p>
                <p className="mt-1.5 text-[0.68rem] text-[var(--muted)]">
                  {formatNotificationTime(notification.created_at)}
                </p>
              </>
            );

            const className = `block rounded-[0.6rem] px-2.5 py-2 transition hover:bg-surface-contrast ${
              notification.read_at ? "" : "bg-accent/5"
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
                  onNavigate();
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
  );
}

export function UnreadBadge({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} unread`}
      className={`flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-danger px-1 text-[0.6rem] font-semibold leading-none text-background ${className}`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
