import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  variant?: "income" | "expense" | "net" | "default";
  currency?: string;
  className?: string;
}

export function SummaryCard({
  title,
  amount,
  icon: Icon,
  variant = "default",
  currency = "₦",
  className,
}: SummaryCardProps) {
  const formatAmount = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "income":
        return {
          border: "rgba(22, 163, 74, 0.2)",
          background: "rgba(22, 163, 74, 0.05)",
        };
      case "expense":
        return {
          border: "rgba(225, 29, 72, 0.2)",
          background: "rgba(225, 29, 72, 0.05)",
        };
      case "net":
        return amount >= 0
          ? {
              border: "rgba(234, 179, 8, 0.3)",
              background: "#C29307",
              textColor: "#ffffff",
            }
          : {
              border: "rgba(225, 29, 72, 0.2)",
              background: "rgba(225, 29, 72, 0.05)",
            };
      default:
        return {
          border: "#e6dfd6",
          background: "#fcfbf9",
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "income":
        return "#16a34a";
      case "expense":
        return "#e11d48";
      case "net":
        return amount >= 0 ? "#26121c" : "#e11d48";
      default:
        return "#26121c";
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case "income":
        return {
          background: "rgba(22, 163, 74, 0.1)",
          color: "#16a34a",
        };
      case "expense":
        return {
          background: "rgba(225, 29, 72, 0.1)",
          color: "#e11d48",
        };
      case "net":
        return amount >= 0
          ? {
              background: "rgba(38, 33, 28, 0.2)",
              color: "#26121c",
            }
          : {
              background: "rgba(225, 29, 72, 0.1)",
              color: "#e11d48",
            };
      default:
        return {
          background: "rgba(234, 179, 8, 0.1)",
          color: "#eab308",
        };
    }
  };

  const styles = getVariantStyles();
  const iconStyles = getIconBg();

  return (
    <div
      className={cn(
        "p-5 rounded-2xl border shadow-[0_2px_20px_-4px_rgba(38,33,28,0.08)] transition-all duration-200 hover:shadow-[0_4px_24px_-8px_rgba(38,33,28,0.1)]",
        className,
      )}
      style={{
        borderColor: typeof styles === "string" ? styles : styles.border,
        background: typeof styles === "string" ? styles : styles.background,
        color:
          typeof styles === "object" && "textColor" in styles
            ? styles.textColor
            : getTextColor(),
      }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p
            className={cn("text-sm font-medium")}
            style={{
              color:
                variant === "net" && amount >= 0
                  ? "rgba(38, 33, 28, 0.8)"
                  : "#80746e",
            }}
          >
            {title}
          </p>
          <p
            className="text-2xl font-semibold tracking-tight"
            style={{ color: getTextColor() }}
          >
            {amount < 0 && "-"}
            {currency}
            {formatAmount(amount)}
          </p>
        </div>
        <div className="p-2.5 rounded-xl" style={iconStyles}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
