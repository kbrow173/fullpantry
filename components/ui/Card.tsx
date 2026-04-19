import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a hover state — useful for clickable cards */
  hoverable?: boolean;
  /** Removes padding for full-bleed content (e.g. image cards) */
  noPadding?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hoverable = false, noPadding = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-fp-surface rounded-xl border border-fp-border",
          "shadow-[0_1px_3px_rgba(28,26,24,0.06),0_1px_2px_rgba(28,26,24,0.04)]",
          !noPadding && "p-4",
          hoverable && [
            "cursor-pointer transition-all duration-200",
            "hover:shadow-[0_4px_12px_rgba(28,26,24,0.10),0_2px_4px_rgba(28,26,24,0.06)]",
            "hover:-translate-y-0.5 active:translate-y-0 active:shadow-none",
          ],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// ─── Card Sub-components ────────────────────────────────────

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-semibold text-fp-text font-display", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-fp-text-secondary text-sm", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-4 pt-3 border-t border-fp-border", className)} {...props}>
      {children}
    </div>
  );
}
