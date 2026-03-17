// components/DashboardFooter.tsx
"use client";

import { usePathname } from "next/navigation";

export default function DashboardFooter() {
  const pathname = usePathname();

  // Only show on dashboard routes
  if (!pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <div className="lg:ml-64 bg-white border-t border-gray-200">
      <div className="p-5">
        <div className="md:max-w-6xl md:mx-auto">
          <footer className="py-6 text-center">
            <p className="text-sm text-gray-600">
              <span className="text-[#2b825b]">Zidwell Finance</span> ©2025
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Created by Zidwell Technologies in collaboration with banking
              partners licensed by the Central Bank of Nigeria (CBN)
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
