import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/** Shimmer loading skeleton. Replace loading content with this. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg shimmer",
        className
      )}
      aria-hidden="true"
    />
  );
}

/** Full recipe card skeleton */
export function RecipeCardSkeleton() {
  return (
    <div className="bg-fp-surface rounded-xl border border-fp-border overflow-hidden">
      <Skeleton className="w-full h-44" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Pantry item row skeleton */
export function PantryItemSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-8 w-16 rounded-lg" />
    </div>
  );
}

/** Page-level loading state */
export function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-px w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <RecipeCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
