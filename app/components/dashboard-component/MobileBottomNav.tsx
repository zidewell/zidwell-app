"use client";

import { FileText, Receipt, BookOpen } from "lucide-react";

const actions = [
  { title: "Invoice", icon: FileText },
  { title: "Receipt", icon: Receipt },
  { title: "Journal", icon: BookOpen },
];

const MobileBottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-(--bg-primary) border-t-2 border-(--border-color) lg:hidden">
      <div className="flex items-center justify-around py-3">
        {actions.map((a) => (
          <button
            key={a.title}
            className="flex flex-col items-center gap-1.5 rounded-2xl px-6 py-2 text-(--text-secondary) transition-colors hover:text-(--color-accent-yellow)"
          >
            <a.icon className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-xs font-semibold">{a.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileBottomNav;