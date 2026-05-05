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
          border: "rgba(0, 182, 79, 0.2)",
          background: "rgba(0, 182, 79, 0.05)",
        };
      case "expense":
        return {
          border: "rgba(239, 68, 68, 0.2)",
          background: "rgba(239, 68, 68, 0.05)",
        };
      case "net":
        return amount >= 0
          ? {
              border: "rgba(253, 192, 32, 0.3)",
              background: "var(--color-accent-yellow)",
              textColor: "var(--color-ink)",
            }
          : {
              border: "rgba(239, 68, 68, 0.2)",
              background: "rgba(239, 68, 68, 0.05)",
            };
      default:
        return {
          border: "var(--border-color)",
          background: "var(--bg-primary)",
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "income":
        return "var(--color-lemon-green)";
      case "expense":
        return "var(--destructive)";
      case "net":
        return amount >= 0 ? "var(--color-ink)" : "var(--destructive)";
      default:
        return "var(--text-primary)";
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case "income":
        return {
          background: "rgba(0, 182, 79, 0.1)",
          color: "var(--color-lemon-green)",
        };
      case "expense":
        return {
          background: "rgba(239, 68, 68, 0.1)",
          color: "var(--destructive)",
        };
      case "net":
        return amount >= 0
          ? {
              background: "rgba(25, 25, 25, 0.1)",
              color: "var(--color-ink)",
            }
          : {
              background: "rgba(239, 68, 68, 0.1)",
              color: "var(--destructive)",
            };
      default:
        return {
          background: "rgba(253, 192, 32, 0.1)",
          color: "var(--color-accent-yellow)",
        };
    }
  };

  const styles = getVariantStyles();
  const iconStyles = getIconBg();

  return (
    <div
      className={cn(
        "p-5 rounded-2xl border shadow-soft transition-all duration-200 hover:shadow-pop squircle-lg",
        className,
      )}
      style={{
        borderColor: styles.border,
        background: styles.background,
        color: "textColor" in styles ? styles.textColor : getTextColor(),
      }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p
            className={cn("text-sm font-medium")}
            style={{
              color:
                variant === "net" && amount >= 0
                  ? "rgba(25, 25, 25, 0.7)"
                  : "var(--text-secondary)",
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