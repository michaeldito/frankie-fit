import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDebugLoading() {
  return (
    <div className="space-y-4">
      <section className="grid gap-3 xl:grid-cols-[0.82fr_1.38fr]">
        <div className="ff-panel space-y-3 p-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-3 w-32" />

          <div className="space-y-2">
            {[0, 1, 2, 3].map((index) => (
              <div className="space-y-2 rounded-[0.65rem] border border-[var(--border)] bg-[var(--surface-elevated)] p-3" key={index}>
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>

        <div className="ff-panel space-y-3 p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </section>
    </div>
  );
}
