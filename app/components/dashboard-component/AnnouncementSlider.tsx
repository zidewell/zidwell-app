"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Megaphone } from "lucide-react";

const announcements = [
  {
    id: 1,
    title: "📢 Tax Filing Deadline",
    text: "Annual tax filing deadline is March 31. Prepare your reports now!",
    cta: "View Tax Manager",
  },
  {
    id: 2,
    title: "🚀 New: Payment Pages",
    text: "Create branded payment pages and share links with your customers instantly.",
    cta: "Try It Now",
  },
  {
    id: 3,
    title: "📊 Monthly Reports Ready",
    text: "Your January financial report is ready for download.",
    cta: "View Reports",
  },
  {
    id: 4,
    title: "💡 Tip: Auto-Categorize",
    text: "Enable smart categorization in Bookkeeping to save time on entries.",
    cta: "Learn More",
  },
];

const AnnouncementSlider = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prev = () =>
    setCurrent((c) => (c - 1 + announcements.length) % announcements.length);
  const next = () => setCurrent((c) => (c + 1) % announcements.length);

  const a = announcements[current];

  return (
    <div className="relative bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-md p-5 md:p-6 shadow-[4px_4px_0px_var(--border-color)]">
      <div className="flex items-center gap-5">
        <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-md bg-[var(--color-accent-yellow)] text-[var(--color-ink)] border-2 border-[var(--border-color)] shadow-[2px_2px_0px_var(--border-color)] shrink-0">
          <Megaphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base text-[var(--text-primary)]">
            {a.title}
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-1 truncate font-['Be_Vietnam_Pro']">
            {a.text}
          </p>
        </div>
        <button className="hidden sm:inline-flex text-sm font-bold text-[var(--color-accent-yellow)] hover:underline shrink-0 uppercase tracking-wide">
          {a.cta}
        </button>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {announcements.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full border-2 border-[var(--border-color)] transition-colors ${
              i === current
                ? "bg-[var(--color-accent-yellow)]"
                : "bg-[var(--bg-secondary)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default AnnouncementSlider;