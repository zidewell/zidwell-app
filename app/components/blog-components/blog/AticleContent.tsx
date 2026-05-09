// ArticleContent.tsx
"use client";

import React, { useEffect, useState } from "react";
import { cleanQuillHTML } from "../RichTextEditor";

interface ArticleContentProps {
  content: string;
}

const ArticleContent = ({ content }: ArticleContentProps) => {
  const [cleanedContent, setCleanedContent] = useState<string>("");

  useEffect(() => {
    const cleaned = cleanQuillHTML(content || "");
    setCleanedContent(cleaned);
  }, [content]);

  const formatContent = (html: string) => {
    if (!html)
      return '<p class="text-(--text-secondary) italic">No content available.</p>';

    let formatted = html
      .replace(
        /<p>/g,
        '<p class="mb-4 sm:mb-6 leading-relaxed text-(--text-primary)">',
      )
      .replace(
        /<h1>/g,
        '<h1 class="text-3xl sm:text-4xl font-bold mt-8 mb-4 text-(--text-primary)">',
      )
      .replace(
        /<h2>/g,
        '<h2 class="text-2xl sm:text-3xl font-semibold mt-6 mb-3 text-(--text-primary)">',
      )
      .replace(
        /<h3>/g,
        '<h3 class="text-xl sm:text-2xl font-semibold mt-5 mb-3 text-(--text-primary)">',
      )
      .replace(
        /<ul>/g,
        '<ul class="list-disc pl-5 sm:pl-8 mb-4 sm:mb-6 text-(--text-primary)">',
      )
      .replace(
        /<ol>/g,
        '<ol class="list-decimal pl-5 sm:pl-8 mb-4 sm:mb-6 text-(--text-primary)">',
      )
      .replace(/<li>/g, '<li class="mb-2">')
      .replace(
        /<blockquote>/g,
        '<blockquote class="border-l-4 border-(--color-accent-yellow) pl-4 sm:pl-6 py-2 my-4 sm:my-6 italic bg-(--bg-secondary) text-(--text-secondary)">',
      )
      .replace(
        /<a /g,
        '<a class="text-(--color-accent-yellow) hover:text-(--color-accent-yellow)/80 hover:underline transition-colors" ',
      )
      .replace(/<strong>/g, '<strong class="font-semibold">')
      .replace(/<em>/g, '<em class="italic">');

    return formatted;
  };

  return (
    <div
      className="prose prose-lg dark:prose-invert max-w-none"
      style={{
        fontFamily: "inherit",
        fontSize: "16px",
        lineHeight: "1.75",
        color: "inherit",
      }}
    >
      <div
        className="article-content"
        dangerouslySetInnerHTML={{
          __html: formatContent(cleanedContent),
        }}
        style={{
          fontFamily: "inherit",
          fontSize: "inherit",
          lineHeight: "inherit",
        }}
      />

      <style jsx>{`
        .article-content {
          font-family: inherit;
          font-size: 16px;
          line-height: 1.75;
          color: var(--text-primary);
        }

        .article-content.dark {
          color: var(--text-primary);
        }

        .article-content p {
          margin-bottom: 1.5rem;
          text-align: justify;
        }

        .article-content h1,
        .article-content h2,
        .article-content h3 {
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .article-content h1 {
          font-size: 2rem;
        }

        .article-content h2 {
          font-size: 1.5rem;
        }

        .article-content h3 {
          font-size: 1.25rem;
        }

        .article-content ul,
        .article-content ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }

        .article-content li {
          margin-bottom: 0.5rem;
        }

        .article-content blockquote {
          border-left: 4px solid var(--color-accent-yellow);
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          background-color: var(--bg-secondary);
        }

        .article-content a {
          color: var(--color-accent-yellow);
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .article-content a:hover {
          color: var(--color-accent-yellow);
          opacity: 0.8;
        }

        .article-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
        }

        @media (min-width: 768px) {
          .article-content {
            font-size: 18px;
            line-height: 1.8;
          }

          .article-content p {
            margin-bottom: 2rem;
          }

          .article-content h1 {
            font-size: 2.5rem;
          }

          .article-content h2 {
            font-size: 2rem;
          }

          .article-content h3 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ArticleContent;
