import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppContext } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveWorkoutSession } from "@/lib/workouts/save-workout-session";
import { workoutSessionInputSchema } from "@/lib/workouts/validation";

export async function POST(request: NextRequest) {
  const context = await getCurrentAppContext();

  if (!context.user) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = workoutSessionInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "That workout session isn't valid." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  try {
    const id = await saveWorkoutSession({
      supabase,
      userId: context.user.id,
      session: parsed.data
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not save the workout session."
      },
      { status: 500 }
    );
  }
}
