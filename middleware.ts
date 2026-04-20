import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicKey, hasSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export async function middleware(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabasePublicKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (request.nextUrl.pathname.startsWith("/app") && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("message", "Log in to continue.");
    return NextResponse.redirect(loginUrl);
  }

  if (
    user &&
    (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup")
  ) {
    const appUrl = request.nextUrl.clone();
    appUrl.pathname = "/app/chat";
    appUrl.search = "";
    return NextResponse.redirect(appUrl);
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/login", "/signup"]
};
