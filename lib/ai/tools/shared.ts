import type { LoggedForDateValue } from "@/lib/chat";
import { getPacificDateKey } from "../../../packages/dashboard-core";

function isValidIsoDate(value: LoggedForDateValue | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function resolveLoggedForDate(exactDate?: LoggedForDateValue): string {
  if (isValidIsoDate(exactDate)) {
    return exactDate;
  }

  return getPacificDateKey();
}
