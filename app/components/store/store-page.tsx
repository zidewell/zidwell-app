// app/components/store-page.tsx
"use client";

import { ReactNode } from "react";

export function StorePage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-8 sm:px-8 lg:py-12">
      <div className="mb-8">
        <p className="eyebrow text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-[1.03] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border p-12">
      <div className="text-center">
        <p className="text-6xl mb-4">📦</p>
        <h3 className="font-display text-2xl font-bold text-foreground">Coming soon</h3>
        <p className="mt-2 text-muted-foreground">
          The {label} section is under development.
        </p>
      </div>
    </div>
  );
}