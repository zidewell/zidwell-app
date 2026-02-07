"use client";

import React, { useEffect, useState } from 'react';
import { cleanQuillHTML } from '../RichTextEditor';

interface ArticleContentProps {
  content: string;
}

const ArticleContent = ({ content }: ArticleContentProps) => {
  const [cleanedContent, setCleanedContent] = useState<string>('');

  useEffect(() => {
    // Clean the HTML content using the same function as the editor
    const cleaned = cleanQuillHTML(content || '');
    setCleanedContent(cleaned);
  }, [content]);

  // Function to format paragraphs with proper spacing
  const formatContent = (html: string) => {
    if (!html) return '<p class="text-gray-500 italic">No content available.</p>';
    
    // Add classes to standard HTML elements for consistent styling
    let formatted = html
      .replace(/<p>/g, '<p class="mb-4 sm:mb-6 leading-relaxed text-gray-700 dark:text-gray-300">')
      .replace(/<h1>/g, '<h1 class="text-3xl sm:text-4xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">')
      .replace(/<h2>/g, '<h2 class="text-2xl sm:text-3xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">')
      .replace(/<h3>/g, '<h3 class="text-xl sm:text-2xl font-semibold mt-5 mb-3 text-gray-900 dark:text-white">')
      .replace(/<ul>/g, '<ul class="list-disc pl-5 sm:pl-8 mb-4 sm:mb-6 text-gray-700 dark:text-gray-300">')
      .replace(/<ol>/g, '<ol class="list-decimal pl-5 sm:pl-8 mb-4 sm:mb-6 text-gray-700 dark:text-gray-300">')
      .replace(/<li>/g, '<li class="mb-2">')
      .replace(/<blockquote>/g, '<blockquote class="border-l-4 border-[#C29307] pl-4 sm:pl-6 py-2 my-4 sm:my-6 italic bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">')
      .replace(/<a /g, '<a class="text-[#C29307] hover:text-[#C29307]/80 hover:underline transition-colors" ')
      .replace(/<strong>/g, '<strong class="font-semibold">')
      .replace(/<em>/g, '<em class="italic">');

    return formatted;
  };

  return (
    <div 
      className="prose prose-lg dark:prose-invert max-w-none"
      style={{
        fontFamily: 'inherit',
        fontSize: '16px',
        lineHeight: '1.75',
        color: 'inherit',
      }}
    >
      <div 
        className="article-content"
        dangerouslySetInnerHTML={{ 
          __html: formatContent(cleanedContent)
        }}
        style={{
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit',
        }}
      />
      
      {/* Add custom styles for better readability */}
      <style jsx>{`
        .article-content {
          font-family: inherit;
          font-size: 16px;
          line-height: 1.75;
          color: #374151;
        }
        
        .article-content.dark {
          color: #d1d5db;
        }
        
        .article-content p {
          margin-bottom: 1.5rem;
          text-align: justify;
        }
        
        .article-content h1, .article-content h2, .article-content h3 {
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
        
        .article-content ul, .article-content ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }
        
        .article-content li {
          margin-bottom: 0.5rem;
        }
        
        .article-content blockquote {
          border-left: 4px solid #C29307;
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          background-color: rgba(194, 147, 7, 0.05);
        }
        
        .article-content a {
          color: #C29307;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        
        .article-content a:hover {
          color: #b38606;
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