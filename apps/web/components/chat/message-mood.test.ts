import { describe, expect, it } from "vitest";
import { loggedPillarsFor, moodForMessage } from "./message-mood";

describe("loggedPillarsFor", () => {
  it("ignores anything that isn't a log confirmation", () => {
    expect(loggedPillarsFor({ message_type: "chat", structured_payload: { dietLogged: [{}] } })).toEqual({
      pillars: [],
      activityTypes: []
    });
  });

  it("reads every pillar and the activity types from the payload", () => {
    expect(
      loggedPillarsFor({
        message_type: "log_confirmation",
        structured_payload: {
          activitiesLogged: [{ activityType: "cycling" }, { activityType: null }],
          dietLogged: [{}],
          lifestyleLogged: [{}],
          wellnessLogged: { energyScore: 4 }
        }
      })
    ).toEqual({ pillars: ["exercise", "diet", "wellness", "lifestyle"], activityTypes: ["cycling"] });
  });

  it("tolerates a missing payload", () => {
    expect(loggedPillarsFor({ message_type: "log_confirmation", structured_payload: null }).pillars).toEqual([]);
  });
});

describe("moodForMessage", () => {
  it("makes Frankie hungry after a meal and zoomy after a run", () => {
    expect(moodForMessage({ message_type: "log_confirmation", structured_payload: { dietLogged: [{}] } })).toBe("hungry");
    expect(
      moodForMessage({ message_type: "log_confirmation", structured_payload: { activitiesLogged: [{ activityType: "run" }] } })
    ).toBe("running");
  });

  it("waits politely on a clarification", () => {
    expect(moodForMessage({ message_type: "clarification_request" })).toBe("waiting");
  });
});
