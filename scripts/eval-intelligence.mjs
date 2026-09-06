#!/usr/bin/env node

import fs from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");

function loadEnvFile(fileName) {
  const filePath = path.join(projectRoot, fileName);

  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function resolveExistingPath(basePath) {
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
    return basePath;
  }

  const candidates = [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}.mjs`,
    `${basePath}.cjs`,
    `${basePath}.json`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js")
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function registerAliasHook() {
  const evalOnlyStubs = new Map([
    ["@/lib/profile", path.join(projectRoot, "scripts", "eval-stubs", "profile.ts")],
    [
      "@/lib/supabase/server",
      path.join(projectRoot, "scripts", "eval-stubs", "supabase-server.ts")
    ]
  ]);

  registerHooks({
    resolve(specifier, context, nextResolve) {
      const stubPath = evalOnlyStubs.get(specifier);

      if (stubPath) {
        return {
          shortCircuit: true,
          url: pathToFileURL(stubPath).href
        };
      }

      if (specifier.startsWith("@/")) {
        const resolvedAlias = resolveExistingPath(path.join(projectRoot, specifier.slice(2)));

        if (resolvedAlias) {
          return {
            shortCircuit: true,
            url: pathToFileURL(resolvedAlias).href
          };
        }
      }

      if (specifier.startsWith("./") || specifier.startsWith("../")) {
        const parentPath = context.parentURL ? fileURLToPath(context.parentURL) : null;
        const basePath = parentPath
          ? path.resolve(path.dirname(parentPath), specifier)
          : path.resolve(projectRoot, specifier);
        const resolvedRelative = resolveExistingPath(basePath);

        if (resolvedRelative) {
          return {
            shortCircuit: true,
            url: pathToFileURL(resolvedRelative).href
          };
        }
      }

      return nextResolve(specifier, context);
    }
  });
}

function parseArgs(argv) {
  const options = {
    caseId: null,
    includePassingRaw: false,
    repeat: 1,
    scenarioId: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--case") {
      options.caseId = argv[index + 1] ?? null;
      index += 1;
    }

    if (arg === "--include-passing-raw") {
      options.includePassingRaw = true;
    }

    if (arg === "--repeat") {
      const parsed = Number.parseInt(argv[index + 1] ?? "", 10);
      options.repeat = Number.isFinite(parsed) && parsed > 0 ? parsed : options.repeat;
      index += 1;
    }

    if (arg === "--scenario") {
      options.scenarioId = argv[index + 1] ?? null;
      index += 1;
    }
  }

  return options;
}

function createCardioBenchmarkProfile() {
  return {
    account_type: "internal_test",
    activity_level: "Consistently active",
    age_range: "35-44",
    available_equipment: ["Bodyweight only", "Cardio machines"],
    avoidances: ["Overly aggressive training jumps"],
    coaching_style: "Gentle and steady",
    current_activities: ["Running four days a week", "Walking and mobility"],
    diet_preferences: ["Mediterranean", "Flexible"],
    diet_restrictions: [],
    energy_baseline: "Up and down",
    fitness_experience: "Intermediate",
    full_name: "Chris Alvarez",
    health_considerations: [],
    injuries_limitations: ["tight calves when volume climbs too fast"],
    nutrition_goal: "support recovery and keep meals simple",
    onboarding_completed: true,
    onboarding_summary:
      "Chris wants to improve running while managing stress and recovery. Coach gently, keep training steady, and support simple recovery-focused meals.",
    preferred_activities: ["Running", "Walking", "Mobility"],
    preferred_checkin_style: "Both",
    preferred_schedule: {
      notes: "Morning runs feel best and Sundays are lighter."
    },
    primary_goal: "Improve running while managing stress and recovery",
    role: "user",
    safety_acknowledged: true,
    secondary_goals: ["Performance", "Stress", "Recovery"],
    stress_baseline: "High",
    target_training_days: 5,
    typical_session_length: 45,
    training_environment: "Outdoors",
    wellness_checkin_opt_in: true,
    wellness_support_focus: ["Stress", "Recovery", "Energy"]
  };
}

function createLiftingBenchmarkProfile() {
  return {
    account_type: "internal_test",
    activity_level: "Consistently active",
    age_range: "35-44",
    available_equipment: ["Dumbbells", "Barbell", "Bench"],
    avoidances: ["Judgmental food language", "Overly aggressive training jumps"],
    coaching_style: "Encouraging and practical",
    current_activities: ["Strength training four days a week", "Walking for recovery"],
    diet_preferences: ["High protein", "Flexible"],
    diet_restrictions: [],
    energy_baseline: "Usually steady but dips with stress",
    fitness_experience: "Intermediate",
    full_name: "Maya Patel",
    health_considerations: [],
    injuries_limitations: ["shoulders can get cranky with too much pressing"],
    nutrition_goal: "eat enough protein and keep weeknight meals simple",
    onboarding_completed: true,
    onboarding_summary:
      "Maya wants to build strength while keeping recovery and nutrition consistent. Coach with practical encouragement and avoid making imperfect meals feel like failure.",
    preferred_activities: ["Strength training", "Walking", "Mobility"],
    preferred_checkin_style: "Both",
    preferred_schedule: {
      notes: "Weekday lifting works best; Sundays are for recovery."
    },
    primary_goal: "Build strength with better recovery and nutrition consistency",
    role: "user",
    safety_acknowledged: true,
    secondary_goals: ["Strength", "Recovery", "Nutrition consistency"],
    stress_baseline: "Moderate",
    target_training_days: 4,
    typical_session_length: 45,
    training_environment: "Gym",
    wellness_checkin_opt_in: true,
    wellness_support_focus: ["Soreness", "Energy", "Motivation"]
  };
}

function createDifficultMixedBenchmarkProfile() {
  return {
    account_type: "internal_test",
    activity_level: "Somewhat active",
    age_range: "25-34",
    available_equipment: ["Bodyweight only", "Gym access"],
    avoidances: ["All-or-nothing coaching", "Food guilt"],
    coaching_style: "Direct but kind",
    current_activities: ["Running", "Yoga", "Sports", "Occasional lifting"],
    diet_preferences: ["Flexible"],
    diet_restrictions: [],
    energy_baseline: "Variable",
    fitness_experience: "Beginner-intermediate",
    full_name: "Nina Brooks",
    health_considerations: [],
    injuries_limitations: ["stress can disrupt consistency"],
    nutrition_goal: "stabilize meals without making food feel complicated",
    onboarding_completed: true,
    onboarding_summary:
      "Nina wants a more consistent routine across mixed workouts, uneven meals, and variable stress. Coach clearly, avoid judgment, and look for small stabilizing next steps.",
    preferred_activities: ["Running", "Yoga", "Soccer", "Hiking"],
    preferred_checkin_style: "Both",
    preferred_schedule: {
      notes: "Schedule varies, so flexible weekly planning works better than rigid programming."
    },
    primary_goal: "Build consistency across activity, food, and stress",
    role: "user",
    safety_acknowledged: true,
    secondary_goals: ["Consistency", "Stress", "Body composition"],
    stress_baseline: "High",
    target_training_days: 4,
    typical_session_length: 35,
    training_environment: "Mixed",
    wellness_checkin_opt_in: true,
    wellness_support_focus: ["Stress", "Motivation", "Energy"]
  };
}

function createMessyInputBenchmarkProfile() {
  return {
    account_type: "internal_test",
    activity_level: "Somewhat active",
    age_range: "25-34",
    available_equipment: ["Bodyweight only", "Gym access"],
    avoidances: ["Rigid form-like clarification"],
    coaching_style: "Casual and quick",
    current_activities: ["Gym sessions", "Running"],
    diet_preferences: ["Flexible"],
    diet_restrictions: [],
    energy_baseline: "Variable",
    fitness_experience: "Intermediate",
    full_name: "Jordan Kim",
    health_considerations: [],
    injuries_limitations: [],
    nutrition_goal: "keep logging low-effort",
    onboarding_completed: true,
    onboarding_summary:
      "Jordan types fast, casual, and sloppy: typos, shorthand, run-on sentences, and vague low-context updates. Frankie should stay grounded in what was actually said instead of guessing at missing detail.",
    preferred_activities: ["Running", "Strength training"],
    preferred_checkin_style: "Both",
    preferred_schedule: {
      notes: "Logs whenever, often in one quick messy message."
    },
    primary_goal: "Keep logging consistent without needing to type carefully",
    role: "user",
    safety_acknowledged: true,
    secondary_goals: ["Consistency"],
    stress_baseline: "Moderate",
    target_training_days: 4,
    typical_session_length: 40,
    training_environment: "Mixed",
    wellness_checkin_opt_in: true,
    wellness_support_focus: ["Energy", "Consistency"]
  };
}

function formatValue(value) {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function printFailure(result) {
  console.log(`\nFAIL ${result.testCase.id}`);
  console.log(`Scenario: ${result.scenario.label}`);
  console.log(`Day/Pillar: ${result.testCase.dayLabel} / ${result.testCase.pillar}`);
  console.log(`Input: ${result.testCase.message}`);
  console.log(`Likely fix area(s): ${result.fixAreas.join(", ") || "unknown"}`);
  console.log("\nDiffs:");

  for (const diff of result.diffs) {
    console.log(
      `- ${diff.path} expected ${formatValue(diff.expected)}, got ${formatValue(diff.actual)}`
    );
  }

  console.log("\nActual normalized snapshot:");
  console.log(
    JSON.stringify(
      {
        activities: result.actual.activities,
        dietEntries: result.actual.dietEntries,
        metadata: result.actual.metadata,
        persistPlan: result.actual.persistPlan,
        rawModel: result.actual.rawModel,
        shouldPersistStructuredData: result.actual.shouldPersistStructuredData,
        wellnessCheckin: result.actual.wellnessCheckin
      },
      null,
      2
    )
  );
  console.log("\nRaw model extraction:");
  console.log(JSON.stringify(result.actual.rawModelExtraction, null, 2));
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");
  registerAliasHook();

  const options = parseArgs(process.argv.slice(2));

  if (options.repeat > 1 && !options.caseId && !options.scenarioId) {
    console.error(
      "--repeat requires --case or --scenario to avoid an accidental full-suite Nx run (each repeat is a live OpenAI API call)."
    );
    process.exitCode = 1;
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is required to run the intelligence eval.");
    process.exitCode = 1;
    return;
  }

  const { FRANKIE_PROMPT_VERSION, orchestrateFrankieReply } = await import(
    "../lib/ai/orchestrator/frankie-orchestrator.ts"
  );
  const { CARDIO_HAPPY_PATH_INTELLIGENCE_CASES } = await import(
    "../lib/evals/intelligence/cardio-happy-path.ts"
  );
  const { LIFTING_MIXED_PATH_INTELLIGENCE_CASES } = await import(
    "../lib/evals/intelligence/lifting-mixed-path.ts"
  );
  const { DIFFICULT_MIXED_PATH_INTELLIGENCE_CASES } = await import(
    "../lib/evals/intelligence/difficult-mixed-path.ts"
  );
  const { MESSY_INPUT_PATH_INTELLIGENCE_CASES } = await import(
    "../lib/evals/intelligence/messy-input-path.ts"
  );
  const { CLARIFICATION_FOLLOWTHROUGH_PATH_INTELLIGENCE_CASES } = await import(
    "../lib/evals/intelligence/clarification-followthrough-path.ts"
  );
  const { buildActualSnapshot, compareIntelligenceCase, summarizeFixAreas } = await import(
    "../lib/evals/intelligence/compare.ts"
  );
  const intelligenceScenarios = [
    {
      cases: CARDIO_HAPPY_PATH_INTELLIGENCE_CASES,
      id: "cardio-happy-path",
      label: "Cardio happy path",
      profile: createCardioBenchmarkProfile()
    },
    {
      cases: LIFTING_MIXED_PATH_INTELLIGENCE_CASES,
      id: "lifting-mixed-path",
      label: "Lifting mixed path",
      profile: createLiftingBenchmarkProfile()
    },
    {
      cases: DIFFICULT_MIXED_PATH_INTELLIGENCE_CASES,
      id: "difficult-mixed-path",
      label: "Difficult mixed path",
      profile: createDifficultMixedBenchmarkProfile()
    },
    {
      cases: MESSY_INPUT_PATH_INTELLIGENCE_CASES,
      id: "messy-input-path",
      label: "Messy input path",
      profile: createMessyInputBenchmarkProfile()
    },
    {
      cases: CLARIFICATION_FOLLOWTHROUGH_PATH_INTELLIGENCE_CASES,
      id: "clarification-followthrough-path",
      label: "Clarification follow-through path",
      profile: createMessyInputBenchmarkProfile()
    }
  ];
  const selectedScenarios = options.scenarioId
    ? intelligenceScenarios.filter((scenario) => scenario.id === options.scenarioId)
    : intelligenceScenarios;

  if (selectedScenarios.length === 0) {
    console.error(`No intelligence eval scenario found for "${options.scenarioId}".`);
    process.exitCode = 1;
    return;
  }

  const cases = selectedScenarios.flatMap((scenario) =>
    scenario.cases
      .filter((testCase) => !options.caseId || testCase.id === options.caseId)
      .map((testCase) => ({ scenario, testCase }))
  );

  if (cases.length === 0) {
    console.error(`No intelligence eval case found for "${options.caseId}".`);
    process.exitCode = 1;
    return;
  }

  console.log("Frankie Intelligence Eval");
  console.log(`Scenario: ${options.scenarioId ?? "all"}`);
  console.log(`Prompt: ${FRANKIE_PROMPT_VERSION}`);
  console.log(`Model: ${process.env.OPENAI_MODEL ?? "gpt-4o-mini"}`);
  console.log("Mode: isolated extraction, coach response skipped\n");

  const caseResults = [];

  for (const { scenario, testCase } of cases) {
    const attempts = [];

    for (let attempt = 0; attempt < options.repeat; attempt += 1) {
      let pendingClarification;

      for (const precedingMessage of testCase.precedingMessages ?? []) {
        const precedingResult = await orchestrateFrankieReply({
          message: precedingMessage,
          profile: scenario.profile,
          recentMessages: [],
          skipCoachResponse: true,
          pendingClarification
        });

        pendingClarification = precedingResult.metadata.pendingClarification;
      }

      const orchestrationResult = await orchestrateFrankieReply({
        message: testCase.message,
        profile: scenario.profile,
        recentMessages: [],
        skipCoachResponse: true,
        pendingClarification
      });
      const actual = buildActualSnapshot(orchestrationResult);
      const diffs = compareIntelligenceCase({
        actual,
        testCase
      });
      const attemptResult = {
        actual,
        diffs,
        fixAreas: summarizeFixAreas(diffs),
        passed: diffs.length === 0,
        scenario,
        testCase
      };

      attempts.push(attemptResult);
      process.stdout.write(attemptResult.passed ? "." : "F");
    }

    caseResults.push({ attempts, scenario, testCase });
  }

  console.log("\n");

  if (options.repeat > 1) {
    for (const { attempts, scenario, testCase } of caseResults) {
      const passedCount = attempts.filter((attempt) => attempt.passed).length;
      const rate = Math.round((passedCount / attempts.length) * 100);

      console.log(`${testCase.id}: ${passedCount}/${attempts.length} passed (${rate}%) [${scenario.label}]`);

      if (passedCount < attempts.length) {
        const firstFailure = attempts.find((attempt) => !attempt.passed);
        console.log("First failing attempt diffs:");
        for (const diff of firstFailure.diffs) {
          console.log(
            `  - ${diff.path} expected ${formatValue(diff.expected)}, got ${formatValue(diff.actual)}`
          );
        }
      }
    }

    console.log(
      "\n--repeat is a diagnostic mode measuring model non-determinism; it does not fail the build regardless of pass rate."
    );
    return;
  }

  const results = caseResults.flatMap((caseResult) => caseResult.attempts);
  const passed = results.filter((result) => result.passed);
  const failed = results.filter((result) => !result.passed);

  console.log(`${results.length} cases`);
  console.log(`${passed.length} passed`);
  console.log(`${failed.length} failed`);

  if (failed.length > 0) {
    for (const result of failed) {
      printFailure(result);
    }

    process.exitCode = 1;
    return;
  }

  if (options.includePassingRaw) {
    for (const result of passed) {
      console.log(`\nPASS ${result.testCase.id}`);
      console.log(`Scenario: ${result.scenario.label}`);
      console.log(JSON.stringify(result.actual.rawModelExtraction, null, 2));
    }
  }

  console.log("\nAll intelligence eval cases passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
