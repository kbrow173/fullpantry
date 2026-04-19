"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Link2, Loader2, ChefHat, Clock, BookOpen, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { ImportedRecipe } from "@/lib/types";
import { RECIPE_CATEGORIES } from "@/lib/types";
import { formatTime } from "@/lib/utils";

type ModalState = "idle" | "loading" | "preview" | "error";

interface ImportModalProps {
  onClose: () => void;
}

export function ImportModal({ onClose }: ImportModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<ModalState>("idle");
  const [url, setUrl] = useState("");
  const [recipe, setRecipe] = useState<ImportedRecipe | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // Focus the URL input when modal opens
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Abort any in-flight import request when the modal unmounts
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleImport() {
    const trimmed = url.trim();
    if (!trimmed || state === "loading") return;

    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
        signal: controller.signal,
      });

      const data = await res.json() as ImportedRecipe & { error?: string };

      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? "Something went wrong. Try another URL.");
        setState("error");
        return;
      }

      setRecipe(data);
      setState("preview");
    } catch (err) {
      // Ignore abort errors — modal was closed while loading
      if (err instanceof Error && err.name === "AbortError") return;
      setErrorMsg("Couldn't connect to the server. Check your internet and try again.");
      setState("error");
    }
  }

  function handleEditAndSave() {
    if (!recipe) return;
    sessionStorage.setItem("fp_import_draft", JSON.stringify(recipe));
    router.push("/recipes/new?from=import");
    onClose();
  }

  function handleManualEntry() {
    router.push("/recipes/new");
    onClose();
  }

  function resetToIdle() {
    setState("idle");
    setErrorMsg("");
    setRecipe(null);
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  const isLoading = state === "loading";

  const categoryLabel =
    RECIPE_CATEGORIES.find((c) => c.value === recipe?.category)?.label ?? null;

  const totalTime =
    recipe ? (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Import recipe from URL"
        className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-md rounded-2xl bg-fp-surface shadow-2xl ring-1 ring-fp-border overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-fp-border">
          <div>
            <h2 className="font-serif text-xl font-semibold text-fp-text leading-tight">
              {state === "preview" ? "Recipe found" : "Import a recipe"}
            </h2>
            <p className="text-xs text-fp-text-muted mt-0.5">
              {state === "preview"
                ? "Review before adding to your collection"
                : "Paste a URL from any recipe site"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-fp-text-muted hover:text-fp-text hover:bg-fp-surface-2 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {/* ── Idle: URL input ── */}
          {state === "idle" && (
            <div className="space-y-4">
              <div className="relative">
                <Link2
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-fp-text-muted pointer-events-none"
                />
                <input
                  ref={inputRef}
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleImport()}
                  placeholder="https://www.example.com/recipe/..."
                  className="w-full pl-9 pr-3 py-2.5 bg-fp-surface-2 border border-fp-border rounded-xl text-sm text-fp-text placeholder:text-fp-text-muted focus:outline-none focus:border-fp-accent transition-colors"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleImport}
                  disabled={!url.trim() || isLoading}
                >
                  Import recipe
                </Button>
                <button
                  onClick={handleManualEntry}
                  className="text-sm text-fp-text-muted hover:text-fp-accent transition-colors"
                >
                  or add manually
                </button>
              </div>
              <p className="text-[11px] text-fp-text-muted leading-relaxed">
                Works with AllRecipes, NYT Cooking, Serious Eats, Food Network, and most major recipe sites.
              </p>
            </div>
          )}

          {/* ── Loading ── */}
          {state === "loading" && (
            <div className="py-8 flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-fp-accent-bg flex items-center justify-center">
                  <ChefHat size={24} className="text-fp-accent" />
                </div>
                <Loader2
                  size={20}
                  className="absolute -bottom-1 -right-1 text-fp-accent animate-spin"
                />
              </div>
              <div>
                <p className="font-serif text-base font-medium text-fp-text">
                  Extracting recipe…
                </p>
                <p className="text-xs text-fp-text-muted mt-1">
                  Reading the page and pulling out the good stuff.
                </p>
              </div>
            </div>
          )}

          {/* ── Preview ── */}
          {state === "preview" && recipe && (
            <div className="space-y-4">
              {/* Recipe title + category */}
              <div>
                {categoryLabel && (
                  <Badge variant="accent" className="mb-2 text-[10px] tracking-wider uppercase">
                    {categoryLabel}
                  </Badge>
                )}
                <h3 className="font-serif text-xl font-semibold text-fp-text leading-tight line-clamp-3">
                  {recipe.title}
                </h3>
                {recipe.description && (
                  <p className="text-sm text-fp-text-secondary mt-1.5 line-clamp-2">
                    {recipe.description}
                  </p>
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 py-3 border-y border-fp-border">
                {totalTime ? (
                  <div className="flex items-center gap-1.5 text-xs text-fp-text-secondary">
                    <Clock size={13} className="text-fp-accent" />
                    <span>{formatTime(totalTime)}</span>
                  </div>
                ) : null}
                <div className="flex items-center gap-1.5 text-xs text-fp-text-secondary">
                  <BookOpen size={13} className="text-fp-accent" />
                  <span>{recipe.ingredients.length} ingredients</span>
                </div>
                <div className="text-xs text-fp-text-secondary">
                  {recipe.instructions.length} steps
                </div>
                {recipe.servings && (
                  <div className="text-xs text-fp-text-secondary">
                    Serves {recipe.servings}
                  </div>
                )}
              </div>

              {/* Source URL */}
              {recipe.source_url && (() => {
                try {
                  const host = new URL(recipe.source_url).hostname.replace(/^www\./, "");
                  return (
                    <p className="text-[11px] text-fp-text-muted truncate">
                      From <span className="font-medium">{host}</span>
                    </p>
                  );
                } catch {
                  return null;
                }
              })()}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <Button variant="primary" size="md" onClick={handleEditAndSave}>
                  Edit &amp; Save
                </Button>
                <button
                  onClick={resetToIdle}
                  className="flex items-center gap-1 text-sm text-fp-text-muted hover:text-fp-text transition-colors"
                >
                  <ArrowLeft size={13} />
                  Try another URL
                </button>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {state === "error" && (
            <div className="space-y-4">
              <div className="flex gap-3 p-4 bg-fp-error-bg rounded-xl">
                <AlertCircle
                  size={18}
                  className="text-fp-error flex-shrink-0 mt-0.5"
                />
                <p className="text-sm text-fp-error leading-relaxed">{errorMsg}</p>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={resetToIdle}>
                  Try another URL
                </Button>
                <button
                  onClick={handleManualEntry}
                  className="text-sm text-fp-accent hover:underline underline-offset-2 transition-colors"
                >
                  Add manually instead
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
