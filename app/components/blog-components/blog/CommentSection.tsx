"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { useToast } from "@/app/hooks/use-toast";

interface CommentAuthor {
  id: string;
  name: string;
  avatar: string | null;
  isZidwellUser?: boolean;
}

interface Comment {
  id: string;
  content: string;
  author: CommentAuthor;
  createdAt: string;
  user_name?: string;
  user_email?: string;
  is_approved?: boolean;
}

interface CommentSectionProps {
  postId: string;
  initialComments?: Comment[];
}

const CommentSection = ({ postId, initialComments = [] }: CommentSectionProps) => {
  const [newComment, setNewComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(initialComments);
  const [isLoading, setIsLoading] = useState(!initialComments.length);
  const [showLoadMore, setShowLoadMore] = useState(false);
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  
  const COMMENTS_PER_PAGE = 10;

  // Debug: Log postId on mount
  useEffect(() => {
    console.log('CommentSection mounted with postId:', postId);
    console.log('Initial comments:', initialComments);
  }, [postId]);

  // Fetch comments from the database
  useEffect(() => {
    if (page === 1 && initialComments.length > 0) {
      // Use initial props if provided (SSR/ISR)
      setLocalComments(initialComments);
      checkForMoreComments();
    } else {
      fetchComments();
    }
  }, [postId, page]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching comments for page:', page);
      
      const response = await fetch(
        `/api/blog/comments?postId=${postId}&page=${page}&limit=${COMMENTS_PER_PAGE}`,
        {
          cache: 'no-store'
        }
      );
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched data:', data);
      
      if (data.success === false) {
        throw new Error(data.error || 'Failed to fetch comments');
      }
      
      if (page === 1) {
        setLocalComments(data.comments || []);
      } else {
        setLocalComments(prev => [...prev, ...(data.comments || [])]);
      }
      
      setShowLoadMore((data.comments || []).length === COMMENTS_PER_PAGE);
      
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkForMoreComments = async () => {
    try {
      const response = await fetch(
        `/api/blog/comments?postId=${postId}&page=2&limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        setShowLoadMore((data.comments || []).length > 0);
      }
    } catch (error) {
      console.error('Error checking for more comments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !name.trim() || !email.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting comment for post:', postId);
      
      const response = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          postId, 
          content: newComment.trim(),
          user_name: name.trim(),
          user_email: email.trim()
        }),
      });
      
      const data = await response.json();
      console.log('Submit response:', data);
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit comment");
      }

      // Clear form
      setNewComment("");
      setName("");
      setEmail("");
      
      // Show optimistic update
      const optimisticComment: Comment = {
        id: `temp-${Date.now()}`,
        content: newComment.trim(),
        author: {
          id: 'temp-user',
          name: name.trim(),
          avatar: null,
          isZidwellUser: false
        },
        createdAt: new Date().toISOString(),
        user_name: name.trim(),
        user_email: email.trim(),
        is_approved: false
      };
      
      setLocalComments(prev => [optimisticComment, ...prev]);
      
      // Force refresh comments
      setTimeout(() => {
        setPage(1);
        fetchComments();
      }, 1000);
      
      toast({
        title: "Success",
        description: "Comment submitted for moderation! It will appear after approval.",
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit comment. Please try again.",
        variant: "destructive",
      });
      
      // Remove optimistic update on error
      setLocalComments(prev => prev.filter(c => !c.id.startsWith('temp-')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleRefresh = () => {
    setPage(1);
    fetchComments();
  };

  // Helper function to get avatar URL
  const getAvatarUrl = (avatar: string | null, authorName: string): string => {
    if (avatar) return avatar;
    
    const initials = authorName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return `https://ui-avatars.com/api/?name=${initials}&background=666&color=fff&size=100`;
  };

  // Filter only approved comments for display
  const approvedComments = localComments.filter(comment => comment.is_approved);
  const pendingComments = localComments.filter(comment => !comment.is_approved);

  console.log('Rendering with:', {
    allComments: localComments.length,
    approved: approvedComments.length,
    pending: pendingComments.length,
    isLoading
  });

  return (
    <section className="border-t border-border pt-8 mt-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Comments ({approvedComments.length})
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Comment Form */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-8">
          <h4 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
            Leave a Comment
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Name *
                </label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full"
                  maxLength={100}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Email *
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full"
                  maxLength={255}
                />
              </div>
            </div>
            <div>
              <label htmlFor="comment" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Comment *
              </label>
              <Textarea
                id="comment"
                placeholder="Share your thoughts on this article..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                required
                disabled={isSubmitting}
                className="w-full resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {newComment.length}/2000 characters
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your comment will be visible after moderation.
              </p>
              <Button
                type="submit"
                disabled={isSubmitting || !newComment.trim() || !name.trim() || !email.trim()}
                className="bg-[#C29307] hover:bg-[#C29307]/90 text-white px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </form>
        </div>

        {/* Pending Comments (User's own unapproved comments) */}
        {pendingComments.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
              Your Pending Comments
            </h4>
            <div className="space-y-4">
              {pendingComments.map((comment) => (
                <div key={comment.id} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-800 flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Pending approval:</span> {comment.content}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Your comment is awaiting moderation and will appear here once approved.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments List */}
        {isLoading && page === 1 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C29307]"></div>
          </div>
        ) : approvedComments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
              No comments yet
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Be the first to share your thoughts on this article.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-8">
              {approvedComments.map((comment) => (
                <div key={comment.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                        <img
                          src={getAvatarUrl(comment.author.avatar, comment.author.name)}
                          alt={comment.author.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const initials = comment.author.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2);
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${initials}&background=666&color=fff&size=100`;
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Comment Content */}
                    <div className="flex-1">
                      {/* Author Info */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {comment.author.name}
                        </span>
                        {comment.author.isZidwellUser && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-[#C29307]/10 text-[#C29307] border-[#C29307]/20 px-2 py-0.5"
                          >
                            Zidwell User
                          </Badge>
                        )}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          • {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      
                      {/* Comment Text */}
                      <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {showLoadMore && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Loading..." : "Load More Comments"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default CommentSection;