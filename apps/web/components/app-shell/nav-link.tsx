"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { HoverLabel } from "@/components/app-shell/hover-label";

type NavLinkProps = {
  href: string;
  children: ReactNode;
  icon?: LucideIcon;
  match?: "exact" | "prefix";
  variant?: "sidebar" | "tab";
  // Text for the hover label shown when the sidebar is collapsed to its icon rail.
  label?: string;
};

function useIsActive(href: string, match: "exact" | "prefix") {
  const pathname = usePathname();
  return match === "exact" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLink({ href, children, icon: Icon, match = "prefix", variant = "sidebar", label }: NavLinkProps) {
  const active = useIsActive(href, match);

  if (variant === "tab") {
    return (
      <Link
        aria-current={active ? "page" : undefined}
        className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[0.68rem] font-medium transition ${
          active ? "text-brand" : "text-muted hover:text-foreground"
        }`}
        href={href}
      >
        {Icon ? <Icon aria-hidden className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} /> : null}
        <span className="truncate">{children}</span>
      </Link>
    );
  }

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition sidebar-collapsed:justify-center sidebar-collapsed:px-0 ${
        active
          ? "bg-[color:color-mix(in_srgb,var(--accent-strong)_32%,transparent)] text-foreground"
          : "text-muted hover:bg-surface-contrast/60 hover:text-foreground"
      }`}
      href={href}
    >
      {active ? <span aria-hidden className="absolute inset-y-2 left-0 w-1 rounded-full bg-brand" /> : null}
      {Icon ? <Icon aria-hidden className="h-[1.1rem] w-[1.1rem]" strokeWidth={active ? 2.3 : 1.8} /> : null}
      <span className="truncate sidebar-collapsed:sr-only">{children}</span>
      {label ? <HoverLabel className="hidden sidebar-collapsed:block" side="right" text={label} /> : null}
    </Link>
  );
}
