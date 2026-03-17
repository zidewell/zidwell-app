"use client";

import { FileText, Receipt, BookOpen } from "lucide-react";

const actions = [
  { title: "Invoice", icon: FileText },
  { title: "Receipt", icon: Receipt },
  { title: "Journal", icon: BookOpen },
];

const MobileBottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#ffffff] dark:bg-[#171717] border-t-2 border-[#242424] dark:border-[#474747]">
      <div className="flex items-center justify-around py-3">
        {actions.map((a) => (
          <button
            key={a.title}
            className="flex flex-col items-center gap-1.5 px-5 py-2 text-[#6b6b6b] dark:text-[#a6a6a6] hover:text-[#2b825b] dark:hover:text-[#2b825b] transition-colors"
          >
            <a.icon className="w-5 h-5" />
            <span className="text-xs  font-bold uppercase tracking-wide">
              {a.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileBottomNav;
