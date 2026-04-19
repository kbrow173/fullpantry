import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  /** Whether to use the full-height content area with scroll */
  scrollable?: boolean;
}

/**
 * Standard page wrapper. Provides consistent padding and max-width.
 * Use this as the root wrapper in every page component.
 */
export function PageShell({ children, className, scrollable = true }: PageShellProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-fp-bg",
        scrollable && "overflow-y-auto",
        className
      )}
    >
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-8 md:px-6 md:pt-8 lg:px-8 lg:pt-10 animate-fade-in-up">
        {children}
      </div>
    </div>
  );
}
