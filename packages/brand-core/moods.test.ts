import { describe, expect, it } from "vitest";
import { frankieMoodFor, isLateNight, type FrankieMoodInput } from "./moods";

describe("frankieMoodFor", () => {
  it.each<[string, FrankieMoodInput, string]>([
    ["thinking wins over everything", { isThinking: true, messageType: "log_confirmation", loggedPillars: ["diet"] }, "focused"],
    ["clarification makes him wait politely", { messageType: "clarification_request" }, "waiting"],
    ["workout drafts get his focus", { messageType: "workout_draft" }, "focused"],
    ["cycling gets the goggles", { messageType: "log_confirmation", loggedPillars: ["exercise"], activityTypes: ["Cycling"] }, "bikeRide"],
    ["a Peloton ride counts as biking", { messageType: "log_confirmation", loggedPillars: ["exercise"], activityTypes: ["peloton class"] }, "bikeRide"],
    ["yoga is stretching", { messageType: "log_confirmation", loggedPillars: ["exercise"], activityTypes: ["yoga"] }, "stretching"],
    ["other exercise is zoomies", { messageType: "log_confirmation", loggedPillars: ["exercise"], activityTypes: ["run"] }, "running"],
    ["exercise outranks a meal in the same message", { messageType: "log_confirmation", loggedPillars: ["diet", "exercise"] }, "running"],
    ["meals make him hungry", { messageType: "log_confirmation", loggedPillars: ["diet"] }, "hungry"],
    ["wellness check-ins are snuggly", { messageType: "log_confirmation", loggedPillars: ["wellness"] }, "snuggle"],
    ["lifestyle logs are happy", { messageType: "log_confirmation", loggedPillars: ["lifestyle"] }, "happy"],
    ["a confirmation with nothing logged falls through to chat", { messageType: "log_confirmation", loggedPillars: [], hourPacific: 10 }, "happy"],
    ["late-night chat is snuggle time", { messageType: "chat", hourPacific: 22 }, "snuggle"],
    ["daytime chat is happy", { messageType: "chat", hourPacific: 14 }, "happy"],
    ["no context at all is happy", {}, "happy"]
  ])("%s", (_label, input, expected) => {
    expect(frankieMoodFor(input)).toBe(expected);
  });
});

describe("isLateNight", () => {
  it.each([
    [20, false],
    [21, true],
    [0, true],
    [4, true],
    [5, false]
  ])("hour %i → %s", (hour, expected) => {
    expect(isLateNight(hour)).toBe(expected);
  });
});
