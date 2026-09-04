const FRANKIE_TIME_ZONE = "America/Los_Angeles";

/**
 * Every "what day is it" computation in the app (chat logging, dashboard
 * aggregation, mobile dashboard) must agree on the same calendar day.
 * Anchoring to Pacific time (rather than server-local time, which is UTC on
 * Vercel and device-local on mobile) keeps them all in sync around midnight.
 */
export function getPacificDateKey(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: FRANKIE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

/** Today's Pacific calendar date, represented as a UTC-noon-anchored Date so day-level arithmetic never crosses a DST boundary. */
export function getPacificToday(): Date {
  return fromDateKey(getPacificDateKey());
}

/** Yesterday's Pacific calendar date, anchored the same way as {@link getPacificToday}. */
export function getPacificYesterday(): Date {
  return addDays(getPacificToday(), -1);
}

export function addDays(value: Date, amount: number): Date {
  const nextValue = new Date(value);
  nextValue.setUTCDate(nextValue.getUTCDate() + amount);
  return nextValue;
}

export function toDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function fromDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12));
}

function getPacificUtcOffsetMinutes(date: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: FRANKIE_TIME_ZONE,
    timeZoneName: "shortOffset"
  });
  const offsetPart = formatter.formatToParts(date).find((part) => part.type === "timeZoneName")?.value ?? "GMT-8";
  const match = offsetPart.match(/GMT([+-]\d+)/);

  return match ? Number(match[1]) * 60 : -480;
}

/**
 * The [start, end) UTC instant range covering one Pacific calendar day, for
 * comparing against timestamptz columns (e.g. "did the user send a chat
 * message yesterday, Pacific time?").
 */
export function getPacificDayUtcRange(dateKey: string): { startUtcIso: string; endUtcIso: string } {
  const [year, month, day] = dateKey.split("-").map(Number);
  const referenceUtc = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12));
  const offsetMinutes = getPacificUtcOffsetMinutes(referenceUtc);
  const naiveUtcMidnight = Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 0, 0, 0);
  const startUtc = new Date(naiveUtcMidnight - offsetMinutes * 60000);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);

  return { startUtcIso: startUtc.toISOString(), endUtcIso: endUtc.toISOString() };
}

export function getWeekStart(value: Date = getPacificToday()): Date {
  const dayOfWeek = value.getUTCDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return addDays(value, diff);
}

export function formatShortDay(value: string): string {
  return fromDateKey(value).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

export function formatShortDate(value: string): string {
  return fromDateKey(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });
}
