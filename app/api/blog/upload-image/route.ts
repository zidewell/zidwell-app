// app/api/blog/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseBlog = createClient(
  process.env.BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ✅ FIX: Normalize MIME type
function normalizeImageMime(file: File): string {
  const declared = (file.type || "").toLowerCase();

  if (declared === "image/jpg" || declared === "image/pjpeg") {
    return "image/jpeg";
  }
  if (declared.startsWith("image/")) return declared;

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    avif: "image/avif",
    svg: "image/svg+xml",
  };
  return map[ext] || "image/jpeg";
}

// ✅ FIX: Safe extension
function safeExtension(file: File, fallback = "jpg"): string {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ext || ext.length > 5 || /[^a-z0-9]/.test(ext)) return fallback;
  return ext;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File | null;

    if (!image || image.size === 0) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const mime = normalizeImageMime(image);
    const ext = safeExtension(image, "jpg");

    console.log("📸 Uploading image:", image.name, mime, image.size);

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `featured-images/${timestamp}-${randomString}.${ext}`;

    // ✅ FIX: ArrayBuffer (not Buffer) + normalized MIME
    const arrayBuffer = await image.arrayBuffer();

    const { error: uploadError } = await supabaseBlog.storage
      .from("blog-images")
      .upload(fileName, arrayBuffer, {
        contentType: mime,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabaseBlog.storage.from("blog-images").getPublicUrl(fileName);

    console.log("✅ Public URL:", publicUrl);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}