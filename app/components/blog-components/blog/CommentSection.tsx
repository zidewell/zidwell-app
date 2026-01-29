"use client ";
import { useState } from "react";
import { Comment } from "./types/blog";
import { format } from "date-fns";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";

interface CommentSectionProps {
  comments: Comment[];
  postId: string;
}

const CommentSection = ({ comments, postId }: CommentSectionProps) => {
  const [newComment, setNewComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle comment submission
    alert("Comment submitted for moderation!");
    setNewComment("");
    setName("");
    setEmail("");
  };

  return (
    <section className="border-t border-border pt-8 mt-12">
      <h3 className="text-xl font-semibold mb-6">
        Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Textarea
          placeholder="Share your thoughts..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={4}
          required
        />
        <Button
          type="submit"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Post Comment
        </Button>
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Be the first to comment on this article.
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <img
                src={comment.author.avatar}
                alt={comment.author.name}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{comment.author.name}</span>
                  {comment.author.isZidwellUser && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-accent/10 text-accent"
                    >
                      Zidwell User
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    · {format(new Date(comment.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="text-muted-foreground">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default CommentSection;
