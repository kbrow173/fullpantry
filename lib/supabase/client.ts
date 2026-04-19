import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 * Use in Client Components ('use client').
 * Creates a new instance per call — safe to call multiple times.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
