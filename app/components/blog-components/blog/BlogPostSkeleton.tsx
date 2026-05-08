// BlogPostSkeleton.tsx
import { Skeleton } from "@/app/components/ui/skeleton";

const BlogPostSkeleton = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header Skeleton */}
      <div className="border-b border-[var(--border-color)]">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <Skeleton className="h-8 w-32 bg-[var(--bg-secondary)]" />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="space-y-8 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-24 bg-[var(--bg-secondary)]" />

          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 bg-[var(--bg-secondary)]" />
            <Skeleton className="h-6 w-16 bg-[var(--bg-secondary)]" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4 bg-[var(--bg-secondary)]" />
            <Skeleton className="h-8 w-1/2 bg-[var(--bg-secondary)]" />
          </div>

          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full bg-[var(--bg-secondary)]" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-[var(--bg-secondary)]" />
              <Skeleton className="h-3 w-24 bg-[var(--bg-secondary)]" />
            </div>
          </div>

          <div className="flex gap-4">
            <Skeleton className="h-10 w-24 bg-[var(--bg-secondary)]" />
            <Skeleton className="h-10 w-28 bg-[var(--bg-secondary)]" />
            <Skeleton className="h-10 w-20 bg-[var(--bg-secondary)]" />
          </div>

          <Skeleton className="aspect-video w-full rounded-lg bg-[var(--bg-secondary)]" />

          <div className="space-y-4">
            <Skeleton className="h-4 w-full bg-[var(--bg-secondary)]" />
            <Skeleton className="h-4 w-full bg-[var(--bg-secondary)]" />
            <Skeleton className="h-4 w-2/3 bg-[var(--bg-secondary)]" />
            <Skeleton className="h-4 w-full bg-[var(--bg-secondary)]" />
            <Skeleton className="h-4 w-5/6 bg-[var(--bg-secondary)]" />
            <Skeleton className="h-4 w-full bg-[var(--bg-secondary)]" />
            <Skeleton className="h-4 w-3/4 bg-[var(--bg-secondary)]" />
          </div>

          <div className="space-y-4 pt-8">
            <Skeleton className="h-6 w-24 bg-[var(--bg-secondary)]" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 bg-[var(--bg-secondary)]" />
              <Skeleton className="h-8 w-20 bg-[var(--bg-secondary)]" />
              <Skeleton className="h-8 w-14 bg-[var(--bg-secondary)]" />
              <Skeleton className="h-8 w-24 bg-[var(--bg-secondary)]" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 sm:p-4 bg-[var(--bg-secondary)] rounded-lg">
                <Skeleton className="h-6 w-12 mx-auto mb-2 bg-[var(--bg-secondary)]" />
                <Skeleton className="h-3 w-16 mx-auto bg-[var(--bg-secondary)]" />
              </div>
            ))}
          </div>

          <div className="mt-12 sm:mt-16 space-y-6">
            <Skeleton className="h-8 w-32 bg-[var(--bg-secondary)]" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-10 h-10 rounded-full bg-[var(--bg-secondary)]" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32 bg-[var(--bg-secondary)]" />
                    <Skeleton className="h-20 w-full bg-[var(--bg-secondary)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostSkeleton;