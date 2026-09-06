import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentAppContext, isOnboardingRequired } from "@/lib/profile";

export default async function CoreAppLayout({
  children
}: {
  children: ReactNode;
}) {
  const context = await getCurrentAppContext();

  if (isOnboardingRequired(context)) {
    redirect("/app/onboarding");
  }

  return <>{children}</>;
}
