import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { itemId } = await params;
  try {
    const body = await req.json() as {
      is_checked?: boolean;
      quantity?: number | null;
      unit?: string | null;
      name?: string;
      notes?: string | null;
    };

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("grocery_items")
      .update(body)
      .eq("id", itemId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { itemId } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("grocery_items").delete().eq("id", itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
