import Link from "next/link";
import { ChefHat } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-fp-bg flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-fp-accent-bg flex items-center justify-center mx-auto mb-5">
          <ChefHat size={24} className="text-fp-accent" />
        </div>
        <p className="text-6xl font-display font-bold text-fp-border-strong mb-3">404</p>
        <h1 className="font-display text-2xl font-bold text-fp-text mb-2">Page not found</h1>
        <p className="text-sm text-fp-text-muted mb-6">
          This page doesn&apos;t exist or was moved.
        </p>
        <Link
          href="/recipes"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-fp-accent text-white text-sm font-semibold hover:bg-fp-accent-hover transition-colors"
        >
          Go to Recipes
        </Link>
      </div>
    </div>
  );
}
