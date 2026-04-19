"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

interface ServingAdjusterProps {
  originalServings: number;
  onChange: (servings: number) => void;
}

export function ServingAdjuster({
  originalServings,
  onChange,
}: ServingAdjusterProps) {
  const [servings, setServings] = useState(originalServings);

  function adjust(delta: number) {
    const next = Math.max(1, Math.min(99, servings + delta));
    setServings(next);
    onChange(next);
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-fp-text-muted">
        Servings
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => adjust(-1)}
          disabled={servings <= 1}
          className="w-7 h-7 rounded-full border border-fp-border flex items-center justify-center text-fp-text-secondary hover:border-fp-border-strong disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Decrease servings"
        >
          <Minus size={11} strokeWidth={2} />
        </button>
        <span className="w-7 text-center font-semibold text-fp-text text-sm tabular-nums">
          {servings}
        </span>
        <button
          type="button"
          onClick={() => adjust(1)}
          disabled={servings >= 99}
          className="w-7 h-7 rounded-full border border-fp-border flex items-center justify-center text-fp-text-secondary hover:border-fp-border-strong disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Increase servings"
        >
          <Plus size={11} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
