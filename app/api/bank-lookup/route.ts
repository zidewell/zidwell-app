// app/api/bank-lookup/route.ts
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";
import { getNombaToken } from "@/lib/nomba";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);
    
  if (!user) {
    const response = NextResponse.json({ error: "Please login to access transactions", logout: true }, { status: 401 });
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  const token = await getNombaToken();
  if (!token) {
    const response = NextResponse.json({ message: "Unauthorized", logout: true }, { status: 401 });
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const { accountNumber, bankCode } = await req.json();

    if (!accountNumber || !bankCode) {
      return NextResponse.json({ error: "accountNumber and bankCode are required" }, { status: 400 });
    }

    const url = `${process.env.NOMBA_URL}/v1/transfers/bank/lookup`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accountId: process.env.NOMBA_ACCOUNT_ID as string,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ accountNumber, bankCode }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Nomba lookup failed:", errorText);
      return NextResponse.json({ error: "Failed to lookup account", details: errorText }, { status: response.status });
    }

    const data = await response.json();
    if (newTokens) return createAuthResponse(data, newTokens);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("❌ Server error:", error.message);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}