import React, { useRef } from "react";

interface CurrencyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  tooltip?: React.ReactNode;
}

export function CurrencyInput({ label, value, onChange, disabled, tooltip }: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    onChange(raw);
  };

  const displayValue = value
    ? `₦ ${Number(value).toLocaleString("en-NG")}`
    : "";

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#242424] dark:text-[#ffffff] flex items-center gap-1">
        {label}
        {tooltip}
      </label>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder="₦ 0"
        className="w-full px-4 py-3 rounded-lg border border-[#e6e6e6] dark:border-[#2e2e2e] bg-[#ffffff] dark:bg-[#0e0e0e] text-[#242424] dark:text-[#ffffff] placeholder:text-[#6b6b6b] dark:placeholder:text-[#b3b3b3] focus:outline-none focus:ring-2 focus:ring-[#29a36c] dark:focus:ring-[#2eb87a] transition-all disabled:opacity-40 disabled:cursor-not-allowed font-body text-sm"
      />
    </div>
  );
}
