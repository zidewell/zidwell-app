import { LucideIcon } from "lucide-react";

interface ProcessStepProps {
  icon: LucideIcon;
  number: number;
  title: string;
  delay?: string;
}

export function ProcessStep({
  icon: Icon,
  number,
  title,
  delay = "0s",
}: ProcessStepProps) {
  return (
    <div
      className="flex items-center gap-3 opacity-0 animate-fade-in"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-(--color-accent-yellow)/10 border border-(--color-accent-yellow)/20">
        <Icon className="w-4 h-4 text-(--color-accent-yellow)" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-(--color-accent-yellow)">
          {number}.
        </span>
        <span className="text-sm text-gray-600">{title}</span>
      </div>
    </div>
  );
}
