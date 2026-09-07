import { NextRequest, NextResponse } from "next/server";
import { createSupabaseBearerClient } from "@/lib/supabase/bearer";

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

async function authenticateMobileRequest(request: NextRequest) {
  const token = getBearerToken(request);

  if (!token) {
    return {
      error: NextResponse.json({ error: "Missing mobile session token." }, { status: 401 })
    };
  }

  const supabase = createSupabaseBearerClient(token);
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return {
      error: NextResponse.json(
        { error: userError?.message ?? "Could not verify your mobile session." },
        { status: 401 }
      )
    };
  }

  return { supabase, user };
}

export async function POST(request: NextRequest) {
  const context = await authenticateMobileRequest(request);

  if ("error" in context) {
    return context.error;
  }

  const body = (await request.json().catch(() => null)) as {
    devicePlatform?: unknown;
    expoPushToken?: unknown;
  } | null;
  const expoPushToken = typeof body?.expoPushToken === "string" ? body.expoPushToken.trim() : "";
  const devicePlatform = typeof body?.devicePlatform === "string" ? body.devicePlatform : null;

  if (!expoPushToken) {
    return NextResponse.json({ error: "Missing Expo push token." }, { status: 400 });
  }

  const { error } = await context.supabase.from("push_tokens").upsert(
    {
      user_id: context.user.id,
      expo_push_token: expoPushToken,
      device_platform: devicePlatform
    },
    { onConflict: "user_id,expo_push_token" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const context = await authenticateMobileRequest(request);

  if ("error" in context) {
    return context.error;
  }

  const body = (await request.json().catch(() => null)) as { expoPushToken?: unknown } | null;
  const expoPushToken = typeof body?.expoPushToken === "string" ? body.expoPushToken.trim() : "";

  if (!expoPushToken) {
    return NextResponse.json({ error: "Missing Expo push token." }, { status: 400 });
  }

  const { error } = await context.supabase
    .from("push_tokens")
    .delete()
    .eq("user_id", context.user.id)
    .eq("expo_push_token", expoPushToken);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
