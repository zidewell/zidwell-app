// app/api/users-verification/bvn/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { encrypt, hashBvn, maskBvn } from "@/lib/encryption";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const BVN_REGEX = /^\d{11}$/;
const PREMBLY_TIMEOUT = 30000;

export async function POST(request: Request) {
  try {
    const { user, newTokens } = await isAuthenticatedWithRefresh(request as any);

    if (!user) {
      const response = NextResponse.json(
        {
          error: "Please login to verify your BVN",
          logout: true,
        },
        { status: 401 }
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    const body = await request.json();
    const { number, consentGiven } = body;

    if (!number) {
      const response = NextResponse.json(
        {
          success: false,
          message: "BVN number is required",
          error: "Missing required field: number",
        },
        { status: 400 }
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    if (!BVN_REGEX.test(number)) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Invalid BVN format. BVN must be exactly 11 digits.",
          error: "Invalid BVN format",
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
          message: "User consent required for BVN verification",
          error: "Consent not provided",
        },
        { status: 400 }
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    const options = {
      method: "POST",
      url: "https://api.prembly.com/verification/bvn_validation",
      headers: {
        accept: "application/json",
        "x-api-key": process.env.PREMBLY_SECRET_KEY,
        "content-type": "application/json",
      },
      data: { number: number },
      timeout: PREMBLY_TIMEOUT,
    };

    const response = await axios.request(options);
    const result = response.data;
    const bvnData = result.data || {};

    const mappedData = {
      success: true,
      data: {
        bvn: number,
        bvn_hash: hashBvn(number),
        bvn_masked: maskBvn(number),
        firstName: bvnData.firstName || "",
        lastName: bvnData.lastName || "",
        middleName: bvnData.middleName || "",
        nameOnCard: bvnData.nameOnCard || "",
        dateOfBirth: bvnData.dateOfBirth || "",
        phone: bvnData.phoneNumber1 || bvnData.phone || "",
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
        verification_status:
          result.verification_status || (result.status ? "VERIFIED" : "FAILED"),
        verification_reference:
          result.reference_id || result.verification?.reference,
        verification_id: result.verification?.verification_id,
        is_sandbox_mode: result.is_sandbox || false,
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
    console.error("BVN Verification Error:", error.code || "unknown_error");

    if (error.code === "ECONNABORTED") {
      return NextResponse.json(
        {
          success: false,
          message: "BVN verification request timed out",
          error: "Request timeout",
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "BVN verification failed",
        error: "Verification service error",
      },
      { status: error.response?.status || 500 }
    );
  }
}
