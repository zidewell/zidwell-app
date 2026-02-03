"use client"
import { useMemo } from "react";

interface ArticleContentProps {
  content: string;
}

const ArticleContent = ({ content }: ArticleContentProps) => {
  // Split content into sentences for hover highlighting
  const processedContent = useMemo(() => {
    // Parse HTML and wrap sentences in spans
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    
    const wrapTextInSpans = (element: Element) => {
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      const textNodes: Text[] = [];
      let node;
      while ((node = walker.nextNode())) {
        textNodes.push(node as Text);
      }
      
      textNodes.forEach((textNode) => {
        const text = textNode.textContent || "";
        // Split by sentences (period, question mark, exclamation mark followed by space or end)
        const sentences = text.split(/(?<=[.!?])\s+/);
        
        if (sentences.length > 1 || text.trim()) {
          const fragment = document.createDocumentFragment();
          sentences.forEach((sentence, index) => {
            if (sentence.trim()) {
              const span = document.createElement("span");
              span.className = "sentence-highlight cursor-default";
              span.textContent = sentence + (index < sentences.length - 1 ? " " : "");
              fragment.appendChild(span);
            }
          });
          textNode.parentNode?.replaceChild(fragment, textNode);
        }
      });
    };
    
    wrapTextInSpans(doc.body);
    return doc.body.innerHTML;
  }, [content]);

  return (
    <div
      className="article-content"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
};

export default ArticleContent;
