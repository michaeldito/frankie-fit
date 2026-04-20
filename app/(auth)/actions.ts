"use server";

import { redirect } from "next/navigation";
import { getPublicEnv, hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function toErrorRedirect(pathname: "/login" | "/signup", message: string) {
  return `${pathname}?error=${encodeURIComponent(message)}`;
}

export async function login(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect(toErrorRedirect("/login", "Configure Supabase env vars first."));
  }

  const email = getStringValue(formData, "email");
  const password = getStringValue(formData, "password");

  if (!email || !password) {
    redirect(toErrorRedirect("/login", "Enter both email and password."));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(toErrorRedirect("/login", error.message));
  }

  redirect("/app/chat");
}

export async function signup(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect(toErrorRedirect("/signup", "Configure Supabase env vars first."));
  }

  const env = getPublicEnv();
  const fullName = getStringValue(formData, "fullName");
  const email = getStringValue(formData, "email");
  const password = getStringValue(formData, "password");
  const confirmPassword = getStringValue(formData, "confirmPassword");

  if (!fullName || !email || !password || !confirmPassword) {
    redirect(
      toErrorRedirect(
        "/signup",
        "Fill out your name, email, password, and password confirmation."
      )
    );
  }

  if (password !== confirmPassword) {
    redirect(toErrorRedirect("/signup", "Passwords do not match."));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: {
        full_name: fullName
      }
    }
  });

  if (error) {
    redirect(toErrorRedirect("/signup", error.message));
  }

  if (data.session) {
    redirect("/app/chat");
  }

  redirect(
    `/login?message=${encodeURIComponent(
      "Check your email for a confirmation link, then come right back."
    )}`
  );
}
