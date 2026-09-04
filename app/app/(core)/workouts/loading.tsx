import { Skeleton } from "@/components/ui/skeleton";

export default function WorkoutsLoading() {
  return (
    <div className="space-y-6 lg:space-y-7">
      <section className="ff-panel-strong space-y-3 p-5 sm:p-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3 w-full max-w-2xl" />
        <Skeleton className="h-3 w-3/4 max-w-2xl" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="ff-panel space-y-3 p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </section>

        <section className="ff-panel p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-6 w-32" />
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((index) => (
              <div className="ff-card-soft space-y-2 p-4" key={index}>
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
