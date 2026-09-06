import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppProfile, CurrentAppContext } from "@/lib/profile";

const { redirect, createSupabaseServerClient } = vi.hoisted(() => ({
  redirect: vi.fn(() => {
    throw new Error("REDIRECT");
  }),
  createSupabaseServerClient: vi.fn()
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));

async function importAdmin() {
  return import("./admin");
}

beforeEach(() => {
  vi.resetAllMocks();
  redirect.mockImplementation(() => {
    throw new Error("REDIRECT");
  });
});

function readyContext(overrides: Partial<CurrentAppContext> = {}): CurrentAppContext {
  return {
    schemaReady: true,
    authConfigured: true,
    user: { id: "user-1" },
    profile: { role: "admin" } as AppProfile,
    error: null,
    ...overrides
  } as CurrentAppContext;
}

describe("isAdminProfile", () => {
  it("returns true only for a profile with the admin role", async () => {
    const { isAdminProfile } = await importAdmin();
    expect(isAdminProfile({ role: "admin" } as AppProfile)).toBe(true);
    expect(isAdminProfile({ role: "member" } as unknown as AppProfile)).toBe(false);
    expect(isAdminProfile(null)).toBe(false);
    expect(isAdminProfile(undefined)).toBe(false);
  });
});

describe("requireAdminContext", () => {
  it("redirects to login when auth isn't configured or there's no user", async () => {
    const { requireAdminContext } = await importAdmin();

    expect(() =>
      requireAdminContext(readyContext({ authConfigured: false }))
    ).toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login?message=Log%20in%20to%20continue.");

    redirect.mockClear();
    expect(() => requireAdminContext(readyContext({ user: null }))).toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login?message=Log%20in%20to%20continue.");
  });

  it("redirects to chat when the user isn't an admin", async () => {
    const { requireAdminContext } = await importAdmin();

    expect(() =>
      requireAdminContext(readyContext({ profile: { role: "member" } as unknown as AppProfile }))
    ).toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith(
      "/app/chat?error=Admin%20access%20is%20restricted%20to%20approved%20accounts."
    );
  });

  it("does not redirect for an authenticated admin", async () => {
    const { requireAdminContext } = await importAdmin();
    expect(() => requireAdminContext(readyContext())).not.toThrow();
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("getAdminOverviewData", () => {
  it("returns empty overview data when the schema isn't ready or the user isn't an admin", async () => {
    const { getAdminOverviewData } = await importAdmin();

    const result = await getAdminOverviewData(readyContext({ schemaReady: false, error: "not ready" }));

    expect(result.ready).toBe(false);
    expect(result.error).toBe("not ready");
    expect(result.metrics).toBeNull();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("builds metric cards and pillar usage from a full metrics payload", async () => {
    const rpc = vi.fn((fn: string) => {
      if (fn === "admin_overview_metrics") {
        return Promise.resolve({
          data: {
            totalUsers: 100,
            realUsers: 80,
            internalTestUsers: 15,
            syntheticDemoUsers: 5,
            onboardingCompleted: 60,
            onboardingCompletionRate: 60.4,
            activeUsers7d: 40,
            activeUsers30d: 90,
            conversationVolume7d: 250,
            pillarUsage30d: { activity: 10, diet: 20, lifestyle: 8, wellness: 5 }
          },
          error: null
        });
      }
      return Promise.resolve({ data: [], error: null });
    });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      then: (onFulfilled: (value: { data: unknown[]; error: null }) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(onFulfilled)
    });
    createSupabaseServerClient.mockResolvedValue({ rpc, from });

    const { getAdminOverviewData } = await importAdmin();
    const result = await getAdminOverviewData(readyContext());

    expect(result.ready).toBe(true);
    expect(result.metricCards[0]).toEqual({
      label: "Accounts in reporting",
      value: "100",
      detail: "80 real, 15 internal test, and 5 synthetic demo"
    });
    expect(result.metricCards[1].value).toBe("60%");
    expect(result.pillarUsageCards).toEqual([
      { label: "Exercise", value: "10" },
      { label: "Diet", value: "20" },
      { label: "Lifestyle", value: "8" },
      { label: "Wellness", value: "5" }
    ]);
  });

  it("still surfaces fetched product suggestions and test accounts when the admin RPC functions don't exist yet", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "function admin_overview_metrics() does not exist" }
    });
    const productSuggestions = [{ id: "s1" }];
    const testAccounts = [
      { id: "a1", full_name: "Jess", account_type: "synthetic_demo", onboarding_completed: false, primary_goal: "run a 5k" }
    ];
    let callIndex = 0;
    const from = vi.fn().mockImplementation(() => {
      callIndex += 1;
      const isTestAccountsCall = callIndex === 2;
      return {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: (onFulfilled: (value: { data: unknown[]; error: null }) => unknown) =>
          Promise.resolve({ data: isTestAccountsCall ? testAccounts : productSuggestions, error: null }).then(
            onFulfilled
          )
      };
    });
    createSupabaseServerClient.mockResolvedValue({ rpc, from });

    const { getAdminOverviewData } = await importAdmin();
    const result = await getAdminOverviewData(readyContext());

    expect(result.ready).toBe(false);
    expect(result.error).toBe("function admin_overview_metrics() does not exist");
    expect(result.metricCards).toEqual([
      { label: "Accounts in reporting", value: "0" },
      { label: "Onboarding completion", value: "0%" },
      { label: "Active accounts (7d)", value: "0" },
      { label: "Conversation volume (7d)", value: "0" }
    ]);
    // Unlike the generic "metrics unavailable" fallback, this branch keeps whatever product
    // suggestions and test accounts were already fetched instead of discarding them.
    expect(result.productSuggestions).toEqual(productSuggestions);
    expect(result.testAccounts).toEqual([
      {
        id: "a1",
        name: "Jess",
        accountType: "Synthetic Demo",
        onboardingCompleted: false,
        primaryGoal: "run a 5k"
      }
    ]);
  });

  it("discards fetched product suggestions and test accounts on the generic metrics-unavailable fallback", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "connection timed out" }
    });
    const productSuggestions = [{ id: "s1" }];
    const testAccounts = [
      { id: "a1", full_name: "Jess", account_type: "synthetic_demo", onboarding_completed: false, primary_goal: "run a 5k" }
    ];
    let callIndex = 0;
    const from = vi.fn().mockImplementation(() => {
      callIndex += 1;
      const isTestAccountsCall = callIndex === 2;
      return {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: (onFulfilled: (value: { data: unknown[]; error: null }) => unknown) =>
          Promise.resolve({ data: isTestAccountsCall ? testAccounts : productSuggestions, error: null }).then(
            onFulfilled
          )
      };
    });
    createSupabaseServerClient.mockResolvedValue({ rpc, from });

    const { getAdminOverviewData } = await importAdmin();
    const result = await getAdminOverviewData(readyContext());

    expect(result.ready).toBe(false);
    expect(result.error).toBe("connection timed out");
    expect(result.productSuggestions).toEqual([]);
    expect(result.testAccounts).toEqual([]);
  });

  it("title-cases test account types and falls back to a placeholder name", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        totalUsers: 1,
        realUsers: 1,
        internalTestUsers: 0,
        syntheticDemoUsers: 0,
        onboardingCompleted: 0,
        onboardingCompletionRate: 0,
        activeUsers7d: 0,
        activeUsers30d: 0,
        conversationVolume7d: 0,
        pillarUsage30d: {}
      },
      error: null
    });
    const testAccounts = [
      { id: "a1", full_name: "  ", account_type: "internal_test", onboarding_completed: true, primary_goal: null }
    ];
    let callIndex = 0;
    const from = vi.fn().mockImplementation(() => {
      callIndex += 1;
      const isTestAccountsCall = callIndex === 2;
      return {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: (onFulfilled: (value: { data: unknown[]; error: null }) => unknown) =>
          Promise.resolve({ data: isTestAccountsCall ? testAccounts : [], error: null }).then(onFulfilled)
      };
    });
    createSupabaseServerClient.mockResolvedValue({ rpc, from });

    const { getAdminOverviewData } = await importAdmin();
    const result = await getAdminOverviewData(readyContext());

    expect(result.testAccounts).toEqual([
      {
        id: "a1",
        name: "Unnamed test account",
        accountType: "Internal Test",
        onboardingCompleted: true,
        primaryGoal: null
      }
    ]);
  });
});
