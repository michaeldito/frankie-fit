import type { ReactNode } from "react";

// Admin tooling was built against the dark palette and still hardcodes dark-only colors,
// so it stays Midnight regardless of the user's theme.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full rounded-2xl bg-background p-1 text-foreground" data-theme="dark">
      {children}
    </div>
  );
}
