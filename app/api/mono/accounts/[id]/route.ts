// app/api/mono/accounts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

const MONO_SECRET_KEY = process.env.MONO_TEST_PRIVATE_KEY;
const MONO_BASE_URL = "https://api.withmono.com/v2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!MONO_SECRET_KEY) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing Mono secret key." },
      { status: 500 }
    );
  }

  if (!id) {
    return NextResponse.json({ error: "Account id is required." }, { status: 400 });
  }

  try {
    const monoResponse = await fetch(`${MONO_BASE_URL}/accounts/${id}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        "mono-sec-key": MONO_SECRET_KEY,
      },
    });

    const data = await monoResponse.json();

    if (!monoResponse.ok) {
      console.error("Mono account fetch error:", data);
      return NextResponse.json(
        { error: data.message || "Failed to fetch account details." },
        { status: monoResponse.status }
      );
    }

    return NextResponse.json(data, { status: monoResponse.status });
  } catch (error: any) {
    console.error("Error fetching Mono account:", error);
    return NextResponse.json({ error: "Failed to reach Mono API." }, { status: 502 });
  }
}