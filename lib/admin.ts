import { redirect } from "next/navigation";
import type { AppProfile, CurrentAppContext } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

type ProductSuggestionRow = Database["public"]["Tables"]["product_suggestions"]["Row"];
type PromptThemeRow = Database["public"]["Functions"]["admin_prompt_theme_counts"]["Returns"][number];
type FrictionRow = Database["public"]["Functions"]["admin_friction_summary"]["Returns"][number];

export type AdminMetricCard = {
  label: string;
  value: string;
  detail?: string;
};

export type AdminOverviewMetrics = {
  totalUsers: number;
  realUsers: number;
  internalTestUsers: number;
  syntheticDemoUsers: number;
  onboardingCompleted: number;
  onboardingCompletionRate: number;
  activeUsers7d: number;
  activeUsers30d: number;
  conversationVolume7d: number;
  pillarUsage30d: {
    activity: number;
    diet: number;
    wellness: number;
  };
};

export type AdminOverviewData = {
  ready: boolean;
  error: string | null;
  metrics: AdminOverviewMetrics | null;
  metricCards: AdminMetricCard[];
  pillarUsageCards: AdminMetricCard[];
  promptThemes: PromptThemeRow[];
  frictionSummary: FrictionRow[];
  productSuggestions: ProductSuggestionRow[];
  testAccounts: Array<{
    id: string;
    name: string;
    accountType: string;
    onboardingCompleted: boolean;
    primaryGoal: string | null;
  }>;
};

function parseAdminOverviewMetrics(value: Json | null): AdminOverviewMetrics | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const source = value as Record<string, Json | undefined>;
  const pillarUsageRaw =
    source.pillarUsage30d && typeof source.pillarUsage30d === "object" && !Array.isArray(source.pillarUsage30d)
      ? (source.pillarUsage30d as Record<string, Json | undefined>)
      : {};

  return {
    totalUsers: Number(source.totalUsers ?? 0),
    realUsers: Number(source.realUsers ?? 0),
    internalTestUsers: Number(source.internalTestUsers ?? 0),
    syntheticDemoUsers: Number(source.syntheticDemoUsers ?? 0),
    onboardingCompleted: Number(source.onboardingCompleted ?? 0),
    onboardingCompletionRate: Number(source.onboardingCompletionRate ?? 0),
    activeUsers7d: Number(source.activeUsers7d ?? 0),
    activeUsers30d: Number(source.activeUsers30d ?? 0),
    conversationVolume7d: Number(source.conversationVolume7d ?? 0),
    pillarUsage30d: {
      activity: Number(pillarUsageRaw.activity ?? 0),
      diet: Number(pillarUsageRaw.diet ?? 0),
      wellness: Number(pillarUsageRaw.wellness ?? 0)
    }
  };
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function titleCase(value: string) {
  return value
    .split("_")
    .map((segment) => segment.slice(0, 1).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function isAdminProfile(profile: AppProfile | null | undefined) {
  return profile?.role === "admin";
}

export function requireAdminContext(context: CurrentAppContext) {
  if (!context.authConfigured || !context.user) {
    redirect("/login?message=Log%20in%20to%20continue.");
  }

  if (!isAdminProfile(context.profile)) {
    redirect("/app/chat?error=Admin%20access%20is%20restricted%20to%20approved%20accounts.");
  }
}

function isMissingAdminFunction(message: string | null | undefined) {
  if (!message) {
    return false;
  }

  return (
    message.includes("admin_overview_metrics") ||
    message.includes("admin_prompt_theme_counts") ||
    message.includes("admin_friction_summary")
  );
}

function buildEmptyOverviewData(error: string | null): AdminOverviewData {
  return {
    ready: false,
    error,
    metrics: null,
    metricCards: [
      { label: "Accounts in reporting", value: "0" },
      { label: "Onboarding completion", value: "0%" },
      { label: "Active accounts (7d)", value: "0" },
      { label: "Conversation volume (7d)", value: "0" }
    ],
    pillarUsageCards: [
      { label: "Exercise", value: "0" },
      { label: "Diet", value: "0" },
      { label: "Wellness", value: "0" }
    ],
    promptThemes: [],
    frictionSummary: [],
    productSuggestions: [],
    testAccounts: []
  };
}

export async function getAdminOverviewData(
  context: CurrentAppContext
): Promise<AdminOverviewData> {
  if (!context.schemaReady || !context.user || !isAdminProfile(context.profile)) {
    return buildEmptyOverviewData(context.error);
  }

  const supabase = await createSupabaseServerClient();
  const [metricsResult, promptThemesResult, frictionSummaryResult, productSuggestionsResult, testAccountsResult] =
    await Promise.all([
      supabase.rpc("admin_overview_metrics"),
      supabase.rpc("admin_prompt_theme_counts"),
      supabase.rpc("admin_friction_summary"),
      supabase
        .from("product_suggestions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("profiles")
        .select("id, full_name, account_type, onboarding_completed, primary_goal")
        .in("account_type", ["internal_test", "synthetic_demo"])
        .order("account_type", { ascending: true })
        .limit(12)
    ]);

  const firstError =
    metricsResult.error?.message ??
    promptThemesResult.error?.message ??
    frictionSummaryResult.error?.message ??
    productSuggestionsResult.error?.message ??
    testAccountsResult.error?.message ??
    null;

  if (firstError && isMissingAdminFunction(firstError)) {
    return {
      ...buildEmptyOverviewData(firstError),
      productSuggestions: productSuggestionsResult.data ?? [],
      testAccounts:
        testAccountsResult.data?.map((account) => ({
          id: account.id,
          name: account.full_name?.trim() || "Unnamed test account",
          accountType: titleCase(account.account_type),
          onboardingCompleted: account.onboarding_completed,
          primaryGoal: account.primary_goal
        })) ?? []
    };
  }

  const metrics = parseAdminOverviewMetrics(metricsResult.data);

  if (!metrics) {
    return buildEmptyOverviewData(firstError ?? "Admin overview metrics were unavailable.");
  }

  return {
    ready: true,
    error: firstError,
    metrics,
    metricCards: [
      {
        label: "Accounts in reporting",
        value: `${metrics.totalUsers}`,
        detail: `${metrics.realUsers} real, ${metrics.internalTestUsers} internal test, and ${metrics.syntheticDemoUsers} synthetic demo`
      },
      {
        label: "Onboarding completion",
        value: formatPercent(metrics.onboardingCompletionRate),
        detail: `${metrics.onboardingCompleted} tracked accounts completed onboarding`
      },
      {
        label: "Active accounts (7d)",
        value: `${metrics.activeUsers7d}`,
        detail: `${metrics.activeUsers30d} active in the last 30 days`
      },
      {
        label: "Conversation volume (7d)",
        value: `${metrics.conversationVolume7d}`,
        detail: "User messages sent to Frankie across all tracked accounts"
      }
    ],
    pillarUsageCards: [
      { label: "Exercise", value: `${metrics.pillarUsage30d.activity}` },
      { label: "Diet", value: `${metrics.pillarUsage30d.diet}` },
      { label: "Wellness", value: `${metrics.pillarUsage30d.wellness}` }
    ],
    promptThemes: promptThemesResult.data ?? [],
    frictionSummary: frictionSummaryResult.data ?? [],
    productSuggestions: productSuggestionsResult.data ?? [],
    testAccounts:
      testAccountsResult.data?.map((account) => ({
        id: account.id,
        name: account.full_name?.trim() || "Unnamed test account",
        accountType: titleCase(account.account_type),
        onboardingCompleted: account.onboarding_completed,
        primaryGoal: account.primary_goal
      })) ?? []
  };
}
