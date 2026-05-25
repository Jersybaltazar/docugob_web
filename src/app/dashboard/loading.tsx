/**
 * DocuGob — Dashboard segment loading state (AUDIT §11.13).
 *
 * Next.js renders this while the segment's RSCs stream in. Keep it
 * skeletal — anything heavy here only delays the actual content.
 */

import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6" aria-busy aria-live="polite">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-80" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
