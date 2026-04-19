"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, Calendar, Package, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/recipes",
    label: "Recipes",
    icon: ChefHat,
    match: (path: string) => path.startsWith("/recipes"),
  },
  {
    href: "/planner",
    label: "Planner",
    icon: Calendar,
    match: (path: string) => path.startsWith("/planner"),
  },
  {
    href: "/pantry",
    label: "Pantry",
    icon: Package,
    match: (path: string) => path.startsWith("/pantry"),
  },
  {
    href: "/groceries",
    label: "Groceries",
    icon: ShoppingCart,
    match: (path: string) => path.startsWith("/groceries"),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Frosted glass bar */}
      <div
        className="bg-fp-surface/90 border-t border-fp-border"
        style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
      >
        <div className="flex items-stretch h-[68px] max-w-2xl mx-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
            const isActive = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 relative",
                  "transition-colors duration-200",
                  isActive
                    ? "text-fp-accent"
                    : "text-fp-text-muted hover:text-fp-text-secondary"
                )}
              >
                {/* Active dot indicator — subtle, not a bar */}
                {isActive && (
                  <span className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-fp-accent" />
                )}

                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.25 : 1.75}
                  className={cn(
                    "transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                />
                <span
                  className={cn(
                    "text-[9px] font-semibold leading-none tracking-[0.06em] uppercase",
                    isActive ? "text-fp-accent" : "text-fp-text-muted"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
