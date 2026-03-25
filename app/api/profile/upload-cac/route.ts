// app/api/profile/upload-cac/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
  if (!user) {
    const response = NextResponse.json(
      { error: "Please login to access transactions", logout: true },
      { status: 401 }
    );
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const cacFile = formData.get("cacFile") as File | null;

    if (!userId || userId !== user.id) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 403 });
    }

    if (!cacFile) {
      return NextResponse.json({ error: "No CAC file uploaded" }, { status: 400 });
    }

    const { data, error: uploadError } = await supabase.storage
      .from("kyc-files")
      .upload(`cac/${userId}-${cacFile.name}`, cacFile, {
        upsert: true,
        contentType: cacFile.type,
      });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage
      .from("kyc-files")
      .getPublicUrl(data.path);

    const cacUrl = publicData.publicUrl;

    const { error: dbError } = await supabase
      .from("businesses")
      .update({ cac_file_url: cacUrl, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (dbError) throw dbError;

    const responseData = { success: true, cacUrl };
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("CAC upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload CAC", details: error.message },
      { status: 500 }
    );
  }
}