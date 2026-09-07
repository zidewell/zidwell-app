import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function updateInvoiceTotals(invoice: any, paidAmountNaira: number) {
  try {
    const paidAmount = paidAmountNaira;
    const targetQty = Number(invoice.target_quantity || 1);
    const totalAmount = Number(invoice.total_amount || 0);
    const currentPaidAmount = Number(invoice.paid_amount || 0);
    const currentPaidQty = Number(invoice.paid_quantity || 0);

    let newPaidAmount = currentPaidAmount + paidAmount;
    let newPaidQuantity = currentPaidQty;
    let newStatus = invoice.status;

    if (invoice.allow_multiple_payments) {
      const quantityPaidSoFar = Math.floor(newPaidAmount / totalAmount);
      if (quantityPaidSoFar > currentPaidQty) {
        newPaidQuantity = quantityPaidSoFar;
      }
      if (newPaidQuantity >= targetQty) {
        newStatus = "paid";
      } else if (newPaidQuantity > 0 || newPaidAmount > 0) {
        newStatus = "partially_paid";
      }
    } else {
      if (newPaidAmount >= totalAmount) {
        newStatus = "paid";
      } else if (newPaidAmount > 0) {
        newStatus = "partially_paid";
      }
    }

    const updateData: any = {
      paid_amount: newPaidAmount,
      paid_quantity: newPaidQuantity,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === "paid") {
      updateData.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", invoice.id);

    if (updateError) {
      console.error("Failed to update invoice:", updateError);
      throw updateError;
    }

    return { newPaidAmount, newPaidQuantity, newStatus };
  } catch (error) {
    console.error("Error in updateInvoiceTotals:", error);
    throw error;
  }
}  