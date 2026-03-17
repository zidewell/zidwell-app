import React from "react";
import { Button } from "../ui/button";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const ButtonPrimary = ({ children, className = "", ...props }: ButtonProps) => {
  return (
    <Button
      {...props}
      className={`bg-[#2b825b] hover:bg-[#2b825b] text-white shadow-sm `}
    >
      {children}
    </Button>
  );
};

export default ButtonPrimary;
