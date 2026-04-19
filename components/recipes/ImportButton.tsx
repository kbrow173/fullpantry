"use client";

import { useState } from "react";
import { Import } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImportModal } from "@/components/recipes/ImportModal";

interface ImportButtonProps {
  /** "button" = outlined button (used in header), "link" = text link (used in empty state) */
  variant?: "button" | "link";
}

export function ImportButton({ variant = "button" }: ImportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "button" ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
        >
          <Import size={15} />
          Import URL
        </Button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-fp-accent hover:underline underline-offset-2 transition-colors"
        >
          import from a URL
        </button>
      )}

      {open && <ImportModal onClose={() => setOpen(false)} />}
    </>
  );
}
