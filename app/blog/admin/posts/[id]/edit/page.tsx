import PostEditor from "@/app/components/blog-components/admin/PostEditor";

interface EditPostPageProps {
  params: {
    id: string;
  };
  searchParams: {
    draft?: string;
  };
}

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ draft?: string }>;
}) {
  const { id } = await params;
  const { draft } = await searchParams;
  const isDraft = draft === "true";

  return <PostEditor postId={id} isDraft={isDraft} />;
}