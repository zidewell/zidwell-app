"use client";

import React from "react";
import {
  ChevronLeft,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  Save,
  Loader2,
  Calendar,
  Clock,
  User,
  Volume2,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { cleanQuillHTML } from "../RichTextEditor";

// Add the same editor styles from RichTextEditor
const previewStyles = `
  .preview-content {
    font-family: inherit;
    font-size: 16px;
    line-height: 1.75;
    color: #1f2937;
  }

  .dark .preview-content {
    color: #e5e7eb;
  }

  .preview-content p {
    margin-bottom: 1rem;
  }

  .preview-content h1 {
    font-size: 2.25rem;
    font-weight: 600;
    margin-top: 2rem;
    margin-bottom: 1rem;
    line-height: 1.2;
  }

  .preview-content h2 {
    font-size: 1.875rem;
    font-weight: 600;
    margin-top: 1.75rem;
    margin-bottom: 0.875rem;
    line-height: 1.3;
  }

  .preview-content h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    line-height: 1.4;
  }

  .preview-content h4 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 1.25rem;
    margin-bottom: 0.625rem;
    line-height: 1.4;
  }

  .preview-content h5 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }

  .preview-content h6 {
    font-size: 1rem;
    font-weight: 600;
    margin-top: 0.875rem;
    margin-bottom: 0.5rem;
    line-height: 1.5;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .preview-content strong, .preview-content b {
    font-weight: 600;
  }

  .preview-content em, .preview-content i {
    font-style: italic;
  }

  .preview-content u {
    text-decoration: underline;
  }

  .preview-content ul, .preview-content ol {
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }

  .preview-content ul {
    list-style-type: disc;
  }

  .preview-content ol {
    list-style-type: decimal;
  }

  .preview-content li {
    margin-bottom: 0.25rem;
  }

  .preview-content blockquote {
    border-left: 4px solid #C29307;
    padding-left: 1rem;
    margin: 1rem 0;
    font-style: italic;
    color: #4b5563;
  }

  .dark .preview-content blockquote {
    color: #9ca3af;
  }

  .preview-content a {
    color: #C29307;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .preview-content a:hover {
    text-decoration: none;
  }

  .preview-content code {
    font-family: monospace;
    background-color: #f3f4f6;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }

  .dark .preview-content code {
    background-color: #1f2937;
  }

  .preview-content pre {
    background-color: #f3f4f6;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 1rem 0;
  }

  .dark .preview-content pre {
    background-color: #1f2937;
  }

  .preview-content pre code {
    background-color: transparent;
    padding: 0;
    border-radius: 0;
  }

  .preview-content img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 1.5rem 0;
  }

  .preview-content hr {
    margin: 2rem 0;
    border: 0;
    border-top: 1px solid #e5e7eb;
  }

  .dark .preview-content hr {
    border-top-color: #374151;
  }

  .preview-content .ql-align-center {
    text-align: center;
  }

  .preview-content .ql-align-right {
    text-align: right;
  }

  .preview-content .ql-align-justify {
    text-align: justify;
  }

  .preview-content .ql-indent-1 {
    padding-left: 3rem;
  }

  .preview-content .ql-indent-2 {
    padding-left: 6rem;
  }

  .preview-content .ql-indent-3 {
    padding-left: 9rem;
  }

  .preview-content .ql-indent-4 {
    padding-left: 12rem;
  }

  .preview-content .ql-indent-5 {
    padding-left: 15rem;
  }

  .preview-content .ql-indent-6 {
    padding-left: 18rem;
  }

  .preview-content .ql-indent-7 {
    padding-left: 21rem;
  }

  .preview-content .ql-indent-8 {
    padding-left: 24rem;
  }

  /* Table styles */
  .preview-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
  }

  .preview-content th {
    background-color: #f3f4f6;
    font-weight: 600;
    padding: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  .dark .preview-content th {
    background-color: #1f2937;
    border-color: #374151;
  }

  .preview-content td {
    padding: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  .dark .preview-content td {
    border-color: #374151;
  }

  /* List styles */
  .preview-content ul[data-list="bullet"] {
    list-style-type: disc;
  }

  .preview-content ul[data-list="checked"], 
  .preview-content ul[data-list="unchecked"] {
    list-style-type: none;
    padding-left: 0.5rem;
  }

  .preview-content ul[data-list="checked"] li:before,
  .preview-content ul[data-list="unchecked"] li:before {
    content: "✓";
    display: inline-block;
    width: 1.5rem;
    margin-left: -1.5rem;
    color: #C29307;
  }

  .preview-content ul[data-list="unchecked"] li:before {
    content: "○";
  }

  /* Video styles */
  .preview-content .ql-video {
    aspect-ratio: 16 / 9;
    width: 100%;
    border: none;
    border-radius: 0.5rem;
    margin: 1.5rem 0;
  }

  /* Size classes */
  .preview-content .ql-size-small {
    font-size: 0.75rem;
  }

  .preview-content .ql-size-large {
    font-size: 1.25rem;
  }

  .preview-content .ql-size-huge {
    font-size: 1.5rem;
  }

  /* Background and color classes */
  .preview-content .ql-font-serif {
    font-family: Georgia, 'Times New Roman', serif;
  }

  .preview-content .ql-font-monospace {
    font-family: 'Courier New', Courier, monospace;
  }
`;

interface PostPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    title: string;
    content: string;
    excerpt: string;
    featuredImage: string;
    audioFile: string;
    categories: string[];
    tags: string;
    authorName: string;
    authorAvatar: string;
    authorBio: string;
    isPublished: boolean;
    postId?: string;
  };
  readTime: number;
  lastSaved: Date | null;
  isSaving: boolean;
  onSaveDraft: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const PostPreviewModal: React.FC<PostPreviewModalProps> = ({
  isOpen,
  onClose,
  post,
  readTime,
  lastSaved,
  isSaving,
  onSaveDraft,
  isFullscreen,
  onToggleFullscreen,
}) => {
  if (!isOpen) return null;

  const {
    title,
    content,
    excerpt,
    featuredImage,
    audioFile,
    categories,
    tags,
    authorName,
    authorAvatar,
    isPublished,
    postId,
  } = post;

  // Clean content for preview using the same function as RichTextEditor
  const cleanContent = React.useMemo(() => {
    return cleanQuillHTML(content || '');
  }, [content]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <style>{previewStyles}</style>
      <div
        className={`
          relative w-full max-w-6xl h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
          flex flex-col overflow-hidden transition-all duration-300
          ${isFullscreen ? 'fixed inset-0 m-0 rounded-none h-screen w-screen' : ''}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Post Preview
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Previewing: {title || "Untitled"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFullscreen}
              className="gap-2"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </Button>
            
            {postId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/blog/preview/${postId}`, "_blank")}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
          <article className="max-w-4xl mx-auto">
            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {categories.map((category, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-[#C29307]/10 text-[#C29307] hover:bg-[#C29307]/20 uppercase text-xs tracking-wider px-2 py-1"
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight mb-6 text-gray-900 dark:text-white">
              {title || "Untitled Post"}
            </h1>

            {/* Excerpt */}
            {excerpt && (
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 italic border-l-4 border-[#C29307] pl-4 py-2">
                {excerpt}
              </p>
            )}

            {/* Author and Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {authorAvatar ? (
                    <img 
                      src={authorAvatar} 
                      alt={authorName}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#C29307]/20 to-[#C29307]/40 flex items-center justify-center">
                      <User className="w-6 h-6 text-[#C29307]" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#C29307] rounded-full border-2 border-white dark:border-gray-900"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {authorName || "Author"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {readTime} min read
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            {featuredImage && (
              <div className="aspect-video overflow-hidden rounded-xl mb-8 border border-gray-200 dark:border-gray-800 shadow-lg">
                <img
                  src={featuredImage}
                  alt={title || "Featured image"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='16' text-anchor='middle' fill='%239ca3af'%3EImage not found%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
            )}

            {/* Audio Player */}
            {audioFile && (
              <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <Volume2 className="w-6 h-6 text-[#C29307]" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Audio Preview
                  </span>
                </div>
                <audio
                  src={audioFile}
                  controls
                  className="w-full"
                  onError={(e) => {
                    console.error("Audio playback error:", e);
                  }}
                />
              </div>
            )}

            {/* Content - Now using the same styling as RichTextEditor */}
            <div 
              className="preview-content prose prose-lg dark:prose-invert max-w-none mb-8"
              dangerouslySetInnerHTML={{ 
                __html: cleanContent || '<p class="text-gray-500 italic">No content yet. Start writing above!</p>' 
              }}
            />

            {/* Tags */}
            {tags.trim() && (
              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                    .map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Status Indicator */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Post Status:
                  </span>
                  <span className={`ml-2 px-3 py-1 text-sm rounded-full ${
                    isPublished 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}>
                    {isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Last saved: {lastSaved ? lastSaved.toLocaleTimeString() : "Not saved yet"}
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              This is a preview. Changes are not saved until you publish.
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Close Preview
              </Button>
              <Button
                className="bg-[#C29307] text-white hover:bg-[#C29307]/90"
                onClick={onSaveDraft}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostPreviewModal;