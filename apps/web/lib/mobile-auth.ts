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

export async function authenticateMobileRequest(request: NextRequest) {
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
