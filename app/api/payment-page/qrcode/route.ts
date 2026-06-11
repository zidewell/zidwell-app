import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const paymentUrl = url.searchParams.get("url");

    if (!paymentUrl) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    // Generate QR code as SVG
    const qrCodeSVG = await QRCode.toString(paymentUrl, {
      type: "svg",
      margin: 2,
      width: 300,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return new NextResponse(qrCodeSVG, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("QR code generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}