"use client";

import { LucideIcon } from "lucide-react";

interface CircleActionProps {
  label: string;
  icon: LucideIcon;
  variant?: "gold" | "green" | "neutral";
}

const CircleAction = ({ label, icon: Icon, variant = "neutral" }: CircleActionProps) => {
  const styles = {
    gold: "bg-(--color-accent-yellow) text-(--color-ink) hover:shadow-[4px_4px_0px_var(--border-color)]",
    green: "bg-[#00B64F] text-white hover:shadow-[4px_4px_0px_var(--border-color)]",
    neutral: "bg-(--bg-secondary) text-(--text-primary) border-2 border-(--border-color) hover:shadow-[4px_4px_0px_var(--border-color)]",
  }[variant];

  return (
    <button className="group flex flex-col items-center gap-3.5">
      <span
        className={`grid aspect-square w-24 place-items-center rounded-full transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-active:translate-y-0 group-active:scale-95 sm:w-28 ${styles}`}
      >
        <Icon className="h-8 w-8" strokeWidth={1.4} />
      </span>
      <span className="text-sm font-semibold tracking-tight text-(--text-primary)">{label}</span>
    </button>
  );
};

export default CircleAction;