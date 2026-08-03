// app/onboarding/components/Stepper.tsx
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: string;
  label: string;
}

export default function Stepper({
  steps,
  current,
}: {
  steps: Step[];
  current: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, idx) => {
        const isCurrent = idx === current;
        const isCompleted = idx < current;
        const isNotLast = idx < steps.length - 1;

        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all",
                isCurrent
                  ? "bg-yellow-400 text-black"
                  : isCompleted
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              )}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                isCurrent
                  ? "text-gray-900 dark:text-gray-100"
                  : isCompleted
                  ? "text-gray-500 dark:text-gray-400"
                  : "text-gray-400 dark:text-gray-500"
              )}
            >
              {step.label}
            </span>
            {isNotLast && (
              <div
                className={cn(
                  "h-0.5 w-6",
                  isCompleted ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
