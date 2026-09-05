import type { User } from "@supabase/supabase-js";

type DisplayNameUser = Pick<User, "email" | "user_metadata"> | null;

type DisplayNameProfile = {
  full_name?: string | null;
} | null;

export function getDisplayName(user: DisplayNameUser, profile: DisplayNameProfile) {
  const metadataName =
    typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;

  return (
    profile?.full_name?.trim() ||
    metadataName?.trim() ||
    user?.email?.split("@")[0] ||
    "Frankie Fit member"
  );
}

export function getAccountLabel(accountType: string | null | undefined) {
  switch (accountType) {
    case "admin":
      return "Admin account";
    case "internal_test":
    case "test":
      return "Internal test account";
    case "synthetic_demo":
    case "synthetic":
      return "Synthetic demo account";
    default:
      return "Frankie Fit member";
  }
}

export function formatList(values: string[] | null | undefined, fallback = "Not set yet") {
  return values && values.length > 0 ? values.join(", ") : fallback;
}

type ScheduleNotesProfile = {
  preferred_schedule?: unknown;
} | null;

/**
 * preferred_schedule is a plain `{ notes?: string } | null` on the web (a hand-written type)
 * but a generated Supabase `Json` column on mobile, which can structurally be an array or a
 * primitive as far as the type checker knows — so this checks the object shape defensively
 * rather than assuming either source's narrower type.
 */
export function formatScheduleNotes(profile: ScheduleNotesProfile | undefined) {
  const schedule = profile?.preferred_schedule;
  const notes =
    schedule &&
    typeof schedule === "object" &&
    !Array.isArray(schedule) &&
    typeof (schedule as { notes?: unknown }).notes === "string"
      ? (schedule as { notes: string }).notes.trim()
      : "";

  return notes || "Not set yet";
}
