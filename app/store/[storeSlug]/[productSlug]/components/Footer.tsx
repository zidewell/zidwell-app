// app/components/store/SimpleFooter.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

interface Props {
  companyName?: string;
  logoUrl?: string | null;
  className?: string;
}

export default function SimpleFooter({
  companyName = "Zidwell",
  logoUrl = "/logo.png",
  className = "",
}: Props) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`border-t border-(--border-color) bg-(--bg-secondary) ${className}`}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6 sm:py-8">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          {logoUrl && (
            <Image
              src={logoUrl}
              alt={`${companyName} logo`}
              width={32}
              height={32}
              className="h-6 w-6 object-contain sm:h-7 sm:w-7"
            />
          )}
          <span className="text-sm font-bold uppercase tracking-tight text-(--text-primary) sm:text-base">
            {companyName}
          </span>
        </Link>

        <p className="text-xs text-(--text-secondary) sm:text-sm">
          © {currentYear} {companyName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}