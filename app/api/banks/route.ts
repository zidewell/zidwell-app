// app/api/banks/route.ts
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";
import { getNombaToken } from "@/lib/nomba";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
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
    const response = await fetch(`${process.env.NOMBA_URL}/v1/transfers/banks`, {
      method: "GET",
      headers: {
        accountId: process.env.NOMBA_ACCOUNT_ID as string,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.json();
      console.error("❌ Nomba API error:", errorText);
      return NextResponse.json({ error: "Failed to fetch banks", details: errorText }, { status: response.status });
    }

    const data = await response.json();
    if (newTokens) return createAuthResponse(data, newTokens);
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}