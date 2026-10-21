import type { FrankieOrchestrationResult } from "@/lib/ai/orchestrator/frankie-orchestrator";

export type QualityCheckResult = {
  name: string;
  result: "pass" | "warn" | "fail" | "skip";
  detail: string | null;
};

export type QualitySummary = {
  pass: number;
  warn: number;
  fail: number;
  skip: number;
  worst: "pass" | "warn" | "fail";
};

type CheckInput = {
  reply: FrankieOrchestrationResult;
  userMessage: string;
  runStatus: string;
};

type QualityCheck = {
  name: string;
  run: (input: CheckInput) => QualityCheckResult;
};

export const QUALITY_CHECK_DESCRIPTIONS: Record<string, string> = {
  missed_exercise_extraction: "Exercise mentioned in the message was extracted as an activity",
  missed_food_extraction: "Food mentioned in the message was extracted as a diet entry",
  food_in_activities: "No food was misfiled as an activity",
  substance_in_activities: "No alcohol/cannabis was misfiled as an activity",
  duplicate_activities: "No activity was extracted twice",
  invalid_date_format: "Every extracted date is YYYY-MM-DD",
  score_out_of_range: "Wellness scores fall within 1–10",
  blank_intent: "Extracted entries have an intent label",
  unnecessary_clarification: "Clarification only asked when a blocking field is missing",
  empty_extraction_with_loggable_content: "Logging intent produced at least one entry"
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const EXERCISE_KEYWORDS = /\b(ran|run|running|jogged|jogging|walked|walking|hiked|hiking|biked|biking|cycled|cycling|swam|swimming|lifted|lifting|yoga|pilates|squats?|deadlifts?|bench|pushups?|pullups?|curls?|rows|sprints?|workout|worked out|gym|cardio|stretching|mobility)\b/i;

const FOOD_KEYWORDS = /\b(ate|eat|eating|breakfast|lunch|dinner|snack|brunch|supper|eggs?|toast|pizza|salad|chicken|rice|pasta|sandwich|burger|steak|oatmeal|yogurt|smoothie|shake|cereal|soup|sushi|tacos?|burrito|wrap)\b/i;

const FOOD_IN_ACTIVITY_KEYWORDS = /\b(ate|eat|eating|eggs?|toast|pizza|salad|chicken|rice|pasta|sandwich|burger|steak|oatmeal|yogurt|smoothie|protein shake|cereal|soup|sushi|tacos?|burrito|wrap|coffee|tea)\b/i;

const SUBSTANCE_KEYWORDS = /\b(smoked|smoking|vaped|vaping|edible|edibles|joint|weed|cannabis|marijuana|THC|beer|wine|cocktail|liquor|bourbon|whiskey|vodka|tequila|alcohol|drunk|drinking|drank|shots?)\b/i;

const checks: QualityCheck[] = [
  {
    name: "missed_exercise_extraction",
    run({ reply, userMessage }) {
      if (reply.metadata.intent === "general_question") return skip(this.name, "Message is a general question");
      if (reply.parsedActivities.length > 0) return pass(this.name);
      if (!EXERCISE_KEYWORDS.test(userMessage)) return skip(this.name, "No exercise mentioned");
      return fail(this.name, "Message contains exercise keywords but no activities were extracted");
    }
  },
  {
    name: "missed_food_extraction",
    run({ reply, userMessage }) {
      if (reply.metadata.intent === "general_question") return skip(this.name, "Message is a general question");
      if (reply.parsedDietEntries.length > 0) return pass(this.name);
      if (!FOOD_KEYWORDS.test(userMessage)) return skip(this.name, "No food mentioned");
      if (reply.parsedLifestyleEntries.some(e => e.category?.startsWith("substance_"))) return pass(this.name);
      return fail(this.name, "Message contains food keywords but no diet entries were extracted");
    }
  },
  {
    name: "food_in_activities",
    run({ reply }) {
      if (reply.parsedActivities.length === 0) return skip(this.name, "No activities extracted");
      for (const activity of reply.parsedActivities) {
        if (FOOD_IN_ACTIVITY_KEYWORDS.test(activity.description) || FOOD_IN_ACTIVITY_KEYWORDS.test(activity.activityType)) {
          return fail(this.name, `Activity "${activity.activityType}" contains food terms — should be a diet entry`);
        }
      }
      return pass(this.name);
    }
  },
  {
    name: "substance_in_activities",
    run({ reply }) {
      if (reply.parsedActivities.length === 0) return skip(this.name, "No activities extracted");
      for (const activity of reply.parsedActivities) {
        const text = `${activity.activityType} ${activity.description} ${activity.detectedKeyword}`;
        if (SUBSTANCE_KEYWORDS.test(text)) {
          return fail(this.name, `Activity "${activity.activityType}" contains substance terms — should be a lifestyle entry`);
        }
      }
      return pass(this.name);
    }
  },
  {
    name: "duplicate_activities",
    run({ reply }) {
      if (reply.parsedActivities.length < 2) return skip(this.name, "Fewer than two activities extracted");
      const seen = new Set<string>();
      for (const a of reply.parsedActivities) {
        const key = `${a.activityType}|${a.loggedForDate}|${a.durationMinutes ?? 0}`;
        if (seen.has(key)) {
          return warn(this.name, `Duplicate activity: ${a.activityType} on ${a.loggedForDate}`);
        }
        seen.add(key);
      }
      return pass(this.name);
    }
  },
  {
    name: "invalid_date_format",
    run({ reply }) {
      const dates: { label: string; value: string | null }[] = [];
      for (const a of reply.parsedActivities) dates.push({ label: `activity ${a.activityType}`, value: a.loggedForDate });
      for (const d of reply.parsedDietEntries) dates.push({ label: `diet "${d.description.slice(0, 30)}"`, value: d.loggedForDate });
      for (const l of reply.parsedLifestyleEntries) dates.push({ label: `lifestyle ${l.category}`, value: l.loggedForDate });
      if (reply.parsedWellnessCheckin) dates.push({ label: "wellness", value: reply.parsedWellnessCheckin.loggedForDate });
      if (!dates.some(d => d.value)) return skip(this.name, "No dates extracted");

      for (const { label, value } of dates) {
        if (value && !DATE_RE.test(value)) {
          return fail(this.name, `${label} has invalid date: "${value}"`);
        }
      }
      return pass(this.name);
    }
  },
  {
    name: "score_out_of_range",
    run({ reply }) {
      const w = reply.parsedWellnessCheckin;
      if (!w) return skip(this.name, "No wellness check-in extracted");
      const scores = [
        { name: "energy", value: w.energyScore },
        { name: "soreness", value: w.sorenessScore },
        { name: "mood", value: w.moodScore },
        { name: "stress", value: w.stressScore },
        { name: "motivation", value: w.motivationScore }
      ];
      for (const s of scores) {
        if (s.value !== null && s.value !== 0 && (s.value < 1 || s.value > 10)) {
          return fail(this.name, `${s.name} score ${s.value} is outside 1–10`);
        }
      }
      return pass(this.name);
    }
  },
  {
    name: "blank_intent",
    run({ reply }) {
      const hasEntries = reply.parsedActivities.length > 0
        || reply.parsedDietEntries.length > 0
        || reply.parsedLifestyleEntries.length > 0
        || reply.parsedWellnessCheckin !== null;
      if (!hasEntries) return skip(this.name, "No entries extracted");
      if (!reply.metadata.intent) {
        return warn(this.name, "Extracted entries exist but intent is blank");
      }
      return pass(this.name);
    }
  },
  {
    name: "unnecessary_clarification",
    run({ reply }) {
      if (!reply.metadata.needsClarification) return skip(this.name, "No clarification requested");
      const blockingFields = new Set(["activityType", "loggedForDate", "sessionSplit"]);
      const hasBlocking = reply.parsedActivities.some(a =>
        a.missingFields.some(f => blockingFields.has(f))
      );
      if (hasBlocking) return pass(this.name);
      return warn(this.name, "Clarification requested but no blocking missing fields found");
    }
  },
  {
    name: "empty_extraction_with_loggable_content",
    run({ reply }) {
      const intent = reply.metadata.intent ?? "";
      const loggableIntents = ["log_activity", "log_diet", "log_wellness", "log_lifestyle", "multi_pillar"];
      if (!loggableIntents.includes(intent)) return skip(this.name, "Not a logging message");
      const hasEntries = reply.parsedActivities.length > 0
        || reply.parsedDietEntries.length > 0
        || reply.parsedLifestyleEntries.length > 0
        || reply.parsedWellnessCheckin !== null;
      if (hasEntries) return pass(this.name);
      return fail(this.name, `Intent is "${intent}" but all extraction arrays are empty`);
    }
  }
];

function pass(name: string): QualityCheckResult {
  return { name, result: "pass", detail: null };
}

function skip(name: string, detail: string): QualityCheckResult {
  return { name, result: "skip", detail };
}

function warn(name: string, detail: string): QualityCheckResult {
  return { name, result: "warn", detail };
}

function fail(name: string, detail: string): QualityCheckResult {
  return { name, result: "fail", detail };
}

export function runQualityChecks(input: CheckInput): QualityCheckResult[] {
  return checks.map(check => check.run(input));
}

export function buildQualitySummary(results: QualityCheckResult[]): QualitySummary {
  let pass = 0;
  let warn = 0;
  let fail = 0;
  let skip = 0;
  for (const r of results) {
    if (r.result === "pass") pass++;
    else if (r.result === "warn") warn++;
    else if (r.result === "skip") skip++;
    else fail++;
  }
  const worst: QualitySummary["worst"] = fail > 0 ? "fail" : warn > 0 ? "warn" : "pass";
  return { pass, warn, fail, skip, worst };
}
