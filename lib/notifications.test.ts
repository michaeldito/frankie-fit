import { describe, expect, it } from "vitest";
import { shouldSendCheckinReminder } from "./notifications";

describe("shouldSendCheckinReminder", () => {
  it("sends a reminder when opted in, unlogged, and not already nudged today", () => {
    expect(
      shouldSendCheckinReminder({
        alreadyNudgedToday: false,
        hasLoggedToday: false,
        wellnessCheckinOptIn: true
      })
    ).toBe(true);
  });

  it("does not send when the user opted out of check-ins", () => {
    expect(
      shouldSendCheckinReminder({
        alreadyNudgedToday: false,
        hasLoggedToday: false,
        wellnessCheckinOptIn: false
      })
    ).toBe(false);
  });

  it("does not send when the user already logged something today", () => {
    expect(
      shouldSendCheckinReminder({
        alreadyNudgedToday: false,
        hasLoggedToday: true,
        wellnessCheckinOptIn: true
      })
    ).toBe(false);
  });

  it("does not send a second reminder on the same day", () => {
    expect(
      shouldSendCheckinReminder({
        alreadyNudgedToday: true,
        hasLoggedToday: false,
        wellnessCheckinOptIn: true
      })
    ).toBe(false);
  });
});
