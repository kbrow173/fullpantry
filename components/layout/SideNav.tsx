"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, Calendar, Package, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/recipes",   label: "Recipes",   icon: ChefHat,      match: (p: string) => p.startsWith("/recipes") },
  { href: "/planner",   label: "Planner",   icon: Calendar,     match: (p: string) => p.startsWith("/planner") },
  { href: "/pantry",    label: "Pantry",    icon: Package,      match: (p: string) => p.startsWith("/pantry") },
  { href: "/groceries", label: "Groceries", icon: ShoppingCart, match: (p: string) => p.startsWith("/groceries") },
] as const;

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-fp-surface border-r border-fp-border z-40">
      {/* Wordmark */}
      <div className="px-6 pt-8 pb-6 border-b border-fp-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-fp-accent flex items-center justify-center flex-shrink-0">
            <ChefHat size={15} className="text-white" strokeWidth={2} />
          </div>
          <span className="font-display font-bold text-lg text-fp-text leading-none">FullPantry</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Main navigation">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const isActive = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150",
                isActive
                  ? "bg-fp-accent/10 text-fp-accent"
                  : "text-fp-text-secondary hover:bg-fp-surface-2 hover:text-fp-text"
              )}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.25 : 1.75}
                className="flex-shrink-0"
              />
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-fp-accent" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 pb-6 pt-4 border-t border-fp-border">
        <p className="text-[10px] text-fp-text-muted font-medium tracking-wide uppercase">Your Kitchen</p>
      </div>
    </aside>
  );
}
