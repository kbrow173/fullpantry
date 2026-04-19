import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Editorial empty state — left-aligned, typographic, magazine-feeling.
 * Deliberately avoids the "icon-in-a-box + centered text + stacked buttons" pattern.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("py-10 px-1", className)}>
      {/* Thin divider with centered icon — editorial section break */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-px flex-1 bg-fp-border" />
        <Icon size={14} className="text-fp-border-strong" strokeWidth={1.5} />
        <div className="h-px flex-1 bg-fp-border" />
      </div>

      {/* Large italic serif — the primary message, left-aligned */}
      <h2 className="font-display italic font-bold text-4xl text-fp-text leading-tight mb-3 tracking-tight">
        {title}
      </h2>

      {description && (
        <p className="text-fp-text-secondary text-[15px] leading-relaxed mb-7 max-w-sm">
          {description}
        </p>
      )}

      {action && <div>{action}</div>}

      {/* Bottom rule */}
      <div className="mt-12 h-px bg-fp-border" />
    </div>
  );
}
