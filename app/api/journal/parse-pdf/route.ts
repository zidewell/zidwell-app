// app/api/journal/parse-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";

const pdfParse = require('pdf-parse');

// Transaction interface
interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit' | 'unknown';
  balance?: number;
  reference?: string;
}

// Parse transactions from text with support for GTBank statement format
function parseTransactions(text: string): Transaction[] {
  const transactions: Transaction[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Find where the actual transaction data starts
  let dataStartIndex = -1;
  let dataEndIndex = lines.length;
  
  // Look for the header row with column names
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('trans. date') && line.includes('value. date')) {
      dataStartIndex = i + 1;
      break;
    }
  }
  
  // If header not found, try to find first transaction by date pattern
  if (dataStartIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Look for date pattern at start of line (DD-MMM-YYYY or DD-MMM-YY)
      if (/^\d{2}-[A-Za-z]{3}-\d{2,4}/.test(line)) {
        dataStartIndex = i;
        break;
      }
    }
  }
  
  // Find where data ends (look for totals or closing balance)
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('total debit') || line.includes('total credit') || 
        line.includes('closing balance') || line.includes('opening balance') ||
        line.includes('statement period')) {
      dataEndIndex = i;
      break;
    }
  }
  
  // If no end found, use all lines after start
  if (dataEndIndex === lines.length && dataStartIndex !== -1) {
    dataEndIndex = lines.length;
  }
  
  // Process each line in the data section
  for (let i = dataStartIndex; i < dataEndIndex && i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.length < 10) continue;
    
    // Skip header lines and summary lines
    if (/^(trans\.|value\.|date|remarks|originating)/i.test(line)) continue;
    if (/^(total|opening|closing|statement)/i.test(line)) continue;
    
    // Parse line with GTBank format
    const transaction = parseGTBankLine(line);
    if (transaction) {
      transactions.push(transaction);
    }
  }
  
  // If no transactions found with the structured parser, try the fallback parser
  if (transactions.length === 0) {
    return parseTransactionsFallback(lines);
  }
  
  return transactions;
}

// Parse a single GTBank transaction line
function parseGTBankLine(line: string): Transaction | null {
  // Try to match the GTBank format
  // Format: "01-Jan-2025 01-Jan-2025 'REF2751603000GA P 248,740.00 8,029,757.72 635 AKIN ADESOLA TRANSFER BETWEEN CUSTOMERS VIA GAPSLITE TAX SETTLEMENT 1011550 0248740250 REF:2751603000 FROM TMS - TOCHIMINT STYLEZ TO ODEY SUNDAY DANIEL"
  
  // Extract date (DD-MMM-YYYY)
  const dateMatch = line.match(/^(\d{2}-[A-Za-z]{3}-\d{4})/);
  if (!dateMatch) return null;
  
  const date = formatDateGTBank(dateMatch[1]);
  
  // Remove the date part
  let remaining = line.substring(dateMatch[0].length).trim();
  
  // Extract value date (DD-MMM-YYYY) - second date
  const valueDateMatch = remaining.match(/^(\d{2}-[A-Za-z]{3}-\d{4})/);
  if (valueDateMatch) {
    remaining = remaining.substring(valueDateMatch[0].length).trim();
  }
  
  // Extract reference (starts with ' or " and contains alphanumeric)
  let reference = '';
  const refMatch = remaining.match(/^['"]?([A-Z0-9]+)['"]?/);
  if (refMatch) {
    reference = refMatch[1];
    remaining = remaining.substring(refMatch[0].length).trim();
  }
  
  // Look for debit amount (positive number with commas)
  const debitMatch = remaining.match(/^([\d,]+\.\d{2})/);
  let debit = 0;
  let credit = 0;
  let balance = 0;
  let description = '';
  
  if (debitMatch) {
    debit = parseFloat(debitMatch[1].replace(/,/g, ''));
    remaining = remaining.substring(debitMatch[0].length).trim();
    
    // Look for balance after debit
    const balanceMatch = remaining.match(/^([\d,]+\.\d{2})/);
    if (balanceMatch) {
      balance = parseFloat(balanceMatch[1].replace(/,/g, ''));
      remaining = remaining.substring(balanceMatch[0].length).trim();
    }
    
    // The rest is description (removing branch code if present)
    description = remaining;
    
    // Remove branch code if it's at the start (e.g., "635 AKIN ADESOLA")
    const branchMatch = description.match(/^\d{3}\s+/);
    if (branchMatch) {
      description = description.substring(branchMatch[0].length).trim();
    }
    
    // Clean up description - remove extra spaces and special characters
    description = description.replace(/\s+/g, ' ').trim();
    
    return {
      date: date,
      description: description || 'Debit transaction',
      amount: debit,
      type: 'debit',
      balance: balance || undefined,
      reference: reference || undefined,
    };
  }
  
  // Look for credit amount
  const creditMatch = remaining.match(/^([\d,]+\.\d{2})/);
  if (creditMatch) {
    credit = parseFloat(creditMatch[1].replace(/,/g, ''));
    remaining = remaining.substring(creditMatch[0].length).trim();
    
    // Look for balance after credit
    const balanceMatch = remaining.match(/^([\d,]+\.\d{2})/);
    if (balanceMatch) {
      balance = parseFloat(balanceMatch[1].replace(/,/g, ''));
      remaining = remaining.substring(balanceMatch[0].length).trim();
    }
    
    // The rest is description
    description = remaining;
    
    // Remove branch code if present
    const branchMatch = description.match(/^\d{3}\s+/);
    if (branchMatch) {
      description = description.substring(branchMatch[0].length).trim();
    }
    
    // Clean up description
    description = description.replace(/\s+/g, ' ').trim();
    
    return {
      date: date,
      description: description || 'Credit transaction',
      amount: credit,
      type: 'credit',
      balance: balance || undefined,
      reference: reference || undefined,
    };
  }
  
  return null;
}

// Fallback parser for other formats
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

// Format date from DD-MMM-YYYY to YYYY-MM-DD
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

// Helper: Format date to YYYY-MM-DD
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

// Calculate summary statistics
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

// Main POST handler with password support
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const password = formData.get("password") as string || null;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF with password support
    let data;
    try {
      data = await pdfParse(buffer);
    } catch (error: any) {
      const isPasswordError = 
        error?.constructor?.name === 'PasswordException' ||
        error?.message?.toLowerCase().includes('password') ||
        error?.code === 1 ||
        error?.toString().toLowerCase().includes('password');
      
      if (isPasswordError) {
        if (!password) {
          return NextResponse.json(
            { 
              needsPassword: true,
              error: "This PDF is password protected. Please provide the password." 
            },
            { status: 401 }
          );
        }
        
        try {
          data = await pdfParse(buffer, { password });
        } catch (passwordError: any) {
          return NextResponse.json(
            { 
              needsPassword: true,
              passwordError: true,
              error: "Incorrect password. Please try again." 
            },
            { status: 401 }
          );
        }
      } else {
        throw error;
      }
    }

    const text = data.text || '';

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "No text could be extracted from the PDF" },
        { status: 400 }
      );
    }

    // Parse transactions
    const transactions = parseTransactions(text);
    const summary = calculateSummary(transactions);

    // Get first 10 transactions as preview
    const preview = transactions.slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        pageCount: data.numpages || 1,
        totalTransactions: transactions.length,
        summary,
        transactions,
        preview,
      },
    });

  } catch (error: any) {
    console.error("PDF extraction error:", error);
    
    const isPasswordError = 
      error?.constructor?.name === 'PasswordException' ||
      error?.message?.toLowerCase().includes('password') ||
      error?.code === 1 ||
      error?.toString().toLowerCase().includes('password');
    
    if (isPasswordError) {
      return NextResponse.json(
        { 
          needsPassword: true,
          error: "This PDF is password protected. Please provide the password." 
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to extract text from PDF" 
      },
      { status: 500 }
    );
  }
}