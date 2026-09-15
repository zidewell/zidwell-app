// app/store/[storeSlug]/[productSlug]/components/DescriptionBlock.tsx
"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  html: string;
}

export function DescriptionBlock({ html }: Props) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const check = () => {
      setIsOverflowing(el.scrollHeight > 140);
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [html]);

  const formatted = html
    .replace(/<p>/g, '<p class="mb-3">')
    .replace(/<ol>/g, '<ol class="list-decimal pl-5 space-y-1 my-2">')
    .replace(/<ul>/g, '<ul class="list-disc pl-5 space-y-1 my-2">')
    .replace(/<li>/g, '<li class="mb-1">');

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h2 className="text-sm font-semibold mb-4">
        <span className="inline-block pb-2 border-b-2 border-[#FDC020]">
          Details
        </span>
      </h2>
      <div className="relative">
        <div
          ref={contentRef}
          className="text-[15px] leading-7 text-foreground/70 max-w-none overflow-hidden"
          style={{ maxHeight: expanded ? "none" : "140px" }}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />

        {!expanded && isOverflowing && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        )}
      </div>

      {isOverflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-medium underline text-foreground hover:no-underline"
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}