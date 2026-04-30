// app/components/journal/types.ts

export type JournalType = 'personal' | 'business';
export type EntryType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: EntryType | 'both';
  isCustom: boolean;
  isFavorite?: boolean; // Add favorite flag
  favoriteOrder?: number; // Order for favorites
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

// INCOME CATEGORIES
export const INCOME_CATEGORIES: Omit<Category, 'isCustom' | 'isFavorite' | 'favoriteOrder'>[] = [
  // Business Income
  { id: 'sales_revenue', name: 'Sales Revenue', icon: '💼', type: 'income' },
  { id: 'service_income', name: 'Service Income', icon: '🧾', type: 'income' },
  { id: 'wholesale_income', name: 'Wholesale Income', icon: '📦', type: 'income' },
  { id: 'retail_sales', name: 'Retail Sales', icon: '🛍️', type: 'income' },
  { id: 'freelance', name: 'Freelance / Contract Work', icon: '💻', type: 'income' },
  { id: 'consulting_fees', name: 'Consulting Fees', icon: '🧑‍💻', type: 'income' },
  { id: 'commission_earned', name: 'Commission Earned', icon: '📈', type: 'income' },
  { id: 'partnership_income', name: 'Partnership Income', icon: '🤝', type: 'income' },
  { id: 'client_payments', name: 'Client Payments', icon: '🏢', type: 'income' },
  { id: 'project_income', name: 'Project-Based Income', icon: '💡', type: 'income' },
  
  // Personal Income
  { id: 'salary', name: 'Salary', icon: '💵', type: 'income' },
  { id: 'bonus', name: 'Bonus', icon: '🎁', type: 'income' },
  { id: 'tips', name: 'Tips', icon: '💸', type: 'income' },
  { id: 'allowance', name: 'Allowance', icon: '🧾', type: 'income' },
  { id: 'side_hustle', name: 'Side Hustle', icon: '🧑‍🏫', type: 'income' },
  
  // Investment Income
  { id: 'investment_income', name: 'Investment Income', icon: '🏦', type: 'income' },
  { id: 'dividends', name: 'Dividends', icon: '📊', type: 'income' },
  { id: 'stock_profits', name: 'Stock/Trading Profits', icon: '💹', type: 'income' },
  { id: 'crypto_gains', name: 'Crypto Gains', icon: '🪙', type: 'income' },
  { id: 'interest_earned', name: 'Interest Earned', icon: '🏦', type: 'income' },
  { id: 'rental_income', name: 'Rental Income', icon: '🏘️', type: 'income' },
  { id: 'capital_gains', name: 'Capital Gains', icon: '📈', type: 'income' },
  
  // Digital & Online Income
  { id: 'online_sales', name: 'Online Sales', icon: '💻', type: 'income' },
  { id: 'content_creation', name: 'Content Creation', icon: '📱', type: 'income' },
  { id: 'royalties', name: 'Royalties', icon: '🎧', type: 'income' },
  { id: 'affiliate_income', name: 'Affiliate Income', icon: '🧾', type: 'income' },
  { id: 'digital_products', name: 'Digital Products', icon: '🛒', type: 'income' },
  
  // Other Income
  { id: 'other_income', name: 'Other Income', icon: '🎁', type: 'income' },
  { id: 'gifts_received', name: 'Gifts Received', icon: '🎁', type: 'income' },
  { id: 'grants_funding', name: 'Grants / Funding', icon: '💰', type: 'income' },
  { id: 'government_support', name: 'Government Support', icon: '🏛️', type: 'income' },
  { id: 'refunds', name: 'Refunds', icon: '💳', type: 'income' },
  { id: 'reimbursements', name: 'Reimbursements', icon: '🔁', type: 'income' },
  { id: 'loan_received', name: 'Loan Received', icon: '🧾', type: 'income' },
];

// EXPENSE CATEGORIES
export const EXPENSE_CATEGORIES: Omit<Category, 'isCustom' | 'isFavorite' | 'favoriteOrder'>[] = [
  // Business Expenses
  { id: 'inventory', name: 'Inventory / Stock Purchase', icon: '📦', type: 'expense' },
  { id: 'logistics', name: 'Logistics & Delivery', icon: '🚚', type: 'expense' },
  { id: 'shop_rent', name: 'Shop Rent', icon: '🏪', type: 'expense' },
  { id: 'utilities_business', name: 'Utilities (Business)', icon: '💡', type: 'expense' },
  { id: 'staff_salaries', name: 'Staff Salaries', icon: '🧑‍💼', type: 'expense' },
  { id: 'contractor_payments', name: 'Contractor Payments', icon: '🤝', type: 'expense' },
  { id: 'marketing_ads', name: 'Marketing & Ads', icon: '📢', type: 'expense' },
  { id: 'branding_design', name: 'Branding & Design', icon: '🎨', type: 'expense' },
  { id: 'software_tools', name: 'Software & Tools', icon: '💻', type: 'expense' },
  { id: 'professional_fees', name: 'Professional Fees', icon: '🧾', type: 'expense' },
  { id: 'bank_charges', name: 'Bank Charges / POS Fees', icon: '🏦', type: 'expense' },
  { id: 'business_compliance', name: 'Business Compliance', icon: '🧾', type: 'expense' },
  { id: 'equipment_purchase', name: 'Equipment Purchase', icon: '🛠️', type: 'expense' },
  { id: 'repairs_maintenance', name: 'Repairs & Maintenance', icon: '🔧', type: 'expense' },
  
  // Rent & Utilities (Personal)
  { id: 'rent_personal', name: 'Rent (Personal)', icon: '🏠', type: 'expense' },
  { id: 'electricity', name: 'Electricity Bill', icon: '💡', type: 'expense' },
  { id: 'water', name: 'Water Bill', icon: '💧', type: 'expense' },
  
  // Food & Household
  { id: 'food_groceries', name: 'Food & Groceries', icon: '🍽️', type: 'expense' },
  { id: 'household_items', name: 'Household Items', icon: '🛒', type: 'expense' },
  { id: 'cleaning', name: 'Cleaning', icon: '🧼', type: 'expense' },
  
  // Transport
  { id: 'transport', name: 'Transport', icon: '🚗', type: 'expense' },
  { id: 'fuel', name: 'Fuel', icon: '⛽', type: 'expense' },
  { id: 'vehicle_maintenance', name: 'Vehicle Maintenance', icon: '🚗', type: 'expense' },
  
  // Travel
  { id: 'travel_flights', name: 'Travel / Flights', icon: '✈️', type: 'expense' },
  { id: 'hotel', name: 'Hotel Bill', icon: '🧳', type: 'expense' },
  
  // Family & Lifestyle
  { id: 'school_fees', name: 'School Fees', icon: '🎓', type: 'expense' },
  { id: 'children_expenses', name: 'Children Expenses', icon: '🧸', type: 'expense' },
  { id: 'family_support', name: 'Family Support', icon: '👨‍👩‍👧‍👦', type: 'expense' },
  { id: 'gifts_given', name: 'Gifts Given', icon: '🎁', type: 'expense' },
  { id: 'events', name: 'Events', icon: '💒', type: 'expense' },
  
  // Health & Wellness
  { id: 'hospital_bills', name: 'Hospital Bills', icon: '🏥', type: 'expense' },
  { id: 'medication', name: 'Medication', icon: '💊', type: 'expense' },
  { id: 'health_wellness', name: 'Health & Wellness', icon: '🩺', type: 'expense' },
  
  // Digital Subscriptions
  { id: 'digital_subscriptions', name: 'Digital Subscriptions', icon: '📱', type: 'expense' },
  { id: 'data_internet', name: 'Data / Internet', icon: '📶', type: 'expense' },
  { id: 'cable_subscriptions', name: 'Cable Subscriptions', icon: '📺', type: 'expense' },
  { id: 'digital_tools', name: 'Digital Tool Purchases', icon: '📱', type: 'expense' },
  
  // Financial Obligations
  { id: 'loan_repayment', name: 'Loan Repayment', icon: '🏦', type: 'expense' },
  { id: 'debt_payment', name: 'Debt Payment', icon: '💳', type: 'expense' },
  { id: 'taxes', name: 'Taxes', icon: '🧾', type: 'expense' },
  { id: 'insurance', name: 'Insurance', icon: '💸', type: 'expense' },
  
  // Lifestyle & Discretionary
  { id: 'clothing', name: 'Clothing & Fashion', icon: '👕', type: 'expense' },
  { id: 'beauty_care', name: 'Beauty & Personal Care', icon: '💄', type: 'expense' },
  { id: 'outings_leisure', name: 'Outings & Leisure', icon: '🎮', type: 'expense' },
  { id: 'drinks_snacks', name: 'Drinks / Snacks', icon: '☕', type: 'expense' },
  
  // Large Purchases
  { id: 'property_purchase', name: 'Property Purchase', icon: '🏠', type: 'expense' },
  { id: 'car_purchase', name: 'Car Purchase', icon: '🚗', type: 'expense' },
  { id: 'gadgets_purchase', name: 'Gadgets Purchase', icon: '💻', type: 'expense' },
  { id: 'furniture', name: 'Furniture', icon: '🪑', type: 'expense' },
  
  // Transfers
  { id: 'transfer_to_self', name: 'Transfer to Self', icon: '🔁', type: 'expense' },
  { id: 'transfer_to_savings', name: 'Transfer to Savings', icon: '🏦', type: 'expense' },
  { id: 'business_to_personal', name: 'Business to Personal Transfer', icon: '💼', type: 'expense' },
  { id: 'personal_to_business', name: 'Personal to Business Transfer', icon: '🧾', type: 'expense' },
  
  // Cash & Emergency
  { id: 'cash_withdrawal', name: 'Cash Withdrawal', icon: '💳', type: 'expense' },
  { id: 'emergency_expenses', name: 'Emergency Expenses', icon: '🚨', type: 'expense' },
  
  // Other
  { id: 'other_expense', name: 'Other Expense', icon: '📦', type: 'expense' },
];

// Combine all default categories
export const DEFAULT_CATEGORIES: Category[] = [
  ...INCOME_CATEGORIES.map(cat => ({ ...cat, isCustom: false, isFavorite: false, favoriteOrder: 0 })),
  ...EXPENSE_CATEGORIES.map(cat => ({ ...cat, isCustom: false, isFavorite: false, favoriteOrder: 0 })),
];