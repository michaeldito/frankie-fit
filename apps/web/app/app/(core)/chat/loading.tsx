import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="-mb-1.5 flex h-full min-h-0 flex-col gap-4 sm:-mb-2">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <div className="ff-card max-w-3xl space-y-2 px-4 py-3 sm:px-5 sm:py-3.5">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="ml-auto w-full max-w-2xl space-y-2 rounded-[1.2rem] border border-[var(--border)] px-4 py-3 sm:px-5 sm:py-3.5">
          <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="ff-card max-w-3xl space-y-2 px-4 py-3 sm:px-5 sm:py-3.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>

      <Skeleton className="h-14 w-full shrink-0 rounded-[1rem]" />
    </div>
  );
}
