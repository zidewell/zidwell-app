export type JournalType = 'personal' | 'business';
export type EntryType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: EntryType | 'both';
  isCustom: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  type: EntryType;
  amount: number;
  categoryId: string;
  note?: string;
  journalType: JournalType;
  createdAt: string;
}

export interface DailySummary {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

export interface PeriodSummary {
  income: number;
  expenses: number;
  net: number;
  savings: number;
  investments: number;
}

export const DEFAULT_CATEGORIES: Category[] = [
  // EXPENSE CATEGORIES - Withdrawal, Transfer, Bills, etc.
  { id: 'cat_withdrawal', name: 'Withdrawal', icon: '🏧', type: 'expense', isCustom: false },
  { id: 'cat_transfer', name: 'Transfer', icon: '💸', type: 'expense', isCustom: false },
  { id: 'cat_data_airtime', name: 'Data & Airtime', icon: '📱', type: 'expense', isCustom: false },
  { id: 'cat_utilities', name: 'Utilities', icon: '💡', type: 'expense', isCustom: false },
  { id: 'cat_bills', name: 'Bills', icon: '📄', type: 'expense', isCustom: false },
  { id: 'cat_rent', name: 'Rent', icon: '🏠', type: 'expense', isCustom: false },
  { id: 'cat_shopping', name: 'Shopping', icon: '🛍️', type: 'expense', isCustom: false },
  { id: 'cat_entertainment', name: 'Entertainment', icon: '🎬', type: 'expense', isCustom: false },
  { id: 'cat_health', name: 'Health', icon: '🏥', type: 'expense', isCustom: false },
  { id: 'cat_education', name: 'Education', icon: '📚', type: 'expense', isCustom: false },
  { id: 'cat_business_expenses', name: 'Business Expenses', icon: '💼', type: 'expense', isCustom: false },
  { id: 'cat_savings', name: 'Savings', icon: '🐷', type: 'expense', isCustom: false },
  { id: 'cat_family_support', name: 'Family Support', icon: '👨‍👩‍👧‍👦', type: 'expense', isCustom: false },
  { id: 'cat_tax', name: 'Tax', icon: '📋', type: 'expense', isCustom: false },
  { id: 'cat_other_expense', name: 'Other Expense', icon: '📦', type: 'expense', isCustom: false },

  // INCOME CATEGORIES
  { id: 'cat_bank_deposit', name: 'Bank Deposit', icon: '💰', type: 'income', isCustom: false },
  { id: 'cat_salary', name: 'Salary', icon: '💼', type: 'income', isCustom: false },
  { id: 'cat_sales', name: 'Sales Revenue', icon: '💵', type: 'income', isCustom: false },
  { id: 'cat_services', name: 'Services', icon: '🛠️', type: 'income', isCustom: false },
  { id: 'cat_freelance', name: 'Freelance', icon: '💻', type: 'income', isCustom: false },
  { id: 'cat_referral_bonus', name: 'Referral Bonus', icon: '🎁', type: 'income', isCustom: false },
  { id: 'cat_refund', name: 'Refund', icon: '↩️', type: 'income', isCustom: false },
  { id: 'cat_cashback', name: 'Cashback', icon: '💵', type: 'income', isCustom: false },
  { id: 'cat_p2p_received', name: 'P2P Transfer Received', icon: '📥', type: 'income', isCustom: false },
  { id: 'cat_gifts', name: 'Gifts', icon: '🎁', type: 'income', isCustom: false },
  { id: 'cat_investments', name: 'Investments', icon: '📈', type: 'income', isCustom: false },
  { id: 'cat_other_income', name: 'Other Income', icon: '💰', type: 'income', isCustom: false },
];