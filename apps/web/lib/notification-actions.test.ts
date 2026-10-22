import { describe, expect, it } from "vitest";
import { notificationAction } from "./notification-actions";

describe("notificationAction", () => {
  it.each([
    [{ type: "frankie_nudge", action_url: "/app/chat?frankie=open" }, "Open Frankie's Day"],
    [{ type: "frankie_nudge", action_url: "/app/chat" }, "Tell Frankie something"],
    [{ type: "checkin_reminder", action_url: "/app/chat" }, "Check in with Frankie"],
    [{ type: "weekly_summary", action_url: "/app/chat" }, "Chat with Frankie"]
  ])("labels %o as %s", (notification, label) => {
    expect(notificationAction(notification)).toEqual({ href: notification.action_url, label });
  });

  it("offers nothing without a link", () => {
    expect(notificationAction({ type: "daily_summary", action_url: null })).toBeNull();
  });
});
