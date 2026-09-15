// app/api/payment-page/update/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh } from "@/lib/auth-check-api";
import { normalizeVariants } from "@/lib/payment-page/normalize";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ─── AUTH ───
    const authResult = await isAuthenticatedWithRefresh(req);
    const { user, newTokens } = authResult;

    if (!user) {
      return NextResponse.json(
        { error: "Please login to update payment page", logout: true },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("Updating page:", id, body);

    const {
      title,
      description,
      coverImage,
      logo,
      productImages,
      priceType,
      price,
      installmentCount,
      metadata,
      isPublished,
    } = body;

    // ─── VALIDATION ───
    if (!title && isPublished === undefined) {
      return NextResponse.json(
        { error: "Title or isPublished is required" },
        { status: 400 }
      );
    }

    // ─── CHECK EXISTING PAGE ───
    const { data: existingPage, error: checkError } = await supabase
      .from("payment_pages")
      .select("user_id, metadata, page_type, price_type, installment_count, price")
      .eq("id", id)
      .single();

    if (checkError || !existingPage) {
      return NextResponse.json(
        { error: "Payment page not found" },
        { status: 404 }
      );
    }

    if (existingPage.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ─── PREPARE UPDATE DATA ───
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || "";
    if (coverImage !== undefined) updateData.cover_image = coverImage || null;
    if (logo !== undefined) updateData.logo = logo || null;
    if (productImages !== undefined)
      updateData.product_images = productImages || [];
    if (priceType !== undefined) updateData.price_type = priceType;
    if (price !== undefined) updateData.price = price || 0;
    if (isPublished !== undefined) updateData.is_published = isPublished;

    // Compute the effective priceType / installmentCount for installment state
    const effectivePriceType = priceType ?? existingPage.price_type;
    const effectivePageType = existingPage.page_type;
    const effectiveInstallmentCount =
      installmentCount !== undefined
        ? installmentCount
        : existingPage.installment_count;
    const effectivePrice =
      price !== undefined ? Number(price) : Number(existingPage.price) || 0;

    // ─── INSTALLMENT COUNT HANDLING ───
    if (effectivePriceType === "installment" && effectiveInstallmentCount) {
      updateData.installment_count = Number(effectiveInstallmentCount);
    } else if (priceType === "fixed") {
      // Reset installment_count when switching away from installment mode
      updateData.installment_count = null;
    }

    // ─── METADATA MERGE + INSTALLMENT STATE ───
    if (metadata !== undefined) {
      const existingMetadata = existingPage.metadata || {};

      const updatedMetadata: any = {
        ...existingMetadata,
        ...metadata,
        // Preserve virtual account if it exists
        virtual_account: existingMetadata.virtual_account,
      };

      // Preserve school-specific arrays explicitly (students, feeBreakdown, etc.)
      if (existingPage.page_type === "school") {
        if (existingMetadata.students && !metadata.students) {
          updatedMetadata.students = existingMetadata.students;
        }
        if (existingMetadata.feeBreakdown && !metadata.feeBreakdown) {
          updatedMetadata.feeBreakdown = existingMetadata.feeBreakdown;
        }
        if (existingMetadata.className && !metadata.className) {
          updatedMetadata.className = existingMetadata.className;
        }
      }

      // ─── PRESERVE INSTALLMENT STATE ───
      // The installmentState is populated by webhooks. Never wipe it on update.
      if (existingMetadata.installmentState) {
        updatedMetadata.installmentState = existingMetadata.installmentState;
      }

      // ─── RE-COMPUTE INSTALLMENT METADATA WHEN CHANGING PLAN ───
      if (
        effectivePriceType === "installment" &&
        effectiveInstallmentCount &&
        Number(effectiveInstallmentCount) > 1 &&
        effectivePageType !== "donation"
      ) {
        const count = Number(effectiveInstallmentCount);
        const totalAmount = effectivePrice;
        const perInstallment = totalAmount / count;

        updatedMetadata.installmentCount = count;
        updatedMetadata.installmentAmount =
          Math.round(perInstallment * 100) / 100;
        updatedMetadata.installmentPeriod =
          metadata?.installmentPeriod ||
          existingMetadata.installmentPeriod ||
          "monthly";
        updatedMetadata.totalAmount = totalAmount;

        // Initialize the state map if it doesn't exist
        if (!updatedMetadata.installmentState) {
          updatedMetadata.installmentState = {};
        }
      } else if (effectivePriceType === "fixed") {
        // Switching back to fixed — clean up installment-only fields
        delete updatedMetadata.installmentCount;
        delete updatedMetadata.installmentAmount;
        delete updatedMetadata.installmentPeriod;
        // KEEP totalAmount for historical reference if payments exist
        if (
          !updatedMetadata.installmentState ||
          Object.keys(updatedMetadata.installmentState).length === 0
        ) {
          delete updatedMetadata.totalAmount;
          delete updatedMetadata.installmentState;
        }
      }

      // ✅ NORMALIZE VARIANT STOCK + PRICE (physical products)
      // Ensures `stock: 0` / null / "" becomes `null` (unlimited) and
      // any invalid price becomes 0 (buyer falls back to page price).
      if (
        existingPage.page_type === "physical" &&
        Array.isArray(updatedMetadata.variants) &&
        updatedMetadata.variants.length > 0
      ) {
        updatedMetadata.variants = normalizeVariants(
          updatedMetadata.variants
        );
      }

      updateData.metadata = updatedMetadata;
    } else if (
      // If metadata isn't sent, but priceType/installmentCount changed, still update metadata
      priceType !== undefined ||
      installmentCount !== undefined ||
      price !== undefined
    ) {
      const existingMetadata = existingPage.metadata || {};
      const updatedMetadata: any = { ...existingMetadata };

      if (existingMetadata.installmentState) {
        updatedMetadata.installmentState = existingMetadata.installmentState;
      }

      if (
        effectivePriceType === "installment" &&
        effectiveInstallmentCount &&
        Number(effectiveInstallmentCount) > 1 &&
        effectivePageType !== "donation"
      ) {
        const count = Number(effectiveInstallmentCount);
        const totalAmount = effectivePrice;
        const perInstallment = totalAmount / count;

        updatedMetadata.installmentCount = count;
        updatedMetadata.installmentAmount =
          Math.round(perInstallment * 100) / 100;
        updatedMetadata.installmentPeriod =
          existingMetadata.installmentPeriod || "monthly";
        updatedMetadata.totalAmount = totalAmount;

        if (!updatedMetadata.installmentState) {
          updatedMetadata.installmentState = {};
        }
      } else if (effectivePriceType === "fixed") {
        delete updatedMetadata.installmentCount;
        delete updatedMetadata.installmentAmount;
        delete updatedMetadata.installmentPeriod;
      }

      // ✅ NORMALIZE VARIANT STOCK + PRICE (physical products)
      if (
        existingPage.page_type === "physical" &&
        Array.isArray(updatedMetadata.variants) &&
        updatedMetadata.variants.length > 0
      ) {
        updatedMetadata.variants = normalizeVariants(
          updatedMetadata.variants
        );
      }

      updateData.metadata = updatedMetadata;
    }

    // ─── APPLY UPDATE ───
    const { data: page, error: updateError } = await supabase
      .from("payment_pages")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating page:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log("✅ Page updated successfully:", page.id);

    const responseData = {
      success: true,
      message: "Payment page updated successfully!",
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        description: page.description,
        coverImage: page.cover_image,
        logo: page.logo,
        productImages: page.product_images,
        priceType: page.price_type,
        price: page.price,
        installmentCount: page.installment_count,
        feeMode: page.fee_mode,
        pageType: page.page_type,
        metadata: page.metadata,
        isPublished: page.is_published,
      },
    };

    if (newTokens) {
      return NextResponse.json(responseData);
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Update page error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}