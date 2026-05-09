// CommentSection.tsx
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

const CommentSection = ({
  postId,
  initialComments = [],
}: CommentSectionProps) => {
  const [newComment, setNewComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localComments, setLocalComments] =
    useState<Comment[]>(initialComments);
  const [isLoading, setIsLoading] = useState(!initialComments.length);
  const [showLoadMore, setShowLoadMore] = useState(false);
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const COMMENTS_PER_PAGE = 10;

  useEffect(() => {
    if (page === 1 && initialComments.length > 0) {
      setLocalComments(initialComments);
      checkForMoreComments();
    } else {
      fetchComments();
    }
  }, [postId, page]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/blog/comments?postId=${postId}&page=${page}&limit=${COMMENTS_PER_PAGE}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }

      const data = await response.json();

      if (page === 1) {
        setLocalComments(data.comments || []);
      } else {
        setLocalComments((prev) => [...prev, ...(data.comments || [])]);
      }

      setShowLoadMore((data.comments || []).length === COMMENTS_PER_PAGE);
    } catch (error) {
      console.error("Error fetching comments:", error);
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
        `/api/blog/comments?postId=${postId}&page=2&limit=1`,
      );

      if (response.ok) {
        const data = await response.json();
        setShowLoadMore((data.comments || []).length > 0);
      }
    } catch (error) {
      console.error("Error checking for more comments:", error);
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
      const response = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          content: newComment.trim(),
          user_name: name.trim(),
          user_email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit comment");
      }

      setNewComment("");
      setName("");
      setEmail("");

      toast({
        title: "Success",
        description:
          "Comment submitted for moderation! It will appear after approval.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const handleRefresh = () => {
    setPage(1);
    fetchComments();
  };

  const getAvatarUrl = (avatar: string | null, authorName: string): string => {
    if (avatar) return avatar;

    const initials = authorName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return `https://ui-avatars.com/api/?name=${initials}&background=666&color=fff&size=100`;
  };

  const approvedComments = localComments.filter(
    (comment) => comment.is_approved,
  );
  const pendingComments = localComments.filter(
    (comment) => !comment.is_approved,
  );

  return (
    <section className="border-t border-(--border-color) pt-8 mt-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-between mb-6">
          <h3 className="text-2xl font-semibold text-(--text-primary)">
            Comments ({approvedComments.length})
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-sm text-(--text-secondary) hover:text-(--text-primary)"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Comment Form */}
        <div className="bg-(--bg-secondary) rounded-xl p-6 mb-8 border border-(--border-color)">
          <h4 className="text-lg font-medium mb-4 text-(--text-primary)">
            Leave a Comment
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2 text-(--text-primary)"
                >
                  Name *
                </label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                  style={{ outline: "none", boxShadow: "none" }}
                  maxLength={100}
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2 text-(--text-primary)"
                >
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
                  className="w-full border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                  style={{ outline: "none", boxShadow: "none" }}
                  maxLength={255}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="comment"
                className="block text-sm font-medium mb-2 text-(--text-primary)"
              >
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
                className="w-full resize-none border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                style={{ outline: "none", boxShadow: "none" }}
                maxLength={2000}
              />
              <p className="text-xs text-(--text-secondary) mt-1">
                {newComment.length}/2000 characters
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-(--text-secondary)">
                Your comment will be visible after moderation.
              </p>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !newComment.trim() ||
                  !name.trim() ||
                  !email.trim()
                }
                className="bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </form>
        </div>

        {/* Pending Comments */}
        {pendingComments.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-4 text-(--text-primary)">
              Your Pending Comments
            </h4>
            <div className="space-y-4">
              {pendingComments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-800 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-yellow-600 dark:text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-(--text-primary)">
                        <span className="font-medium">Pending approval:</span>{" "}
                        {comment.content}
                      </p>
                      <p className="text-xs text-(--text-secondary) mt-1">
                        Your comment is awaiting moderation and will appear here
                        once approved.
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--color-accent-yellow)"></div>
          </div>
        ) : approvedComments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-(--bg-secondary) rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-(--text-secondary)"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h4 className="text-lg font-medium mb-2 text-(--text-primary)">
              No comments yet
            </h4>
            <p className="text-(--text-secondary) mb-4">
              Be the first to share your thoughts on this article.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-8">
              {approvedComments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-(--bg-primary) rounded-lg p-6 border border-(--border-color)"
                >
                  <div className="flex gap-4">
                    <div className="shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-(--border-color)">
                        <img
                          src={getAvatarUrl(
                            comment.author.avatar,
                            comment.author.name,
                          )}
                          alt={comment.author.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const initials = comment.author.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2);
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${initials}&background=666&color=fff&size=100`;
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-(--text-primary)">
                          {comment.author.name}
                        </span>
                        {comment.author.isZidwellUser && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-(--color-accent-yellow)/10 text-(--color-accent-yellow) border-(--color-accent-yellow)/20 px-2 py-0.5"
                          >
                            Zidwell User
                          </Badge>
                        )}
                        <span className="text-sm text-(--text-secondary)">
                          •{" "}
                          {format(
                            new Date(comment.createdAt),
                            "MMM d, yyyy 'at' h:mm a",
                          )}
                        </span>
                      </div>

                      <p className="text-(--text-primary) mb-4 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {showLoadMore && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary) disabled:opacity-50 disabled:cursor-not-allowed"
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
