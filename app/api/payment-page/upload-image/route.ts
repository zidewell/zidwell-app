// app/api/payment-page/upload-image/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // Check authentication
    const { user, newTokens } = await isAuthenticatedWithRefresh(request as any);
    
    if (!user) {
      const response = NextResponse.json({ error: "Please login", logout: true }, { status: 401 });
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    const { image, type } = await request.json();

    if (!image || !type) {
      return NextResponse.json(
        { error: "Image and type are required" },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Determine file extension
    const matches = image.match(/^data:image\/(\w+);base64,/);
    const extension = matches ? matches[1] : "jpg";
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const filename = `${user.id}/${type}/${timestamp}-${randomString}.${extension}`;

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from("payment-page-images")
      .upload(filename, imageBuffer, {
        contentType: `image/${extension}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("payment-page-images")
      .getPublicUrl(filename);

    const responseData = {
      success: true,
      url: urlData.publicUrl,
      message: "Image uploaded successfully",
    };

    const response = NextResponse.json(responseData);
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return response;
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}