// app/api/mono/initiate/route.ts
import { NextRequest, NextResponse } from "next/server";

const MONO_SECRET_KEY = process.env.MONO_TEST_PRIVATE_KEY;
const MONO_BASE_URL = "https://api.withmono.com/v2";

interface InitiateAccountRequest {
  customer: {
    name: string;
    email: string;
  };
  meta?: { ref?: string; [key: string]: any };
  scope: string;
  redirect_url: string;
}

export async function POST(request: NextRequest) {
  if (!MONO_SECRET_KEY) {
    console.error("MONO_SEC_KEY is not set in environment variables.");
    return NextResponse.json(
      { error: "Server misconfiguration: missing Mono secret key." },
      { status: 500 }
    );
  }

  let body: InitiateAccountRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!body.customer?.name || !body.customer?.email) {
    return NextResponse.json(
      { error: "customer.name and customer.email are required." },
      { status: 400 }
    );
  }

  if (!body.scope || !body.redirect_url) {
    return NextResponse.json(
      { error: "scope and redirect_url are required." },
      { status: 400 }
    );
  }

  try {
    const monoResponse = await fetch(`${MONO_BASE_URL}/accounts/initiate`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "mono-sec-key": MONO_SECRET_KEY,
      },
      body: JSON.stringify({
        customer: { name: body.customer.name, email: body.customer.email },
        meta: body.meta || {},
        scope: body.scope,
        redirect_url: body.redirect_url,
      }),
    });

    const data = await monoResponse.json();

    if (!monoResponse.ok) {
      console.error("Mono initiate error:", data);
      return NextResponse.json(
        { error: data.message || "Failed to initiate Mono account linking." },
        { status: monoResponse.status }
      );
    }

    return NextResponse.json(data, { status: monoResponse.status });
  } catch (error: any) {
    console.error("Error calling Mono initiate API:", error);
    return NextResponse.json({ error: "Failed to reach Mono API." }, { status: 502 });
  }
}