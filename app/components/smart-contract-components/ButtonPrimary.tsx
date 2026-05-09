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
      className={`bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) shadow-sm ${className}`}
    >
      {children}
    </Button>
  );
};

export default ButtonPrimary;
