interface ToggleButtonProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  label: string;
  error: string;
}

export const ToggleButton = ({
  isActive,
  onToggle,
  label,
  error,
}: ToggleButtonProps) => (
  <div className="w-full">
    <div className="flex flex-col sm:flex-row sm:items-center md:items-end justify-between p-3 sm:p-4 border rounded-lg bg-gray-50 gap-3 sm:gap-4">
      <span className="text-xs sm:text-sm font-medium text-gray-700 flex-1">
        {label}
      </span>
      <div className="shrink-0">
        <button
          type="button"
          onClick={() => onToggle(!isActive)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#C29307] focus:ring-offset-2 ${
            isActive ? "bg-[#C29307]" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isActive ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
    {error && (
      <p className="text-red-500 text-xs sm:text-sm mt-2 px-1">{error}</p>
    )}
  </div>
);
