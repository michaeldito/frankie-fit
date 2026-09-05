import { describe, expect, it } from "vitest";
import { formatList, formatScheduleNotes, getAccountLabel, getDisplayName } from "./profile-format";

describe("getDisplayName", () => {
  it("prefers the profile's full name", () => {
    expect(
      getDisplayName(
        { email: "alex@example.com", user_metadata: { full_name: "Metadata Name" } },
        { full_name: "Profile Name" }
      )
    ).toBe("Profile Name");
  });

  it("falls back to the auth metadata name when the profile has none", () => {
    expect(
      getDisplayName(
        { email: "alex@example.com", user_metadata: { full_name: "Metadata Name" } },
        null
      )
    ).toBe("Metadata Name");
  });

  it("falls back to the email prefix when there is no name anywhere", () => {
    expect(getDisplayName({ email: "alex@example.com", user_metadata: {} }, null)).toBe("alex");
  });

  it("falls back to a generic label when there is no user at all", () => {
    expect(getDisplayName(null, null)).toBe("Frankie Fit member");
  });

  it("ignores blank names and falls through to the next source", () => {
    expect(
      getDisplayName(
        { email: "alex@example.com", user_metadata: { full_name: "   " } },
        { full_name: "  " }
      )
    ).toBe("alex");
  });
});

describe("getAccountLabel", () => {
  it("maps known account types to their labels", () => {
    expect(getAccountLabel("admin")).toBe("Admin account");
    expect(getAccountLabel("internal_test")).toBe("Internal test account");
    expect(getAccountLabel("test")).toBe("Internal test account");
    expect(getAccountLabel("synthetic_demo")).toBe("Synthetic demo account");
    expect(getAccountLabel("synthetic")).toBe("Synthetic demo account");
  });

  it("falls back to a generic member label for anything else", () => {
    expect(getAccountLabel("real_user")).toBe("Frankie Fit member");
    expect(getAccountLabel(null)).toBe("Frankie Fit member");
    expect(getAccountLabel(undefined)).toBe("Frankie Fit member");
  });
});

describe("formatList", () => {
  it("joins non-empty lists with a comma", () => {
    expect(formatList(["running", "yoga"])).toBe("running, yoga");
  });

  it("uses the fallback for empty, null, or undefined lists", () => {
    expect(formatList([])).toBe("Not set yet");
    expect(formatList(null)).toBe("Not set yet");
    expect(formatList(undefined)).toBe("Not set yet");
    expect(formatList(undefined, "None")).toBe("None");
  });
});

describe("formatScheduleNotes", () => {
  it("returns trimmed notes when present", () => {
    expect(formatScheduleNotes({ preferred_schedule: { notes: "  mornings only  " } })).toBe(
      "mornings only"
    );
  });

  it("falls back when notes are missing, blank, or the profile is absent", () => {
    expect(formatScheduleNotes({ preferred_schedule: { notes: "   " } })).toBe("Not set yet");
    expect(formatScheduleNotes({ preferred_schedule: null })).toBe("Not set yet");
    expect(formatScheduleNotes(null)).toBe("Not set yet");
    expect(formatScheduleNotes(undefined)).toBe("Not set yet");
  });

  it("falls back defensively when preferred_schedule is not a plain object (e.g. a raw Json array or primitive)", () => {
    expect(formatScheduleNotes({ preferred_schedule: ["mornings"] })).toBe("Not set yet");
    expect(formatScheduleNotes({ preferred_schedule: "mornings" })).toBe("Not set yet");
  });
});
