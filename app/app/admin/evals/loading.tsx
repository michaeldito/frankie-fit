import { Skeleton } from "@/components/ui/skeleton";

export default function AdminEvalsLoading() {
  return (
    <div className="space-y-4">
      <section>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-2 h-4 w-48" />
        <div className="mt-3 flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton className="h-9 w-36 rounded-full" key={index} />
          ))}
        </div>
      </section>

      <section className="ff-panel space-y-3 p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-56" />
        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <Skeleton className="h-16 w-full" key={index} />
          ))}
        </div>
      </section>
    </div>
  );
}
