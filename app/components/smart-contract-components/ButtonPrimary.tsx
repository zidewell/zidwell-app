// app/components/smart-contract/ButtonPrimary.tsx
import React from "react";
import { Button } from "../ui/button";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const ButtonPrimary = ({ children, className = "", ...props }: ButtonProps) => {
  return (
    <Button
      {...props}
      className={`bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)] shadow-sm ${className}`}
    >
      {children}
    </Button>
  );
};

export default ButtonPrimary;