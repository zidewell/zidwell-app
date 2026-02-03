"use client";
import { useState, useEffect, useMemo } from "react";
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
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Filter, CheckCircle, Circle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import AdminLayout from "@/app/components/blog-components/admin/AdminLayout";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import Swal from "sweetalert2";
import { Badge } from "@/app/components/ui/badge";
import { useBlog } from "@/app/context/BlogContext"; 

// Filter types
type FilterType = 'all' | 'published' | 'draft';

const AdminPosts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const { posts, isLoading, error, refreshPosts } = useBlog();

  // Filter posts based on search and active filter
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Apply status filter
      if (activeFilter === 'published' && !post.is_published) return false;
      if (activeFilter === 'draft' && post.is_published) return false;
      
      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          post.title.toLowerCase().includes(query) ||
          (post.author?.name && post.author.name.toLowerCase().includes(query)) ||
          (post.excerpt && post.excerpt.toLowerCase().includes(query)) ||
          (post.categories && post.categories.some(cat => cat.toLowerCase().includes(query)))
        );
      }
      
      return true;
    });
  }, [posts, activeFilter, searchQuery]);

  // Count stats from context posts
  const stats = useMemo(() => {
    const publishedCount = posts.filter(p => p.is_published).length;
    const draftCount = posts.filter(p => !p.is_published).length;
    const totalCount = posts.length;
    
    return { publishedCount, draftCount, totalCount };
  }, [posts]);

  // Function to handle post deletion
  const handleDeletePost = async (postId: string, postTitle: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete "${postTitle}". This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      confirmButtonColor: '#dc2626',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/blog/posts?id=${postId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete post');
        }

        // Refresh posts after deletion
        await refreshPosts();
        
        Swal.fire({
          title: 'Deleted!',
          text: 'Your post has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (err) {
        console.error('Error deleting post:', err);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete post. Please try again.',
          icon: 'error',
        });
      }
    }
  };

  // Function to toggle publish status
  const handleTogglePublish = async (post: any) => {
    const newStatus = !post.is_published;
    const action = newStatus ? 'publish' : 'unpublish';
    
    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `You are about to ${action} "${post.title}"`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Yes, ${action} it!`,
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      confirmButtonColor: '#059669',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/blog/posts?id=${post.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_published: newStatus,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update post status');
        }

        // Refresh posts after status change
        await refreshPosts();
        
        Swal.fire({
          title: 'Success!',
          text: `Post has been ${action}ed successfully.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (err) {
        console.error('Error updating post:', err);
        Swal.fire({
          title: 'Error!',
          text: `Failed to ${action} post. Please try again.`,
          icon: 'error',
        });
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
  };

  // Loading state
  if (isLoading && posts.length === 0) {
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
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C29307] mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading posts...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Posts</h1>
            <p className="text-muted-foreground">
              {stats.totalCount} total posts ({stats.publishedCount} published, {stats.draftCount} drafts)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={refreshPosts}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Link href="/blog/admin/posts/new">
              <Button className="bg-[#C29307] text-accent-foreground hover:bg-[#C29307]/90">
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            </Link>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-destructive font-medium">Error Loading Posts</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
              <Button 
                onClick={refreshPosts} 
                variant="outline" 
                size="sm"
                disabled={isLoading}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search posts by title, author, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button
              variant={activeFilter === 'all' ? "default" : "outline"}
              onClick={() => setActiveFilter('all')}
              disabled={isLoading}
              className={`flex items-center gap-2 ${activeFilter === 'all' ? 'bg-[#C29307] text-accent-foreground hover:bg-[#C29307]/90' : ''}`}
            >
              <Filter className="w-4 h-4" />
              All ({stats.totalCount})
            </Button>
            <Button
              variant={activeFilter === 'published' ? "default" : "outline"}
              onClick={() => setActiveFilter('published')}
              disabled={isLoading}
              className={`flex items-center gap-2 ${activeFilter === 'published' ? 'bg-green-600 text-white hover:bg-green-700' : ''}`}
            >
              <CheckCircle className="w-4 h-4" />
              Published ({stats.publishedCount})
            </Button>
            <Button
              variant={activeFilter === 'draft' ? "default" : "outline"}
              onClick={() => setActiveFilter('draft')}
              disabled={isLoading}
              className={`flex items-center gap-2 ${activeFilter === 'draft' ? 'bg-yellow-600 text-white hover:bg-yellow-700' : ''}`}
            >
              <Circle className="w-4 h-4" />
              Drafts ({stats.draftCount})
            </Button>
          </div>
        </div>

        {/* Results Info */}
        {posts.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              Showing {filteredPosts.length} of {stats.totalCount} posts
              {activeFilter !== 'all' && ` (${activeFilter} only)`}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
        )}

        {/* Posts Table */}
        {filteredPosts.length === 0 ? (
          <div className="border border-border rounded-lg p-8 text-center">
            {searchQuery || activeFilter !== 'all' ? (
              <>
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? `No posts match your search query "${searchQuery}"`
                    : `No ${activeFilter} posts found`}
                </p>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  disabled={isLoading}
                >
                  Clear filters
                </Button>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]">Views</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
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
                              loading="lazy"
                              width={40}
                              height={40}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">No image</span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium line-clamp-1">
                              {post.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              /{post.slug}
                            </p>
                            {post.excerpt && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                {post.excerpt}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{post.author?.name || 'Unknown Author'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {post.categories && post.categories.slice(0, 2).map((category, index) => (
                            <Badge
                              key={`${post.id}-category-${index}`}
                              variant="secondary"
                              className="text-xs"
                            >
                              {category}
                            </Badge>
                          ))}
                          {post.categories && post.categories.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.categories.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleTogglePublish(post)}
                          disabled={isLoading}
                          className={`px-3 py-1 text-xs rounded-full cursor-pointer transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                            post.is_published
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          }`}
                        >
                          {post.is_published ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Published
                            </>
                          ) : (
                            <>
                              <Circle className="w-3 h-3" />
                              Draft
                            </>
                          )}
                        </button>
                        {post.published_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(post.published_at), "MMM d, yyyy")}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(post.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {post.view_count || 0} views
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {post.comments_count || 0} comments
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isLoading}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href={`/blog/post-blog/${post.slug}`} target="_blank">
                              <DropdownMenuItem disabled={isLoading}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </DropdownMenuItem>
                            </Link>
                            <Link href={`/blog/admin/posts/${post.id}/edit`}>
                              <DropdownMenuItem disabled={isLoading}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeletePost(post.id, post.title)}
                              disabled={isLoading}
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
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPosts;