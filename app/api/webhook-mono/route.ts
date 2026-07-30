// app/api/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";

const secret = process.env.MONO_WEBHOOK_SEC;

interface MonoWebhookPayload {
  event: string;
  data: {
    account?: Record<string, any>;
    [key: string]: any;
  };
}

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const providedSecret = request.headers.get("mono-webhook-secret");

  if (!secret || providedSecret !== secret) {
    return NextResponse.json(
      { message: "Unauthorized request." },
      { status: 401 }
    );
  }

  let webhook: MonoWebhookPayload;
  try {
    webhook = await request.json();
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  switch (webhook.event) {
    case "mono.events.account_updated":
      // do something with webhook.data.account
      console.log("Account updated:", webhook.data.account);
      break;

    default:
      console.log("Unhandled Mono webhook event:", webhook.event);
      break;
  }

  return new NextResponse(null, { status: 200 });
}