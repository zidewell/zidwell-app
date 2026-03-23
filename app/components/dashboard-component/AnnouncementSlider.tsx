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
    <div className="relative bg-[#ffffff] dark:bg-[#171717] border-2 border-[#242424] dark:border-[#474747] rounded-md p-5 md:p-6 shadow-[4px_4px_0px_#242424] dark:shadow-[4px_4px_0px_#000000]">
      <div className="flex items-center gap-5">
        <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-md bg-[#2b825b] dark:bg-[#2b825b] text-white border-2 border-[#242424] dark:border-[#474747] shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] shrink-0">
          <Megaphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className=" font-bold text-base text-[#141414] dark:text-[#f5f5f5]">
            {a.title}
          </p>
          <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6] mt-1 truncate font-['Be_Vietnam_Pro']">
            {a.text}
          </p>
        </div>
        <button className="hidden sm:inline-flex text-sm  font-bold text-[#2b825b] dark:text-[#2b825b] hover:underline shrink-0 uppercase tracking-wide">
          {a.cta}
        </button>
      </div>

      {/* <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
        <button
          onClick={prev}
          className="p-1.5 rounded-md border-2 border-[#242424] dark:border-[#474747] text-[#6b6b6b] dark:text-[#a6a6a6] hover:text-[#141414] dark:hover:text-[#f5f5f5] hover:bg-[#f0efe7] dark:hover:bg-[#242424] shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={next}
          className="p-1.5 rounded-md border-2 border-[#242424] dark:border-[#474747] text-[#6b6b6b] dark:text-[#a6a6a6] hover:text-[#141414] dark:hover:text-[#f5f5f5] hover:bg-[#f0efe7] dark:hover:bg-[#242424] shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div> */}

      <div className="flex justify-center gap-2 mt-4">
        {announcements.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full border-2 border-[#242424] dark:border-[#474747] transition-colors ${
              i === current
                ? "bg-[#2b825b] dark:bg-[#2b825b]"
                : "bg-[#f0f0f0] dark:bg-[#242424]"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default AnnouncementSlider;
