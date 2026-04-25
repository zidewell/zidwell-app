
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let browser = null;
  
  try {
    const { html } = await req.json();

    let executablePath: string;
    let browserArgs: string[];

    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      executablePath = await chromium.executablePath();
      browserArgs = [...chromium.args];
    } else {
      executablePath = process.env.CHROME_PATH || 
        (process.platform === 'win32' 
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : process.platform === 'darwin'
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : '/usr/bin/google-chrome');
      
      browserArgs = ['--no-sandbox', '--disable-setuid-sandbox'];
    }

    browser = await puppeteer.launch({
      executablePath,
      args: browserArgs,
      headless: true,
    });

    const page = await browser.newPage();
    
    // Simple approach - just wait for domcontentloaded
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdfBuffer = await page.pdf({ 
      format: "A4", 
      printBackground: true 
    });

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(pdfBuffer);
        controller.close();
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=receipt.pdf",
      },
    });

  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}