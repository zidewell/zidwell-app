// app/api/deduct-funds/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticated } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const user = await isAuthenticated(req);

  if (!user) {
    return NextResponse.json(
      { error: "Please login to access this feature" },
      { status: 401 },
    );
  }

  try {
    const body = await req.json();
    let {
      userId,
      isInvoiceCreation = false,
      isReceiptCreation = false,
      isContractCreation = false,
      isBookkeepingAccess = false,
      isTaxCalculatorAccess = false,
      isTaxFilingAccess = false,
      include_lawyer_signature = false,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 },
      );
    }

    if (user.id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 },
      );
    }

    // Fetch user data with usage counts
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select(
        `
        subscription_tier, 
        subscription_expires_at,
        invoices_used_lifetime,
        receipts_used_lifetime,
        contracts_used_lifetime,
        invoice_lifetime_limit,
        receipt_lifetime_limit,
        contract_lifetime_limit
      `,
      )
      .eq("id", userId)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json(
        { error: fetchError?.message || "User not found" },
        { status: 404 },
      );
    }

    // Check subscription status
    const isFree = userData.subscription_tier === "free";
    const isZidLite = userData.subscription_tier === "zidlite";
    const isGrowth = userData.subscription_tier === "growth";
    const isPremium = userData.subscription_tier === "premium" || 
                      userData.subscription_tier === "elite";

    // ============ INVOICE CREATION ============
    if (isInvoiceCreation) {
      // Free tier - use lifetime limits
      if (isFree) {
        const lifetimeUsed = userData.invoices_used_lifetime || 0;
        const lifetimeLimit = userData.invoice_lifetime_limit || 5;
        
        if (lifetimeUsed < lifetimeLimit) {
          // Free invoice (within lifetime limit)
          await supabase
            .from("users")
            .update({
              invoices_used_lifetime: lifetimeUsed + 1,
            })
            .eq("id", userId);

          return NextResponse.json({
            success: true,
            message: "Invoice created successfully",
            usedLifetime: lifetimeUsed + 1,
            limit: lifetimeLimit,
            remaining: lifetimeLimit - (lifetimeUsed + 1),
            tier: 'free',
          });
        } else {
          // Free tier user exhausted lifetime limit - upgrade required
          return NextResponse.json(
            { 
              error: "You've used all your free lifetime invoices. Please upgrade to continue creating invoices.",
              requiresUpgrade: true,
              requiredTier: "growth",
              usedLifetime: lifetimeUsed,
              limit: lifetimeLimit,
            },
            { status: 403 },
          );
        }
      } 
      
      // ZidLite tier - 10 lifetime invoices
      else if (isZidLite) {
        const lifetimeUsed = userData.invoices_used_lifetime || 0;
        const lifetimeLimit = 10;
        
        if (lifetimeUsed < lifetimeLimit) {
          // ZidLite invoice (within limit)
          await supabase
            .from("users")
            .update({
              invoices_used_lifetime: lifetimeUsed + 1,
            })
            .eq("id", userId);

          return NextResponse.json({
            success: true,
            message: "Invoice created successfully",
            usedLifetime: lifetimeUsed + 1,
            limit: lifetimeLimit,
            remaining: lifetimeLimit - (lifetimeUsed + 1),
            tier: 'zidlite',
          });
        } else {
          // ZidLite user exhausted limit - upgrade required
          return NextResponse.json(
            { 
              error: "You've used all your ZidLite invoices. Please upgrade to continue creating unlimited invoices.",
              requiresUpgrade: true,
              requiredTier: "growth",
              usedLifetime: lifetimeUsed,
              limit: lifetimeLimit,
            },
            { status: 403 },
          );
        }
      }
      
      // Paid tiers - unlimited invoices (just track count)
      else if (isGrowth || isPremium) {
        await supabase
          .from("users")
          .update({
            invoices_used_lifetime: (userData.invoices_used_lifetime || 0) + 1,
          })
          .eq("id", userId);

        return NextResponse.json({
          success: true,
          message: "Invoice created successfully",
          tier: userData.subscription_tier,
          unlimited: true,
        });
      }
    }

    // ============ RECEIPT CREATION ============
    if (isReceiptCreation) {
      // Free tier - use lifetime limits
      if (isFree) {
        const lifetimeUsed = userData.receipts_used_lifetime || 0;
        const lifetimeLimit = userData.receipt_lifetime_limit || 5;
        
        if (lifetimeUsed < lifetimeLimit) {
          // Free receipt (within lifetime limit)
          await supabase
            .from("users")
            .update({
              receipts_used_lifetime: lifetimeUsed + 1,
            })
            .eq("id", userId);

          return NextResponse.json({
            success: true,
            message: "Receipt created",
            usedLifetime: lifetimeUsed + 1,
            limit: lifetimeLimit,
            remaining: lifetimeLimit - (lifetimeUsed + 1),
            tier: 'free',
          });
        } else {
          // Free tier user exhausted lifetime limit - upgrade required
          return NextResponse.json(
            { 
              error: "You've used all your free lifetime receipts. Please upgrade to continue creating receipts.",
              requiresUpgrade: true,
              requiredTier: "growth",
              usedLifetime: lifetimeUsed,
              limit: lifetimeLimit,
            },
            { status: 403 },
          );
        }
      } 
      
      // ZidLite tier - 10 lifetime receipts
      else if (isZidLite) {
        const lifetimeUsed = userData.receipts_used_lifetime || 0;
        const lifetimeLimit = 10;
        
        if (lifetimeUsed < lifetimeLimit) {
          await supabase
            .from("users")
            .update({
              receipts_used_lifetime: lifetimeUsed + 1,
            })
            .eq("id", userId);

          return NextResponse.json({
            success: true,
            message: "Receipt created",
            usedLifetime: lifetimeUsed + 1,
            limit: lifetimeLimit,
            remaining: lifetimeLimit - (lifetimeUsed + 1),
            tier: 'zidlite',
          });
        } else {
          return NextResponse.json(
            { 
              error: "You've used all your ZidLite receipts. Please upgrade to continue creating unlimited receipts.",
              requiresUpgrade: true,
              requiredTier: "growth",
              usedLifetime: lifetimeUsed,
              limit: lifetimeLimit,
            },
            { status: 403 },
          );
        }
      }
      
      // Paid tiers - unlimited receipts
      else if (isGrowth || isPremium) {
        await supabase
          .from("users")
          .update({
            receipts_used_lifetime: (userData.receipts_used_lifetime || 0) + 1,
          })
          .eq("id", userId);

        return NextResponse.json({
          success: true,
          message: "Receipt created",
          tier: userData.subscription_tier,
          unlimited: true,
        });
      }
    }

    // ============ CONTRACT CREATION ============
    if (isContractCreation) {
      // Free tier - 1 free contract
      if (isFree) {
        const lifetimeUsed = userData.contracts_used_lifetime || 0;
        const lifetimeLimit = userData.contract_lifetime_limit || 1;
        
        if (lifetimeUsed < lifetimeLimit) {
          // Free contract (within lifetime limit)
          await supabase
            .from("users")
            .update({
              contracts_used_lifetime: lifetimeUsed + 1,
            })
            .eq("id", userId);

          return NextResponse.json({
            success: true,
            message: include_lawyer_signature ? "Contract with lawyer signature created" : "Contract created",
            usedLifetime: lifetimeUsed + 1,
            limit: lifetimeLimit,
            remaining: lifetimeLimit - (lifetimeUsed + 1),
            tier: 'free',
            lawyer_signature: include_lawyer_signature,
          });
        } else {
          // Free tier user exhausted lifetime limit - upgrade required
          return NextResponse.json(
            { 
              error: "You've used your free lifetime contract. Please upgrade to continue creating contracts.",
              requiresUpgrade: true,
              requiredTier: "growth",
              usedLifetime: lifetimeUsed,
              limit: lifetimeLimit,
            },
            { status: 403 },
          );
        }
      } 
      
      // ZidLite tier - 2 contracts
      else if (isZidLite) {
        const lifetimeUsed = userData.contracts_used_lifetime || 0;
        const lifetimeLimit = 2;
        
        if (lifetimeUsed < lifetimeLimit) {
          await supabase
            .from("users")
            .update({
              contracts_used_lifetime: lifetimeUsed + 1,
            })
            .eq("id", userId);

          return NextResponse.json({
            success: true,
            message: include_lawyer_signature ? "Contract with lawyer signature created" : "Contract created",
            usedLifetime: lifetimeUsed + 1,
            limit: lifetimeLimit,
            remaining: lifetimeLimit - (lifetimeUsed + 1),
            tier: 'zidlite',
            lawyer_signature: include_lawyer_signature,
          });
        } else {
          return NextResponse.json(
            { 
              error: "You've used all your ZidLite contracts. Please upgrade to continue creating more contracts.",
              requiresUpgrade: true,
              requiredTier: "growth",
              usedLifetime: lifetimeUsed,
              limit: lifetimeLimit,
            },
            { status: 403 },
          );
        }
      }
      
      // Growth tier - 5 contracts
      else if (isGrowth) {
        const lifetimeUsed = userData.contracts_used_lifetime || 0;
        const lifetimeLimit = 5;
        
        if (lifetimeUsed < lifetimeLimit) {
          await supabase
            .from("users")
            .update({
              contracts_used_lifetime: lifetimeUsed + 1,
            })
            .eq("id", userId);

          return NextResponse.json({
            success: true,
            message: include_lawyer_signature ? "Contract with lawyer signature created" : "Contract created",
            usedLifetime: lifetimeUsed + 1,
            limit: lifetimeLimit,
            remaining: lifetimeLimit - (lifetimeUsed + 1),
            tier: 'growth',
            lawyer_signature: include_lawyer_signature,
          });
        } else {
          // Growth tier exhausted lifetime limit - upgrade to premium required
          return NextResponse.json(
            { 
              error: "You've used all your included contracts. Please upgrade to Premium for unlimited contracts.",
              requiresUpgrade: true,
              requiredTier: "premium",
              usedLifetime: lifetimeUsed,
              limit: lifetimeLimit,
            },
            { status: 403 },
          );
        }
      } 
      
      // Premium/Elite - unlimited contracts
      else if (isPremium) {
        await supabase
          .from("users")
          .update({
            contracts_used_lifetime: (userData.contracts_used_lifetime || 0) + 1,
          })
          .eq("id", userId);

        return NextResponse.json({
          success: true,
          message: include_lawyer_signature ? "Contract with lawyer signature created" : "Contract created",
          tier: userData.subscription_tier,
          unlimited: true,
          lawyer_signature: include_lawyer_signature,
        });
      }
    }

    // ============ BOOKKEEPING ACCESS ============
    if (isBookkeepingAccess) {
      // Check for active trial first
      const { data: activeTrial } = await supabase
        .from("user_trials")
        .select("*")
        .eq("user_id", userId)
        .eq("feature_key", "bookkeeping_access")
        .eq("status", "active")
        .maybeSingle();

      if (activeTrial) {
        const trialEndsAt = new Date(activeTrial.ends_at);
        if (trialEndsAt > new Date()) {
          return NextResponse.json({
            success: true,
            message: "Bookkeeping access granted (trial)",
            isTrial: true,
            trialEndsAt: trialEndsAt,
            daysRemaining: Math.ceil(
              (trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
            ),
          });
        }
      }

      // Check subscription access
      if (isGrowth || isPremium) {
        return NextResponse.json({
          success: true,
          message: "Bookkeeping access granted",
          includedInPlan: true,
          tier: userData.subscription_tier,
        });
      }

      // No trial and not subscribed - offer trial or upgrade
      return NextResponse.json(
        {
          error: "Bookkeeping requires Growth plan or higher",
          requiredTier: "growth",
          upgradeRequired: true,
          canStartTrial: true,
          trialDays: 14,
        },
        { status: 403 },
      );
    }

    // ============ TAX CALCULATOR ACCESS ============
    if (isTaxCalculatorAccess) {
      if (isGrowth || isPremium) {
        return NextResponse.json({
          success: true,
          message: "Tax calculator access granted",
          includedInPlan: true,
        });
      }

      return NextResponse.json(
        {
          error: "Tax calculator requires Growth plan or higher",
          requiredTier: "growth",
          upgradeRequired: true,
        },
        { status: 403 },
      );
    }

    // ============ TAX FILING ACCESS ============
    if (isTaxFilingAccess) {
      if (isPremium) {
        return NextResponse.json({
          success: true,
          message: "Tax filing support granted",
          includedInPlan: true,
        });
      }

      return NextResponse.json(
        {
          error: "Tax filing requires Premium plan or higher",
          requiredTier: "premium",
          upgradeRequired: true,
        },
        { status: 403 },
      );
    }

    // If no feature matched, return error
    return NextResponse.json(
      { error: "Invalid request - no feature specified" },
      { status: 400 },
    );

  } catch (err: any) {
    console.error("❌ Feature Access Error:", err.message);
    return NextResponse.json(
      { error: err.message || "Unexpected server error" },
      { status: 500 },
    );
  }
}