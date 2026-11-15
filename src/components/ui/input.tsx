import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-9.5 w-full rounded-lg border border-border/80 bg-background px-3 text-sm transition-all shadow-subtle placeholder:text-muted-foreground/70 focus-visible:border-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20 disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-sm leading-relaxed transition-all shadow-subtle placeholder:text-muted-foreground/70 focus-visible:border-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20 disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
