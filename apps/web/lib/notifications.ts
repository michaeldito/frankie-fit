import type { SupabaseClient } from "@supabase/supabase-js";
import { Expo } from "expo-server-sdk";
import {
  addDays,
  getPacificDateKey,
  getPacificDayUtcRange,
  getPacificToday,
  getPacificYesterday,
  toDateKey
} from "@frankie-fit/dashboard-core";
import { loadProfile } from "@/lib/admin-eval-runner";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { generateDailyCoachSummary, generateWeeklyCoachSummary } from "@/lib/ai/summaries/frankie-summaries";
import type { Database } from "@/types/database";

const SUMMARY_NOTIFICATION_BODY_MAX_LENGTH = 400;
const expo = new Expo();

/**
 * Best-effort push delivery on top of the in-app `notifications` row, which stays the
 * source of truth. A user with no registered device (or a web-only user) is skipped silently.
 */
async function sendPushNotification(input: {
  actionUrl: string | null;
  body: string;
  supabase: SupabaseServerClient;
  title: string;
  userId: string;
}) {
  const { data: tokenRows } = await input.supabase
    .from("push_tokens")
    .select("expo_push_token")
    .eq("user_id", input.userId);

  const pushTokens = (tokenRows ?? [])
    .map((row) => row.expo_push_token)
    .filter((token) => Expo.isExpoPushToken(token));

  if (pushTokens.length === 0) {
    return;
  }

  const messages = pushTokens.map((token) => ({
    to: token,
    sound: "default" as const,
    title: input.title,
    body: input.body,
    data: { action_url: input.actionUrl }
  }));

  for (const chunk of expo.chunkPushNotifications(messages)) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch {
      // Push delivery is best-effort; the in-app notification row already exists.
    }
  }
}

function truncateSummaryText(summaryText: string) {
  if (summaryText.length <= SUMMARY_NOTIFICATION_BODY_MAX_LENGTH) {
    return summaryText;
  }

  return `${summaryText.slice(0, SUMMARY_NOTIFICATION_BODY_MAX_LENGTH - 1).trimEnd()}…`;
}

type SupabaseServerClient = SupabaseClient<Database>;
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export async function getUnreadNotificationCount(
  supabase: SupabaseServerClient,
  userId: string
) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    if (error.message.includes("public.notifications")) {
      return 0;
    }

    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function listNotifications(
  supabase: SupabaseServerClient,
  userId: string,
  limit = 20
): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.message.includes("public.notifications")) {
      return [];
    }

    throw new Error(error.message);
  }

  return data ?? [];
}

export async function markNotificationRead(
  supabase: SupabaseServerClient,
  userId: string,
  notificationId: string
) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }
}

export async function markAllNotificationsRead(
  supabase: SupabaseServerClient,
  userId: string
) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }
}

export function shouldSendCheckinReminder(input: {
  alreadyNudgedToday: boolean;
  hasLoggedToday: boolean;
  wellnessCheckinOptIn: boolean;
}) {
  return input.wellnessCheckinOptIn && !input.hasLoggedToday && !input.alreadyNudgedToday;
}

async function userHasLoggedToday(input: {
  supabase: SupabaseServerClient;
  today: string;
  userId: string;
}) {
  const [activities, dietEntries, wellnessCheckins] = await Promise.all([
    input.supabase
      .from("activity_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", input.userId)
      .eq("logged_for_date", input.today),
    input.supabase
      .from("diet_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", input.userId)
      .eq("logged_for_date", input.today),
    input.supabase
      .from("wellness_checkins")
      .select("id", { count: "exact", head: true })
      .eq("user_id", input.userId)
      .eq("logged_for_date", input.today)
  ]);

  return (
    (activities.count ?? 0) > 0 ||
    (dietEntries.count ?? 0) > 0 ||
    (wellnessCheckins.count ?? 0) > 0
  );
}

async function userWasAlreadyNudgedToday(input: {
  supabase: SupabaseServerClient;
  todayStartUtcIso: string;
  userId: string;
}) {
  const { count } = await input.supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId)
    .eq("type", "checkin_reminder")
    .gte("created_at", input.todayStartUtcIso);

  return (count ?? 0) > 0;
}

export async function evaluateCheckinNudges() {
  const supabase = createSupabaseServiceRoleClient();
  const today = getPacificDateKey();
  const todayStartUtcIso = new Date(`${today}T00:00:00.000Z`).toISOString();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("wellness_checkin_opt_in", true);

  if (error) {
    throw new Error(error.message);
  }

  let sentCount = 0;

  for (const profile of profiles ?? []) {
    const [hasLoggedToday, alreadyNudgedToday] = await Promise.all([
      userHasLoggedToday({ supabase, today, userId: profile.id }),
      userWasAlreadyNudgedToday({ supabase, todayStartUtcIso, userId: profile.id })
    ]);

    if (
      !shouldSendCheckinReminder({
        alreadyNudgedToday,
        hasLoggedToday,
        wellnessCheckinOptIn: true
      })
    ) {
      continue;
    }

    const title = "Check in with Frankie";
    const body = "You haven't logged anything today — a quick update helps keep tomorrow's coaching on track.";
    const actionUrl = "/app/chat";

    const { error: insertError } = await supabase.from("notifications").insert({
      user_id: profile.id,
      type: "checkin_reminder",
      title,
      body,
      action_url: actionUrl
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    await sendPushNotification({ actionUrl, body, supabase, title, userId: profile.id });

    sentCount += 1;
  }

  return { evaluatedCount: profiles?.length ?? 0, sentCount };
}

export function shouldSendDailySummaryNotification(input: {
  alreadySentToday: boolean;
  chattedYesterday: boolean;
}) {
  return input.chattedYesterday && !input.alreadySentToday;
}

export function shouldSendWeeklySummaryToday(pacificDayOfWeek: number) {
  return pacificDayOfWeek === 0;
}

export function getWeeklySummaryPeriod(today: Date = getPacificToday()) {
  const periodEndDate = addDays(today, -1);
  const periodStartDate = addDays(periodEndDate, -6);

  return { periodStart: toDateKey(periodStartDate), periodEnd: toDateKey(periodEndDate) };
}

async function userChattedOnDate(input: {
  dateKey: string;
  supabase: SupabaseServerClient;
  userId: string;
}) {
  const { startUtcIso, endUtcIso } = getPacificDayUtcRange(input.dateKey);
  const { count } = await input.supabase
    .from("conversation_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId)
    .eq("role", "user")
    .gte("created_at", startUtcIso)
    .lt("created_at", endUtcIso);

  return (count ?? 0) > 0;
}

async function userAlreadyReceivedNotificationToday(input: {
  supabase: SupabaseServerClient;
  todayStartUtcIso: string;
  type: "daily_summary" | "weekly_summary";
  userId: string;
}) {
  const { count } = await input.supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId)
    .eq("type", input.type)
    .gte("created_at", input.todayStartUtcIso);

  return (count ?? 0) > 0;
}

export async function evaluateDailySummaryNotifications() {
  const supabase = createSupabaseServiceRoleClient();
  const today = getPacificDateKey();
  const todayStartUtcIso = new Date(`${today}T00:00:00.000Z`).toISOString();
  const yesterday = toDateKey(getPacificYesterday());

  const { data: profiles, error } = await supabase.from("profiles").select("id");

  if (error) {
    throw new Error(error.message);
  }

  let sentCount = 0;

  for (const profile of profiles ?? []) {
    const [chattedYesterday, alreadySentToday] = await Promise.all([
      userChattedOnDate({ supabase, userId: profile.id, dateKey: yesterday }),
      userAlreadyReceivedNotificationToday({
        supabase,
        todayStartUtcIso,
        type: "daily_summary",
        userId: profile.id
      })
    ]);

    if (!shouldSendDailySummaryNotification({ alreadySentToday, chattedYesterday })) {
      continue;
    }

    const profileData = await loadProfile(supabase, profile.id);
    const summary = await generateDailyCoachSummary({
      supabase,
      userId: profile.id,
      profile: profileData,
      date: yesterday
    });

    const title = "Your daily summary from Frankie";
    const body = truncateSummaryText(summary.summary_text);
    const actionUrl = "/app/chat";

    const { error: insertError } = await supabase.from("notifications").insert({
      user_id: profile.id,
      type: "daily_summary",
      title,
      body,
      action_url: actionUrl
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    await sendPushNotification({ actionUrl, body, supabase, title, userId: profile.id });

    sentCount += 1;
  }

  return { evaluatedCount: profiles?.length ?? 0, sentCount };
}

export async function evaluateWeeklySummaryNotifications() {
  const today = getPacificToday();

  if (!shouldSendWeeklySummaryToday(today.getUTCDay())) {
    return { evaluatedCount: 0, sentCount: 0 };
  }

  const supabase = createSupabaseServiceRoleClient();
  const todayStartUtcIso = new Date(`${getPacificDateKey()}T00:00:00.000Z`).toISOString();
  const { periodStart, periodEnd } = getWeeklySummaryPeriod(today);

  const { data: profiles, error } = await supabase.from("profiles").select("id");

  if (error) {
    throw new Error(error.message);
  }

  let sentCount = 0;

  for (const profile of profiles ?? []) {
    const alreadySentToday = await userAlreadyReceivedNotificationToday({
      supabase,
      todayStartUtcIso,
      type: "weekly_summary",
      userId: profile.id
    });

    if (alreadySentToday) {
      continue;
    }

    const profileData = await loadProfile(supabase, profile.id);
    const summary = await generateWeeklyCoachSummary({
      supabase,
      userId: profile.id,
      profile: profileData,
      periodStart,
      periodEnd
    });

    const title = "Your weekly summary from Frankie";
    const body = truncateSummaryText(summary.summary_text);
    const actionUrl = "/app/chat";

    const { error: insertError } = await supabase.from("notifications").insert({
      user_id: profile.id,
      type: "weekly_summary",
      title,
      body,
      action_url: actionUrl
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    await sendPushNotification({ actionUrl, body, supabase, title, userId: profile.id });

    sentCount += 1;
  }

  return { evaluatedCount: profiles?.length ?? 0, sentCount };
}
