// app/api/mono/exchange/route.ts
import { NextRequest, NextResponse } from "next/server";

const MONO_SECRET_KEY = process.env.MONO_TEST_PRIVATE_KEY;
const MONO_BASE_URL = "https://api.withmono.com/v2";

export async function POST(request: NextRequest) {
  if (!MONO_SECRET_KEY) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing Mono secret key." },
      { status: 500 }
    );
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!body.code) {
    return NextResponse.json({ error: "code is required." }, { status: 400 });
  }

  try {
    const monoResponse = await fetch(`${MONO_BASE_URL}/accounts/auth`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "mono-sec-key": MONO_SECRET_KEY,
      },
      body: JSON.stringify({ code: body.code }),
    });

    const data = await monoResponse.json();

    if (!monoResponse.ok) {
      console.error("Mono exchange error:", data);
      return NextResponse.json(
        { error: data.message || "Failed to exchange code for account." },
        { status: monoResponse.status }
      );
    }

    // Mono returns { id: "<account_id>" } (shape may include more — pass through)
    return NextResponse.json(data, { status: monoResponse.status });
  } catch (error: any) {
    console.error("Error exchanging Mono code:", error);
    return NextResponse.json({ error: "Failed to reach Mono API." }, { status: 502 });
  }
}