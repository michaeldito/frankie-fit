"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type EvalTab = "runs" | "memory";

function TabButton({
  active,
  count,
  isPending,
  label,
  onClick
}: {
  active: boolean;
  count: number;
  isPending: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`-mb-px rounded-t-[0.5rem] border border-b-0 px-3 py-2 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-70 ${
        active
          ? "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)]"
          : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
      disabled={isPending}
      onClick={onClick}
      type="button"
    >
      {label} <span className="text-xs text-[var(--muted)]">{count}</span>
    </button>
  );
}

function TabContentSkeleton() {
  return (
    <section className="ff-panel space-y-3 p-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-4 w-56" />
      <div className="space-y-2">
        {[0, 1, 2].map((index) => (
          <Skeleton className="h-16 w-full" key={index} />
        ))}
      </div>
    </section>
  );
}

export function EvalTabSection({
  activeTab,
  children,
  memoryCount,
  runsCount
}: {
  activeTab: EvalTab;
  children: ReactNode;
  memoryCount: number;
  runsCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingTab, setPendingTab] = useState<EvalTab | null>(null);
  const displayedTab = isPending && pendingTab ? pendingTab : activeTab;

  function goToTab(tab: EvalTab) {
    if (tab === activeTab) {
      return;
    }

    setPendingTab(tab);
    startTransition(() => {
      router.push(`/app/admin/evals?tab=${tab}`);
    });
  }

  return (
    <>
      <nav className="flex gap-1 border-b border-[var(--border)]">
        <TabButton
          active={displayedTab === "runs"}
          count={runsCount}
          isPending={isPending}
          label="Eval runs"
          onClick={() => goToTab("runs")}
        />
        <TabButton
          active={displayedTab === "memory"}
          count={memoryCount}
          isPending={isPending}
          label="Coaching memory"
          onClick={() => goToTab("memory")}
        />
      </nav>

      {isPending ? <TabContentSkeleton /> : children}
    </>
  );
}
