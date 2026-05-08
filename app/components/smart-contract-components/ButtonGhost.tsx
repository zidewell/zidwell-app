// app/components/smart-contract/ButtonGhost.tsx
import React from "react";
import { Button } from "../ui/button";

const ButtonGhost: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <Button className={`border border-[var(--border-color)] text-sm bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] ${className}`}>
    {children}
  </Button>
);

export default ButtonGhost;