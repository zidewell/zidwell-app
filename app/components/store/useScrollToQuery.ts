// app/components/store/useScrollToQuery.ts
"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Reads ?scroll=<elementId> and smooth-scrolls to that element once it
 * mounts. Handles Suspense boundaries via MutationObserver.
 *
 * Matches the working /pricing?scroll=pricing pattern.
 */
export function useScrollToQuery() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get("scroll");
  const didScroll = useRef(false);

  useEffect(() => {
    if (!targetId || didScroll.current) return;

    console.log("[scroll] target:", targetId);

    const scroll = () => {
      const el = document.getElementById(targetId);
      if (!el) return false;

      didScroll.current = true;
      console.log("[scroll] ✅ element found, scrolling");

      const top = el.getBoundingClientRect().top + window.scrollY - 88;
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      window.scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });

      if (!prefersReduced) {
        el.animate(
          [
            { boxShadow: "0 0 0 0 rgba(245,184,0,0)" },
            { boxShadow: "0 0 0 6px rgba(245,184,0,0.35)" },
            { boxShadow: "0 0 0 0 rgba(245,184,0,0)" },
          ],
          { duration: 1400, easing: "ease-out" },
        );
      }

      // Remove scroll param so refresh doesn't re-scroll
      const url = new URL(window.location.href);
      url.searchParams.delete("scroll");
      window.history.replaceState({}, "", url.toString());

      return true;
    };

    if (scroll()) return;

    const observer = new MutationObserver(() => {
      if (scroll()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const timeout = setTimeout(() => observer.disconnect(), 10000);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [targetId]);
}