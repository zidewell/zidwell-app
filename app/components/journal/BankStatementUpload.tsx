"use client";

import { useState, useRef } from 'react';
import { 
  Upload, FileText, X, CheckCircle2, AlertCircle, Loader2, 
  ArrowLeft, ArrowRight, Lock, Key, Sparkles
} from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { useJournal } from '@/app/context/JournalContext';
import { useTier } from '@/app/context/TierContext';
import { toast } from 'sonner';

import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from './types';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'preview' | 'completed' | 'error' | 'password_required';
  error?: string;
  entriesAdded?: number;
  passwordAttempts?: number;
  previewData?: {
    totalRows: number;
    entries: Array<{
      date: string;
      description: string;
      type: 'income' | 'expense';
      amount: number;
      category: string;
      categoryId: string;
      note: string;
      reference?: string;
      balance?: number;
    }>;
    summary: {
      totalIncome: number;
      totalExpenses: number;
      netBalance: number;
    };
  };
}

interface BankStatementUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: () => void;
}

function PasswordDialog({ 
  open, 
  onClose, 
  onConfirm,
  fileName, 
  error 
}: { 
  open: boolean; 
  onClose: () => void; 
  onConfirm: (password: string) => void; 
  fileName: string; 
  error?: string;
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleConfirm = () => {
    if (!password.trim()) {
      toast.error('Please enter the password');
      return;
    }
    onConfirm(password);
    setPassword('');
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-(--bg-primary) border-(--border-color)">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-(--color-accent-yellow)/10">
              <Lock className="h-5 w-5 text-(--color-accent-yellow)" />
            </div>
            <DialogTitle className="text-xl text-(--text-primary) font-display">
              Password Protected PDF
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <p className="text-(--text-secondary) text-sm">
            The file <span className="font-medium text-(--text-primary)">{fileName}</span> is password protected. 
            Please enter the password to view and import the transactions.
          </p>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-(--text-secondary) block">
              PDF Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter PDF password..."
                className="border-(--border-color) bg-(--bg-primary) text-(--text-primary) pr-10"
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-secondary) hover:text-(--text-primary)"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!password.trim()}
              className="flex-1 bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
            >
              <Key className="h-4 w-4 mr-2" />
              Unlock & Preview
            </Button>
          </div>

          <p className="text-xs text-(--text-secondary) text-center border-t border-(--border-color) pt-4">
            Your password is not stored. It's only used to unlock this PDF for processing.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function findMatchingCategory(description: string, type: 'income' | 'expense'): { category: string; categoryId: string } {
  const desc = description.toLowerCase().trim();
  
  const incomeCategoryMap: Record<string, { id: string; keywords: string[] }> = {};
  
  INCOME_CATEGORIES.forEach(cat => {
    const keywords: string[] = [];
    const name = cat.name.toLowerCase();
    
    keywords.push(name);
    
    switch(cat.id) {
      case 'salary':
        keywords.push('salary', 'wage', 'payroll', 'monthly pay', 'compensation', 'pay', 'salary payment');
        break;
      case 'bonus':
        keywords.push('bonus', 'incentive', 'reward', 'performance bonus');
        break;
      case 'freelance':
        keywords.push('freelance', 'contract', 'gig', 'consulting', 'project fee', 'service fee', 'contractor');
        break;
      case 'consulting_fees':
        keywords.push('consulting', 'advisory', 'professional service', 'consultancy', 'consultant');
        break;
      case 'commission_earned':
        keywords.push('commission', 'brokerage', 'agent fee', 'broker');
        break;
      case 'service_income':
        keywords.push('service', 'consultation', 'professional', 'consultancy fee', 'service fee');
        break;
      case 'sales_revenue':
        keywords.push('sales', 'revenue', 'turnover', 'sale', 'product sales', 'retail sales', 'sales revenue');
        break;
      case 'wholesale_income':
        keywords.push('wholesale', 'bulk sales', 'distributor', 'wholesale income');
        break;
      case 'retail_sales':
        keywords.push('retail', 'store sales', 'shop sales', 'retail sales');
        break;
      case 'client_payments':
        keywords.push('client', 'customer payment', 'invoice payment', 'client payment');
        break;
      case 'project_income':
        keywords.push('project', 'contract work', 'deliverable', 'project payment');
        break;
      case 'investment_income':
        keywords.push('investment', 'dividend', 'return', 'yield', 'capital', 'investment return');
        break;
      case 'dividends':
        keywords.push('dividend', 'share profit', 'stock dividend');
        break;
      case 'stock_profits':
        keywords.push('stock', 'trading', 'equity', 'share', 'market profit', 'stock trade');
        break;
      case 'crypto_gains':
        keywords.push('crypto', 'bitcoin', 'ethereum', 'blockchain', 'coin', 'token', 'crypto gain');
        break;
      case 'interest_earned':
        keywords.push('interest', 'savings interest', 'bank interest', 'interest earned');
        break;
      case 'rental_income':
        keywords.push('rental', 'rent', 'lease', 'tenant', 'property income', 'rental income');
        break;
      case 'capital_gains':
        keywords.push('capital gain', 'asset sale', 'investment profit');
        break;
      case 'online_sales':
        keywords.push('online sale', 'ecommerce', 'shopify', 'website sale', 'digital sale');
        break;
      case 'content_creation':
        keywords.push('content', 'video', 'youtube', 'social media', 'influencer', 'creator', 'content creation');
        break;
      case 'royalties':
        keywords.push('royalty', 'intellectual property', 'license', 'patent');
        break;
      case 'affiliate_income':
        keywords.push('affiliate', 'referral', 'commission from affiliate');
        break;
      case 'digital_products':
        keywords.push('digital product', 'ebook', 'course', 'software', 'digital download');
        break;
      case 'tips':
        keywords.push('tip', 'gratuity', 'service charge');
        break;
      case 'allowance':
        keywords.push('allowance', 'stipend', 'pocket money');
        break;
      case 'side_hustle':
        keywords.push('side hustle', 'part time', 'extra income', 'side income');
        break;
      case 'refunds':
        keywords.push('refund', 'return', 'reversal', 'chargeback');
        break;
      case 'reimbursements':
        keywords.push('reimbursement', 'expense claim', 'expense refund');
        break;
      case 'grants_funding':
        keywords.push('grant', 'funding', 'sponsorship', 'seed funding');
        break;
      case 'government_support':
        keywords.push('government', 'social benefit', 'welfare', 'subsidy');
        break;
      case 'loan_received':
        keywords.push('loan received', 'loan disbursement', 'borrowing');
        break;
      case 'gifts_received':
        keywords.push('gift', 'present', 'donation');
        break;
      default:
        keywords.push(cat.name.toLowerCase());
    }
    
    incomeCategoryMap[cat.id] = {
      id: cat.id,
      keywords: keywords
    };
  });

  const expenseCategoryMap: Record<string, { id: string; keywords: string[] }> = {};
  
  EXPENSE_CATEGORIES.forEach(cat => {
    const keywords: string[] = [];
    const name = cat.name.toLowerCase();
    
    keywords.push(name);
    
    switch(cat.id) {
      case 'food':
        keywords.push('food', 'restaurant', 'meal', 'groceries', 'dining', 'eat', 'cafe', 'lunch', 'dinner', 'breakfast', 'snack', 'foodstuff');
        break;
      case 'household_items':
        keywords.push('household', 'home supplies', 'cleaning', 'household items', 'home');
        break;
      case 'bills':
        keywords.push('bill', 'utility', 'invoice', 'monthly bill');
        break;
      case 'electricity_bill':
        keywords.push('electricity', 'power', 'electric', 'energy', 'light bill', 'nepa', 'prepaid meter');
        break;
      case 'water_bill':
        keywords.push('water', 'sewage', 'water bill', 'water service');
        break;
      case 'fuel':
        keywords.push('fuel', 'gasoline', 'diesel', 'petrol', 'gas', 'filling station');
        break;
      case 'data_internet':
        keywords.push('data', 'internet', 'wifi', 'bundle', 'subscription data', 'broadband', 'fiber');
        break;
      case 'call_airtime':
        keywords.push('airtime', 'call time', 'phone credit', 'recharge', 'top up', 'call');
        break;
      case 'transport':
        keywords.push('transport', 'transportation', 'cab', 'uber', 'bolt', 'taxi', 'bus', 'train', 'metro', 'commute', 'okada', 'keke');
        break;
      case 'cash_withdrawal':
        keywords.push('withdrawal', 'atm', 'cash out', 'cash withdrawal', 'withdraw');
        break;
      case 'children_expenses':
        keywords.push('children', 'child', 'kid', 'school child', 'childcare', 'child care', 'daycare');
        break;
      case 'family_support':
        keywords.push('family', 'relative', 'parents', 'mother', 'father', 'support family', 'family support');
        break;
      case 'gifts_given':
        keywords.push('gift', 'present', 'birthday gift', 'wedding gift', 'anniversary');
        break;
      case 'hospital_bills':
        keywords.push('hospital', 'medical bill', 'clinic', 'doctor', 'surgery', 'treatment', 'healthcare');
        break;
      case 'medication':
        keywords.push('medication', 'drugs', 'pharmacy', 'prescription', 'medicine', 'drug');
        break;
      case 'digital_subscriptions':
        keywords.push('subscription', 'netflix', 'spotify', 'apple music', 'streaming', 'app subscription', 'software subscription');
        break;
      case 'vehicle_maintenance':
        keywords.push('car maintenance', 'vehicle repair', 'oil change', 'tyre', 'tire', 'auto repair', 'mechanic', 'car repair');
        break;
      case 'religious_giving':
        keywords.push('tithe', 'offering', 'church', 'mosque', 'religious', 'tithing', 'donation church', 'pastor');
        break;
      case 'charity_donations':
        keywords.push('charity', 'donation', 'nonprofit', 'ngo', 'charitable', 'giving back', 'aid');
        break;
      case 'inventory_stock':
        keywords.push('inventory', 'stock', 'supplies', 'merchandise', 'inventory purchase', 'stock take');
        break;
      case 'logistics_delivery':
        keywords.push('logistics', 'delivery', 'shipping', 'courier', 'freight');
        break;
      case 'shop_rent':
        keywords.push('shop rent', 'store rent', 'shop rent', 'market rent');
        break;
      case 'staff_salaries':
        keywords.push('staff salary', 'employee salary', 'wages', 'staff pay', 'worker salary');
        break;
      case 'school_fees':
        keywords.push('school fees', 'tuition', 'education', 'school payment', 'academic');
        break;
      case 'marketing_ads':
        keywords.push('marketing', 'advertising', 'ads', 'promotion', 'social media ad');
        break;
      case 'bank_charges':
        keywords.push('bank charge', 'pos fee', 'transaction fee', 'bank fee', 'transfer fee', 'charges');
        break;
      case 'rent_personal':
        keywords.push('rent', 'apartment', 'house rent', 'accommodation');
        break;
      case 'rent_business':
        keywords.push('office rent', 'business rent', 'commercial rent');
        break;
      case 'loan_repayment':
        keywords.push('loan repayment', 'loan payback', 'loan payment');
        break;
      case 'debt_payment':
        keywords.push('debt payment', 'debt repayment', 'debt clearance');
        break;
      case 'taxes':
        keywords.push('tax', 'vat', 'withholding tax', 'tax payment');
        break;
      case 'insurance':
        keywords.push('insurance', 'premium', 'health insurance', 'car insurance');
        break;
      case 'clothing_fashion':
        keywords.push('clothing', 'fashion', 'clothes', 'shoes', 'dress', 'outfit');
        break;
      case 'beauty_personal_care':
        keywords.push('beauty', 'personal care', 'hair', 'makeup', 'spa', 'salon');
        break;
      case 'transfer_to_self':
        keywords.push('transfer to self', 'self transfer', 'own account');
        break;
      case 'transfer_to_savings':
        keywords.push('savings', 'save', 'savings transfer');
        break;
      default:
        keywords.push(cat.name.toLowerCase());
    }
    
    expenseCategoryMap[cat.id] = {
      id: cat.id,
      keywords: keywords
    };
  });

  const categoryMap = type === 'income' ? incomeCategoryMap : expenseCategoryMap;
  
  let bestMatch = '';
  let bestMatchId = '';
  let highestScore = 0;

  for (const [id, data] of Object.entries(categoryMap)) {
    let score = 0;
    for (const keyword of data.keywords) {
      if (desc.includes(keyword)) {
        score += keyword.length;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = data.id;
      bestMatchId = id;
    }
  }

  if (!bestMatch) {
    if (type === 'income') {
      return { category: 'Other Income', categoryId: 'other_income' };
    } else {
      if (desc.includes('transfer') || desc.includes('send')) {
        return { category: 'Transfer to Self', categoryId: 'transfer_to_self' };
      }
      return { category: 'Other Expense', categoryId: 'other_expense' };
    }
  }

  const categoryList = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const matchedCategory = categoryList.find(cat => cat.id === bestMatchId);
  
  return {
    category: matchedCategory?.name || bestMatch,
    categoryId: bestMatchId
  };
}

export function BankStatementUpload({ open, onOpenChange, onUploadComplete }: BankStatementUploadProps) {
  const { addEntry, activeJournalType, refetch, userId } = useJournal();
  const { isPremium } = useTier();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [storedFiles, setStoredFiles] = useState<Map<string, File>>(new Map());
  
  const [passwordDialog, setPasswordDialog] = useState<{
    open: boolean;
    fileId: string;
    fileName: string;
    error?: string;
  }>({ open: false, fileId: '', fileName: '' });

  const entriesPerPage = 50;
  const selectedFile = files.find(f => f.id === selectedFileId);
  const previewData = selectedFile?.previewData;
  const isPreviewReady = selectedFile?.status === 'preview' && previewData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const parsePDF = async (file: File, password?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (password) {
      formData.append('password', password);
    }

    const response = await fetch('/api/journal/parse-pdf', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      if (result.needsPassword) {
        throw new Error('PASSWORD_REQUIRED');
      }
      if (result.passwordError) {
        throw new Error('INVALID_PASSWORD');
      }
      throw new Error(result.error || 'Failed to parse PDF');
    }

    const data = result.data;
    
    if (!data.transactions || data.transactions.length === 0) {
      throw new Error('No transactions found in the PDF');
    }
    
    const entries = data.transactions.map((tx: any) => {
      const type = tx.type === 'credit' ? 'income' : tx.type === 'debit' ? 'expense' : 'expense';
      const amount = Math.abs(tx.amount);
      const { category, categoryId } = findMatchingCategory(tx.description, type);

      return {
        date: tx.date,
        description: tx.description || 'No description',
        type: type as 'income' | 'expense',
        amount: amount,
        category: category,
        categoryId: categoryId,
        note: tx.description || 'Imported from bank statement',
        reference: tx.reference,
        balance: tx.balance,
      };
    });

    const totalIncome = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);

    return {
      totalRows: entries.length,
      entries: entries,
      summary: {
        totalIncome: totalIncome,
        totalExpenses: totalExpenses,
        netBalance: totalIncome - totalExpenses,
      },
      pageCount: data.pageCount || 1,
      fileName: data.fileName || file.name,
    };
  };

  const handleFileSelect = async (fileList: FileList | null) => {
    if (!fileList) return;

    for (const file of fileList) {
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        toast.error(`"${file.name}" is not a PDF file. Please upload PDF files.`);
        continue;
      }

      const fileId = crypto.randomUUID();
      
      storedFiles.set(fileId, file);
      
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'processing',
        passwordAttempts: 0,
      };

      setFiles(prev => [...prev, newFile]);

      try {
        const previewData = await parsePDF(file);
        setFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'preview', previewData }
              : f
          )
        );
        if (!selectedFileId) setSelectedFileId(fileId);
        toast.success(`Parsed ${previewData.totalRows} transactions from ${file.name}`);
      } catch (error: any) {
        if (error.message === 'PASSWORD_REQUIRED') {
          setFiles(prev =>
            prev.map(f =>
              f.id === fileId
                ? { ...f, status: 'password_required' }
                : f
            )
          );
          setPasswordDialog({
            open: true,
            fileId: fileId,
            fileName: file.name,
          });
        } else {
          setFiles(prev =>
            prev.map(f =>
              f.id === fileId
                ? { ...f, status: 'error', error: error.message }
                : f
            )
          );
          toast.error(`Failed to parse "${file.name}": ${error.message}`);
        }
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePasswordConfirm = async (password: string) => {
    const file = files.find(f => f.id === passwordDialog.fileId);
    if (!file) {
      setPasswordDialog({ open: false, fileId: '', fileName: '' });
      return;
    }

    const actualFile = storedFiles.get(file.id);
    if (!actualFile) {
      toast.error('File not found. Please re-upload.');
      setPasswordDialog({ open: false, fileId: '', fileName: '' });
      return;
    }

    try {
      const previewData = await parsePDF(actualFile, password);
      setFiles(prev =>
        prev.map(f =>
          f.id === file.id
            ? { ...f, status: 'preview', previewData, passwordAttempts: 0 }
            : f
        )
      );
      if (!selectedFileId) setSelectedFileId(file.id);
      setPasswordDialog({ open: false, fileId: '', fileName: '' });
      toast.success(`Unlocked! ${previewData.totalRows} transactions found`);
    } catch (error: any) {
      if (error.message === 'INVALID_PASSWORD') {
        const attempts = (file.passwordAttempts || 0) + 1;
        setFiles(prev =>
          prev.map(f =>
            f.id === file.id
              ? { ...f, passwordAttempts: attempts }
              : f
          )
        );

        if (attempts >= 3) {
          setFiles(prev =>
            prev.map(f =>
              f.id === file.id
                ? { ...f, status: 'error', error: 'Too many failed attempts' }
                : f
            )
          );
          setPasswordDialog({ open: false, fileId: '', fileName: '' });
          toast.error('Too many failed attempts. Please try re-uploading the file.');
          storedFiles.delete(file.id);
        } else {
          setPasswordDialog({
            open: true,
            fileId: file.id,
            fileName: file.name,
            error: `Incorrect password. ${3 - attempts} attempts remaining`
          });
        }
      } else {
        toast.error(`Error: ${error.message}`);
        setPasswordDialog({ open: false, fileId: '', fileName: '' });
      }
    }
  };

  const handleImportAll = async () => {
    const filesToImport = files.filter(f => f.status === 'preview' && f.previewData);
    if (filesToImport.length === 0) {
      toast.error('No files ready to import');
      return;
    }

    setIsProcessing(true);
    let totalImported = 0;

    for (const file of filesToImport) {
      try {
        const entries = file.previewData!.entries;
        let added = 0;

        for (const entry of entries) {
          try {
            const response = await fetch('/api/journal/entries', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: userId,
                date: entry.date,
                type: entry.type,
                amount: entry.amount,
                categoryId: entry.categoryId,
                note: entry.note || `Imported from ${file.name}`,
                journalType: activeJournalType,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to add entry');
            }

            added++;
          } catch (err) {
            console.error('Failed to add entry:', err);
          }
        }

        totalImported += added;
        setFiles(prev =>
          prev.map(f =>
            f.id === file.id
              ? { ...f, status: 'completed', entriesAdded: added }
              : f
          )
        );
      } catch (error) {
        setFiles(prev =>
          prev.map(f =>
            f.id === file.id
              ? { ...f, status: 'error', error: 'Failed to import' }
              : f
          )
        );
      }
    }

    setIsProcessing(false);
    await refetch();
    if (onUploadComplete) onUploadComplete();
    toast.success(`Imported ${totalImported} transactions!`);
    onOpenChange(false);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    storedFiles.delete(id);
    if (selectedFileId === id) {
      setSelectedFileId(files.find(f => f.id !== id)?.id || null);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setSelectedFileId(null);
    setCurrentPage(1);
    storedFiles.clear();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (!isPremium) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl bg-(--bg-primary) border-(--border-color)">
          <DialogHeader>
            <DialogTitle className="text-xl text-(--text-primary) font-display">
              Upload Bank Statement
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <div className="p-4 rounded-full bg-(--color-accent-yellow)/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Lock className="h-8 w-8 text-(--color-accent-yellow)" />
            </div>
            <h3 className="text-lg font-semibold text-(--text-primary) mb-2">Premium Feature</h3>
            <p className="text-(--text-secondary) mb-6">
              Upload bank statements and automatically import transactions into your journal.
            </p>
            <Button
              onClick={() => {
                onOpenChange(false);
                window.dispatchEvent(new CustomEvent('openUpgradeModal'));
              }}
              className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto bg-(--bg-primary) border-(--border-color)">
          <DialogHeader>
            <DialogTitle className="text-xl text-(--text-primary) font-display">
              Upload Bank Statement
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div
              className={cn(
                'border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer',
                dragActive
                  ? 'border-(--color-accent-yellow) bg-(--color-accent-yellow)/5'
                  : 'border-(--border-color) hover:border-(--color-accent-yellow)/50'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <Upload className="h-12 w-12 mx-auto text-(--text-secondary)/40 mb-4" />
              <p className="text-(--text-primary) font-medium">
                Drop your bank statement PDF here or click to browse
              </p>
              <p className="text-sm text-(--text-secondary) mt-1">
                Supports PDF files (including password-protected PDFs)
              </p>
              <p className="text-xs text-(--text-secondary) mt-2">
                Extracts transactions from Nigerian bank statements
              </p>
            </div>

            {files.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <p className="text-sm font-medium text-(--text-secondary)">
                    {files.length} file{files.length > 1 ? 's' : ''} uploaded
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {files.some(f => f.status === 'preview') && (
                      <Button
                        onClick={handleImportAll}
                        disabled={isProcessing}
                        className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Import All Transactions
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={clearAll}
                      variant="outline"
                      className="border-(--border-color) text-(--text-secondary)"
                      disabled={isProcessing}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all cursor-pointer',
                        selectedFileId === file.id
                          ? 'border-(--color-accent-yellow) bg-(--color-accent-yellow)/10'
                          : 'border-(--border-color) hover:bg-(--bg-secondary)',
                        file.status === 'completed' && 'border-success/50 bg-success/5',
                        file.status === 'error' && 'border-destructive/50 bg-destructive/5',
                        file.status === 'password_required' && 'border-(--color-accent-yellow)/50'
                      )}
                      onClick={() => {
                        if (file.status === 'password_required') {
                          setPasswordDialog({
                            open: true,
                            fileId: file.id,
                            fileName: file.name,
                          });
                          return;
                        }
                        if (file.status === 'preview' || file.status === 'completed') {
                          setSelectedFileId(file.id);
                          setCurrentPage(1);
                        }
                      }}
                    >
                      <FileText className={cn(
                        'h-4 w-4 flex-shrink-0',
                        file.status === 'completed' ? 'text-success' :
                        file.status === 'error' ? 'text-destructive' :
                        'text-(--text-secondary)'
                      )} />
                      <span className="text-sm truncate max-w-[120px]">{file.name}</span>
                      {file.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-success flex-shrink-0" />}
                      {file.status === 'error' && <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />}
                      {file.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin text-(--color-accent-yellow) flex-shrink-0" />}
                      {file.status === 'password_required' && <Lock className="h-3 w-3 text-(--color-accent-yellow) flex-shrink-0" />}
                      <button
                        type="button"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          removeFile(file.id); 
                        }}
                        className="ml-1 p-0.5 hover:bg-(--bg-primary) rounded flex-shrink-0"
                      >
                        <X className="h-3 w-3 text-(--text-secondary)" />
                      </button>
                    </div>
                  ))}
                </div>

                {isPreviewReady && previewData.entries.length > 0 && (
                  <div className="border border-(--border-color) rounded-xl overflow-hidden">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-(--bg-secondary) border-b border-(--border-color)">
                      <div>
                        <p className="text-xs text-(--text-secondary) uppercase tracking-wider">Total Transactions</p>
                        <p className="font-semibold text-(--text-primary)">{previewData.totalRows}</p>
                      </div>
                      <div>
                        <p className="text-xs text-(--text-secondary) uppercase tracking-wider">Total Income</p>
                        <p className="font-semibold text-success">{formatCurrency(previewData.summary.totalIncome)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-(--text-secondary) uppercase tracking-wider">Total Expenses</p>
                        <p className="font-semibold text-destructive">{formatCurrency(previewData.summary.totalExpenses)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-(--text-secondary) uppercase tracking-wider">Net Balance</p>
                        <p className={cn(
                          'font-semibold',
                          previewData.summary.netBalance >= 0 ? 'text-success' : 'text-destructive'
                        )}>
                          {formatCurrency(previewData.summary.netBalance)}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-(--bg-primary) z-10">
                          <tr className="border-b border-(--border-color)">
                            <th className="px-4 py-2 text-left text-(--text-secondary) text-xs uppercase tracking-wider">Date</th>
                            <th className="px-4 py-2 text-left text-(--text-secondary) text-xs uppercase tracking-wider">Description</th>
                            <th className="px-4 py-2 text-left text-(--text-secondary) text-xs uppercase tracking-wider">Reference</th>
                            <th className="px-4 py-2 text-left text-(--text-secondary) text-xs uppercase tracking-wider">Category</th>
                            <th className="px-4 py-2 text-left text-(--text-secondary) text-xs uppercase tracking-wider">Type</th>
                            <th className="px-4 py-2 text-right text-(--text-secondary) text-xs uppercase tracking-wider">Amount</th>
                            <th className="px-4 py-2 text-right text-(--text-secondary) text-xs uppercase tracking-wider">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.entries
                            .slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage)
                            .map((entry, idx) => (
                              <tr key={idx} className="border-b border-(--border-color) hover:bg-(--bg-secondary)/50">
                                <td className="px-4 py-2 text-(--text-primary) whitespace-nowrap">{entry.date}</td>
                                <td className="px-4 py-2 text-(--text-primary) max-w-[300px] truncate" title={entry.description}>
                                  {entry.description}
                                </td>
                                <td className="px-4 py-2 text-(--text-secondary) text-xs font-mono">
                                  {entry.reference || '-'}
                                </td>
                                <td className="px-4 py-2 text-(--text-primary)">
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-(--bg-secondary)">
                                    {entry.category}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <span className={cn(
                                    'text-xs px-2 py-0.5 rounded-full font-medium',
                                    entry.type === 'income'
                                      ? 'bg-green-500/20 text-green-600'
                                      : 'bg-red-500/20 text-red-600'
                                  )}>
                                    {entry.type === 'income' ? 'CREDIT' : 'DEBIT'}
                                  </span>
                                </td>
                                <td className={cn(
                                  'px-4 py-2 text-right font-semibold',
                                  entry.type === 'income' ? 'text-green-600' : 'text-red-600'
                                )}>
                                  {entry.type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
                                </td>
                                <td className="px-4 py-2 text-right text-(--text-secondary) font-mono">
                                  {entry.balance ? formatCurrency(entry.balance) : '-'}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    {Math.ceil(previewData.entries.length / entriesPerPage) > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-(--border-color) bg-(--bg-secondary) flex-wrap gap-2">
                        <p className="text-xs text-(--text-secondary)">
                          Showing {((currentPage - 1) * entriesPerPage) + 1} - {Math.min(currentPage * entriesPerPage, previewData.entries.length)} of {previewData.entries.length}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-8 px-3"
                          >
                            <ArrowLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <span className="flex items-center px-3 text-sm text-(--text-secondary)">
                            Page {currentPage} of {Math.ceil(previewData.entries.length / entriesPerPage)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(previewData.entries.length / entriesPerPage), p + 1))}
                            disabled={currentPage === Math.ceil(previewData.entries.length / entriesPerPage)}
                            className="h-8 px-3"
                          >
                            Next
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {isPreviewReady && previewData.entries.length === 0 && (
                  <div className="border border-(--border-color) rounded-xl p-8 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-(--color-accent-yellow) mb-4" />
                    <p className="text-(--text-primary) font-medium">No transactions found</p>
                    <p className="text-sm text-(--text-secondary) mt-1">
                      The PDF was parsed but no transactions were extracted. This could be because:
                    </p>
                    <ul className="text-sm text-(--text-secondary) mt-2 text-left max-w-md mx-auto">
                      <li>• The PDF format is not supported</li>
                      <li>• The PDF is scanned (image-based) rather than text-based</li>
                      <li>• The statement format is different from what's expected</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-(--text-secondary) text-center">
            Your data is processed securely. No data is stored permanently.
          </p>
        </DialogContent>
      </Dialog>

      <PasswordDialog
        open={passwordDialog.open}
        onClose={() => {
          setPasswordDialog({ open: false, fileId: '', fileName: '' });
        }}
        onConfirm={handlePasswordConfirm}
        fileName={passwordDialog.fileName}
        error={passwordDialog.error}
      />
    </>
  );
}