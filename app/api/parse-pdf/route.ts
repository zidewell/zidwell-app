// app/api/parse-pdf/route.ts

import { NextRequest, NextResponse } from 'next/server';
import * as pdfjs from 'pdfjs-dist';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const password = formData.get('password') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({
      data: arrayBuffer,
      password,
    }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return NextResponse.json({ success: true, text: fullText });
  } catch (error: any) {
    if (error.message?.includes('password') || error.name === 'PasswordException') {
      return NextResponse.json(
        { error: 'Password required', needsPassword: true },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}