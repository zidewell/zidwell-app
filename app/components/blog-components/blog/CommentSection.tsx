"use client";
import { useState } from "react";
import { format } from "date-fns";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";

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
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: string;
  comments?: Comment[];
}

const CommentSection = ({ comments = [], postId }: CommentSectionProps) => {
  const [newComment, setNewComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !name.trim() || !email.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newCommentObj: Comment = {
        id: `comment-${Date.now()}`,
        content: newComment,
        author: {
          id: `user-${Date.now()}`,
          name,
          avatar: null,
          isZidwellUser: false
        },
        createdAt: new Date().toISOString(),
      };

      // Add to local state
      setLocalComments(prev => [newCommentObj, ...prev]);
      
      // Clear form
      setNewComment("");
      setName("");
      setEmail("");
      
      alert("Comment submitted for moderation! It will appear after approval.");
      
      // In a real app, you would send to your API:
      // await fetch('/api/comments', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ postId, content: newComment, name, email }),
      // });
      
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert("Failed to submit comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get avatar URL
  const getAvatarUrl = (avatar: string | null, authorName: string): string => {
    if (avatar) return avatar;
    
    // Generate placeholder avatar based on name initials
    const initials = authorName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return `https://ui-avatars.com/api/?name=${initials}&background=random&color=fff&size=100`;
  };

  return (
    <section className="border-t border-border pt-8 mt-12">
      <div className="max-w-3xl mx-auto">
        <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
          Comments ({localComments.length})
        </h3>

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
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your comment will be visible after moderation.
              </p>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#C29307] hover:bg-[#C29307]/90 text-white px-6 py-2"
              >
                {isSubmitting ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </form>
        </div>

        {/* Comments List */}
        <div className="space-y-8">
          {localComments.length === 0 ? (
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
            localComments.map((comment) => (
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
                    
                    {/* Reply Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Reply
                    </Button>
                  </div>
                </div>
                
                {/* Replies Section */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-16 mt-6 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="mb-4 last:mb-0">
                        <div className="flex gap-3">
                          <img
                            src={getAvatarUrl(reply.author.avatar, reply.author.name)}
                            alt={reply.author.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {reply.author.name}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {format(new Date(reply.createdAt), "MMM d")}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Load More Button (if needed) */}
        {localComments.length > 0 && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Load More Comments
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CommentSection;