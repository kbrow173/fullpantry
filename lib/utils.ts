/**
 * FullPantry — Shared Utilities
 */

// ─── Class Name Merging ────────────────────────────────────
// Lightweight cn() without clsx/tailwind-merge dependency
// Supports nested arrays for conditional class groups
type ClassValue = string | undefined | null | false | 0 | ClassValue[];

export function cn(...classes: ClassValue[]): string {
  return classes
    .flat(Infinity as 1)
    .filter(Boolean)
    .join(" ");
}

// ─── Date Utilities ────────────────────────────────────

/** Returns ISO date string (YYYY-MM-DD) using LOCAL date components to avoid UTC timezone shift */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Returns the Sunday of the week containing the given date */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns array of 7 ISO date strings starting from the given Sunday */
export function getWeekDates(weekStart: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return toISODate(d);
  });
}

/** Format: "April 14" */
export function formatMonthDay(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

/** Format: "Mon", "Tue", etc. */
export function formatShortDay(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

/** Format: "Monday" */
export function formatFullDay(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

/** Format: "Apr 14 – Apr 20" for a week range */
export function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const start = weekStart.toLocaleDateString("en-US", opts);
  const end = weekEnd.toLocaleDateString("en-US", opts);
  return `${start} – ${end}`;
}

/** Returns "Today", "Yesterday", "Apr 10", etc. */
export function formatRelativeDate(isoDate: string): string {
  const today = toISODate(new Date());
  const yesterday = toISODate(new Date(Date.now() - 86400000));
  if (isoDate === today) return "Today";
  if (isoDate === yesterday) return "Yesterday";
  return formatMonthDay(isoDate);
}

/** Days since a date (positive = in the past) */
export function daysSince(isoDate: string): number {
  const then = new Date(isoDate + "T00:00:00").getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.floor((now - then) / 86400000);
}

// ─── Number & Unit Utilities ────────────────────────────────────

/** Converts a decimal to a fraction string: 0.5 → "½", 0.25 → "¼", 0.75 → "¾" */
export function decimalToFraction(decimal: number): string {
  const fractions: [number, string][] = [
    [1, "1"],
    [0.875, "⅞"],
    [0.75, "¾"],
    [0.667, "⅔"],
    [0.625, "⅝"],
    [0.5, "½"],
    [0.375, "⅜"],
    [0.333, "⅓"],
    [0.25, "¼"],
    [0.125, "⅛"],
  ];

  const whole = Math.floor(decimal);
  const remainder = decimal - whole;

  if (remainder < 0.05) return whole > 0 ? String(whole) : "";
  if (remainder > 0.95) return String(whole + 1);

  // Find nearest fraction
  const [, frac] = fractions.reduce((best, curr) =>
    Math.abs(curr[0] - remainder) < Math.abs(best[0] - remainder) ? curr : best
  );

  return whole > 0 ? `${whole}${frac}` : frac;
}

/** Format quantity for display: 1.5 → "1½", 0.333 → "⅓" */
export function formatQuantity(quantity: number | null): string {
  if (quantity === null) return "";
  return decimalToFraction(quantity);
}

/** Format time in minutes to human-readable: 90 → "1 hr 30 min", 45 → "45 min" */
export function formatTime(minutes: number | null): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + "…";
}

// ─── String Utilities ────────────────────────────────────

/** Capitalize first letter: "breakfast" → "Breakfast" */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Slug to readable: "side-dish" → "Side Dish" */
export function slugToLabel(slug: string): string {
  return slug.split("-").map(capitalize).join(" ");
}
