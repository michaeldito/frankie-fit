import Link from "next/link";
import { login } from "@/app/(auth)/actions";
import { hasSupabaseEnv } from "@/lib/env";

type AuthPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: AuthPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const error = getSearchParam(resolvedSearchParams.error);
  const message = getSearchParam(resolvedSearchParams.message);
  const authConfigured = hasSupabaseEnv();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(44,107,103,0.2),transparent_40%)]" />
      <div className="relative w-full max-w-md rounded-[2rem] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_94%,black_6%)] p-8 shadow-[0_24px_80px_rgba(3,6,5,0.42)]">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
          Frankie Fit
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Pick up where you left off with Frankie and keep your coaching context in
          one place.
        </p>

        {!authConfigured ? (
          <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
            Preview mode is active right now. Add your Supabase env vars in
            <span className="font-medium text-[var(--foreground)]"> .env.local</span>
            when you&apos;re ready to turn on real accounts.
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--accent)_55%,var(--border)_45%)] bg-[color:color-mix(in_srgb,var(--accent)_12%,var(--surface)_88%)] px-4 py-3 text-sm leading-6 text-[var(--foreground)]">
            {error}
          </div>
        ) : null}

        {!error && message ? (
          <div className="mt-6 rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--brand)_55%,var(--border)_45%)] bg-[color:color-mix(in_srgb,var(--brand)_14%,var(--surface)_86%)] px-4 py-3 text-sm leading-6 text-[var(--foreground)]">
            {message}
          </div>
        ) : null}

        <form action={login} className="mt-8 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Email</span>
            <input
              autoComplete="email"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Password</span>
            <input
              autoComplete="current-password"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--brand)]"
              name="password"
              placeholder="********"
              required
              type="password"
            />
          </label>

          <button
            className={`w-full rounded-full px-5 py-3 font-medium text-white transition ${
              authConfigured
                ? "bg-[var(--brand)] hover:bg-[var(--brand-strong)]"
                : "cursor-not-allowed bg-[color:color-mix(in_srgb,var(--brand)_55%,black_45%)] opacity-65"
            }`}
            disabled={!authConfigured}
            type="submit"
          >
            Log in
          </button>
        </form>

        <p className="mt-6 text-sm text-[var(--muted)]">
          Need an account?{" "}
          <Link className="font-semibold text-[var(--brand)]" href="/signup">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
