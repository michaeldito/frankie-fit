import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOverviewLoading() {
  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div className="ff-card space-y-2 p-4" key={index}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-14" />
          </div>
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <div className="ff-panel space-y-3 p-4" key={index}>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {[0, 1].map((index) => (
            <div className="ff-panel space-y-3 p-4" key={index}>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-56" />
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
