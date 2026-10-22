// The button a notification offers, when it leads somewhere other than the page you're on.
export function notificationAction(notification: { type: string; action_url: string | null }) {
  if (!notification.action_url) return null;
  if (notification.type === "frankie_nudge") {
    return {
      href: notification.action_url,
      label: notification.action_url.includes("frankie=open") ? "Open Frankie's Day" : "Tell Frankie something"
    };
  }
  if (notification.type === "checkin_reminder") {
    return { href: notification.action_url, label: "Check in with Frankie" };
  }
  return { href: notification.action_url, label: "Chat with Frankie" };
}
