import { NextRequest, NextResponse } from "next/server";
import pdfParse from 'pdf-parse';

// Your existing extraction logic (copy from your current code)
interface ParsedEntry {
  date: string;
  description: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  categoryId: string;
  note: string;
}

const formatDate = (dateStr: string): string => {
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      let [m, d, y] = parts;
      if (parseInt(m) > 12) [d, m] = [m, d];
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  return dateStr;
};

const findMatchingCategory = (text: string) => {
  const keywords: Record<string, string[]> = {
    food: ["food", "restaurant", "cafe", "meal", "groceries", "supermarket"],
    transport: ["transport", "uber", "bolt", "taxi", "fuel", "gas", "petrol"],
    salary: ["salary", "wage", "payroll", "bonus"],
    electricity_bill: ["electricity", "energy", "power", "ede"],
    data_internet: ["data", "internet", "wifi", "broadband"],
    call_airtime: ["airtime", "call", "phone", "mtn", "glo", "airtel"],
    transfer: ["transfer", "send", "p2p", "bank transfer"],
    withdrawal: ["withdrawal", "atm", "cash"],
    online_sales: ["paypal", "stripe", "flutterwave", "paystack", "online"],
    rent: ["rent", "property", "apartment", "house"],
    professional_fees: ["professional fee", "consulting", "legal", "consultation", "lawyer"],
  };

  const lowerText = text.toLowerCase();
  for (const [categoryId, words] of Object.entries(keywords)) {
    if (words.some((word) => lowerText.includes(word))) {
      return {
        id: categoryId,
        name: categoryId.replace("_", " ").toUpperCase(),
      };
    }
  }
  return null;
};

const extractTransactions = (text: string): ParsedEntry[] => {
  console.log("📄 Extracted text length:", text.length);
  
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const entries: ParsedEntry[] = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Skip headers/footers
    if (
      lowerLine.includes("date") ||
      lowerLine.includes("transaction") ||
      lowerLine.includes("balance") ||
      lowerLine.includes("opening") ||
      lowerLine.includes("closing") ||
      lowerLine.includes("statement") ||
      lowerLine.includes("page") ||
      lowerLine.includes("account") ||
      lowerLine.includes("total") ||
      lowerLine.includes("summary")
    ) {
      continue;
    }

    // Find date
    let dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (!dateMatch) dateMatch = line.match(/(\d{2}-\d{2}-\d{4})/);
    if (!dateMatch) dateMatch = line.match(/(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) dateMatch = line.match(/(\d{2}\/\d{2}\/\d{2})/);
    if (!dateMatch) dateMatch = line.match(/(\d{2}\.\d{2}\.\d{4})/);

    // Find amount
    let amountMatch = line.match(/([\d,]+\.\d{2})/);
    if (!amountMatch) amountMatch = line.match(/₦([\d,]+\.\d{2})/);
    if (!amountMatch) amountMatch = line.match(/\$([\d,]+\.\d{2})/);
    if (!amountMatch) amountMatch = line.match(/NGN\s*([\d,]+\.\d{2})/);

    if (dateMatch && amountMatch) {
      const amount = parseFloat(amountMatch[1].replace(/,/g, ""));

      const isCredit =
        lowerLine.includes("credit") ||
        lowerLine.includes("deposit") ||
        lowerLine.includes("inflow") ||
        lowerLine.includes("payment received") ||
        lowerLine.includes("salary") ||
        lowerLine.includes("transfer in") ||
        lowerLine.includes("funding") ||
        lowerLine.includes("received") ||
        lowerLine.includes("cr");

      const isDebit =
        lowerLine.includes("debit") ||
        lowerLine.includes("withdrawal") ||
        lowerLine.includes("outflow") ||
        lowerLine.includes("payment made") ||
        lowerLine.includes("purchase") ||
        lowerLine.includes("transfer out") ||
        lowerLine.includes("atm") ||
        lowerLine.includes("pos") ||
        lowerLine.includes("spent") ||
        lowerLine.includes("paid") ||
        lowerLine.includes("dr");

      let type: "income" | "expense" = "expense";
      if (isCredit && !isDebit) {
        type = "income";
      } else if (isDebit && !isCredit) {
        type = "expense";
      } else if (amount > 0) {
        type = lowerLine.includes("received") || lowerLine.includes("credit")
          ? "income"
          : "expense";
      }

      const category = findMatchingCategory(line);
      const date = formatDate(dateMatch[1]);

      entries.push({
        date,
        description: line.substring(0, 200),
        type,
        amount: Math.abs(amount),
        category: category?.name || "Other",
        categoryId: category?.id || (type === "income" ? "other_income" : "other_expense"),
        note: line.substring(0, 200),
      });
    }
  }

  // Fallback extraction
  if (entries.length === 0) {
    for (const line of lines) {
      const numbers = line.match(/\d+\.\d{2}/g);
      if (numbers && numbers.length > 0) {
        const dateMatch = line.match(
          /(\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2})/
        );
        if (dateMatch) {
          const amount = parseFloat(numbers[numbers.length - 1].replace(/,/g, ""));
          const date = formatDate(dateMatch[1]);
          const lowerLine = line.toLowerCase();
          const isCredit = lowerLine.includes("credit") || lowerLine.includes("deposit");
          const type: "income" | "expense" = isCredit ? "income" : "expense";

          entries.push({
            date,
            description: line.substring(0, 200),
            type,
            amount: Math.abs(amount),
            category: "Other",
            categoryId: type === "income" ? "other_income" : "other_expense",
            note: line.substring(0, 200),
          });
        }
      }
    }
  }

  console.log("📊 Found entries:", entries.length);
  return entries;
};

// MAIN API HANDLER - Using pdf-parse
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const password = formData.get("password") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    
    // For non-PDF files (CSV, Excel)
    if (!isPDF) {
      // Your existing CSV/Excel parsing logic here
      // ... (keep your existing code)
      
      return NextResponse.json({
        success: true,
        data: {
          totalRows: 0,
          entries: [],
          summary: { totalIncome: 0, totalExpenses: 0, netBalance: 0 }
        }
      });
    }

    // PDF PROCESSING - Using pdf-parse (EASY!)
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Parse PDF with pdf-parse
      const data = await pdfParse(buffer, {
        // Password handling if needed
        ...(password ? { password } : {})
      });
      
      const text = data.text;
      
      if (!text || text.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "No text could be extracted from the PDF" },
          { status: 400 }
        );
      }

      // Extract transactions using your existing logic
      const entries = extractTransactions(text);

      if (entries.length === 0) {
        return NextResponse.json(
          { success: false, error: "No transactions could be extracted from the file" },
          { status: 400 }
        );
      }

      const totalIncome = entries
        .filter((e) => e.type === "income")
        .reduce((sum, e) => sum + e.amount, 0);
      const totalExpenses = entries
        .filter((e) => e.type === "expense")
        .reduce((sum, e) => sum + e.amount, 0);

      return NextResponse.json({
        success: true,
        data: {
          totalRows: entries.length,
          entries,
          summary: {
            totalIncome,
            totalExpenses,
            netBalance: totalIncome - totalExpenses,
          },
        },
      });
      
    } catch (error: any) {
      // Check if it's a password error
      if (error.message?.toLowerCase().includes("password")) {
        return NextResponse.json({
          success: false,
          needsPassword: true,
          error: "Password required",
        });
      }
      
      throw error;
    }
    
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process file" },
      { status: 500 }
    );
  }
}