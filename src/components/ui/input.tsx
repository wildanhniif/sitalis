import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("h-10 w-full rounded-lg border bg-background px-3 text-sm transition-colors placeholder:text-muted-foreground disabled:opacity-50", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn("w-full rounded-lg border bg-background px-3 py-2.5 text-sm leading-6 transition-colors placeholder:text-muted-foreground disabled:opacity-50", className)} {...props} />
));
Textarea.displayName = "Textarea";
