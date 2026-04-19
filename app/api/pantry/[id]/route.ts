import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PantryCategory } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json() as {
      name?: string;
      quantity?: number;
      unit?: string;
      category?: PantryCategory;
      purchased_date?: string | null;
      expiry_date?: string | null;
      notes?: string | null;
    };

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.quantity !== undefined) updates.quantity = body.quantity;
    if (body.unit !== undefined) updates.unit = body.unit.trim();
    if (body.category !== undefined) updates.category = body.category;
    if (body.purchased_date !== undefined) updates.purchased_date = body.purchased_date;
    if (body.expiry_date !== undefined) updates.expiry_date = body.expiry_date;
    if (body.notes !== undefined) updates.notes = body.notes?.trim() ?? null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("pantry_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("pantry_items")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
