export interface ParsedEntry {
  date: string;
  description: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  categoryId: string;
  note: string;
}

export const formatDate = (dateStr: string): string => {
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

export const findMatchingCategory = (text: string) => {
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
    professional_fees: [
      "professional fee",
      "consulting",
      "legal",
      "consultation",
      "lawyer",
    ],
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

export const extractTransactions = (text: string): ParsedEntry[] => {
  console.log("📄 Extracted text length:", text.length);
  console.log("📄 First 500 chars:", text.substring(0, 500));

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  console.log("📄 Total lines:", lines.length);
  console.log("📄 First 10 lines:", lines.slice(0, 10));

  const entries: ParsedEntry[] = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Skip common header/footer lines
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

    // Match date patterns
    let dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (!dateMatch) dateMatch = line.match(/(\d{2}-\d{2}-\d{4})/);
    if (!dateMatch) dateMatch = line.match(/(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) dateMatch = line.match(/(\d{2}\/\d{2}\/\d{2})/);
    if (!dateMatch) dateMatch = line.match(/(\d{2}\.\d{2}\.\d{4})/);

    // Match amount patterns
    let amountMatch = line.match(/([\d,]+\.\d{2})/);
    if (!amountMatch) amountMatch = line.match(/₦([\d,]+\.\d{2})/);
    if (!amountMatch) amountMatch = line.match(/\$([\d,]+\.\d{2})/);
    if (!amountMatch) amountMatch = line.match(/NGN\s*([\d,]+\.\d{2})/);

    if (dateMatch && amountMatch) {
      const amount = parseFloat(amountMatch[1].replace(/,/g, ""));

      // Determine transaction type
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
        type =
          lowerLine.includes("received") || lowerLine.includes("credit")
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
        categoryId:
          category?.id ||
          (type === "income" ? "other_income" : "other_expense"),
        note: line.substring(0, 200),
      });
    }
  }

  // Fallback extraction if no entries found
  if (entries.length === 0) {
    console.log("🔄 Trying alternative extraction...");

    for (const line of lines) {
      const numbers = line.match(/\d+\.\d{2}/g);
      if (numbers && numbers.length > 0) {
        const dateMatch = line.match(
          /(\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2})/,
        );
        if (dateMatch) {
          const amount = parseFloat(
            numbers[numbers.length - 1].replace(/,/g, ""),
          );
          const date = formatDate(dateMatch[1]);

          const lowerLine = line.toLowerCase();
          const isCredit =
            lowerLine.includes("credit") || lowerLine.includes("deposit");
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

    console.log("🔄 Alternative found:", entries.length, "entries");
  }

  console.log("📊 Found entries:", entries.length);
  if (entries.length > 0) {
    console.log("📊 Sample entry:", entries[0]);
  }

  return entries;
};