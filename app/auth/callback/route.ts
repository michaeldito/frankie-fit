import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getSupabasePublicKey, hasSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

function redirectToLogin(request: NextRequest, message: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", message);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return redirectToLogin(request, "Configure Supabase env vars first.");
  }

  const code = request.nextUrl.searchParams.get("code");
  const errorDescription = request.nextUrl.searchParams.get("error_description");

  if (errorDescription) {
    return redirectToLogin(request, errorDescription);
  }

  if (!code) {
    return redirectToLogin(request, "Missing sign-in code.");
  }

  const response = NextResponse.redirect(new URL("/app/chat", request.url));
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabasePublicKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectToLogin(request, error.message);
  }

  return response;
}
