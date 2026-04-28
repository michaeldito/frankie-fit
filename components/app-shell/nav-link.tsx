"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavLinkProps = {
  href: string;
  children: ReactNode;
};

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      className={`rounded-[1.1rem] px-4 py-3 text-sm font-medium transition ${
        active
          ? "border border-transparent bg-[color:color-mix(in_srgb,var(--brand)_86%,white_14%)] text-white shadow-[0_16px_32px_rgba(29,78,216,0.34)]"
          : "border border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[color:color-mix(in_srgb,var(--surface-contrast)_74%,black_26%)] hover:text-[var(--foreground)]"
      }`}
      href={href}
    >
      {children}
    </Link>
  );
}
