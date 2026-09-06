import { Skeleton } from "@/components/ui/skeleton";

const dashboardTabLabels = ["Exercise", "Diet", "Lifestyle", "Wellness"];

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <nav className="flex gap-1 border-b border-[var(--border)]">
        {dashboardTabLabels.map((label) => (
          <div className="-mb-px px-3 py-2" key={label}>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </nav>

      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div className="ff-card-soft space-y-2 p-4" key={index}>
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
