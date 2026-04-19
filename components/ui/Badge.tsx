import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "error" | "muted";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-fp-surface-2 text-fp-text-secondary border border-fp-border",
  accent: "bg-fp-accent-bg text-fp-accent border border-fp-accent-border",
  success: "bg-fp-success-bg text-fp-success border border-fp-success/20",
  warning: "bg-fp-warning-bg text-fp-warning border border-fp-warning/20",
  error: "bg-fp-error-bg text-fp-error border border-fp-error/20",
  muted: "bg-fp-surface-3 text-fp-text-muted border border-fp-border",
};

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        "px-2 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
