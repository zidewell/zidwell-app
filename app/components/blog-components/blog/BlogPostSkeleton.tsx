import { Skeleton } from "@/app/components/ui/skeleton";

const BlogPostSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="border-b">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Back button skeleton */}
          <Skeleton className="h-8 w-24" />

          {/* Categories skeleton */}
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>

          {/* Title skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
          </div>

          {/* Author info skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          {/* Action buttons skeleton */}
          <div className="flex gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-20" />
          </div>

          {/* Featured image skeleton */}
          <Skeleton className="aspect-video w-full rounded-lg" />

          {/* Content skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Tags skeleton */}
          <div className="space-y-4 pt-8">
            <Skeleton className="h-6 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-14" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 sm:p-4 bg-muted rounded-lg">
                <Skeleton className="h-6 w-12 mx-auto mb-2" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>

          {/* Comments section skeleton */}
          <div className="mt-12 sm:mt-16 space-y-6">
            <Skeleton className="h-8 w-32" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-20 w-full" />
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