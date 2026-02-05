"use client"
import { useState, useEffect } from "react";
import AdminLayout from "@/app/components/blog-components/admin/AdminLayout";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Search, Check, X, Eye, Loader2, RefreshCw, Trash2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/app/components/ui/badge";
import { toast } from "sonner";
import { useBlog } from "@/app/context/BlogContext"; 

// Type for comment matching your schema
interface Comment {
  id: string;
  content: string;
  user_name: string | null;
  user_email: string | null;
  post_id: string | null;
  is_approved: boolean | null;
  created_at: string;
  postTitle?: string;
  postSlug?: string;
}

// Type for API response
interface ApiResponse {
  success: boolean;
  comments: Comment[];
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const AdminComments = () => {
  const { posts, refreshPosts } = useBlog();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "delete" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1
  });

  // Fetch comments from API
  const fetchComments = async (page = 1) => {
    try {
      setLoading(true);
      
      // Create a map of posts for quick lookup
      const postsMap = new Map();
      posts.forEach(post => {
        postsMap.set(post.id, { 
          title: post.title, 
          slug: post.slug 
        });
      });

      // Fetch comments using the admin API
      const response = await fetch(`/api/blog/comments?page=${page}&limit=${pagination.limit}&postId=all`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch comments');
      }
      
      const data: ApiResponse = await response.json();
      
      if (!data.success || !data.comments) {
        throw new Error('Invalid response format');
      }
      
      // Enrich comments with post data
      const enrichedComments = data.comments.map((comment: Comment) => {
        const postInfo = comment.post_id ? postsMap.get(comment.post_id) : null;
        return {
          ...comment,
          user_name: comment.user_name || 'Anonymous',
          user_email: comment.user_email || 'No email',
          is_approved: comment.is_approved || false,
          postTitle: postInfo?.title || 'Post not found',
          postSlug: postInfo?.slug || '#'
        };
      });
      
      setComments(enrichedComments);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchComments();
  }, []);

  // Refresh when posts are loaded
  useEffect(() => {
    if (posts.length > 0 && comments.length === 0 && !loading) {
      fetchComments();
    }
  }, [posts]);

  const handleViewComment = (comment: Comment) => {
    setSelectedComment(comment);
    setViewDialogOpen(true);
  };

  const handleActionClick = (comment: Comment, type: "approve" | "reject" | "delete") => {
    setSelectedComment(comment);
    setActionType(type);
    setActionDialogOpen(true);
  };

  const processCommentAction = async () => {
    if (!selectedComment || !actionType) return;

    setIsProcessing(true);
    setProcessingId(selectedComment.id);
    try {
      let response;
      let endpoint = `/api/blog/comments/${selectedComment.id}`;
      
      if (actionType === "delete") {
        // Delete comment
        response = await fetch(endpoint, {
          method: 'DELETE',
        });
      } else {
        // Approve or reject comment
        response = await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_approved: actionType === "approve"
          }),
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${actionType} comment`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || `Failed to ${actionType} comment`);
      }
      
      // Update local state
      if (actionType === "delete") {
        setComments(prev => prev.filter(comment => comment.id !== selectedComment.id));
        toast.success("Comment deleted successfully");
      } else {
        setComments(prev => 
          prev.map(comment => 
            comment.id === selectedComment.id 
              ? { 
                  ...comment, 
                  is_approved: actionType === "approve",
                }
              : comment
          )
        );
        toast.success(
          actionType === "approve" 
            ? "Comment approved successfully" 
            : "Comment rejected successfully"
        );
      }
      
      setActionDialogOpen(false);
      setSelectedComment(null);
      setActionType(null);
    } catch (error) {
      console.error('Error processing comment:', error);
      toast.error(`Failed to ${actionType} comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  const filteredComments = comments.filter((comment) => {
    const matchesSearch =
      comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (comment.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (comment.user_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (comment.postTitle?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    if (filter === "pending") return matchesSearch && !comment.is_approved;
    if (filter === "approved") return matchesSearch && comment.is_approved;
    return matchesSearch;
  });

  const stats = {
    total: comments.length,
    approved: comments.filter(c => c.is_approved).length,
    pending: comments.filter(c => !c.is_approved).length
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchComments(newPage);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Comments Management</h1>
            <p className="text-muted-foreground">
              Moderate and manage comments ({filteredComments.length} shown of {pagination.total} total)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPosts}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4" />
              <span className="ml-2 hidden sm:inline">Refresh Posts</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => fetchComments(pagination.page)}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="ml-2">Refresh Comments</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Comments</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search comments by content, author, email, or post..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("pending")}
            >
              Pending ({stats.pending})
            </Button>
            <Button
              variant={filter === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("approved")}
            >
              Approved ({stats.approved})
            </Button>
          </div>
        </div>

        {/* Comments Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <span className="ml-2">Loading comments...</span>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Author</TableHead>
                    <TableHead>Comment</TableHead>
                    
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[160px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {comments.length === 0 
                          ? "No comments found in the system" 
                          : "No comments match your search"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredComments.map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{comment.user_name}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                              {comment.user_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="line-clamp-2 max-w-[300px]">{comment.content}</p>
                        </TableCell>
                        {/* <TableCell>
                          <div className="space-y-1">
                            <span className="text-sm font-medium line-clamp-1 max-w-[200px]">
                              {comment.postTitle}
                            </span>
                            <a 
                              href={comment.postSlug !== '#' ? `/blog/${comment.postSlug}` : '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-xs flex items-center gap-1 ${
                                comment.postSlug !== '#' 
                                  ? "text-blue-600 hover:underline" 
                                  : "text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              View post {comment.postSlug !== '#' && <ExternalLink className="w-3 h-3" />}
                            </a>
                          </div>
                        </TableCell> */}
                        <TableCell>
                          <Badge 
                            variant={comment.is_approved ? "default" : "secondary"}
                            className={
                              comment.is_approved 
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                            }
                          >
                            {comment.is_approved ? "Approved" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex flex-col">
                            <span>{format(new Date(comment.created_at), "MMM d, yyyy")}</span>
                            <span className="text-xs">
                              {format(new Date(comment.created_at), "h:mm a")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="View comment"
                              onClick={() => handleViewComment(comment)}
                              disabled={isProcessing && processingId === comment.id}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {!comment.is_approved ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Approve"
                                onClick={() => handleActionClick(comment, "approve")}
                                disabled={isProcessing && processingId === comment.id}
                              >
                                {isProcessing && processingId === comment.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                title="Reject"
                                onClick={() => handleActionClick(comment, "reject")}
                                disabled={isProcessing && processingId === comment.id}
                              >
                                {isProcessing && processingId === comment.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete"
                              onClick={() => handleActionClick(comment, "delete")}
                              disabled={isProcessing && processingId === comment.id}
                            >
                              {isProcessing && processingId === comment.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1 || loading}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="ml-1 hidden sm:inline">Previous</span>
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            disabled={loading}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages || loading}
                    >
                      <span className="mr-1 hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Comment Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comment Details</DialogTitle>
            <DialogDescription>
              Review comment from {selectedComment?.user_name}
            </DialogDescription>
          </DialogHeader>
          {selectedComment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Author</h4>
                  <p className="font-medium">{selectedComment.user_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                  <p>{selectedComment.user_email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Post</h4>
                  <p className="font-medium">{selectedComment.postTitle}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <Badge variant={selectedComment.is_approved ? "default" : "secondary"}>
                    {selectedComment.is_approved ? "Approved" : "Pending"}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Submitted</h4>
                  <p>{format(new Date(selectedComment.created_at), "PPP 'at' p")}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Comment</h4>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedComment.content}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                {!selectedComment.is_approved ? (
                  <Button
                    variant="default"
                    onClick={() => {
                      setViewDialogOpen(false);
                      setTimeout(() => handleActionClick(selectedComment, "approve"), 100);
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve Comment
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setViewDialogOpen(false);
                      setTimeout(() => handleActionClick(selectedComment, "reject"), 100);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject Comment
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    setViewDialogOpen(false);
                    setTimeout(() => handleActionClick(selectedComment, "delete"), 100);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" && "Approve Comment"}
              {actionType === "reject" && "Reject Comment"}
              {actionType === "delete" && "Delete Comment"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve" && 
                "Are you sure you want to approve this comment? It will be visible to all users."}
              {actionType === "reject" && 
                "Are you sure you want to reject this comment? It will be hidden from public view."}
              {actionType === "delete" && 
                "Are you sure you want to delete this comment? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={processCommentAction}
              disabled={isProcessing}
              className={
                actionType === "delete" 
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : actionType === "reject"
                  ? "bg-yellow-600 text-white hover:bg-yellow-700"
                  : ""
              }
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {actionType === "approve" && "Approve"}
              {actionType === "reject" && "Reject"}
              {actionType === "delete" && "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminComments;