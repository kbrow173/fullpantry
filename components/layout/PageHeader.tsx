import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Editorial page header.
 * Left-aligned, strong typographic hierarchy.
 * Avoids the generic "title + thin rule" template pattern.
 */
export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-8", className)}>
      <div className="flex items-start justify-between gap-4 mb-1">
        {/* Left accent + title block */}
        <div className="flex items-start gap-3">
          <div className="w-1 self-stretch rounded-full bg-fp-accent mt-1 flex-shrink-0" />
          <h1 className="text-4xl font-bold text-fp-text font-display leading-none tracking-tight">
            {title}
          </h1>
        </div>
        {action && (
          <div className="flex-shrink-0 pt-1">{action}</div>
        )}
      </div>

      {subtitle && (
        <p className="ml-4 mt-2 text-xs font-semibold tracking-[0.12em] uppercase text-fp-text-muted">
          {subtitle}
        </p>
      )}
    </header>
  );
}
