import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { findProgramWorkout, wodTemplates, type WorkoutSessionInput } from "../../packages/workout-core";

type SupabaseServerClient = SupabaseClient<Database>;

function buildActivityDescription(input: WorkoutSessionInput) {
  if (input.wodTemplateSlug) {
    const template = wodTemplates.find((candidate) => candidate.slug === input.wodTemplateSlug);

    if (template) {
      return `${template.name}${input.forTime ? " (for time)" : ""}`;
    }

    const programWorkout = findProgramWorkout(input.wodTemplateSlug);

    if (programWorkout) {
      return input.programDay ? `${programWorkout.name} · Day ${input.programDay}` : programWorkout.name;
    }
  }

  const exerciseNames = input.exercises.map((exercise) => exercise.exerciseName);

  if (input.sessionType === "simple") {
    if (exerciseNames.length === 1) {
      const setCount = input.exercises[0].sets.length;
      return `${exerciseNames[0]} · ${setCount} set${setCount === 1 ? "" : "s"}`;
    }

    return `${exerciseNames.join(", ")} · ${exerciseNames.length} exercises`;
  }

  const roundsLabel = input.roundsCount ? `${input.roundsCount} rounds` : "circuit";
  const forTimeLabel = input.forTime ? ", for time" : "";
  return `${exerciseNames.join(" + ")} · ${roundsLabel}${forTimeLabel}`;
}

export async function saveWorkoutSession(input: {
  supabase: SupabaseServerClient;
  userId: string;
  session: WorkoutSessionInput;
}): Promise<string> {
  const { supabase, userId, session } = input;

  const { data: activityLog, error: activityLogError } = await supabase
    .from("activity_logs")
    .insert({
      user_id: userId,
      activity_type: "weight lifting",
      description: buildActivityDescription(session),
      duration_minutes: session.totalTimeSeconds ? Math.round(session.totalTimeSeconds / 60) : null,
      logged_for_date: session.loggedForDate
    })
    .select("id")
    .single();

  if (activityLogError || !activityLog) {
    throw new Error(activityLogError?.message ?? "Could not save the workout summary.");
  }

  const activityLogId = activityLog.id;

  async function deleteActivityLog() {
    await supabase.from("activity_logs").delete().eq("id", activityLogId);
  }

  async function deleteWorkoutSession(workoutSessionId: string) {
    await supabase.from("workout_sessions").delete().eq("id", workoutSessionId);
    await deleteActivityLog();
  }

  const { data: workoutSession, error: workoutSessionError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      activity_log_id: activityLogId,
      session_type: session.sessionType,
      title: session.title,
      notes: session.notes,
      wod_template_slug: session.wodTemplateSlug,
      rounds_count: session.roundsCount,
      for_time: session.forTime,
      total_time_seconds: session.totalTimeSeconds,
      logged_for_date: session.loggedForDate,
      program_slug: session.programSlug,
      program_day: session.programDay
    })
    .select("id")
    .single();

  if (workoutSessionError || !workoutSession) {
    await deleteActivityLog();
    throw new Error(workoutSessionError?.message ?? "Could not save the workout session.");
  }

  const { data: workoutExercises, error: workoutExercisesError } = await supabase
    .from("workout_exercises")
    .insert(
      session.exercises.map((exercise) => ({
        session_id: workoutSession.id,
        exercise_slug: exercise.exerciseSlug,
        exercise_name: exercise.exerciseName,
        position: exercise.position
      }))
    )
    .select("id, position");

  if (workoutExercisesError || !workoutExercises) {
    await deleteWorkoutSession(workoutSession.id);
    throw new Error(workoutExercisesError?.message ?? "Could not save the workout exercises.");
  }

  const exerciseIdByPosition = new Map(
    workoutExercises.map((exercise) => [exercise.position, exercise.id])
  );

  const setRows = session.exercises.flatMap((exercise) => {
    const workoutExerciseId = exerciseIdByPosition.get(exercise.position);

    if (!workoutExerciseId) {
      return [];
    }

    return exercise.sets.map((set) => ({
      workout_exercise_id: workoutExerciseId,
      set_number: set.setNumber,
      reps: set.reps,
      weight: set.weight,
      weight_unit: session.weightUnit,
      duration_seconds: set.durationSeconds
    }));
  });

  const { error: workoutSetsError } = await supabase.from("workout_sets").insert(setRows);

  if (workoutSetsError) {
    await deleteWorkoutSession(workoutSession.id);
    throw new Error(workoutSetsError.message);
  }

  return workoutSession.id;
}
