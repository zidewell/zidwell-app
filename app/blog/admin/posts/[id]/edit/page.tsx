import PostEditor from "@/app/components/blog-components/admin/PostEditor"; 

interface EditPostPageProps {
  params: {
    id: string;
  };
}

export default function EditPostPage({ params }: EditPostPageProps) {
  return <PostEditor postId={params.id} />;
}