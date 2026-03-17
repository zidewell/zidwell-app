
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
   const receiptId = (await params).id;


    if (!receiptId) {
      return NextResponse.json(
        { success: false, message: "Receipt ID is required" },
        { status: 400 }
      );
    }

    console.log("Fetching receipt with receipt_id:", receiptId);

    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('receipt_id', receiptId)
      .single();

    if (error) {
      console.error("Error fetching receipt:", error);
      return NextResponse.json(
        { 
          success: false, 
          message: "Receipt not found",
          error: error.message 
        },
        { status: 404 }
      );
    }

    // Parse receipt_items if it's a string
    let parsedReceipt = { ...data };
    if (typeof data.receipt_items === 'string') {
      try {
        parsedReceipt.receipt_items = JSON.parse(data.receipt_items);
      } catch (parseError) {
        console.error("Error parsing receipt_items:", parseError);
        parsedReceipt.receipt_items = [];
      }
    }

    return NextResponse.json({
      success: true,
      receipt: parsedReceipt,
    });

  } catch (error) {
    console.error("Error in GET receipt:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}