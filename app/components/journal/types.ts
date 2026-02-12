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
  { id: 'food', name: 'Food', icon: '🍽️', type: 'expense', isCustom: false },
  { id: 'transportation', name: 'Transportation', icon: '🚗', type: 'expense', isCustom: false },
  { id: 'data-airtime', name: 'Data & Airtime', icon: '📱', type: 'expense', isCustom: false },
  { id: 'rent', name: 'Rent', icon: '🏠', type: 'expense', isCustom: false },
  { id: 'utilities', name: 'Utilities', icon: '💡', type: 'expense', isCustom: false },
  { id: 'salaries', name: 'Salaries', icon: '💰', type: 'both', isCustom: false },
  { id: 'business-expenses', name: 'Business Expenses', icon: '💼', type: 'expense', isCustom: false },
  { id: 'health', name: 'Health', icon: '🏥', type: 'expense', isCustom: false },
  { id: 'education', name: 'Education', icon: '📚', type: 'expense', isCustom: false },
  { id: 'tax', name: 'Tax', icon: '📋', type: 'expense', isCustom: false },
  { id: 'savings', name: 'Savings', icon: '🐷', type: 'expense', isCustom: false },
  { id: 'investments', name: 'Investments', icon: '📈', type: 'both', isCustom: false },
  { id: 'family-support', name: 'Family Support', icon: '👨‍👩‍👧‍👦', type: 'expense', isCustom: false },
  { id: 'sales', name: 'Sales Revenue', icon: '💵', type: 'income', isCustom: false },
  { id: 'services', name: 'Services', icon: '🛠️', type: 'income', isCustom: false },
  { id: 'freelance', name: 'Freelance', icon: '💻', type: 'income', isCustom: false },
  { id: 'gifts', name: 'Gifts', icon: '🎁', type: 'income', isCustom: false },
  { id: 'other', name: 'Other', icon: '📦', type: 'both', isCustom: false },
];