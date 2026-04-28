import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { seedAccounts } from "./seed-data/archetypes.mjs"
import {
  buildActivityConfirmation,
  buildCoachingSummary,
  buildDietConfirmation,
  buildInitialAssistantMessage,
  buildWellnessConfirmation
} from "./seed-data/message-builders.mjs"
import { getLoggedForDate, getTimestampForDay } from "./seed-data/weekly-rhythm.mjs"

const SEED_PACK_KEY = "demo-v1"
const DEFAULT_DEMO_PASSWORD = "FrankieFitDemo!2026"
const DRY_RUN = process.argv.includes("--dry-run")
const VERBOSE = process.argv.includes("--verbose")

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, "..")
const require = createRequire(import.meta.url)

loadEnvFile(path.join(repoRoot, ".env"))
loadEnvFile(path.join(repoRoot, ".env.local"))

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }

  const contents = fs.readFileSync(filePath, "utf8")

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith("#")) {
      continue
    }

    const separatorIndex = line.indexOf("=")

    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

function requireEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function getSupabaseCreateClient() {
  const supabaseModule = require("../node_modules/@supabase/supabase-js/dist/index.cjs")
  return supabaseModule.createClient
}

function getDemoPassword() {
  return process.env.FF_DEMO_ACCOUNT_PASSWORD || DEFAULT_DEMO_PASSWORD
}

function getSeedMetadata(account, dayIndex, domain) {
  return {
    seeded: true,
    seedPack: SEED_PACK_KEY,
    archetypeKey: account.key,
    accountType: account.accountType,
    domain,
    dayOffset: dayIndex
  }
}

function createProfilePayload(userId, account) {
  const profile = account.profile
  const onboardingSummary = buildCoachingSummary({
    primaryGoal: profile.primaryGoal,
    activityLevel: profile.activityLevel,
    preferredActivities: profile.preferredActivities,
    coachingStyle: profile.coachingStyle,
    targetTrainingDays: profile.targetTrainingDays,
    nutritionGoal: profile.nutritionGoal
  })

  return {
    id: userId,
    full_name: profile.fullName,
    role: "user",
    account_type: account.accountType,
    age_range: profile.ageRange,
    primary_goal: profile.primaryGoal,
    secondary_goals: profile.secondaryGoals,
    activity_level: profile.activityLevel,
    fitness_experience: profile.fitnessExperience,
    current_activities: profile.currentActivities,
    preferred_activities: profile.preferredActivities,
    available_equipment: profile.availableEquipment,
    training_environment: profile.trainingEnvironment,
    target_training_days: profile.targetTrainingDays,
    typical_session_length: profile.typicalSessionLength,
    preferred_schedule: {
      notes: profile.preferredScheduleNotes
    },
    diet_preferences: profile.dietPreferences,
    diet_restrictions: profile.dietRestrictions,
    nutrition_goal: profile.nutritionGoal,
    energy_baseline: profile.energyBaseline,
    stress_baseline: profile.stressBaseline,
    wellness_support_focus: profile.wellnessSupportFocus,
    wellness_checkin_opt_in: true,
    injuries_limitations: profile.injuriesLimitations,
    health_considerations: profile.healthConsiderations,
    avoidances: profile.avoidances,
    coaching_style: profile.coachingStyle,
    preferred_checkin_style: profile.preferredCheckinStyle,
    safety_acknowledged: true,
    onboarding_completed: true,
    onboarding_summary: onboardingSummary
  }
}

async function listAllUsers(supabase) {
  const users = []
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000
    })

    if (error) {
      throw error
    }

    users.push(...data.users)

    if (data.users.length < 1000) {
      break
    }

    page += 1
  }

  return users
}

async function deleteExistingSeedUsers(supabase) {
  const allUsers = await listAllUsers(supabase)
  const seededEmails = new Set(seedAccounts.map((account) => account.email))
  const usersToDelete = allUsers.filter((user) => seededEmails.has(user.email))

  for (const user of usersToDelete) {
    if (VERBOSE) {
      console.log(`Deleting existing seeded user ${user.email}`)
    }

    const { error } = await supabase.auth.admin.deleteUser(user.id, false)

    if (error) {
      throw error
    }
  }

  return usersToDelete.length
}

async function createSeedUser(supabase, account, password) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: account.profile.fullName,
      seeded: true,
      seed_pack: SEED_PACK_KEY
    }
  })

  if (error || !data.user) {
    throw error || new Error(`Failed to create auth user for ${account.email}`)
  }

  return data.user
}

async function upsertProfile(supabase, payload) {
  const { error } = await supabase.from("profiles").upsert(payload, {
    onConflict: "id"
  })

  if (error) {
    throw error
  }
}

async function insertThread(supabase, userId, fullName, createdAt) {
  const { data, error } = await supabase
    .from("conversation_threads")
    .insert({
      user_id: userId,
      title: `${fullName.split(" ")[0]}'s Frankie chat`,
      created_at: createdAt,
      updated_at: createdAt
    })
    .select("id")
    .single()

  if (error || !data) {
    throw error || new Error(`Failed to create conversation thread for ${fullName}`)
  }

  return data.id
}

async function insertMessage(supabase, payload) {
  const { data, error } = await supabase
    .from("conversation_messages")
    .insert(payload)
    .select("id")
    .single()

  if (error || !data) {
    throw error || new Error("Failed to insert conversation message.")
  }

  return data.id
}

async function insertActivityLog(supabase, userId, sourceMessageId, dayIndex, account, activity, createdAt) {
  const { error } = await supabase.from("activity_logs").insert({
    user_id: userId,
    source_message_id: sourceMessageId,
    activity_type: activity.activityType,
    description: activity.description,
    duration_minutes: activity.durationMinutes,
    intensity: activity.intensity,
    logged_for_date: getLoggedForDate(dayIndex),
    metadata_json: getSeedMetadata(account, dayIndex, "activity"),
    created_at: createdAt,
    updated_at: createdAt
  })

  if (error) {
    throw error
  }
}

async function insertDietLog(supabase, userId, sourceMessageId, dayIndex, account, entry, createdAt) {
  const { error } = await supabase.from("diet_logs").insert({
    user_id: userId,
    source_message_id: sourceMessageId,
    description: entry.description,
    meal_type: entry.mealType,
    logged_for_date: getLoggedForDate(dayIndex),
    confidence: entry.confidence,
    metadata_json: getSeedMetadata(account, dayIndex, "diet"),
    created_at: createdAt,
    updated_at: createdAt
  })

  if (error) {
    throw error
  }
}

async function insertWellnessCheckin(supabase, userId, sourceMessageId, dayIndex, account, entry, createdAt) {
  const { error } = await supabase.from("wellness_checkins").insert({
    user_id: userId,
    source_message_id: sourceMessageId,
    energy_score: entry.energyScore,
    soreness_score: entry.sorenessScore,
    mood_score: entry.moodScore,
    stress_score: entry.stressScore,
    motivation_score: entry.motivationScore,
    notes: entry.notes,
    logged_for_date: getLoggedForDate(dayIndex),
    created_at: createdAt,
    updated_at: createdAt
  })

  if (error) {
    throw error
  }
}

async function seedAccountHistory(supabase, userId, threadId, account, onboardingSummary) {
  const initialMessageAt = getTimestampForDay(0, 6, 45, account.timeShiftMinutes)

  await insertMessage(supabase, {
    thread_id: threadId,
    user_id: userId,
    role: "assistant",
    message_type: "summary",
    content: buildInitialAssistantMessage(onboardingSummary),
    structured_payload: {
      ...getSeedMetadata(account, 0, "summary"),
      seededFromOnboarding: true
    },
    created_at: initialMessageAt
  })

  for (const day of account.week) {
    const wellnessUserAt = getTimestampForDay(day.dayIndex, 8, 5, account.timeShiftMinutes)
    const wellnessLogAt = getTimestampForDay(day.dayIndex, 8, 5, account.timeShiftMinutes + 1)
    const wellnessAssistantAt = getTimestampForDay(day.dayIndex, 8, 7, account.timeShiftMinutes)
    const dietUserAt = getTimestampForDay(day.dayIndex, 12, 25, account.timeShiftMinutes)
    const dietLogAt = getTimestampForDay(day.dayIndex, 12, 26, account.timeShiftMinutes)
    const dietAssistantAt = getTimestampForDay(day.dayIndex, 12, 28, account.timeShiftMinutes)
    const activityUserAt = getTimestampForDay(day.dayIndex, 18, 10, account.timeShiftMinutes)
    const activityLogAt = getTimestampForDay(day.dayIndex, 18, 11, account.timeShiftMinutes)
    const activityAssistantAt = getTimestampForDay(day.dayIndex, 18, 13, account.timeShiftMinutes)

    const wellnessUserMessageId = await insertMessage(supabase, {
      thread_id: threadId,
      user_id: userId,
      role: "user",
      message_type: "chat",
      content: day.wellness.message,
      structured_payload: getSeedMetadata(account, day.dayIndex, "wellness"),
      created_at: wellnessUserAt
    })

    await insertWellnessCheckin(
      supabase,
      userId,
      wellnessUserMessageId,
      day.dayIndex,
      account,
      day.wellness,
      wellnessLogAt
    )

    await insertMessage(supabase, {
      thread_id: threadId,
      user_id: userId,
      role: "assistant",
      message_type: "log_confirmation",
      content: `${buildWellnessConfirmation(day.wellness)} That gives us a better read on recovery and readiness.`,
      structured_payload: getSeedMetadata(account, day.dayIndex, "wellness_confirmation"),
      created_at: wellnessAssistantAt
    })

    const dietUserMessageId = await insertMessage(supabase, {
      thread_id: threadId,
      user_id: userId,
      role: "user",
      message_type: "chat",
      content: day.diet.message,
      structured_payload: getSeedMetadata(account, day.dayIndex, "diet"),
      created_at: dietUserAt
    })

    await insertDietLog(
      supabase,
      userId,
      dietUserMessageId,
      day.dayIndex,
      account,
      day.diet,
      dietLogAt
    )

    await insertMessage(supabase, {
      thread_id: threadId,
      user_id: userId,
      role: "assistant",
      message_type: "log_confirmation",
      content: buildDietConfirmation(day.diet),
      structured_payload: getSeedMetadata(account, day.dayIndex, "diet_confirmation"),
      created_at: dietAssistantAt
    })

    const activityUserMessageId = await insertMessage(supabase, {
      thread_id: threadId,
      user_id: userId,
      role: "user",
      message_type: "chat",
      content: day.activity.message,
      structured_payload: getSeedMetadata(account, day.dayIndex, "activity"),
      created_at: activityUserAt
    })

    await insertActivityLog(
      supabase,
      userId,
      activityUserMessageId,
      day.dayIndex,
      account,
      day.activity,
      activityLogAt
    )

    await insertMessage(supabase, {
      thread_id: threadId,
      user_id: userId,
      role: "assistant",
      message_type: "log_confirmation",
      content: buildActivityConfirmation(day.activity, account.profile.primaryGoal),
      structured_payload: getSeedMetadata(account, day.dayIndex, "activity_confirmation"),
      created_at: activityAssistantAt
    })
  }
}

function printDryRunSummary() {
  const structuredRowsPerAccount = 21
  const messagePairsPerDay = 6
  const initialAssistantMessages = seedAccounts.length
  const totalStructuredRows = structuredRowsPerAccount * seedAccounts.length
  const totalMessages = seedAccounts.length * 7 * messagePairsPerDay + initialAssistantMessages

  console.log("Frankie Fit demo seed dry run")
  console.log(`Seed pack: ${SEED_PACK_KEY}`)
  console.log(`Accounts: ${seedAccounts.length}`)
  console.log(`Structured log rows: ${totalStructuredRows}`)
  console.log(`Conversation messages: ${totalMessages}`)
  console.log(`Demo password: ${getDemoPassword()}`)
  console.log("")
  console.table(
    seedAccounts.map((account) => ({
      email: account.email,
      accountType: account.accountType,
      fullName: account.profile.fullName,
      primaryGoal: account.profile.primaryGoal
    }))
  )
}

async function main() {
  if (DRY_RUN) {
    printDryRunSummary()
    return
  }

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  const demoPassword = getDemoPassword()
  const createClient = getSupabaseCreateClient()

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log("Resetting existing seeded users...")
  const deletedCount = await deleteExistingSeedUsers(supabase)
  console.log(`Deleted ${deletedCount} existing seeded user(s).`)

  for (const account of seedAccounts) {
    console.log(`Seeding ${account.email} (${account.profile.fullName})...`)
    const authUser = await createSeedUser(supabase, account, demoPassword)
    const profilePayload = createProfilePayload(authUser.id, account)
    await upsertProfile(supabase, profilePayload)

    const threadId = await insertThread(
      supabase,
      authUser.id,
      account.profile.fullName,
      getTimestampForDay(0, 6, 30, account.timeShiftMinutes)
    )

    await seedAccountHistory(
      supabase,
      authUser.id,
      threadId,
      account,
      profilePayload.onboarding_summary
    )
  }

  console.log("")
  console.log("Frankie Fit demo seed complete.")
  console.log(`Seeded ${seedAccounts.length} accounts with password: ${demoPassword}`)
}

main().catch((error) => {
  console.error("")
  console.error("Seed run failed.")
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
