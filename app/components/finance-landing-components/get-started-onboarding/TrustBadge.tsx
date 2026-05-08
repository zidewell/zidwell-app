import { Shield } from "lucide-react";

export function TrustBadge() {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-(--color-accent-yellow)/5 border border-(--color-accent-yellow)/10 opacity-0 animate-fade-in"
      style={{ animationDelay: "0.6s" }}
    >
      <Shield className="w-5 h-5 text-(--color-accent-yellow) shrink-0" />
      <div>
        <p className="text-sm font-medium text-gray-900">
          Your information is safe
        </p>
        <p className="text-xs text-gray-600">
          All details are confidential and reviewed only by our internal finance
          team.
        </p>
      </div>
    </div>
  );
}
