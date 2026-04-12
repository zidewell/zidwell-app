// // app/api/payment-pages/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { supabaseAdmin } from "@/lib/supabase/admin";
// import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/check-auth";
// import { getNombaToken } from "@/lib/nomba/client";

// // Helper to generate mock account for development/fallback
// function generateMockVirtualAccount(accountName: string): { accountNumber: string; bankName: string } {
//   return {
//     accountNumber: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
//     bankName: "Zidwell Bank (Test)",
//   };
// }

// // Create virtual account via Nomba
// async function createVirtualAccountWithNomba(
//   accountName: string,
//   accountRef: string,
//   customerEmail?: string,
//   customerPhone?: string
// ): Promise<{ accountNumber: string; bankName: string } | null> {
//   try {
//     const token = await getNombaToken();
    
//     if (!token) {
//       console.error("Failed to get Nomba token");
//       return null;
//     }

//     const nombaUrl = `${process.env.NOMBA_URL}/v1/accounts/virtual`;
    
//     const response = await fetch(nombaUrl, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         accountId: process.env.NOMBA_ACCOUNT_ID!,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         accountName: accountName.slice(0, 30),
//         accountRef: accountRef,
//         customerEmail: customerEmail || undefined,
//         customerPhone: customerPhone || undefined,
//         currency: "NGN",
//         metadata: {
//           source: "zidwell_payment_page",
//           created_at: new Date().toISOString(),
//         },
//       }),
//     });

//     const responseData = await response.json();

//     if (!response.ok) {
//       console.error("Nomba virtual account creation failed:", responseData);
      
//       if (process.env.NODE_ENV === "development") {
//         console.log("⚠️ Using mock virtual account for development");
//         return generateMockVirtualAccount(accountName);
//       }
//       return null;
//     }

//     const accountNumber = responseData.data?.accountNumber || 
//                          responseData.accountNumber || 
//                          responseData.virtualAccountNumber;
    
//     const bankName = responseData.data?.bankName || 
//                     responseData.bankName || 
//                     "Wema Bank";

//     if (!accountNumber) {
//       console.error("No account number in Nomba response:", responseData);
//       return null;
//     }

//     return { accountNumber, bankName };
//   } catch (error) {
//     console.error("Error creating virtual account:", error);
    
//     if (process.env.NODE_ENV === "development") {
//       return generateMockVirtualAccount(accountName);
//     }
//     return null;
//   }
// }

// // GET: Fetch all payment pages for authenticated user
// export async function GET(req: NextRequest) {
//   const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
//   if (!user) {
//     const response = NextResponse.json(
//       { error: "Please login to view payment pages", logout: true },
//       { status: 401 }
//     );
//     if (newTokens) return createAuthResponse(await response.json(), newTokens);
//     return response;
//   }

//   try {
//     const { data: pages, error } = await supabaseAdmin
//       .from("payment_pages")
//       .select("*")
//       .eq("user_id", user.id)
//       .order("created_at", { ascending: false });

//     if (error) throw error;

//     const response = NextResponse.json({ pages });
//     if (newTokens) return createAuthResponse(await response.json(), newTokens);
//     return response;
//   } catch (error) {
//     console.error("Error fetching payment pages:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch payment pages" },
//       { status: 500 }
//     );
//   }
// }

// // POST: Create a new payment page with virtual account
// export async function POST(req: NextRequest) {
//   const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
//   if (!user) {
//     const response = NextResponse.json(
//       { error: "Please login to create payment page", logout: true },
//       { status: 401 }
//     );
//     if (newTokens) return createAuthResponse(await response.json(), newTokens);
//     return response;
//   }

//   try {
//     const body = await req.json();
    
//     // Generate a unique slug if not provided
//     let slug = body.slug;
//     if (!slug) {
//       slug = body.title
//         .toLowerCase()
//         .replace(/[^a-z0-9]+/g, "-")
//         .replace(/(^-|-$)/g, "");
      
//       // Check if slug exists and add suffix if needed
//       const { data: existing } = await supabaseAdmin
//         .from("payment_pages")
//         .select("slug")
//         .eq("slug", slug)
//         .single();
      
//       if (existing) {
//         slug = `${slug}-${Date.now().toString(36)}`;
//       }
//     }

//     // Create virtual account name
//     const virtualAccountName = `Zidwell/${body.title.slice(0, 20)}/${user.id.slice(0, 8)}`;
//     const accountRef = `PP_${Date.now()}_${user.id.slice(0, 8)}`;

//     // Create virtual account via Nomba
//     const virtualAccount = await createVirtualAccountWithNomba(
//       virtualAccountName,
//       accountRef,
//       user.email,
//       body.phone
//     );

//     if (!virtualAccount) {
//       return NextResponse.json(
//         { error: "Failed to create virtual account. Please try again." },
//         { status: 500 }
//       );
//     }

//     // Prepare page data for insertion
//     const pageData = {
//       user_id: user.id,
//       title: body.title,
//       slug: slug,
//       description: body.description || "",
//       cover_image: body.coverImage,
//       logo: body.logo,
//       product_images: body.productImages || [],
//       price_type: body.priceType,
//       price: body.price || 0,
//       installment_count: body.installmentCount,
//       fee_mode: body.feeMode,
//       virtual_account_number: virtualAccount.accountNumber,
//       virtual_account_name: virtualAccountName,
//       bank_name: virtualAccount.bankName,
//       page_type: body.pageType,
//       total_revenue: 0,
//       total_payments: 0,
//       page_views: 0,
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString(),
//     };

//     // Add type-specific fields
//     if (body.pageType === "school") {
//       pageData.students = body.students || [];
//       pageData.class_name = body.className;
//       pageData.required_fields = body.requiredFields || [];
//       pageData.fee_breakdown = body.feeBreakdown || [];
//     }
    
//     if (body.pageType === "donation") {
//       pageData.suggested_amounts = body.suggestedAmounts || [];
//       pageData.show_donor_list = body.showDonorList || false;
//       pageData.allow_donor_message = body.allowDonorMessage || false;
//     }
    
//     if (body.pageType === "physical") {
//       pageData.variants = body.variants || [];
//       pageData.requires_shipping = body.requiresShipping || false;
//     }
    
//     if (body.pageType === "digital") {
//       pageData.download_url = body.downloadUrl;
//       pageData.access_link = body.accessLink;
//       pageData.email_delivery = body.emailDelivery !== false;
//     }
    
//     if (body.pageType === "services") {
//       pageData.booking_enabled = body.bookingEnabled || false;
//       pageData.customer_note_enabled = body.customerNoteEnabled !== false;
//     }
    
//     // Investment types
//     if (["real_estate", "stock", "savings", "crypto"].includes(body.pageType)) {
//       pageData.minimum_amount = body.minimumAmount;
//       pageData.expected_return = body.expectedReturn;
//       pageData.tenure = body.tenure;
//       pageData.payment_frequency = body.paymentFrequency;
//       pageData.charges = body.charges;
//       pageData.terms_and_conditions = body.termsAndConditions;
//       pageData.risk_explanation = body.riskExplanation;
//       pageData.cac_certificate = body.cacCertificate;
//       pageData.tax_clearance = body.taxClearance;
//       pageData.explainer_video = body.explainerVideo;
//       pageData.social_links = body.socialLinks || [];
//       pageData.website = body.website;
//       pageData.contact_info = body.contactInfo;
//       pageData.total_investments = 0;
//       pageData.total_participants = 0;
//     }

//     // Insert into database
//     const { data: page, error: insertError } = await supabaseAdmin
//       .from("payment_pages")
//       .insert(pageData)
//       .select()
//       .single();

//     if (insertError) {
//       console.error("Error inserting payment page:", insertError);
//       return NextResponse.json(
//         { error: "Failed to create payment page" },
//         { status: 500 }
//       );
//     }

//     const response = NextResponse.json({ 
//       success: true, 
//       page,
//       virtualAccount: {
//         accountNumber: virtualAccount.accountNumber,
//         bankName: virtualAccount.bankName
//       }
//     });
    
//     if (newTokens) return createAuthResponse(await response.json(), newTokens);
//     return response;
//   } catch (error) {
//     console.error("Error creating payment page:", error);
//     return NextResponse.json(
//       { error: "Failed to create payment page" },
//       { status: 500 }
//     );
//   }
// }

// // PUT: Update a payment page
// export async function PUT(req: NextRequest) {
//   const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
//   if (!user) {
//     const response = NextResponse.json(
//       { error: "Please login to update payment page", logout: true },
//       { status: 401 }
//     );
//     if (newTokens) return createAuthResponse(await response.json(), newTokens);
//     return response;
//   }

//   try {
//     const body = await req.json();
//     const { id, ...updates } = body;

//     if (!id) {
//       return NextResponse.json(
//         { error: "Page ID is required" },
//         { status: 400 }
//       );
//     }

//     // Verify ownership
//     const { data: existing, error: checkError } = await supabaseAdmin
//       .from("payment_pages")
//       .select("user_id")
//       .eq("id", id)
//       .single();

//     if (checkError || !existing) {
//       return NextResponse.json(
//         { error: "Payment page not found" },
//         { status: 404 }
//       );
//     }

//     if (existing.user_id !== user.id) {
//       return NextResponse.json(
//         { error: "Unauthorized to update this page" },
//         { status: 403 }
//       );
//     }

//     // Prepare update data
//     const updateData: any = {
//       updated_at: new Date().toISOString(),
//     };

//     const allowedFields = [
//       "title", "description", "cover_image", "logo", "product_images",
//       "price_type", "price", "installment_count", "fee_mode",
//       "students", "class_name", "required_fields", "fee_breakdown",
//       "suggested_amounts", "show_donor_list", "allow_donor_message",
//       "variants", "requires_shipping", "download_url", "access_link",
//       "email_delivery", "booking_enabled", "customer_note_enabled",
//       "minimum_amount", "expected_return", "tenure", "payment_frequency",
//       "charges", "terms_and_conditions", "risk_explanation",
//       "cac_certificate", "tax_clearance", "explainer_video",
//       "social_links", "website", "contact_info"
//     ];

//     for (const field of allowedFields) {
//       if (updates[field] !== undefined) {
//         updateData[field] = updates[field];
//       }
//     }

//     const { data: page, error: updateError } = await supabaseAdmin
//       .from("payment_pages")
//       .update(updateData)
//       .eq("id", id)
//       .select()
//       .single();

//     if (updateError) throw updateError;

//     const response = NextResponse.json({ success: true, page });
//     if (newTokens) return createAuthResponse(await response.json(), newTokens);
//     return response;
//   } catch (error) {
//     console.error("Error updating payment page:", error);
//     return NextResponse.json(
//       { error: "Failed to update payment page" },
//       { status: 500 }
//     );
//   }
// }

// // DELETE: Delete a payment page
// export async function DELETE(req: NextRequest) {
//   const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
//   if (!user) {
//     const response = NextResponse.json(
//       { error: "Please login to delete payment page", logout: true },
//       { status: 401 }
//     );
//     if (newTokens) return createAuthResponse(await response.json(), newTokens);
//     return response;
//   }

//   try {
//     const url = new URL(req.url);
//     const id = url.searchParams.get("id");

//     if (!id) {
//       return NextResponse.json(
//         { error: "Page ID is required" },
//         { status: 400 }
//       );
//     }

//     // Verify ownership
//     const { data: existing, error: checkError } = await supabaseAdmin
//       .from("payment_pages")
//       .select("user_id")
//       .eq("id", id)
//       .single();

//     if (checkError || !existing) {
//       return NextResponse.json(
//         { error: "Payment page not found" },
//         { status: 404 }
//       );
//     }

//     if (existing.user_id !== user.id) {
//       return NextResponse.json(
//         { error: "Unauthorized to delete this page" },
//         { status: 403 }
//       );
//     }

//     const { error: deleteError } = await supabaseAdmin
//       .from("payment_pages")
//       .delete()
//       .eq("id", id);

//     if (deleteError) throw deleteError;

//     const response = NextResponse.json({ success: true });
//     if (newTokens) return createAuthResponse(await response.json(), newTokens);
//     return response;
//   } catch (error) {
//     console.error("Error deleting payment page:", error);
//     return NextResponse.json(
//       { error: "Failed to delete payment page" },
//       { status: 500 }
//     );
//   }
// }