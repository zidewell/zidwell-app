import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import axios from "axios";
import bank78AccountService from "@/lib/bank78/bank78AccountService";
import { getNombaToken } from "@/lib/nomba";
import { encrypt } from "@/lib/encryption";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PREMBLY_TIMEOUT = 30000;
const NOMBA_TIMEOUT = 30000;

const BVN_REGEX = /^\d{11}$/;
const PIN_REGEX = /^\d{4}$/;

interface OnboardingBody {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  purpose: "personal" | "business";
  bvn: string;
  transactionPin: string;
  businessAddress?: string;
  mapUrl?: string;
  utilityBillName?: string;
  business?: {
    isRegistered: boolean;
    businessName: string;
    cacNumber: string | null;
    businessAddress: string;
    businessCategory: string;
    businessDescription: string;
    mapUrl: string;
    businessEmail: string;
    businessPhone: string;
    businessWebsite: string;
    businessType: string;
    businessIndustry: string;
    cacVerified: boolean;
    businessData: any;
    dateOfBirth: string;
  };
  faceMatchData?: { verified: boolean };
}

export async function POST(request: Request) {
  const createdRecords = {
    businessId: null as string | null,
    bvnSaved: false,
  };

  let body: OnboardingBody;

  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const missingFields: string[] = [];
  if (!body.userId) missingFields.push("userId");
  if (!body.fullName) missingFields.push("fullName");
  if (!body.email) missingFields.push("email");
  if (!body.bvn) missingFields.push("bvn");
  if (!body.transactionPin) missingFields.push("transactionPin");

  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        error: "Missing required fields",
        missing: missingFields,
        message: `The following fields are required: ${missingFields.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (!BVN_REGEX.test(body.bvn)) {
    return NextResponse.json(
      { 
        error: "Invalid BVN format", 
        message: "BVN must be exactly 11 digits.",
        status: "bvn_invalid_format"
      },
      { status: 400 }
    );
  }

  if (!PIN_REGEX.test(body.transactionPin)) {
    return NextResponse.json(
      { error: "Transaction PIN must be exactly 4 digits" },
      { status: 400 }
    );
  }

  try {
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("*")
      .eq("id", body.userId)
      .single();

    if (existingUserError) {
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      );
    }

    // Verify BVN with Prembly
    const bvnResult = await verifyBvnWithPrembly(body.bvn);
    const bvnData = bvnResult.data || {};

    const verificationReference =
      bvnResult.reference_id || bvnResult.verification?.reference;
    const verificationId = bvnResult.verification?.verification_id;
    const verificationStatus =
      bvnResult.verification_status ||
      (bvnResult.status ? "VERIFIED" : "FAILED");

    const nameMatches =
      bvnData.firstName &&
      body.fullName.toLowerCase().includes(bvnData.firstName.toLowerCase());
    const dobMatches =
      bvnData.dateOfBirth &&
      body.business?.dateOfBirth &&
      new Date(bvnData.dateOfBirth).getTime() ===
        new Date(body.business.dateOfBirth).getTime();

    const encryptedBvn = encrypt(body.bvn);

    const initialUpdateData = {
      bvn_data: {
        verification: {
          provider: "prembly",
          reference: verificationReference,
          id: verificationId,
          status: verificationStatus,
          timestamp: new Date().toISOString(),
        },
        request: {
          id: `BVN-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
          timestamp: new Date().toISOString(),
          ip:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          user_agent: request.headers.get("user-agent") || "unknown",
        },
        consent: {
          given: true,
          timestamp: new Date().toISOString(),
        },
        audit_trail: {
          verification_payload: bvnResult,
          request_payload: { bvn: body.bvn },
          timestamp: new Date().toISOString(),
        },
        raw_data: {
          firstName: bvnData.firstName || "",
          lastName: bvnData.lastName || "",
          middleName: bvnData.middleName || "",
          nameOnCard: bvnData.nameOnCard || "",
          dateOfBirth: bvnData.dateOfBirth || "",
          phoneNumber1: bvnData.phoneNumber1 || "",
          phoneNumber2: bvnData.phoneNumber2 || "",
          email: bvnData.email || "",
          gender: bvnData.gender || "",
          title: bvnData.title || "",
          nationality: bvnData.nationality || "",
          stateOfOrigin: bvnData.stateOfOrigin || "",
          lgaOfOrigin: bvnData.lgaOfOrigin || "",
          stateOfResidence: bvnData.stateOfResidence || "",
          lgaOfResidence: bvnData.lgaOfResidence || "",
          residentialAddress: bvnData.residentialAddress || "",
          enrollmentBank: bvnData.enrollmentBank || "",
          enrollmentBranch: bvnData.enrollmentBranch || "",
          registrationDate: bvnData.registrationDate || "",
          maritalStatus: bvnData.maritalStatus || "",
          levelOfAccount: bvnData.levelOfAccount || "",
          watchListed: bvnData.watchListed || "False",
          base64Image: bvnData.base64Image || null,
        },
        logs: [
          {
            provider: "prembly",
            type: "bvn",
            request_payload: { bvn: body.bvn },
            response_payload: bvnResult,
            status: verificationStatus,
            verified_at: new Date().toISOString(),
            reference: verificationReference,
            verification_id: verificationId,
            consent_given: true,
            consent_timestamp: new Date().toISOString(),
          },
        ],
      },
      bvn_verification: "verified",
      encrypted_bvn: encryptedBvn,
      transaction_pin: await bcrypt.hash(body.transactionPin, 10),
      pin_set: true,
      verification_step: 1,
    };

    const { error: initialUpdateError } = await supabase
      .from("users")
      .update(initialUpdateData)
      .eq("id", body.userId);

    if (initialUpdateError) {
      return NextResponse.json(
        { error: "Failed to save BVN data: " + initialUpdateError.message },
        { status: 500 }
      );
    }

    createdRecords.bvnSaved = true;

    let isRegisteredBusiness = false;
    let businessData: any = null;
    let directorVerified = false;

    // ✅ CHECK IF BUSINESS RECORD ALREADY EXISTS
    const { data: existingBusiness, error: existingBusinessError } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", body.userId)
      .single();

    if (body.purpose === "business" && body.business) {
      // ✅ If business record exists, UPDATE it instead of creating new one
      if (existingBusiness) {
        console.log('✅ Business record already exists, updating...');
        
        // Only update CAC verification if registered and has CAC number
        if (body.business.isRegistered && body.business.cacNumber && body.business.cacNumber.trim().length > 0) {
          try {
            const cacResult = await verifyCacWithPrembly(body.business.cacNumber);
            const cacData = cacResult.data?.[0] || null;

            if (cacResult.status && cacData) {
              isRegisteredBusiness = true;

              const companyActive =
                cacData.company_status === "ACTIVE" ||
                cacData.company_status === "active" ||
                cacData.company_status === "Active";

              const directors = cacData.directors || [];
              directorVerified = directors.some((director: any) => {
                const directorName = `${director.firstname || ""} ${director.otherName || ""} ${director.surname || ""}`.trim();
                return (
                  directorName.toLowerCase().includes(body.fullName.toLowerCase()) ||
                  director.firstname?.toLowerCase().includes(body.fullName.split(" ")[0]?.toLowerCase())
                );
              });

              // ✅ UPDATE existing business record
              const updateData = {
                business_name: cacData.company_name || body.business.businessName || existingBusiness.business_name,
                business_address: cacData.company_address || body.business.businessAddress || existingBusiness.business_address || "",
                cac_number: body.business.cacNumber,
                is_registered: true,
                verification_status: "verified",
                cac_data: {
                  ...cacData,
                  verification: {
                    provider: "prembly",
                    reference: cacResult.reference_id,
                    id: cacResult.verification?.verification_id,
                    status: "VERIFIED",
                    timestamp: new Date().toISOString(),
                  },
                  consent: {
                    given: true,
                    timestamp: new Date().toISOString(),
                  },
                  directors: cacData.directors || [],
                },
                business_type: cacData.entity_type || body.business.businessType || existingBusiness.business_type,
                business_category: body.business.businessCategory || existingBusiness.business_category,
                business_description: body.business.businessDescription || existingBusiness.business_description,
                business_email: body.business.businessEmail || existingBusiness.business_email,
                business_phone: body.business.businessPhone || existingBusiness.business_phone,
                business_website: body.business.businessWebsite || existingBusiness.business_website,
                map_url: body.business.mapUrl || existingBusiness.map_url,
                registration_date: cacData.registration_date || null,
                cac_verified: true,
                company_name: cacData.company_name,
                rc_number: cacData.rc_number,
                company_status: cacData.company_status,
                director_verified: directorVerified,
                authorized_representative_verified: directorVerified,
                verification_reference: cacResult.reference_id,
                verification_id: cacResult.verification?.verification_id,
                verified_at: new Date().toISOString(),
                business_kyc_completed: companyActive && directorVerified,
                updated_at: new Date().toISOString(),
              };

              const { data: updatedBusiness, error: updateError } = await supabase
                .from("businesses")
                .update(updateData)
                .eq("user_id", body.userId)
                .select()
                .single();

              if (!updateError) {
                businessData = updatedBusiness;
                createdRecords.businessId = updatedBusiness.id;
              } else {
                console.error("Failed to update business:", updateError);
                return NextResponse.json(
                  { error: "Failed to update business record: " + updateError.message },
                  { status: 500 }
                );
              }
            } else {
              // CAC verification failed - update as unregistered
              const updateData = {
                is_registered: false,
                verification_status: "pending",
                updated_at: new Date().toISOString(),
              };

              const { data: updatedBusiness, error: updateError } = await supabase
                .from("businesses")
                .update(updateData)
                .eq("user_id", body.userId)
                .select()
                .single();

              if (!updateError) {
                businessData = updatedBusiness;
                createdRecords.businessId = updatedBusiness.id;
              }
            }
          } catch (cacError: any) {
            console.error("CAC verification error:", cacError);
            isRegisteredBusiness = false;
          }
        } else if (body.business.isRegistered === false) {
          // Business not registered - update status only
          const updateData = {
            is_registered: false,
            verification_status: "pending",
            updated_at: new Date().toISOString(),
          };

          const { data: updatedBusiness, error: updateError } = await supabase
            .from("businesses")
            .update(updateData)
            .eq("user_id", body.userId)
            .select()
            .single();

          if (!updateError) {
            businessData = updatedBusiness;
            createdRecords.businessId = updatedBusiness.id;
          }
        }
      } else {
        // ✅ No business record exists - CREATE NEW
        console.log('✅ No business record exists, creating new...');
        
        if (body.business.isRegistered && body.business.cacNumber && body.business.cacNumber.trim().length > 0) {
          try {
            const cacResult = await verifyCacWithPrembly(body.business.cacNumber);
            const cacData = cacResult.data?.[0] || null;

            if (cacResult.status && cacData) {
              isRegisteredBusiness = true;

              const companyActive =
                cacData.company_status === "ACTIVE" ||
                cacData.company_status === "active" ||
                cacData.company_status === "Active";

              const directors = cacData.directors || [];
              directorVerified = directors.some((director: any) => {
                const directorName = `${director.firstname || ""} ${director.otherName || ""} ${director.surname || ""}`.trim();
                return (
                  directorName.toLowerCase().includes(body.fullName.toLowerCase()) ||
                  director.firstname?.toLowerCase().includes(body.fullName.split(" ")[0]?.toLowerCase())
                );
              });

              const businessInsert = {
                user_id: body.userId,
                business_name: cacData.company_name || body.business.businessName,
                business_address: cacData.company_address || body.business.businessAddress || "",
                cac_number: body.business.cacNumber,
                is_registered: true,
                verification_status: "verified",
                cac_data: {
                  ...cacData,
                  verification: {
                    provider: "prembly",
                    reference: cacResult.reference_id,
                    id: cacResult.verification?.verification_id,
                    status: "VERIFIED",
                    timestamp: new Date().toISOString(),
                  },
                  consent: {
                    given: true,
                    timestamp: new Date().toISOString(),
                  },
                  directors: cacData.directors || [],
                },
                business_type: cacData.entity_type || body.business.businessType,
                business_category: body.business.businessCategory || "",
                business_description: body.business.businessDescription || "",
                business_email: body.business.businessEmail || "",
                business_phone: body.business.businessPhone || "",
                business_website: body.business.businessWebsite || "",
                map_url: body.business.mapUrl || "",
                registration_date: cacData.registration_date || null,
                cac_verified: true,
                company_name: cacData.company_name,
                rc_number: cacData.rc_number,
                company_status: cacData.company_status,
                director_verified: directorVerified,
                authorized_representative_verified: directorVerified,
                verification_reference: cacResult.reference_id,
                verification_id: cacResult.verification?.verification_id,
                verified_at: new Date().toISOString(),
                business_kyc_completed: companyActive && directorVerified,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              const { data: bizData, error: bizError } = await supabase
                .from("businesses")
                .insert(businessInsert)
                .select()
                .single();

              if (!bizError) {
                businessData = bizData;
                createdRecords.businessId = bizData.id;
              } else {
                await rollbackBvnData(body.userId);
                return NextResponse.json(
                  { error: "Failed to create business record: " + bizError.message },
                  { status: 500 }
                );
              }
            } else {
              // CAC verification failed - create unregistered
              isRegisteredBusiness = false;
              businessData = await createUnregisteredBusiness(
                body.userId,
                body.business
              );
              if (businessData) createdRecords.businessId = businessData.id;
            }
          } catch (cacError: any) {
            console.error("CAC verification error:", cacError);
            isRegisteredBusiness = false;
            businessData = await createUnregisteredBusiness(
              body.userId,
              body.business
            );
            if (businessData) createdRecords.businessId = businessData.id;
          }
        } else {
          // Unregistered business
          isRegisteredBusiness = false;
          businessData = await createUnregisteredBusiness(
            body.userId,
            body.business
          );
          if (businessData) createdRecords.businessId = businessData.id;
        }
      }
    }

    let bank78Accounts: any = null;

    // ✅ CORRECTED LOGIC:
    // - Personal accounts: Create ONLY Personal Bank78 account
    // - Business registered: Create ONLY Business Bank78 account
    // - Business unregistered: Use Nomba
    if (body.purpose === "personal") {
      try {
        bank78Accounts = await bank78AccountService.createUserAccounts(
          body.userId
        );
      } catch (accountError: any) {
        console.error("Bank78 account creation error:", accountError);
        await rollbackAll(createdRecords, body.userId);
        return NextResponse.json(
          {
            error: "Account creation failed",
            message: accountError.message,
            details: "Please ensure your BVN is valid and try again.",
            status: "bank78_error"
          },
          { status: 500 }
        );
      }
    } else if (body.purpose === "business" && isRegisteredBusiness) {
      try {
        bank78Accounts = await bank78AccountService.createUserAccounts(
          body.userId
        );
      } catch (accountError: any) {
        console.error("Bank78 business account creation error:", accountError);
        await rollbackAll(createdRecords, body.userId);
        return NextResponse.json(
          {
            error: "Business account creation failed",
            message: accountError.message,
            details: "Please ensure your BVN is valid and try again.",
            status: "bank78_error"
          },
          { status: 500 }
        );
      }
    } else {
      // Unregistered business → Use Nomba
      try {
        await createNombaWallet(body.userId, existingUser);
      } catch (nombaError: any) {
        await rollbackAll(createdRecords, body.userId);
        return NextResponse.json(
          {
            error: "Nomba account creation failed",
            message: nombaError.message,
            status: "nomba_error",
          },
          { status: 500 }
        );
      }
    }

    const finalUpdateData = {
      verification_step: 6,
      identity_verified: true,
      kyc_level: isRegisteredBusiness ? "business_verified" : "personal_verified",
      verified_at: new Date().toISOString(),
      verification_provider: "prembly",
      verification_reference: verificationReference,
      verification_id: verificationId,
      verification_status: verificationStatus,
      face_match_verified: !!body.faceMatchData?.verified,
      dob_verified: dobMatches,
      name_verified: nameMatches,
      verification_completed: true,
      onboarding_completed: true,
      onboarding_step: 6,
      ...(body.phone && { phone: body.phone }),
    };

    // ✅ Add Bank78 account fields if they exist
    if (bank78Accounts?.personalAccount) {
      Object.assign(finalUpdateData, {
        bank78_verified: true,
        bank78_personal_account_number: bank78Accounts.personalAccount.account_number,
        bank78_personal_account_name: bank78Accounts.personalAccount.account_name,
        bank78_personal_bank_name: bank78Accounts.personalAccount.bank_name,
        bank78_personal_account_id: bank78Accounts.personalAccount.account_id,
        bank_account_number: bank78Accounts.personalAccount.account_number,
        bank_account_name: bank78Accounts.personalAccount.account_name,
        bank_name: bank78Accounts.personalAccount.bank_name,
        wallet_id: bank78Accounts.personalAccount.account_id,
        primary_provider: "bank78",
        wallet_provider: "bank78",
      });
    }

    if (bank78Accounts?.businessAccount) {
      Object.assign(finalUpdateData, {
        bank78_verified: true,
        bank78_business_account_number: bank78Accounts.businessAccount.account_number,
        bank78_business_account_name: bank78Accounts.businessAccount.account_name,
        bank78_business_bank_name: bank78Accounts.businessAccount.bank_name,
        bank78_business_account_id: bank78Accounts.businessAccount.account_id,
        primary_provider: "bank78",
        wallet_provider: "bank78",
      });
    }

    // Update user and fetch the complete updated profile
    const { data: updatedUser, error: finalUpdateError } = await supabase
      .from("users")
      .update(finalUpdateData)
      .eq("id", body.userId)
      .select()
      .single();

    if (finalUpdateError) {
      await rollbackAll(createdRecords, body.userId);
      return NextResponse.json(
        { error: "Failed to finalize verification: " + finalUpdateError.message },
        { status: 500 }
      );
    }

    // Build the safe user profile for frontend
    const safeProfile = {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.full_name || body.fullName,
      full_name: updatedUser.full_name || body.fullName,
      first_name: updatedUser.first_name || "",
      last_name: updatedUser.last_name || "",
      phone: updatedUser.phone || body.phone || "",
      bvn_verification: "verified",
      identity_verified: true,
      kyc_level: isRegisteredBusiness ? "business_verified" : "personal_verified",
      verification_completed: true,
      onboarding_completed: true,
      bank78_verified: !!bank78Accounts?.personalAccount || !!bank78Accounts?.businessAccount,
      purpose: body.purpose,
      verification_step: 6,
      onboarding_step: 6,
      // Bank78 fields
      bank78_personal_account_number: bank78Accounts?.personalAccount?.account_number || "",
      bank78_personal_account_name: bank78Accounts?.personalAccount?.account_name || "",
      bank78_personal_bank_name: bank78Accounts?.personalAccount?.bank_name || "",
      bank78_personal_account_id: bank78Accounts?.personalAccount?.account_id || "",
      bank78_business_account_number: bank78Accounts?.businessAccount?.account_number || "",
      bank78_business_account_name: bank78Accounts?.businessAccount?.account_name || "",
      bank78_business_bank_name: bank78Accounts?.businessAccount?.bank_name || "",
      bank78_business_account_id: bank78Accounts?.businessAccount?.account_id || "",
      // Bank fields for compatibility
      bank_account_number: bank78Accounts?.personalAccount?.account_number || updatedUser.bank_account_number || "",
      bank_account_name: bank78Accounts?.personalAccount?.account_name || updatedUser.bank_account_name || "",
      bank_name: bank78Accounts?.personalAccount?.bank_name || updatedUser.bank_name || "",
      wallet_id: bank78Accounts?.personalAccount?.account_id || updatedUser.wallet_id || "",
      primary_provider: bank78Accounts ? "bank78" : "nomba",
      wallet_provider: bank78Accounts ? "bank78" : "nomba",
      // Verification fields
      verified_at: new Date().toISOString(),
      verification_provider: "prembly",
      verification_reference: verificationReference,
      verification_id: verificationId,
      verification_status: verificationStatus,
      face_match_verified: !!body.faceMatchData?.verified,
      dob_verified: dobMatches,
      name_verified: nameMatches,
      // Subscription
      subscription_tier: updatedUser.subscription_tier || "free",
      subscription_expires_at: updatedUser.subscription_expires_at || null,
      // Other fields
      created_at: updatedUser.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: updatedUser.last_login || new Date().toISOString(),
      wallet_balance: updatedUser.wallet_balance || 0,
      zidcoin_balance: updatedUser.zidcoin_balance || 0,
      referral_code: updatedUser.referral_code || "",
      referred_by: updatedUser.referred_by || null,
      is_blocked: updatedUser.is_blocked || false,
      email_verified: updatedUser.email_verified || false,
      country: updatedUser.country || "Nigeria",
      admin_role: updatedUser.admin_role || "",
    };

    const responseData = {
      success: true,
      message: "Verification complete and account activated",
      user: safeProfile,
      // business: businessData,
      wallet_type: bank78Accounts ? "bank78" : "nomba",
      verification_summary: {
        identity_verified: true,
        kyc_level: isRegisteredBusiness ? "business_verified" : "personal_verified",
        verified_at: new Date().toISOString(),
        verification_provider: "prembly",
        verification_reference: verificationReference,
        verification_id: verificationId,
        verification_status: "VERIFIED",
        face_match_verified: !!body.faceMatchData?.verified,
        name_verified: nameMatches,
        dob_verified: dobMatches,
        business_verified: isRegisteredBusiness,
        cac_verified: isRegisteredBusiness,
        director_verified: directorVerified,
        bvn_validated: true,
        onboarding_completed: true,
      },
    };

    if (bank78Accounts && bank78Accounts.personalAccount) {
      responseData.bank78 = {
        personal: {
          accountNumber: bank78Accounts.personalAccount.account_number || "",
          accountName: bank78Accounts.personalAccount.account_name || "",
          bankName: bank78Accounts.personalAccount.bank_name || "Bank78",
          accountId: bank78Accounts.personalAccount.account_id || "",
        },
      };

      if (bank78Accounts.businessAccount) {
        responseData.bank78.business = {
          accountNumber: bank78Accounts.businessAccount.account_number || "",
          accountName: bank78Accounts.businessAccount.account_name || "",
          bankName: bank78Accounts.businessAccount.bank_name || "Bank78",
          accountId: bank78Accounts.businessAccount.account_id || "",
        };
      }
    }

    if (updatedUser?.wallet_id) {
      responseData.nomba = {
        accountNumber: updatedUser.bank_account_number || updatedUser.wallet_id,
        accountName: updatedUser.bank_account_name || updatedUser.full_name,
        bankName: updatedUser.bank_name || "Wema Bank",
      };
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    await rollbackAll(createdRecords, body?.userId);

    return NextResponse.json(
      {
        error: "Onboarding failed",
        message: error.message || "An unexpected error occurred",
        status: "onboarding_failed"
      },
      { status: 500 }
    );
  }
}

// Verify BVN with Prembly
async function verifyBvnWithPrembly(bvn: string) {
  const response = await axios.post(
    "https://api.prembly.com/verification/bvn_validation",
    { number: bvn },
    {
      headers: {
        accept: "application/json",
        "x-api-key": process.env.PREMBLY_SECRET_KEY,
        "content-type": "application/json",
      },
      timeout: PREMBLY_TIMEOUT,
    }
  );
  return response.data;
}

// Verify CAC with Prembly
async function verifyCacWithPrembly(rcNumber: string) {
  const response = await axios.post(
    "https://api.prembly.com/verification/cac",
    { rc_number: rcNumber, company_type: "RC" },
    {
      headers: {
        accept: "application/json",
        "x-api-key": process.env.PREMBLY_SECRET_KEY,
        "content-type": "application/json",
      },
      timeout: PREMBLY_TIMEOUT,
    }
  );
  return response.data;
}

async function rollbackBvnData(userId: string) {
  try {
    await supabase
      .from("users")
      .update({
        bvn_data: null,
        bvn_verification: "not_submitted",
        encrypted_bvn: null,
        transaction_pin: null,
        pin_set: false,
        verification_step: 0,
      })
      .eq("id", userId);
  } catch (error) {
    console.error("Rollback error:", error);
  }
}

async function rollbackAll(
  createdRecords: { businessId: string | null; bvnSaved: boolean },
  userId: string
) {
  if (createdRecords.businessId) {
    try {
      await supabase
        .from("businesses")
        .delete()
        .eq("id", createdRecords.businessId);
    } catch (rollbackError) {
      console.error("Rollback error:", rollbackError);
    }
  }

  if (createdRecords.bvnSaved && userId) {
    await rollbackBvnData(userId);
  }
}

async function createUnregisteredBusiness(userId: string, businessData: any) {
  try {
    const businessInsert = {
      user_id: userId,
      business_name: businessData.businessName || "Unnamed Business",
      business_address: businessData.businessAddress || "",
      cac_number: null,
      is_registered: false,
      verification_status: "pending",
      business_type: businessData.businessType || "",
      business_category: businessData.businessCategory || "",
      business_description: businessData.businessDescription || "",
      business_email: businessData.businessEmail || "",
      business_phone: businessData.businessPhone || "",
      business_website: businessData.businessWebsite || "",
      map_url: businessData.mapUrl || "",
      business_kyc_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: bizData, error: bizError } = await supabase
      .from("businesses")
      .insert(businessInsert)
      .select()
      .single();

    if (bizError) {
      console.error("Unregistered business insert error:", bizError);
      return null;
    }

    return bizData;
  } catch (error) {
    console.error("Failed to create unregistered business:", error);
    return null;
  }
}

async function createNombaWallet(userId: string, userData: any) {
  try {
    const token = await getNombaToken();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NOMBA_TIMEOUT);

    const response = await fetch(
      `${process.env.NOMBA_URL}/v1/accounts/virtual`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: process.env.NOMBA_ACCOUNT_ID,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountName: userData.full_name,
          accountRef: userId,
          bvn: userData.bvn_data?.raw_data?.bvn || userData.bvn_data?.bvn || "",
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const wallet = await response.json();

    if (!response.ok || !wallet?.data) {
      throw new Error(wallet.message || "Failed to create Nomba wallet");
    }

    await supabase
      .from("users")
      .update({
        wallet_id: wallet.data.accountRef,
        bank_name: wallet.data.bankName,
        bank_account_number: wallet.data.bankAccountNumber,
        bank_account_name: wallet.data.bankAccountName,
        wallet_provider: "nomba",
        primary_provider: "nomba",
        wallet_updated_at: new Date().toISOString(),
        verification_completed: true,
        verification_step: 6,
        bank78_verified: false,
      })
      .eq("id", userId);

    return wallet.data;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Nomba wallet creation timed out");
    }
    throw new Error("Failed to create Nomba wallet: " + error.message);
  }
}