import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PantryCategory } from "@/lib/types";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pantry_items")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name?: string;
      quantity?: number;
      unit?: string;
      category?: PantryCategory;
      purchased_date?: string | null;
      expiry_date?: string | null;
      notes?: string | null;
    };

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("pantry_items")
      .insert({
        name,
        quantity: body.quantity ?? 1,
        unit: body.unit?.trim() ?? "",
        category: body.category ?? "other",
        purchased_date: body.purchased_date ?? null,
        expiry_date: body.expiry_date ?? null,
        notes: body.notes?.trim() ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}
