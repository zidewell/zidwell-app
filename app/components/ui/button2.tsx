
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#f4c600] text-[#01402e] border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600] hover:shadow-[6px_6px_0px_#01402e] dark:hover:shadow-[6px_6px_0px_#f4c600] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-1 active:translate-y-1",
        destructive:
          "bg-red-500 text-white border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600] hover:shadow-[6px_6px_0px_#01402e] dark:hover:shadow-[6px_6px_0px_#f4c600] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-1 active:translate-y-1",
        outline:
          "border-2 border-[#01402e] dark:border-[#f7f0e5] bg-[#f7f0e5] dark:bg-[#01402e] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600] hover:shadow-[6px_6px_0px_#01402e] dark:hover:shadow-[6px_6px_0px_#f4c600] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-1 active:translate-y-1",
        secondary:
          "bg-[#f7f0e5] dark:bg-[#01402e] text-[#01402e] dark:text-[#f7f0e5] border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600] hover:shadow-[6px_6px_0px_#01402e] dark:hover:shadow-[6px_6px_0px_#f4c600] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-1 active:translate-y-1",
        ghost: "hover:bg-[#f4c600]/10 hover:text-[#01402e] dark:hover:text-[#f4c600]",
        link: "text-[#f4c600] underline-offset-4 hover:underline",
        hero: "bg-[#f4c600] text-[#01402e] border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600] hover:shadow-[6px_6px_0px_#01402e] dark:hover:shadow-[6px_6px_0px_#f4c600] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-1 active:translate-y-1 text-base",
        heroOutline: "bg-[#f7f0e5] dark:bg-[#01402e] text-[#01402e] dark:text-[#f7f0e5] border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600] hover:shadow-[6px_6px_0px_#01402e] dark:hover:shadow-[6px_6px_0px_#f4c600] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-1 active:translate-y-1 text-base",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button2 = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button2.displayName = "Button";

export { Button2, buttonVariants };
