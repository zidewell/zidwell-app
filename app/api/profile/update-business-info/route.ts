// app/api/profile/update-business-info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticated } from "@/lib/auth-check-api";
// import { clearBusinessDataCache } from "../../get-business-account-details/route";
// import { clearWalletBalanceCache } from "../../wallet-balance/route";
// import { clearTransactionsCache } from "../../bill-transactions/route";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const user = await isAuthenticated(req);

  if (!user) {
    return NextResponse.json(
      { error: "Please login to access transactions" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const {
      userId,
      businessName,
      businessType,
      rcNumber,
      taxId,
      businessAddress,
      businessDescription,
      cacFileBase64,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    let cacFileUrl: string | null = null;

    // ✅ Upload CAC file to Supabase Storage if provided
    if (cacFileBase64) {
      // Determine file type from base64 header
      const matches = cacFileBase64.match(/^data:([A-Za-z-+\/]+);base64,/);
      const mimeType = matches ? matches[1] : '';
      
      let fileExt = 'pdf';
      if (mimeType.includes('image')) {
        fileExt = mimeType.includes('png') ? 'png' : 'jpg';
      }

      const fileBuffer = Buffer.from(cacFileBase64.split(",")[1], "base64");
      const filePath = `cac/${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("kyc")
        .upload(filePath, fileBuffer, {
          contentType: mimeType || (fileExt === "pdf" ? "application/pdf" : "image/jpeg"),
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload CAC document" },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("kyc")
        .getPublicUrl(filePath);

      cacFileUrl = publicUrlData?.publicUrl ?? null;
    }

    // Check if business already exists
    const { data: existing, error: fetchError } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      throw fetchError;
    }

    let result;
    if (existing) {
      // Update existing business
      result = await supabase
        .from("businesses")
        .update({
          business_name: businessName,
          business_category: businessType,
          registration_number: rcNumber,
          tax_id: taxId,
          business_address: businessAddress,
          business_description: businessDescription,
          cac_file_url: cacFileUrl || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    } else {
      // Insert new business
      result = await supabase.from("businesses").insert([
        {
          user_id: userId,
          business_name: businessName,
          business_category: businessType,
          registration_number: rcNumber,
          tax_id: taxId,
          business_address: businessAddress,
          business_description: businessDescription,
          cac_file_url: cacFileUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    }

    if (result.error) {
      console.error("Insert/Update error:", result.error);
      throw result.error;
    }

    // Clear caches
    // clearBusinessDataCache(userId);
    // clearWalletBalanceCache(userId);
    // clearTransactionsCache(userId);

    return NextResponse.json({ 
      success: true, 
      cacFileUrl,
      message: "Business information updated successfully" 
    });
    
  } catch (error: any) {
    console.error("Business update error:", error);
    return NextResponse.json(
      { error: "Failed to update business info", details: error.message },
      { status: 500 }
    );
  }
}