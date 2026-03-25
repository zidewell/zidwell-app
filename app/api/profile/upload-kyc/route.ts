// app/api/kyc/route.ts
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
    const nin = formData.get("nin") as string;

    if (!userId || userId !== user.id) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 403 });
    }

    const idCard = formData.get("idCard") as File | null;
    const utilityBill = formData.get("utilityBill") as File | null;

    let idCardUrl = null;
    if (idCard) {
      const { data, error } = await supabase.storage
        .from("kyc-files")
        .upload(`id-cards/${userId}-${idCard.name}`, idCard, {
          upsert: true,
          contentType: idCard.type,
        });
      if (error) throw error;
      idCardUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/kyc-files/${data.path}`;
    }

    let utilityBillUrl = null;
    if (utilityBill) {
      const { data, error } = await supabase.storage
        .from("kyc-files")
        .upload(`utility-bills/${userId}-${utilityBill.name}`, utilityBill, {
          upsert: true,
          contentType: utilityBill.type,
        });
      if (error) throw error;
      utilityBillUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/kyc-files/${data.path}`;
    }

    const { error: kycError } = await supabase.from("kyc").upsert(
      {
        user_id: userId,
        nin,
        id_card_url: idCardUrl,
        utility_bill_url: utilityBillUrl,
        status: "pending",
      },
      { onConflict: "user_id" }
    );

    if (kycError) throw kycError;

    const responseData = { success: true, message: "KYC submitted successfully ✅" };
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("KYC upload error:", error);
    return NextResponse.json({ error: "Failed to upload KYC" }, { status: 500 });
  }
}