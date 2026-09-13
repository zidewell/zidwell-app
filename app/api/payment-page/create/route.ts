// app/api/payment-page/create/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Slugs reserved by app infrastructure ───
// A payment page slug lives at /store/[storeSlug]/[pageSlug], so it
// only collides with OTHER payment pages — not with store slugs.
// Still, we reserve a few critical words for defense in depth.
const RESERVED_PAGE_SLUGS = new Set([
  "api",
  "admin",
  "auth",
  "dashboard",
  "new",
  "create",
  "edit",
  "delete",
  "manage",
  "link",
  "settings",
  "profile",
  "account",
  "login",
  "signup",
  "register",
  "checkout",
  "cart",
  "order",
  "orders",
  "zidwell",
  "official",
  "system",
  "root",
]);

const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 50;
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

// ─── Slug cleanup — mirrors client-side slugify ───
function cleanSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/\s/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ============================================================
// SLUG VALIDATION
// Returns null if valid, or an error message string if invalid.
// ============================================================
async function validateSlugOrFail(
  rawSlug: string,
  userId: string
): Promise<string | null> {
  const slug = cleanSlug(rawSlug);

  if (slug.length < MIN_SLUG_LENGTH) {
    return `URL must be at least ${MIN_SLUG_LENGTH} characters`;
  }

  if (slug.length > MAX_SLUG_LENGTH) {
    return `URL is too long. Maximum ${MAX_SLUG_LENGTH} characters.`;
  }

  if (!SLUG_REGEX.test(slug)) {
    return "URL must start and end with a letter or number, and contain only lowercase letters, numbers, and hyphens.";
  }

  if (RESERVED_PAGE_SLUGS.has(slug)) {
    return `"${slug}" is reserved by Zidwell. Please choose a different URL.`;
  }

  // ─── UNIQUENESS CHECK ───
  // Payment pages are unique by slug globally (they share the same
  // /store/[slug] URL namespace as their parent store's slug segment).
  const { data: existingPage, error: slugCheckError } = await supabase
    .from("payment_pages")
    .select("id, user_id")
    .eq("slug", slug)
    .maybeSingle();

  if (slugCheckError && slugCheckError.code !== "PGRST116") {
    console.error("Slug uniqueness check failed:", slugCheckError);
    return "Failed to validate URL. Please try again.";
  }

  if (existingPage) {
    // If it's the same user's page, that's still a collision —
    // they can't have two pages with the same slug.
    if (existingPage.user_id === userId) {
      return "You already have a payment page with this URL. Please choose a different one.";
    }
    return "This URL is already taken. Please choose a different one.";
  }

  // Also check online_stores slug — defense in depth.
  // A store named "premium-plan" would collide with a page named
  // "premium-plan" at /store/premium-plan in the URL path.
  const { data: existingStore, error: storeCheckError } = await supabase
    .from("online_stores")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (storeCheckError && storeCheckError.code !== "PGRST116") {
    console.error("Store slug check failed:", storeCheckError);
    return "Failed to validate URL. Please try again.";
  }

  if (existingStore) {
    return "This URL is already used by a store. Please choose a different one.";
  }

  return null; // ✅ valid
}

// ============================================================
// IMAGE UPLOAD HELPER
// ============================================================
async function uploadImageToStorage(
  userId: string,
  base64Image: string,
  type: string
): Promise<string | null> {
  if (!base64Image) return null;
  if (base64Image.startsWith("http://") || base64Image.startsWith("https://")) {
    return base64Image;
  }
  if (!base64Image.startsWith("data:image")) return null;

  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");
    const matches = base64Image.match(/^data:image\/(\w+);base64,/);
    const extension = matches ? matches[1] : "jpg";
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const filename = `${userId}/${type}/${timestamp}-${randomString}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-page-images")
      .upload(filename, imageBuffer, {
        contentType: `image/${extension}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("payment-page-images")
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}

// ============================================================
// MAIN POST HANDLER
// ============================================================
export async function POST(request: Request) {
  try {
    const { user, newTokens } = await isAuthenticatedWithRefresh(request as any);

    if (!user) {
      return NextResponse.json(
        { error: "Please login to create a payment page", logout: true },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      slug,
      description,
      coverImage,
      logo,
      productImages,
      priceType,
      price,
      installmentCount,
      feeMode,
      pageType,
      metadata,
    } = body;

    console.log("📝 Creating page:", { title, pageType, slug });

    // ─── VALIDATION ───
    if (!title || !pageType || !slug) {
      return NextResponse.json(
        { error: "Title, page type, and slug are required" },
        { status: 400 }
      );
    }

    if (pageType === "link") {
      if (
        metadata?.linkConfig?.amountMode === "fixed" &&
        (!price || price <= 0)
      ) {
        return NextResponse.json(
          { error: "Amount is required for fixed amount payment link" },
          { status: 400 }
        );
      }
    }

    if (pageType === "school") {
      if (!metadata?.feeBreakdown || metadata.feeBreakdown.length === 0) {
        return NextResponse.json(
          { error: "Fee breakdown is required for school pages" },
          { status: 400 }
        );
      }
    }

    if (pageType === "physical" || pageType === "digital") {
      if (priceType !== "open" && (!price || price <= 0)) {
        return NextResponse.json(
          { error: "Price is required for this page type" },
          { status: 400 }
        );
      }
    }

    // ─── CHECK ACTIVE STORE ───
    const { data: store, error: storeError } = await supabase
      .from("online_stores")
      .select("id, is_active, activation_paid")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (storeError || !store) {
      return NextResponse.json(
        { error: "You need to create and activate a store first" },
        { status: 400 }
      );
    }

    if (!store.is_active || !store.activation_paid) {
      return NextResponse.json(
        { error: "Your store must be activated before creating payment pages" },
        { status: 400 }
      );
    }

    // ─── ✅ SERVER-SIDE SLUG VALIDATION ───
    // Never trust the client. The frontend validator is UX only.
    const cleanedSlug = cleanSlug(slug);
    const slugError = await validateSlugOrFail(cleanedSlug, user.id);

    if (slugError) {
      console.warn(`❌ Slug validation failed: "${slug}" → ${slugError}`);
      return NextResponse.json({ error: slugError }, { status: 409 });
    }

    // ─── UPLOAD IMAGES ───
    let uploadedCoverImage = null;
    if (coverImage) {
      uploadedCoverImage = await uploadImageToStorage(
        user.id,
        coverImage,
        "covers"
      );
    }

    let uploadedLogo = null;
    if (logo && logo.startsWith("data:image")) {
      uploadedLogo = await uploadImageToStorage(user.id, logo, "logos");
    } else if (
      logo &&
      (logo.startsWith("http://") || logo.startsWith("https://"))
    ) {
      uploadedLogo = logo;
    }

    const uploadedProductImages: string[] = [];
    if (productImages && productImages.length > 0) {
      for (const img of productImages) {
        if (img.startsWith("data:image")) {
          const uploadedUrl = await uploadImageToStorage(
            user.id,
            img,
            "products"
          );
          if (uploadedUrl) uploadedProductImages.push(uploadedUrl);
        } else if (img.startsWith("http://") || img.startsWith("https://")) {
          uploadedProductImages.push(img);
        }
      }
    }

    // ─── PREPARE METADATA ───
    const finalMetadata: any = { ...metadata };

    // For link pages, store the entire link configuration in metadata
    if (pageType === "link" && metadata?.linkConfig) {
      finalMetadata.pageType = "link";
      finalMetadata.linkConfig = {
        ...metadata.linkConfig,
        createdAt: new Date().toISOString(),
      };
    }

    // ─── CALCULATE FINAL PRICE ───
    let finalPrice = price || 0;
    if (pageType === "school" && finalMetadata.feeBreakdown?.length > 0) {
      finalPrice = finalMetadata.feeBreakdown.reduce(
        (sum: number, item: any) => sum + (item.amount || 0),
        0
      );
    }

    // ─── DETERMINE FINAL PRICE TYPE ───
    let finalPriceType = priceType;
    if (
      pageType === "link" &&
      metadata?.linkConfig?.amountMode === "variable"
    ) {
      finalPriceType = "open";
    }
    if (pageType === "donation") {
      finalPriceType = "open";
    }

    // ─── INSTALLMENT METADATA (ALL PAGE TYPES) ───
    // Every page type supports installments except donation/open-ended pages.
    if (
      finalPriceType === "installment" &&
      installmentCount &&
      Number(installmentCount) > 1 &&
      pageType !== "donation" &&
      finalPriceType !== "open"
    ) {
      const totalAmount = Number(finalPrice) || 0;
      const count = Number(installmentCount);
      const perInstallment = totalAmount / count;

      finalMetadata.installmentCount = count;
      finalMetadata.installmentAmount =
        Math.round(perInstallment * 100) / 100;
      finalMetadata.installmentPeriod =
        metadata?.installmentPeriod || "monthly";
      finalMetadata.totalAmount = totalAmount;
      // Populated progressively by webhook services as payments come in.
      // Keyed by entity ID (student name, variant SKU, or "default").
      finalMetadata.installmentState = {};
    }

    // ─── SAVE PAYMENT PAGE ───
    console.log("💾 Saving payment page to database...");

    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .insert({
        user_id: user.id,
        title,
        slug: cleanedSlug, // ✅ use the cleaned slug
        description: description || "",
        cover_image: uploadedCoverImage,
        logo: uploadedLogo,
        product_images: uploadedProductImages,
        price_type: finalPriceType,
        price: finalPrice,
        installment_count:
          finalPriceType === "installment" ? Number(installmentCount) : null,
        fee_mode: feeMode || "bearer",
        page_type: pageType,
        metadata: finalMetadata,
        is_published: true,
        published_at: new Date().toISOString(),
        page_balance: 0,
        total_revenue: 0,
        total_payments: 0,
        page_views: 0,
      })
      .select()
      .single();

    if (pageError) {
      console.error("❌ Error creating page:", pageError);

      // ─── HANDLE POSTGRES UNIQUE VIOLATION ───
      // Even with our pre-check, a concurrent request could have
      // grabbed the slug. Catch the DB error and return a friendly
      // 409 instead of a raw 500.
      if (
        pageError.code === "23505" ||
        pageError.message?.includes("duplicate key") ||
        pageError.message?.includes("unique constraint")
      ) {
        return NextResponse.json(
          {
            error:
              "This URL was just taken. Please choose a different one and try again.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: pageError.message }, { status: 500 });
    }

    console.log(`✅ Payment page created: ${page.id}`);

    const responseData = {
      success: true,
      message: "Payment page created successfully!",
      slug: page.slug,
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        pageType: page.page_type,
        coverImage: page.cover_image,
        priceType: page.price_type,
        price: page.price,
        installmentCount: page.installment_count,
        metadata: page.metadata,
      },
    };

    if (newTokens) {
      return NextResponse.json(responseData);
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Create page error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}