// api/delete-invoice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    // First, check if the invoice exists
    const { data: existingInvoice, error: fetchError } = await supabase
      .from("invoices")
      .select("id, status, invoice_id")
      .eq("id", invoiceId)
      .single();

    if (fetchError || !existingInvoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Prevent deletion of paid invoices
    if (existingInvoice.status === "paid") {
      return NextResponse.json(
        { error: "Cannot delete a paid invoice" },
        { status: 400 }
      );
    }

    // Delete the invoice
    const { error: deleteError } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete invoice" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Invoice ${existingInvoice.invoice_id} deleted successfully`,
      deletedId: invoiceId,
    });
  } catch (error) {
    console.error("Delete invoice error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}