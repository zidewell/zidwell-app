// app/api/journal/parse-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
// @ts-ignore - legacy build has no bundled types entry for this subpath
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
interface ColumnDef {
  key: string;
  xStart: number;
}
const EXPECTED_COLUMNS: { key: string; match: string[] }[] = [
  { key: 'transDate', match: ['trans date', 'trans. date', 'transaction date'] },
  { key: 'valueDate', match: ['value date', 'value. date'] },
  { key: 'narration', match: ['narration', 'description', 'remarks'] },
  { key: 'chqNo', match: ['chq no', 'cheque no', 'chq. no'] },
  { key: 'debit', match: ['debit'] },
  { key: 'credit', match: ['credit'] },
  { key: 'balance', match: ['balance'] },
];


interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit' | 'unknown';
  balance?: number;
  reference?: string;
}

// --- pdfjs-dist extraction ------------------------------------------

interface TextRun {
  x: number;
  y: number;
  text: string;
}

interface RowData {
  y: number;
  items: { x: number; text: string }[];
}

async function extractTextFromPDF(
  buffer: Buffer,
  password?: string
): Promise<{ text: string; numpages: number; rows: RowData[] }> {
  const uint8 = new Uint8Array(buffer);

  const loadingTask = pdfjsLib.getDocument({
    data: uint8,
    password: password || undefined,
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
  });

  const pdf = await loadingTask.promise;

  const numPages = pdf.numPages;
  const lines: string[] = [];
  const allRows: RowData[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const runs: TextRun[] = content.items
      .filter((item: any) => typeof item.str === "string" && item.str.trim().length > 0)
      .map((item: any) => ({
        x: item.transform[4],
        y: item.transform[5],
        text: item.str,
      }));

    runs.sort((a, b) => b.y - a.y || a.x - b.x);

    let currentY: number | null = null;
    let currentLine: TextRun[] = [];
    const Y_TOLERANCE = 2;

    const flushLine = () => {
      if (currentLine.length === 0) return;
      currentLine.sort((a, b) => a.x - b.x);
      lines.push(currentLine.map(r => r.text).join(' ').replace(/\s+/g, ' ').trim());
      allRows.push({
        y: currentLine[0].y,
        items: currentLine.map(r => ({ x: r.x, text: r.text })),
      });
      currentLine = [];
    };

    for (const run of runs) {
      if (currentY === null || Math.abs(run.y - currentY) <= Y_TOLERANCE) {
        currentLine.push(run);
        currentY = run.y;
      } else {
        flushLine();
        currentLine.push(run);
        currentY = run.y;
      }
    }
    flushLine();
  }

  return { text: lines.join('\n'), numpages: numPages, rows: allRows };
}

//56158


// --- Transaction parsing (unchanged) ----------------------------------

function detectColumns(headerItems: { x: number; text: string }[]): ColumnDef[] | null {
  const tokens = headerItems.slice().sort((a, b) => a.x - b.x);
  const found: ColumnDef[] = [];
  const usedIndices = new Set<number>();

  for (const col of EXPECTED_COLUMNS) {
    for (let i = 0; i < tokens.length; i++) {
      if (usedIndices.has(i)) continue;
      const text = tokens[i].text.toLowerCase().trim();
      if (col.match.some(phrase => text === phrase || text.includes(phrase))) {
        usedIndices.add(i);
        found.push({ key: col.key, xStart: tokens[i].x });
        break;
      }
    }
  }

  const required = ['transDate', 'narration'];
  const hasRequired = required.every(k => found.some(f => f.key === k));
  if (!hasRequired) return null;

  found.sort((a, b) => a.xStart - b.xStart);
  return found;
}

function assignColumn(x: number, columns: ColumnDef[]): string {
  // columns must be sorted ascending by xStart
  if (x < columns[0].xStart) return columns[0].key;
  for (let i = 0; i < columns.length - 1; i++) {
    const boundary = (columns[i].xStart + columns[i + 1].xStart) / 2;
    if (x < boundary) return columns[i].key;
  }
  return columns[columns.length - 1].key;
}

function parseTableStatement(rows: RowData[]): Transaction[] {
  const headerRowIndex = rows.findIndex(r => {
    const joined = r.items.map(i => i.text).join(' ').toLowerCase();
    return joined.includes('narration') &&
      (joined.includes('debit') || joined.includes('credit')) &&
      joined.includes('date');
  });

  if (headerRowIndex === -1) return [];

  const columns = detectColumns(rows[headerRowIndex].items);
  if (!columns) return [];

  const DATE_RE = /^\d{2}-[A-Za-z]{3}-\d{2,4}$/;
  const AMOUNT_RE = /^[\d,]+\.\d{2}$/;

  let endIndex = rows.length;
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const joined = rows[i].items.map(it => it.text).join(' ').toLowerCase();
    if (joined.includes('total debit') || joined.includes('total credit') ||
        joined.includes('statement period') || joined.includes('closing balance summary')) {
      endIndex = i;
      break;
    }
  }

  const bodyRows = rows.slice(headerRowIndex + 1, endIndex);

  const bucketRow = (row: RowData) => {
    const buckets: Record<string, string[]> = {};
    for (const item of row.items) {
      const key = assignColumn(item.x, columns);
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(item.text);
    }
    return buckets;
  };

  interface Anchor {
    y: number;
    date: string;
    debit?: number;
    credit?: number;
    balance?: number;
    narration: string[];
  }

  const anchors: Anchor[] = [];

  // Pass 1: identify anchor rows (rows with a valid date)
  for (const row of bodyRows) {
    const buckets = bucketRow(row);
    const transDateText = (buckets['transDate'] || []).join(' ').trim();
    if (DATE_RE.test(transDateText)) {
      const debitText = (buckets['debit'] || []).join(' ').trim();
      const creditText = (buckets['credit'] || []).join(' ').trim();
      const balanceText = (buckets['balance'] || []).join(' ').trim();

      anchors.push({
        y: row.y,
        date: transDateText,
        debit: AMOUNT_RE.test(debitText) ? parseFloat(debitText.replace(/,/g, '')) : undefined,
        credit: AMOUNT_RE.test(creditText) ? parseFloat(creditText.replace(/,/g, '')) : undefined,
        balance: AMOUNT_RE.test(balanceText) ? parseFloat(balanceText.replace(/,/g, '')) : undefined,
        narration: [],
      });
    }
  }

  if (anchors.length === 0) return [];

  // Pass 2: attach every row's narration text to the nearest anchor by y-distance
  for (const row of bodyRows) {
    const buckets = bucketRow(row);
    const narrationPart = (buckets['narration'] || []).join(' ').trim();
    if (!narrationPart) continue;

    let nearest = anchors[0];
    let minDist = Math.abs(row.y - anchors[0].y);
    for (const a of anchors) {
      const d = Math.abs(row.y - a.y);
      if (d < minDist) {
        minDist = d;
        nearest = a;
      }
    }
    nearest.narration.push(narrationPart);
  }

  const transactions: Transaction[] = [];
  for (const a of anchors) {
    const narrationText = a.narration.join(' ').replace(/\s+/g, ' ').trim();
    const lower = narrationText.toLowerCase();
    if (lower.includes('opening balance') || lower.includes('closing balance')) continue;

    if (a.debit && a.debit > 0) {
      transactions.push({
        date: formatDateGTBank(a.date),
        description: narrationText || 'Debit transaction',
        amount: a.debit,
        type: 'debit',
        balance: a.balance,
      });
    } else if (a.credit && a.credit > 0) {
      transactions.push({
        date: formatDateGTBank(a.date),
        description: narrationText || 'Credit transaction',
        amount: a.credit,
        type: 'credit',
        balance: a.balance,
      });
    }
  }

  return transactions;
}
function parseTransactions(text: string): Transaction[] {
  const transactions: Transaction[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  let dataStartIndex = -1;
  let dataEndIndex = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('trans. date') && line.includes('value. date')) {
      dataStartIndex = i + 1;
      break;
    }
  }

  if (dataStartIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\d{2}-[A-Za-z]{3}-\d{2,4}/.test(line)) {
        dataStartIndex = i;
        break;
      }
    }
  }

  // If we still couldn't find a starting point, skip the structured
  // GTBank parser entirely and go straight to the fallback parser.
  if (dataStartIndex === -1) {
    return parseTransactionsFallback(lines);
  }

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('total debit') || line.includes('total credit') ||
      line.includes('closing balance') || line.includes('opening balance') ||
      line.includes('statement period')) {
      dataEndIndex = i;
      break;
    }
  }

  if (dataEndIndex === lines.length && dataStartIndex !== -1) {
    dataEndIndex = lines.length;
  }

  for (let i = dataStartIndex; i < dataEndIndex && i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.length < 10) continue;
    if (/^(trans\.|value\.|date|remarks|originating)/i.test(line)) continue;
    if (/^(total|opening|closing|statement)/i.test(line)) continue;

    const transaction = parseGTBankLine(line);
    if (transaction) {
      transactions.push(transaction);
    }
  }

  if (transactions.length === 0) {
    return parseTransactionsFallback(lines);
  }

  return transactions;
}

function parseGTBankLine(line: string): Transaction | null {
  const dateMatch = line.match(/^(\d{2}-[A-Za-z]{3}-\d{4})/);
  if (!dateMatch) return null;

  const date = formatDateGTBank(dateMatch[1]);
  let remaining = line.substring(dateMatch[0].length).trim();

  const valueDateMatch = remaining.match(/^(\d{2}-[A-Za-z]{3}-\d{4})/);
  if (valueDateMatch) {
    remaining = remaining.substring(valueDateMatch[0].length).trim();
  }

  let reference = '';
  const refMatch = remaining.match(/^['"]?([A-Z0-9]+)['"]?/);
  if (refMatch) {
    reference = refMatch[1];
    remaining = remaining.substring(refMatch[0].length).trim();
  }

  const debitMatch = remaining.match(/^([\d,]+\.\d{2})/);
  let debit = 0;
  let credit = 0;
  let balance = 0;
  let description = '';

  if (debitMatch) {
    debit = parseFloat(debitMatch[1].replace(/,/g, ''));
    remaining = remaining.substring(debitMatch[0].length).trim();

    const balanceMatch = remaining.match(/^([\d,]+\.\d{2})/);
    if (balanceMatch) {
      balance = parseFloat(balanceMatch[1].replace(/,/g, ''));
      remaining = remaining.substring(balanceMatch[0].length).trim();
    }

    description = remaining;
    const branchMatch = description.match(/^\d{3}\s+/);
    if (branchMatch) {
      description = description.substring(branchMatch[0].length).trim();
    }
    description = description.replace(/\s+/g, ' ').trim();

    return {
      date,
      description: description || 'Debit transaction',
      amount: debit,
      type: 'debit',
      balance: balance || undefined,
      reference: reference || undefined,
    };
  }

  const creditMatch = remaining.match(/^([\d,]+\.\d{2})/);
  if (creditMatch) {
    credit = parseFloat(creditMatch[1].replace(/,/g, ''));
    remaining = remaining.substring(creditMatch[0].length).trim();

    const balanceMatch = remaining.match(/^([\d,]+\.\d{2})/);
    if (balanceMatch) {
      balance = parseFloat(balanceMatch[1].replace(/,/g, ''));
      remaining = remaining.substring(balanceMatch[0].length).trim();
    }

    description = remaining;
    const branchMatch = description.match(/^\d{3}\s+/);
    if (branchMatch) {
      description = description.substring(branchMatch[0].length).trim();
    }
    description = description.replace(/\s+/g, ' ').trim();

    return {
      date,
      description: description || 'Credit transaction',
      amount: credit,
      type: 'credit',
      balance: balance || undefined,
      reference: reference || undefined,
    };
  }

  return null;
}

function parseTransactionsFallback(lines: string[]): Transaction[] {
  const transactions: Transaction[] = [];
  const patterns = {
    date: /\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4})\b/,
    amount: /[₦$€]?\s*([\-+]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
    credit: /\b(credit|deposit|inflow|received|salary|transfer in|cr|funding)\b/i,
    debit: /\b(debit|withdrawal|outflow|payment|purchase|transfer out|atm|pos|spent|dr)\b/i,
  };

  let currentDate = '';
  let currentDescription = '';
  let currentAmount = 0;
  let currentType: 'credit' | 'debit' | 'unknown' = 'unknown';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.toLowerCase().includes('statement') ||
      line.toLowerCase().includes('page') ||
      line.toLowerCase().includes('account') ||
      line.toLowerCase().includes('balance') ||
      line.toLowerCase().includes('opening') ||
      line.toLowerCase().includes('closing') ||
      line.toLowerCase().includes('summary') ||
      line.toLowerCase().includes('total') ||
      line.toLowerCase().includes('rate') ||
      line.toLowerCase().includes('interest')) {
      continue;
    }

    const dateMatch = line.match(patterns.date);
    if (dateMatch) {
      if (currentDate && currentAmount > 0) {
        transactions.push({
          date: currentDate,
          description: currentDescription || 'No description',
          amount: currentAmount,
          type: currentType,
        });
      }

      currentDate = formatDate(dateMatch[1]);
      currentDescription = '';
      currentAmount = 0;
      currentType = 'unknown';
    }

    const amountMatch = line.match(patterns.amount);
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      if (!isNaN(amount) && amount > 0) {
        const lowerLine = line.toLowerCase();
        const isCredit = patterns.credit.test(lowerLine);
        const isDebit = patterns.debit.test(lowerLine);
        const hasNegative = line.includes('-') || line.includes('(') || line.includes(')');

        if (isCredit && !isDebit) {
          currentType = 'credit';
          currentAmount = amount;
        } else if (isDebit && !isCredit) {
          currentType = 'debit';
          currentAmount = amount;
        } else if (hasNegative) {
          currentType = 'debit';
          currentAmount = amount;
        } else {
          currentType = amount > 1000 ? 'debit' : 'credit';
          currentAmount = amount;
        }
      }
    }

    const isNumericLine = /^[\d,.\s]+$/.test(line);
    const isDateLine = patterns.date.test(line);

    if (!isNumericLine && !isDateLine && line.length > 3) {
      if (currentDescription) {
        currentDescription += ' ' + line;
      } else {
        currentDescription = line;
      }
    }

    if (currentDate && currentAmount > 0 && currentDescription &&
      (i === lines.length - 1 || patterns.date.test(lines[i + 1]))) {
      transactions.push({
        date: currentDate,
        description: currentDescription.substring(0, 200),
        amount: currentAmount,
        type: currentType,
      });

      currentDate = '';
      currentDescription = '';
      currentAmount = 0;
      currentType = 'unknown';
    }
  }

  if (currentDate && currentAmount > 0 && currentDescription) {
    transactions.push({
      date: currentDate,
      description: currentDescription.substring(0, 200),
      amount: currentAmount,
      type: currentType,
    });
  }

  return transactions;
}

function formatDateGTBank(dateStr: string): string {
  try {
    const months: { [key: string]: string } = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = months[parts[1].toLowerCase()] || parts[1];
      const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  } catch (error) {
    return dateStr;
  }
}

function formatDate(dateStr: string): string {
  try {
    const clean = dateStr.replace(/[^0-9\/\-\.]/g, '');

    let day, month, year;

    if (clean.includes('/')) {
      [day, month, year] = clean.split('/');
    } else if (clean.includes('-')) {
      [day, month, year] = clean.split('-');
    } else if (clean.includes('.')) {
      [day, month, year] = clean.split('.');
    } else {
      return dateStr;
    }

    if (year && year.length === 2) {
      year = '20' + year;
    }

    if (!day || !month || !year) {
      return dateStr;
    }

    day = day.padStart(2, '0');
    month = month.padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    return dateStr;
  }
}

function calculateSummary(transactions: Transaction[]) {
  let totalCredit = 0;
  let totalDebit = 0;
  let countCredit = 0;
  let countDebit = 0;

  transactions.forEach(t => {
    if (t.type === 'credit') {
      totalCredit += t.amount;
      countCredit++;
    } else if (t.type === 'debit') {
      totalDebit += t.amount;
      countDebit++;
    }
  });

  return {
    totalCredit,
    totalDebit,
    netBalance: totalCredit - totalDebit,
    countCredit,
    countDebit,
    totalTransactions: transactions.length,
  };
}

// --- Main handler --------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const password = (formData.get("password") as string) || undefined;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.includes('pdf') && !file.name?.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let parsed: { text: string; numpages: number; rows: RowData[] };
    try {
      parsed = await extractTextFromPDF(buffer, password);
    } catch (error: any) {
      const isPasswordException = error?.name === "PasswordException";

      if (isPasswordException) {
        // pdfjs PasswordResponses: 1 = NEED_PASSWORD, 2 = INCORRECT_PASSWORD
        const needsPassword = error.code === 1 || !password;
        const wrongPassword = error.code === 2;

        if (wrongPassword) {
          return NextResponse.json(
            { needsPassword: true, passwordError: true, error: "Incorrect password. Please try again." },
            { status: 401 }
          );
        }

        return NextResponse.json(
          { needsPassword: true, error: "This PDF is password protected. Please provide the password." },
          { status: 401 }
        );
      }

      console.error("PDF extraction error - name:", error?.name);
      console.error("PDF extraction error - message:", error?.message);
      console.error("PDF extraction error - stack:", error?.stack);

      return NextResponse.json(
        { success: false, error: "Failed to extract text from this PDF. It may be scanned/image-based or corrupted." },
        { status: 422 }
      );
    }

    const text = parsed.text || '';

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "No text could be extracted from the PDF" },
        { status: 400 }
      );
    }

  let transactions = parseTableStatement(parsed.rows);

    console.log("=== TABLE PARSER RESULT ===");
    console.log("Transactions found by table parser:", transactions.length);
    console.log("Total rows extracted:", parsed.rows.length);

    // Find and dump the header row + next 15 rows after it
    const headerIdx = parsed.rows.findIndex(r => {
      const joined = r.items.map(i => i.text).join(' ').toLowerCase();
      return joined.includes('narration');
    });
    console.log("Detected header row index:", headerIdx);

    if (headerIdx !== -1) {
      console.log("Header row + next 15 rows:", JSON.stringify(parsed.rows.slice(headerIdx, headerIdx + 16), null, 2));
    } else {
      console.log("No row containing 'narration' was found at all. Dumping rows 10-40 instead:");
      console.log(JSON.stringify(parsed.rows.slice(10, 40), null, 2));
    }

    if (transactions.length === 0) {
      transactions = parseTransactions(text);
      console.log("Fallback parser found:", transactions.length);
    }

    const summary = calculateSummary(transactions);
    const preview = transactions.slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        pageCount: parsed.numpages || 1,
        totalTransactions: transactions.length,
        summary,
        transactions,
        preview,
      },
    });

  } catch (error: any) {
    console.error("PDF extraction error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to extract text from PDF" },
      { status: 500 }
    );
  }
}