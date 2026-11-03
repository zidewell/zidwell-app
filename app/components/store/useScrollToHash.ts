// app/components/store/useScrollToHash.ts
"use client";

import { useEffect, useRef } from "react";

/**
 * Waits for the target element to mount, then smooth-scrolls to it
 * with a subtle gold pulse. Handles the case where the target is
 * inside a <Suspense> boundary (like ZidStorePricing).
 */
export function useScrollToHash() {
  const didScroll = useRef(false);

  useEffect(() => {
    if (didScroll.current) return;

    const scroll = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return false;

      const el = document.getElementById(hash);
      if (!el) return false;

      didScroll.current = true;

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

      return true;
    };

    if (scroll()) return;

    const observer = new MutationObserver(() => {
      if (scroll()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const timeout = setTimeout(() => observer.disconnect(), 8000);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, []);
}