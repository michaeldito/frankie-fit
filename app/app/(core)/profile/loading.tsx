import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-4">
      <section className="ff-panel-strong space-y-3 p-5 sm:p-6">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-48" />
      </section>

      <section className="ff-panel space-y-5 p-5 sm:p-6">
        {[0, 1, 2, 3, 4].map((index) => (
          <div className="space-y-2" key={index}>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </section>
    </div>
  );
}
