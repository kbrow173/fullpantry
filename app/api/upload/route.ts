import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "recipe-images";

export async function POST(request: Request) {
  const supabase = createAdminClient();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image files are allowed" },
      { status: 400 }
    );
  }

  // Ensure bucket exists — check error on creation
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find((b) => b.name === BUCKET)) {
    const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
      public: true,
    });
    // Ignore "already exists" error (race condition); surface other errors
    if (bucketError && !bucketError.message.includes("already exists")) {
      return NextResponse.json(
        { error: `Could not create storage bucket: ${bucketError.message}` },
        { status: 500 }
      );
    }
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrl });
}
