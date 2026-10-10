// app/api/payment-page/details/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;

    // ─── AUTH ───
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);

    if (!user) {
      const response = NextResponse.json(
        { error: "Please login to view page details", logout: true },
        { status: 401 }
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ─── GET PAGE (must belong to user) ───
    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (pageError || !page) {
      return NextResponse.json(
        { error: "Payment page not found" },
        { status: 404 }
      );
    }

    // ─── GET COMPLETED PAYMENTS ───
    const { data: payments, error: paymentsError } = await supabase
      .from("payment_page_payments")
      .select("*")
      .eq("payment_page_id", id)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
    }

    const totalAmount =
      payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

    // ─── EXTRACT LINK CONFIG (for link pages) ───
    let linkConfig = null;
    if (page.page_type === "link" && page.metadata?.linkConfig) {
      linkConfig = page.metadata.linkConfig;
    }

    // ─── NORMALIZE METADATA (ensure installmentState exists) ───
    // The metadata carries:
    //   - installmentCount, installmentAmount, installmentPeriod, totalAmount
    //   - installmentState: { [entityId]: { paidAmount, installmentsPaid, payments, lastPaidAt } }
    //   - page-type specific fields (students, feeBreakdown, variants, etc.)
    const normalizedMetadata: any = {
      ...(page.metadata || {}),
    };

    // Ensure installmentState is always an object (never null/undefined)
    if (
      !normalizedMetadata.installmentState ||
      typeof normalizedMetadata.installmentState !== "object"
    ) {
      normalizedMetadata.installmentState = {};
    }

    // ─── COMPUTE INSTALLMENT SUMMARY ───
    // Aggregated installment stats for the page
    let installmentSummary: any = null;
    if (
      page.price_type === "installment" &&
      page.installment_count &&
      page.installment_count > 1
    ) {
      const totalAmountForPage =
        Number(normalizedMetadata.totalAmount) || Number(page.price) || 0;
      const perInstallment =
        Number(normalizedMetadata.installmentAmount) ||
        (page.installment_count > 0
          ? totalAmountForPage / page.installment_count
          : 0);

      // Count total installments paid across all entities
      const state = normalizedMetadata.installmentState;
      let totalInstallmentsPaid = 0;
      let totalPaidAcrossEntities = 0;
      let fullyPaidEntities = 0;
      let partiallyPaidEntities = 0;

      Object.values(state).forEach((entityState: any) => {
        const paidAmount = Number(entityState?.paidAmount) || 0;
        const installmentsPaid = Number(entityState?.installmentsPaid) || 0;
        totalPaidAcrossEntities += paidAmount;
        totalInstallmentsPaid += installmentsPaid;

        if (totalAmountForPage > 0 && paidAmount >= totalAmountForPage) {
          fullyPaidEntities++;
        } else if (paidAmount > 0) {
          partiallyPaidEntities++;
        }
      });

      installmentSummary = {
        totalAmount: totalAmountForPage,
        installmentCount: page.installment_count,
        installmentAmount: Math.round(perInstallment * 100) / 100,
        period: normalizedMetadata.installmentPeriod || "monthly",
        totalInstallmentsPaid,
        totalPaidAcrossEntities,
        fullyPaidEntities,
        partiallyPaidEntities,
        remainingBalance: Math.max(
          0,
          totalAmountForPage - totalPaidAcrossEntities
        ),
      };
    }

    // ─── FORMAT PAGE RESPONSE ───
    const formattedPage = {
      id: page.id,
      title: page.title,
      slug: page.slug,
      description: page.description,
      coverImage: page.cover_image,
      logo: page.logo,
      productImages: page.product_images || [],
      priceType: page.price_type,
      price: Number(page.price) || 0,
      installmentCount: page.installment_count,
      feeMode: page.fee_mode,
      pageBalance: Number(page.page_balance) || 0,
      totalRevenue: Number(page.total_revenue) || 0,
      totalPayments: page.total_payments || 0,
      pageViews: page.page_views || 0,
      createdAt: page.created_at,
      pageType: page.page_type,
      isPublished: page.is_published,
      isActive: page.is_active,
      metadata: normalizedMetadata,
      linkConfig: linkConfig,
      installmentSummary: installmentSummary,
      recentPayments:
        payments?.slice(0, 10).map((p) => ({
          id: p.id,
          customerName: p.customer_name,
          customerEmail: p.customer_email,
          amount: Number(p.amount) || 0,
          fee: Number(p.fee) || 0,
          netAmount: Number(p.net_amount) || 0,
          paymentType: p.payment_type,
          installmentNumber: p.installment_number,
          totalInstallments: p.total_installments,
          studentName: p.student_name,
          selectedStudents: p.selected_students,
          createdAt: p.created_at,
          paidAt: p.paid_at,
        })) || [],
      paymentStats: {
        totalAmount,
        totalCount: payments?.length || 0,
      },
    };

    const responseData = {
      success: true,
      page: formattedPage,
    };

    const response = NextResponse.json(responseData);

    if (newTokens) return createAuthResponse(responseData, newTokens);
    return response;
  } catch (error: any) {
    console.error("Get page details error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}