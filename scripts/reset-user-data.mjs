import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, "..")
const require = createRequire(import.meta.url)

loadEnvFile(path.join(repoRoot, ".env"))
loadEnvFile(path.join(repoRoot, ".env.local"))

const args = process.argv.slice(2)
const emailArg = readFlagValue(args, "--email")
const userIdArg = readFlagValue(args, "--user-id")
const execute = args.includes("--execute")
const verbose = args.includes("--verbose")

if (!emailArg && !userIdArg) {
  console.error("Provide either --email=<user@example.com> or --user-id=<uuid>.")
  process.exit(1)
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY")
const createClient = getSupabaseCreateClient()
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

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

function readFlagValue(argv, flag) {
  const inlineMatch = argv.find((arg) => arg.startsWith(`${flag}=`))

  if (inlineMatch) {
    return inlineMatch.slice(flag.length + 1).trim()
  }

  const index = argv.indexOf(flag)

  if (index === -1) {
    return null
  }

  const value = argv[index + 1]
  return value ? value.trim() : null
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

async function main() {
  const target = await resolveTargetUser()

  if (!target) {
    throw new Error("Could not find a user for the provided email/user id.")
  }

  const threadIds = await listThreadIds(target.id)
  const summary = await buildResetSummary(target.id, threadIds)

  console.log("")
  console.log("Frankie Fit user reset summary")
  console.log("--------------------------------")
  console.log(`User id: ${target.id}`)
  console.log(`Email: ${target.email ?? "unknown"}`)
  console.log(`Threads: ${summary.threads}`)
  console.log(`Messages: ${summary.messages}`)
  console.log(`Activity logs: ${summary.activityLogs}`)
  console.log(`Diet logs: ${summary.dietLogs}`)
  console.log(`Wellness check-ins: ${summary.wellnessCheckins}`)
  console.log(`Recommendations: ${summary.recommendations}`)
  console.log(`Weekly summaries: ${summary.weeklySummaries}`)
  console.log(`AI traces: ${summary.aiTraceRuns}`)
  console.log("")

  if (!execute) {
    console.log("Dry run only. Nothing was deleted.")
    console.log(
      "Run again with --execute to clear this user's chat history and generated records."
    )
    return
  }

  await deleteUserData(target.id, threadIds)

  console.log("Reset complete.")
}

async function resolveTargetUser() {
  if (emailArg) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })

    if (error) {
      throw error
    }

    const matchingUser = data.users.find(
      (user) => user.email?.toLowerCase() === emailArg.toLowerCase()
    )

    return matchingUser ?? null
  }

  const { data, error } = await supabase.auth.admin.getUserById(userIdArg)

  if (error) {
    throw error
  }

  return data.user ?? null
}

async function listThreadIds(userId) {
  const { data, error } = await supabase
    .from("conversation_threads")
    .select("id")
    .eq("user_id", userId)

  if (error) {
    throw error
  }

  return (data ?? []).map((thread) => thread.id)
}

async function countRows(table, filters = []) {
  let query = supabase.from(table).select("*", { count: "exact", head: true })

  for (const filter of filters) {
    query = query.eq(filter.column, filter.value)
  }

  const { count, error } = await query

  if (error) {
    throw error
  }

  return count ?? 0
}

async function countMessagesForThreads(threadIds) {
  if (threadIds.length === 0) {
    return 0
  }

  const { count, error } = await supabase
    .from("conversation_messages")
    .select("*", { count: "exact", head: true })
    .in("thread_id", threadIds)

  if (error) {
    throw error
  }

  return count ?? 0
}

async function countTracesForThreads(threadIds) {
  if (threadIds.length === 0) {
    return 0
  }

  const { count, error } = await supabase
    .from("ai_trace_runs")
    .select("*", { count: "exact", head: true })
    .in("thread_id", threadIds)

  if (error) {
    throw error
  }

  return count ?? 0
}

async function buildResetSummary(userId, threadIds) {
  const [
    messages,
    activityLogs,
    dietLogs,
    wellnessCheckins,
    recommendations,
    weeklySummaries,
    aiTraceRuns
  ] = await Promise.all([
    countMessagesForThreads(threadIds),
    countRows("activity_logs", [{ column: "user_id", value: userId }]),
    countRows("diet_logs", [{ column: "user_id", value: userId }]),
    countRows("wellness_checkins", [{ column: "user_id", value: userId }]),
    countRows("recommendations", [{ column: "user_id", value: userId }]),
    countRows("weekly_summaries", [{ column: "user_id", value: userId }]),
    countTracesForThreads(threadIds)
  ])

  return {
    threads: threadIds.length,
    messages,
    activityLogs,
    dietLogs,
    wellnessCheckins,
    recommendations,
    weeklySummaries,
    aiTraceRuns
  }
}

async function deleteRows(table, filters = []) {
  if (verbose) {
    const whereText =
      filters.length > 0
        ? filters.map((filter) => `${filter.column}=${filter.value}`).join(", ")
        : "no filters"
    console.log(`Deleting from ${table} where ${whereText}`)
  }

  let query = supabase.from(table).delete()

  for (const filter of filters) {
    query = query.eq(filter.column, filter.value)
  }

  const { error } = await query

  if (error) {
    throw error
  }
}

async function deleteRowsIn(table, column, values) {
  if (values.length === 0) {
    return
  }

  if (verbose) {
    console.log(`Deleting from ${table} where ${column} in ${values.length} value(s)`)
  }

  const { error } = await supabase.from(table).delete().in(column, values)

  if (error) {
    throw error
  }
}

async function deleteUserData(userId, threadIds) {
  await deleteRows("activity_logs", [{ column: "user_id", value: userId }])
  await deleteRows("diet_logs", [{ column: "user_id", value: userId }])
  await deleteRows("wellness_checkins", [{ column: "user_id", value: userId }])
  await deleteRows("recommendations", [{ column: "user_id", value: userId }])
  await deleteRows("weekly_summaries", [{ column: "user_id", value: userId }])
  await deleteRowsIn("ai_trace_runs", "thread_id", threadIds)
  await deleteRows("conversation_threads", [{ column: "user_id", value: userId }])
}
