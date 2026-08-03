// app/api/users-verification/cac/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

// ✅ Updated regex to accept both formats: "RC1234567" or just "1234567"
const RC_NUMBER_REGEX = /^(RC)?\d{1,10}$/;
const PREMBLY_TIMEOUT = 30000;

export async function POST(request) {
  try {
    const { user, newTokens } = await isAuthenticatedWithRefresh(request);

    if (!user) {
      const response = NextResponse.json(
        { error: "Please login to verify your business", logout: true },
        { status: 401 }
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    const body = await request.json();
    let { rc_number, company_type = "RC", consentGiven } = body;

    if (!rc_number) {
      const response = NextResponse.json(
        {
          success: false,
          message: "RC number is required",
          error: "Missing required field: rc_number",
        },
        { status: 400 }
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ✅ Clean the RC number - remove spaces and ensure proper format
    rc_number = rc_number.trim().toUpperCase();
    
    // ✅ If it starts with "RC", keep it as is, otherwise prepend "RC"
    if (!rc_number.startsWith("RC")) {
      rc_number = `RC${rc_number}`;
    }

    if (!RC_NUMBER_REGEX.test(rc_number)) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Invalid RC number format. Expected format: RC followed by digits (e.g., RC1234567).",
          error: "Invalid RC number format",
        },
        { status: 400 }
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    if (!consentGiven) {
      const response = NextResponse.json(
        {
          success: false,
          message: "User consent required for CAC verification",
          error: "Consent not provided",
        },
        { status: 400 }
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    const options = {
      method: "POST",
      url: "https://api.prembly.com/verification/cac",
      headers: {
        accept: "application/json",
        "x-api-key": process.env.PREMBLY_SECRET_KEY,
        "content-type": "application/json",
      },
      data: {
        rc_number: rc_number,
        company_type: company_type,
      },
      timeout: PREMBLY_TIMEOUT,
    };

    const response = await axios.request(options);
    const result = response.data;


    console.log(result, "result")
    
    // ✅ Handle both data formats - array or object
    const businessInfo = result.data && Array.isArray(result.data) && result.data.length > 0 
      ? result.data[0] 
      : result.data || {};

    const mappedData = {
      success: true,
      data: {
        business_info: {
          company_name: businessInfo?.company_name || "",
          company_address: businessInfo?.company_address || "",
          entity_type: businessInfo?.company_type || businessInfo?.entity_type || "",
          company_status: businessInfo?.company_status || "",
          registration_date: businessInfo?.registrationDate || businessInfo?.registration_date || "",
          rc_number: businessInfo?.rc_number || rc_number,
          directors: businessInfo?.directors || [],
          company_id: businessInfo?.company_id || "",
          branch_address: businessInfo?.branchAddress || businessInfo?.branch_address || "",
          email_address: businessInfo?.email_address || "",
          lga: businessInfo?.lga || "",
          city: businessInfo?.city || "",
          state: businessInfo?.state || "",
          postcode: businessInfo?.postcode || "",
        },
        verification_status: result.verification?.status || result.verification_status || (result.status ? "VERIFIED" : "FAILED"),
        verification_reference: result.verification?.reference || result.reference_id,
        verification_id: result.verification?.verification_id,
        is_sandbox_mode: result.is_sandbox || false,
        account_verified: result.account_verified || false,
        user: {
          id: user.id,
          email: user.email,
          tier: user.subscription_tier,
          subscription_active: user.is_subscription_active,
        },
      },
    };

    if (newTokens) return createAuthResponse(mappedData, newTokens);
    return NextResponse.json(mappedData);
  } catch (error: any) {
    console.error("CAC Verification Error:", error.code || "unknown_error");

    if (error.code === "ECONNABORTED") {
      return NextResponse.json(
        {
          success: false,
          message: "CAC verification request timed out",
          error: "Request timeout",
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || "CAC verification failed",
        error: "Verification service error",
        details: error.response?.data || null,
      },
      { status: error.response?.status || 500 }
    );
  }
}