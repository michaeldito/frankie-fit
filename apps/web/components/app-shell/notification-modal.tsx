"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useFrankieDay } from "@/components/frankie-day/frankie-day-context";
import ReactMarkdown from "react-markdown";
import type { NotificationItem } from "@/components/app-shell/notifications-list";
import { formatNotificationTime } from "@/components/app-shell/notifications-list";
import { notificationAction } from "@/lib/notification-actions";

export function NotificationModal({
  notification,
  onClose
}: {
  notification: NotificationItem;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { openSheet } = useFrankieDay();
  const [fullBody, setFullBody] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/notifications/${notification.id}`)
      .then((response) => (response.ok ? (response.json() as Promise<{ fullBody?: string }>) : null))
      .then((data) => {
        if (!cancelled && data?.fullBody) setFullBody(data.fullBody);
      })
      .catch(() => undefined);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [notification.id, onClose]);

  const action = notificationAction(notification);
  // A plain link back to the page you're already on would do nothing, so skip it.
  const visibleAction = action && (action.href.includes("?") || action.href !== pathname) ? action : null;
  const opensFrankieDay = Boolean(action?.href.includes("frankie=open"));

  // Portaled to <body>: the account menu that opens this is transformed, which would otherwise
  // trap a fixed-position overlay inside it.
  return createPortal(
    <div
      aria-labelledby="notification-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="ff-panel-strong ff-scroll flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-b-none sm:rounded-b-[0.9rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-[-0.02em]" id="notification-modal-title">
              {notification.title}
            </h2>
            <p className="mt-1 text-xs text-muted">{formatNotificationTime(notification.created_at)}</p>
          </div>
          <button
            aria-label="Close"
            className="ff-button-secondary h-9 w-9 flex-none cursor-pointer p-0"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>

        <div className="ff-scroll ff-markdown min-h-0 flex-1 overflow-y-auto p-5 text-sm leading-7">
          <ReactMarkdown>{fullBody ?? notification.body}</ReactMarkdown>
        </div>

        {visibleAction ? (
          <div className="flex justify-end border-t border-border p-4">
            {opensFrankieDay ? (
              <button
                className="ff-button-primary cursor-pointer px-4 py-2 text-sm"
                onClick={() => {
                  onClose();
                  openSheet();
                }}
                type="button"
              >
                {visibleAction.label}
              </button>
            ) : (
              <Link className="ff-button-primary px-4 py-2 text-sm" href={visibleAction.href} onClick={onClose}>
                {visibleAction.label}
              </Link>
            )}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
