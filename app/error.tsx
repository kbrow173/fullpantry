"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-fp-bg flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-fp-error-bg flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={24} className="text-fp-error" />
        </div>
        <h1 className="font-display text-2xl font-bold text-fp-text mb-2">Something went wrong</h1>
        <p className="text-sm text-fp-text-muted mb-6">
          An unexpected error occurred. Your data is safe.
        </p>
        <Button variant="primary" size="md" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
