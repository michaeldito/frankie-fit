import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  UserAppShell,
  type UserAppShellUser
} from "@/components/app-shell/user-app-shell";
import {
  getAccountLabel,
  getCurrentAppContext,
  getDisplayName,
  getInitials
} from "@/lib/profile";

const previewUser: UserAppShellUser = {
  displayName: "Preview Member",
  subtitle: "Scaffold preview mode",
  initials: "PM",
  primaryGoal: "Build more consistency",
  goalDescription:
    "Keep movement, meals, and recovery close enough together that Frankie can guide the next step well.",
  authConfigured: false
};

export default async function AppLayout({ children }: { children: ReactNode }) {
  const context = await getCurrentAppContext();

  if (!context.authConfigured) {
    return <UserAppShell user={previewUser}>{children}</UserAppShell>;
  }

  if (!context.user) {
    redirect("/login?message=Log%20in%20to%20continue.");
  }

  const displayName = getDisplayName(context.user, context.profile);
  const primaryGoal = context.profile?.primary_goal?.trim()
    ? context.profile.primary_goal
    : context.schemaReady
      ? "Complete onboarding"
      : "Apply the database schema";
  const shellUser: UserAppShellUser = {
    displayName,
    subtitle: context.schemaReady
      ? getAccountLabel(
          context.profile?.role === "admin" ? "admin" : context.profile?.account_type
        )
      : "Database setup needed",
    initials: getInitials(displayName),
    primaryGoal,
    goalDescription: context.profile?.primary_goal
      ? "Frankie will keep coaching, summaries, and next-step guidance anchored to this goal."
      : context.schemaReady
        ? "Your onboarding answers will turn this into a more personal coaching read."
        : "Run the Supabase migration to unlock onboarding, saved profiles, and personalized coaching.",
    authConfigured: true
  };

  return <UserAppShell user={shellUser}>{children}</UserAppShell>;
}
