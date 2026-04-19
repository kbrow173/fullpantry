"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ImagePlus, X, ChevronUp, ChevronDown } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { RECIPE_CATEGORIES, type RecipeCategory, type ImportedRecipe } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─── Local state types ───────────────────────────────

interface IngredientRow {
  _key: string;
  name: string;
  quantity: string;
  unit: string;
  notes: string;
}

interface InstructionRow {
  _key: string;
  text: string;
}

interface InitialData {
  id: string;
  title: string;
  description: string | null;
  category: RecipeCategory;
  servings: number;
  prep_time: number | null;
  cook_time: number | null;
  source_url: string | null;
  image_url: string | null;
  tags: string[];
  ingredients: Array<{
    id: string;
    name: string;
    quantity: number | null;
    unit: string | null;
    notes: string | null;
  }>;
  instructions: Array<{
    id: string;
    step_number: number;
    instruction: string;
  }>;
}

interface RecipeFormProps {
  initialData?: InitialData;
  /** Pre-populated data from URL import — no DB ids, not in edit mode */
  importDraft?: ImportedRecipe | null;
}

// ─── Helpers ────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2);
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h3 className="text-[10px] font-semibold tracking-[0.14em] uppercase text-fp-text-muted whitespace-nowrap">
        {label}
      </h3>
      <div className="flex-1 h-px bg-fp-border" />
    </div>
  );
}

// ─── Component ──────────────────────────────────────

export function RecipeForm({ initialData, importDraft }: RecipeFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // isEditing only true when we have an existing DB record (has an id)
  const isEditing = !!initialData?.id;

  // Seed values: edit mode uses initialData, import mode uses importDraft, otherwise blank
  const seed = initialData ?? importDraft ?? null;

  // Basic fields
  const [title, setTitle] = useState(seed?.title ?? "");
  const [description, setDescription] = useState(seed?.description ?? "");
  const [category, setCategory] = useState<RecipeCategory>(seed?.category ?? "dinner");
  const [servings, setServings] = useState(seed?.servings?.toString() ?? "4");
  const [prepTime, setPrepTime] = useState(seed?.prep_time?.toString() ?? "");
  const [cookTime, setCookTime] = useState(seed?.cook_time?.toString() ?? "");
  const [sourceUrl, setSourceUrl] = useState(seed?.source_url ?? "");
  const [tags, setTags] = useState(seed?.tags?.join(", ") ?? "");

  // Image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    seed?.image_url ?? null
  );

  // Dynamic lists — handle both InitialData (has id/step_number) and ImportedRecipe (plain objects)
  const [ingredients, setIngredients] = useState<IngredientRow[]>(() => {
    const src = initialData?.ingredients ?? importDraft?.ingredients ?? [];
    return src.length
      ? src.map((i) => ({
          _key: uid(),
          name: i.name,
          quantity: i.quantity?.toString() ?? "",
          unit: i.unit ?? "",
          notes: i.notes ?? "",
        }))
      : [{ _key: uid(), name: "", quantity: "", unit: "", notes: "" }];
  });
  const [instructions, setInstructions] = useState<InstructionRow[]>(() => {
    const src = initialData?.instructions ?? importDraft?.instructions ?? [];
    return src.length
      ? src.map((i) => ({ _key: uid(), text: i.instruction }))
      : [{ _key: uid(), text: "" }];
  });

  // UI state
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Image handling ──────────────────────────────

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ─── Ingredient handlers ─────────────────────────

  function addIngredient() {
    setIngredients((p) => [
      ...p,
      { _key: uid(), name: "", quantity: "", unit: "", notes: "" },
    ]);
  }

  function removeIngredient(key: string) {
    setIngredients((p) => p.filter((i) => i._key !== key));
  }

  function updateIngredient(key: string, field: keyof Omit<IngredientRow, "_key">, value: string) {
    setIngredients((p) =>
      p.map((i) => (i._key === key ? { ...i, [field]: value } : i))
    );
  }

  function moveIngredient(key: string, dir: -1 | 1) {
    setIngredients((p) => {
      const idx = p.findIndex((i) => i._key === key);
      if (idx < 0) return p;
      const next = idx + dir;
      if (next < 0 || next >= p.length) return p;
      const arr = [...p];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  }

  // ─── Instruction handlers ────────────────────────

  function addInstruction() {
    setInstructions((p) => [...p, { _key: uid(), text: "" }]);
  }

  function removeInstruction(key: string) {
    setInstructions((p) => p.filter((i) => i._key !== key));
  }

  function updateInstruction(key: string, value: string) {
    setInstructions((p) =>
      p.map((i) => (i._key === key ? { ...i, text: value } : i))
    );
  }

  function moveInstruction(key: string, dir: -1 | 1) {
    setInstructions((p) => {
      const idx = p.findIndex((i) => i._key === key);
      if (idx < 0) return p;
      const next = idx + dir;
      if (next < 0 || next >= p.length) return p;
      const arr = [...p];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  }

  // ─── Validation ──────────────────────────────────

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Recipe title is required.";
    const serv = parseInt(servings);
    if (!servings || isNaN(serv) || serv < 1) errs.servings = "Enter a valid number of servings.";
    if (prepTime) {
      const p = parseInt(prepTime);
      if (isNaN(p) || p < 0) errs.prepTime = "Prep time must be 0 or more.";
    }
    if (cookTime) {
      const c = parseInt(cookTime);
      if (isNaN(c) || c < 0) errs.cookTime = "Cook time must be 0 or more.";
    }
    const filledIngredients = ingredients.filter((i) => i.name.trim());
    if (filledIngredients.length === 0) errs.ingredients = "Add at least one ingredient.";
    // Validate quantity for any row that has a quantity entered (regardless of name)
    for (const ing of ingredients) {
      if (ing.quantity.trim()) {
        const q = parseFloat(ing.quantity);
        if (isNaN(q) || q < 0) {
          errs.ingredients = "One or more ingredient quantities are invalid (use a number, e.g. 1.5).";
          break;
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ─── Submit ──────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setErrors({});

    try {
      // Upload image if new file was selected
      let imageUrl: string | null = seed?.image_url ?? null;
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error((errData as { error?: string }).error ?? "Image upload failed.");
        }
        const json = await res.json();
        imageUrl = json.url as string;
      } else if (!imagePreview) {
        imageUrl = null; // image was cleared
      }

      const prep = prepTime ? parseInt(prepTime) : null;
      const cook = cookTime ? parseInt(cookTime) : null;

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        servings: parseInt(servings),
        prep_time: prep,
        cook_time: cook,
        total_time: (prep ?? 0) + (cook ?? 0) || null,
        source_url: sourceUrl.trim() || null,
        image_url: imageUrl,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        ingredients: ingredients
          .filter((i) => i.name.trim())
          .map((i) => ({
            name: i.name.trim(),
            quantity: i.quantity ? parseFloat(i.quantity) : null,
            unit: i.unit.trim() || null,
            notes: i.notes.trim() || null,
            category: null,
          })),
        instructions: instructions
          .filter((i) => i.text.trim())
          .map((i) => ({ instruction: i.text.trim() })),
      };

      const url = isEditing
        ? `/api/recipes/${initialData!.id}`
        : "/api/recipes";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to save");
      }

      router.refresh();
      if (isEditing) {
        router.push(`/recipes/${initialData!.id}`);
      } else {
        const data = await res.json();
        router.push(`/recipes/${(data as { id: string }).id}`);
      }
    } catch (err) {
      setErrors({
        submit:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  // ─── Shared input class ──────────────────────────

  const inputCls =
    "w-full px-3 py-2.5 bg-fp-surface border border-fp-border rounded-lg text-sm text-fp-text placeholder:text-fp-text-muted focus:outline-none focus:border-fp-accent transition-colors";

  // ─── Render ──────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* ── Image ── */}
      <div>
        <SectionHeader label="Photo" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="sr-only"
          id="recipe-image-upload"
        />
        {imagePreview ? (
          <div className="relative aspect-video rounded-xl overflow-hidden bg-fp-surface-2 group">
            <Image
              src={imagePreview}
              alt="Recipe preview"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 hover:bg-white text-fp-text transition-colors shadow-sm"
            >
              <X size={14} />
            </button>
            <label
              htmlFor="recipe-image-upload"
              className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/90 hover:bg-white rounded-lg text-xs font-semibold text-fp-text cursor-pointer transition-colors shadow-sm"
            >
              Change
            </label>
          </div>
        ) : (
          <label
            htmlFor="recipe-image-upload"
            className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-fp-border hover:border-fp-accent-border bg-fp-surface-2 hover:bg-fp-accent-bg cursor-pointer transition-colors group"
          >
            <ImagePlus
              size={24}
              className="text-fp-text-muted group-hover:text-fp-accent mb-2 transition-colors"
            />
            <span className="text-sm text-fp-text-secondary group-hover:text-fp-accent transition-colors font-medium">
              Add a photo
            </span>
            <span className="text-xs text-fp-text-muted mt-0.5">
              JPEG, PNG, WEBP
            </span>
          </label>
        )}
      </div>

      {/* ── Basic Info ── */}
      <div>
        <SectionHeader label="About" />
        <div className="space-y-3">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-fp-text-secondary mb-1.5">
              Recipe title <span className="text-fp-accent">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((p) => ({ ...p, title: "" }));
              }}
              placeholder="e.g. Lemon Herb Roasted Chicken"
              className={cn(inputCls, errors.title && "border-fp-error")}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-fp-error">{errors.title}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-fp-text-secondary mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as RecipeCategory)}
              className={inputCls}
            >
              {RECIPE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-fp-text-secondary mb-1.5">
              Description{" "}
              <span className="text-fp-text-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief note about this recipe…"
              rows={3}
              className={cn(inputCls, "resize-none")}
            />
          </div>
        </div>
      </div>

      {/* ── Times & Servings ── */}
      <div>
        <SectionHeader label="Times & Servings" />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-fp-text-secondary mb-1.5">
              Prep (min)
            </label>
            <input
              type="number"
              min="0"
              value={prepTime}
              onChange={(e) => { setPrepTime(e.target.value); setErrors((p) => ({ ...p, prepTime: "" })); }}
              placeholder="15"
              className={cn(inputCls, errors.prepTime && "border-fp-error")}
            />
            {errors.prepTime && (
              <p className="mt-1 text-xs text-fp-error">{errors.prepTime}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-fp-text-secondary mb-1.5">
              Cook (min)
            </label>
            <input
              type="number"
              min="0"
              value={cookTime}
              onChange={(e) => { setCookTime(e.target.value); setErrors((p) => ({ ...p, cookTime: "" })); }}
              placeholder="30"
              className={cn(inputCls, errors.cookTime && "border-fp-error")}
            />
            {errors.cookTime && (
              <p className="mt-1 text-xs text-fp-error">{errors.cookTime}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-fp-text-secondary mb-1.5">
              Servings <span className="text-fp-accent">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={servings}
              onChange={(e) => {
                setServings(e.target.value);
                setErrors((p) => ({ ...p, servings: "" }));
              }}
              placeholder="4"
              className={cn(inputCls, errors.servings && "border-fp-error")}
            />
            {errors.servings && (
              <p className="mt-1 text-xs text-fp-error">{errors.servings}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Ingredients ── */}
      <div>
        <SectionHeader label="Ingredients" />
        {errors.ingredients && (
          <p className="mb-3 text-xs text-fp-error">{errors.ingredients}</p>
        )}
        <div className="space-y-2">
          {/* Column headers */}
          <div className="grid grid-cols-[5rem_1fr_5rem_auto] gap-2 px-1">
            {["Qty", "Ingredient", "Unit", ""].map((h) => (
              <span
                key={h}
                className="text-[10px] font-semibold tracking-[0.1em] uppercase text-fp-text-muted"
              >
                {h}
              </span>
            ))}
          </div>

          {ingredients.map((ing, idx) => (
            <div key={ing._key} className="group">
              <div className="grid grid-cols-[5rem_1fr_5rem_auto] gap-2 items-center">
              <input
                type="text"
                inputMode="decimal"
                value={ing.quantity}
                onChange={(e) => updateIngredient(ing._key, "quantity", e.target.value)}
                placeholder="1½"
                className="px-2 py-2 bg-fp-surface border border-fp-border rounded-md text-sm text-fp-text placeholder:text-fp-text-muted focus:outline-none focus:border-fp-accent transition-colors text-center tabular-nums"
              />
              <input
                type="text"
                value={ing.name}
                onChange={(e) => {
                  updateIngredient(ing._key, "name", e.target.value);
                  setErrors((p) => ({ ...p, ingredients: "" }));
                }}
                placeholder="Ingredient name"
                className="px-2 py-2 bg-fp-surface border border-fp-border rounded-md text-sm text-fp-text placeholder:text-fp-text-muted focus:outline-none focus:border-fp-accent transition-colors"
              />
              <input
                type="text"
                value={ing.unit}
                onChange={(e) => updateIngredient(ing._key, "unit", e.target.value)}
                placeholder="cup"
                className="px-2 py-2 bg-fp-surface border border-fp-border rounded-md text-sm text-fp-text placeholder:text-fp-text-muted focus:outline-none focus:border-fp-accent transition-colors"
              />
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveIngredient(ing._key, -1)}
                  disabled={idx === 0}
                  className="text-fp-text-muted hover:text-fp-text disabled:opacity-20 transition-colors"
                  aria-label="Move ingredient up"
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => moveIngredient(ing._key, 1)}
                  disabled={idx === ingredients.length - 1}
                  className="text-fp-text-muted hover:text-fp-text disabled:opacity-20 transition-colors"
                  aria-label="Move ingredient down"
                >
                  <ChevronDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => removeIngredient(ing._key)}
                  disabled={ingredients.length === 1}
                  className="text-fp-text-muted hover:text-fp-error disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Remove ingredient"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              </div>
              {/* Notes field (full-width, below) */}
              <div className="pl-[calc(5rem+0.5rem)] mt-1">
                  <input
                    type="text"
                    value={ing.notes}
                    onChange={(e) => updateIngredient(ing._key, "notes", e.target.value)}
                    placeholder="Notes (e.g. finely chopped)"
                    className="w-full px-2 py-1.5 text-xs bg-transparent border-b border-fp-border text-fp-text-secondary placeholder:text-fp-text-muted focus:outline-none focus:border-fp-accent transition-colors"
                  />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addIngredient}
          className="mt-3 flex items-center gap-1.5 text-xs text-fp-accent hover:text-fp-accent-hover font-semibold transition-colors"
        >
          <Plus size={13} />
          Add ingredient
        </button>
      </div>

      {/* ── Instructions ── */}
      <div>
        <SectionHeader label="Instructions" />
        <div className="space-y-3">
          {instructions.map((inst, idx) => (
            <div key={inst._key} className="flex gap-3 items-start">
              {/* Step number */}
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-fp-accent text-white text-[11px] font-bold flex items-center justify-center mt-2.5">
                {idx + 1}
              </span>
              {/* Text area */}
              <textarea
                value={inst.text}
                onChange={(e) => updateInstruction(inst._key, e.target.value)}
                placeholder={`Step ${idx + 1}…`}
                rows={2}
                className="flex-1 px-3 py-2 bg-fp-surface border border-fp-border rounded-lg text-sm text-fp-text placeholder:text-fp-text-muted focus:outline-none focus:border-fp-accent transition-colors resize-none"
              />
              {/* Move + remove */}
              <div className="flex flex-col gap-1 pt-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => moveInstruction(inst._key, -1)}
                  disabled={idx === 0}
                  className="text-fp-text-muted hover:text-fp-text disabled:opacity-20 transition-colors"
                  aria-label="Move step up"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveInstruction(inst._key, 1)}
                  disabled={idx === instructions.length - 1}
                  className="text-fp-text-muted hover:text-fp-text disabled:opacity-20 transition-colors"
                  aria-label="Move step down"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => removeInstruction(inst._key)}
                  disabled={instructions.length === 1}
                  className="text-fp-text-muted hover:text-fp-error disabled:opacity-20 transition-colors"
                  aria-label="Remove step"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addInstruction}
          className="mt-3 flex items-center gap-1.5 text-xs text-fp-accent hover:text-fp-accent-hover font-semibold transition-colors"
        >
          <Plus size={13} />
          Add step
        </button>
      </div>

      {/* ── Optional fields ── */}
      <div>
        <SectionHeader label="Optional Details" />
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-fp-text-secondary mb-1.5">
              Tags{" "}
              <span className="text-fp-text-muted font-normal">
                (comma separated)
              </span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="quick, weeknight, chicken, italian"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-fp-text-secondary mb-1.5">
              Source URL{" "}
              <span className="text-fp-text-muted font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://www.recipesource.com/…"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* ── Error & Submit ── */}
      {errors.submit && (
        <p className="text-sm text-fp-error bg-fp-error-bg rounded-lg px-4 py-3">
          {errors.submit}
        </p>
      )}

      <div className="flex items-center gap-4 pb-4">
        <Button type="submit" variant="primary" size="md" loading={saving}>
          {isEditing ? "Save changes" : "Add to collection"}
        </Button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-fp-text-secondary hover:text-fp-text transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
