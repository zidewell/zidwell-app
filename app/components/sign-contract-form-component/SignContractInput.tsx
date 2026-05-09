// app/components/sign-contract-form-component/SignContractInput.tsx
import React from "react";

const SignContractInput: React.FC<{
  label?: string;
  placeholder?: string;
  id: string;
  value: string;
  onchange: (e: any) => void;
}> = ({ label, placeholder, id, value, onchange }) => (
  <div>
    {label && (
      <label className="block text-xs font-medium text-(--text-secondary)">
        {label}
      </label>
    )}
    <input
      id={id}
      value={value}
      onChange={onchange}
      className="mt-1 w-full border border-(--border-color) rounded px-3 py-2 text-sm bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
      style={{ outline: "none", boxShadow: "none" }}
      placeholder={placeholder}
    />
  </div>
);
export default SignContractInput;
