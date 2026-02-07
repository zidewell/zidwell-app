import { NextRequest, NextResponse } from "next/server"; 
import { createClient } from "@supabase/supabase-js";
import { isAuthenticated } from "@/lib/auth-check-api";

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
    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const nin = formData.get("nin") as string;

    const idCard = formData.get("idCard") as File | null;
    const utilityBill = formData.get("utilityBill") as File | null;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // ✅ Upload ID Card
    let idCardUrl = null;
    if (idCard) {
      const { data, error } = await supabase.storage
        .from("kyc-files") // ✅ Correct bucket
        .upload(`id-cards/${userId}-${idCard.name}`, idCard, {
          upsert: true,
          contentType: idCard.type,
        });
      if (error) throw error;

      idCardUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/kyc-files/${data.path}`;
    }

    // ✅ Upload Utility Bill
    let utilityBillUrl = null;
    if (utilityBill) {
      const { data, error } = await supabase.storage
        .from("kyc-files") // ✅ Correct bucket
        .upload(`utility-bills/${userId}-${utilityBill.name}`, utilityBill, {
          upsert: true,
          contentType: utilityBill.type,
        });
      if (error) throw error;

      utilityBillUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/kyc-files/${data.path}`;
    }

    // ✅ Insert into kyc table
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

    return NextResponse.json({ success: true, message: "KYC submitted successfully ✅" });
  } catch (error) {
    console.error("KYC upload error:", error);
    return NextResponse.json({ error: "Failed to upload KYC" }, { status: 500 });
  }
}
