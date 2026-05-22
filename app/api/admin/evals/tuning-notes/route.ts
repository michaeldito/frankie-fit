import { NextResponse, type NextRequest } from "next/server";
import { requireAdminContext } from "@/lib/admin";
import { getCurrentAppContext } from "@/lib/profile";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

type EvalReviewStatus = "good" | "needs_work" | "not_applicable";

function parseReviewStatus(value: unknown): EvalReviewStatus {
  if (value === "good" || value === "needs_work" || value === "not_applicable") {
    return value;
  }

  throw new Error("Choose a valid review status.");
}

function parseString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const context = await getCurrentAppContext();
  requireAdminContext(context);

  if (!context.user) {
    return NextResponse.json({ error: "Admin user context is required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const itemId = parseString(body.itemId);
    const reviewCheck = parseString(body.reviewCheck);
    const actualBehavior = parseString(body.actualBehavior) || null;
    const expectedBehavior = parseString(body.expectedBehavior) || null;
    const status = parseReviewStatus(body.status);

    if (!itemId || !reviewCheck) {
      return NextResponse.json(
        { error: "Eval review item and check are required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceRoleClient();
    const reviewedAt = new Date().toISOString();
    const { error } = await supabase.from("eval_reviews").upsert(
      {
        actual_behavior: actualBehavior,
        eval_run_item_id: itemId,
        expected_behavior: expectedBehavior,
        issue_tags: [],
        field_note: null,
        review_check: reviewCheck,
        reviewed_at: reviewedAt,
        reviewed_by: context.user.id,
        status
      },
      {
        onConflict: "eval_run_item_id,review_check"
      }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, reviewedAt });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save tuning note." },
      { status: 500 }
    );
  }
}
