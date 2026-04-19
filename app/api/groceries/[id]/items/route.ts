import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { categorizeIngredient } from "@/lib/grocery";
import type { GroceryCategory } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await req.json() as {
      name?: string;
      quantity?: number | null;
      unit?: string | null;
      category?: GroceryCategory | null;
      notes?: string | null;
    };

    const name = body.name?.trim();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("grocery_items")
      .insert({
        grocery_list_id: id,
        name,
        quantity: body.quantity ?? null,
        unit: body.unit?.trim() || null,
        category: body.category ?? categorizeIngredient(name),
        is_checked: false,
        notes: body.notes?.trim() || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}
