// app/components/smart-contract/Icon.tsx
import React from "react";

interface IconProps {
  children: React.ReactNode;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ children, className }) => {
  return (
    <div
      className={`w-12 h-12 rounded-full bg-[var(--color-accent-yellow)]/10 flex items-center justify-center ${className}`}
    >
      {children}
    </div>
  );
};

export default Icon;