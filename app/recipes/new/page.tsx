"use client";

import { useState, useEffect } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import type { ImportedRecipe } from "@/lib/types";

export default function NewRecipePage() {
  const [importDraft, setImportDraft] = useState<ImportedRecipe | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (window.location.search.includes("from=import")) {
        const raw = sessionStorage.getItem("fp_import_draft");
        if (raw) {
          try {
            setImportDraft(JSON.parse(raw) as ImportedRecipe);
          } catch {
            // malformed JSON — show blank form
          }
          sessionStorage.removeItem("fp_import_draft");
        }
      }
    } catch {
      // sessionStorage unavailable (e.g. certain privacy modes) — show blank form
    }
    setReady(true);
  }, []);

  // Brief gate prevents initializing RecipeForm state with empty values
  // before the draft is loaded from sessionStorage
  if (!ready) return null;

  return (
    <PageShell>
      <PageHeader
        title={importDraft ? "Review & Save" : "Add Recipe"}
        subtitle={importDraft ? "Check the imported details and save" : "Build your collection"}
      />
      <RecipeForm importDraft={importDraft} />
    </PageShell>
  );
}
