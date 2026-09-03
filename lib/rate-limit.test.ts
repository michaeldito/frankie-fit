import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit within a window", () => {
    const key = "user-a";
    expect(checkRateLimit(key, 3).allowed).toBe(true);
    expect(checkRateLimit(key, 3).allowed).toBe(true);
    expect(checkRateLimit(key, 3).allowed).toBe(true);
  });

  it("blocks a request once the limit is reached in the same window", () => {
    const key = "user-b";
    checkRateLimit(key, 2);
    checkRateLimit(key, 2);
    const result = checkRateLimit(key, 2);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets the count once the window elapses", () => {
    const key = "user-c";
    checkRateLimit(key, 1);
    expect(checkRateLimit(key, 1).allowed).toBe(false);

    vi.advanceTimersByTime(60_000);

    expect(checkRateLimit(key, 1).allowed).toBe(true);
  });

  it("tracks separate keys independently", () => {
    checkRateLimit("user-d", 1);
    expect(checkRateLimit("user-d", 1).allowed).toBe(false);
    expect(checkRateLimit("user-e", 1).allowed).toBe(true);
  });
});
