"use client";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import AdminLayout from "@/app/components/blog-components/admin/AdminLayout";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import Swal from "sweetalert2";

// Define the Post interface
interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  categories: string[];
  tags: string[];
  is_published: boolean;
  author_id: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
    bio: string | null;
  };
  published_at: string | null;
  created_at: string;
  updated_at: string;
  view_count: number;
  likes_count: number;
  comments_count: number;
}

const AdminPosts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize SweetAlert
  const showAlert = Swal.mixin({
    customClass: {
      confirmButton: "bg-[#C29307] text-accent-foreground hover:bg-[#C29307]/90",
      cancelButton: "bg-gray-200 hover:bg-gray-300",
    },
    buttonsStyling: true,
  });

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/blog/posts?limit=100');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch posts: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Handle both response formats
        const postsData = data.posts || data;
        
        if (Array.isArray(postsData)) {
          setPosts(postsData);
        } else {
          console.error('Unexpected API response format:', data);
          setPosts([]);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch posts');
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Filter posts based on search query
  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to handle post deletion
  const handleDeletePost = async (postId: string, postTitle: string) => {
    const result = await showAlert.fire({
      title: 'Are you sure?',
      text: `You are about to delete "${postTitle}". This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/blog/posts?id=${postId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete post');
        }

        // Remove the deleted post from state
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
        
        await showAlert.fire({
          title: 'Deleted!',
          text: 'Your post has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (err) {
        console.error('Error deleting post:', err);
        await showAlert.fire({
          title: 'Error!',
          text: 'Failed to delete post. Please try again.',
          icon: 'error',
        });
      }
    }
  };

  // Function to toggle publish status
  const handleTogglePublish = async (post: Post) => {
    const newStatus = !post.is_published;
    const action = newStatus ? 'publish' : 'unpublish';
    
    const result = await showAlert.fire({
      title: `Are you sure?`,
      text: `You are about to ${action} "${post.title}"`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Yes, ${action} it!`,
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/blog/posts?id=${post.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isPublished: newStatus,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update post status');
        }

        const updatedPost = await response.json();
        
        // Update the post in state
        setPosts(prevPosts => 
          prevPosts.map(p => p.id === post.id ? updatedPost : p)
        );
        
        await showAlert.fire({
          title: 'Success!',
          text: `Post has been ${action}ed successfully.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (err) {
        console.error('Error updating post:', err);
        await showAlert.fire({
          title: 'Error!',
          text: `Failed to ${action} post. Please try again.`,
          icon: 'error',
        });
      }
    }
  };

  // Function to show error alert
  const showErrorAlert = (message: string) => {
    showAlert.fire({
      title: 'Error!',
      text: message,
      icon: 'error',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C29307] mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Posts</h1>
              <p className="text-muted-foreground">Manage your blog posts</p>
            </div>
            <Link href="/blog/admin/posts/new">
              <Button className="bg-[#C29307] text-accent-foreground hover:bg-[#C29307]/90">
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            </Link>
          </div>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive">Error: {error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Posts</h1>
            <p className="text-muted-foreground">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'} total
            </p>
          </div>
          <Link href="/blog/admin/posts/new">
            <Button className="bg-[#C29307] text-accent-foreground hover:bg-[#C29307]/90">
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Posts Table */}
        {filteredPosts.length === 0 ? (
          <div className="border border-border rounded-lg p-8 text-center">
            {searchQuery ? (
              <>
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                <p className="text-muted-foreground">
                  No posts match your search query "{searchQuery}"
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by creating your first blog post
                </p>
                <Link href="/blog/admin/posts/new">
                  <Button className="bg-[#C29307] text-accent-foreground hover:bg-[#C29307]/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {post.featured_image ? (
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">No image</span>
                          </div>
                        )}
                        <span className="font-medium line-clamp-1 max-w-[250px]">
                          {post.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{post.author.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {post.categories.slice(0, 2).map((category, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 text-xs bg-secondary rounded"
                          >
                            {category}
                          </span>
                        ))}
                        {post.categories.length > 2 && (
                          <span className="px-2 py-0.5 text-xs text-muted-foreground">
                            +{post.categories.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleTogglePublish(post)}
                        className={`px-2 py-1 text-xs rounded-full cursor-pointer transition-colors ${
                          post.is_published
                            ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
                            : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800"
                        }`}
                      >
                        {post.is_published ? "Published" : "Draft"}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(post.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/blog/post-blog/${post.slug}`} target="_blank">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/blog/admin/posts/${post.id}/edit`}>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeletePost(post.id, post.title)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPosts;