import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-subtle",
        secondary:
          "border border-border/80 bg-background text-foreground shadow-subtle hover:bg-muted/70 hover:border-border",
        ghost: "hover:bg-muted/70 text-foreground",
        danger:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600",
        outline:
          "border border-border/80 bg-transparent text-foreground hover:bg-muted/50",
      },
      size: {
        default: "h-9.5 px-3.5 py-2",
        sm: "h-8 min-h-8 px-2.5 text-xs rounded-md",
        lg: "h-11 px-5 text-sm rounded-lg",
        icon: "size-9 min-h-9 p-0 rounded-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
});
Button.displayName = "Button";
