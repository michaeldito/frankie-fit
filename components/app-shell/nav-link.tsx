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
      className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
        active
          ? "bg-[var(--brand)] text-white shadow-[0_12px_30px_rgba(19,50,48,0.35)]"
          : "text-[var(--muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)]"
      }`}
      href={href}
    >
      {children}
    </Link>
  );
}
