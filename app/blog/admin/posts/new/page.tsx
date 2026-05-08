// app/blog/admin/posts/new/page.tsx
import PostEditor from "@/app/components/blog-components/admin/PostEditor";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

// Force dynamic rendering to prevent static generation
export const dynamic = "force-dynamic";

export default function NewPostPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <Loader2 className="w-8 h-8 animate-spin text-(--color-accent-yellow)" />
        </div>
      }
    >
      <PostEditor />
    </Suspense>
  );
}
