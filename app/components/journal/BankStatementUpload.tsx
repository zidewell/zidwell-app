"use client";

import { useState, useRef, useEffect } from 'react';
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

// ==================== PDF.js IMPORTS ====================
// Use the main build which handles password-protected PDFs
import * as pdfjsLib from 'pdfjs-dist';

// ==================== TYPES ====================
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

// ==================== PASSWORD DIALOG ====================
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

// ==================== MAIN COMPONENT ====================
export function BankStatementUpload({ open, onOpenChange, onUploadComplete }: BankStatementUploadProps) {
  const { addEntry, activeJournalType, categories, refetch } = useJournal();
  const { isPremium } = useTier();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [storedFiles, setStoredFiles] = useState<Map<string, File>>(new Map());
  const [workerInitialized, setWorkerInitialized] = useState(false);
  
  // Password dialog state
  const [passwordDialog, setPasswordDialog] = useState<{
    open: boolean;
    fileId: string;
    fileName: string;
    error?: string;
  }>({ open: false, fileId: '', fileName: '' });

  const entriesPerPage = 10;
  const selectedFile = files.find(f => f.id === selectedFileId);
  const previewData = selectedFile?.previewData;
  const isPreviewReady = selectedFile?.status === 'preview' && previewData;

  // ==================== SETUP PDF.JS WORKER ====================
  useEffect(() => {
    if (typeof window !== 'undefined' && !workerInitialized) {
      try {
        // For version 6.x, use the correct worker URL with .mjs extension
        const workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs';
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
        setWorkerInitialized(true);
        console.log('✅ PDF.js worker configured with version 6.1.200');
      } catch (error) {
        console.error('Failed to configure PDF worker:', error);
        // Fallback to unpkg
        pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://unpkg.com/pdfjs-dist@6.1.200/build/pdf.worker.min.mjs';
        setWorkerInitialized(true);
      }
    }
  }, [workerInitialized]);

  // ==================== HELPERS ====================
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string): string => {
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        let [m, d, y] = parts;
        if (parseInt(m) > 12) [d, m] = [m, d];
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
    return dateStr;
  };

  const findMatchingCategory = (text: string) => {
    const keywords: Record<string, string[]> = {
      food: ['food', 'restaurant', 'cafe', 'meal', 'groceries', 'supermarket'],
      transport: ['transport', 'uber', 'bolt', 'taxi', 'fuel', 'gas', 'petrol'],
      salary: ['salary', 'wage', 'payroll', 'bonus'],
      electricity_bill: ['electricity', 'energy', 'power', 'ede'],
      data_internet: ['data', 'internet', 'wifi', 'broadband'],
      call_airtime: ['airtime', 'call', 'phone', 'mtn', 'glo', 'airtel'],
      transfer: ['transfer', 'send', 'p2p', 'bank transfer'],
      withdrawal: ['withdrawal', 'atm', 'cash'],
      online_sales: ['paypal', 'stripe', 'flutterwave', 'paystack', 'online'],
      rent: ['rent', 'property', 'apartment', 'house'],
      professional_fees: ['professional fee', 'consulting', 'legal', 'consultation', 'lawyer'],
    };

    const lowerText = text.toLowerCase();
    for (const [categoryId, words] of Object.entries(keywords)) {
      if (words.some(word => lowerText.includes(word))) {
        return categories.find(c => c.id === categoryId);
      }
    }
    return null;
  };

  // ==================== PDF PARSING ====================
  const parsePDFContent = async (file: File, password?: string): Promise<{ text: string; needsPassword?: boolean }> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Create the loading task
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        password: password || undefined,
        useSystemFonts: true,
        disableFontFace: false,
      });

      // Handle password callback
      loadingTask.onPassword = (updatePassword: (password: string) => void, reason: number) => {
        console.log('Password callback triggered, reason:', reason);
        if (reason === 1) { // NEED_PASSWORD
          if (password) {
            updatePassword(password);
          } else {
            throw new Error('PASSWORD_REQUIRED');
          }
        } else if (reason === 2) { // INCORRECT_PASSWORD
          throw new Error('INVALID_PASSWORD');
        }
      };

      // Load the PDF
      const pdf = await loadingTask.promise;
      let fullText = '';

      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      return { text: fullText };
    } catch (error: any) {
      console.error('PDF parsing error:', error);
      
      // Check if it's a password error
      if (error?.message === 'PASSWORD_REQUIRED' || 
          error?.message === 'INVALID_PASSWORD' ||
          error?.message?.toLowerCase().includes('password') ||
          error?.name === 'PasswordException' ||
          error?.message?.includes('Invalid password')) {
        return { text: '', needsPassword: true };
      }
      
      throw new Error(error?.message || 'Failed to parse PDF');
    }
  };

  const parseStatementFile = async (file: File, password?: string): Promise<UploadedFile['previewData']> => {
    let text = '';

    try {
      // Parse PDF
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const result = await parsePDFContent(file, password);
        if (result.needsPassword) {
          throw new Error('PASSWORD_REQUIRED');
        }
        text = result.text || '';
      } else {
        // CSV or text files
        text = await file.text();
      }

      if (!text || text.trim().length === 0) {
        throw new Error('No text could be extracted from the file');
      }

      // Extract transactions
      const lines = text.split('\n').filter(line => line.trim());
      const entries: UploadedFile['previewData']['entries'] = [];

      for (const line of lines) {
        const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
        const amountMatch = line.match(/([\d,]+\.\d{2})/);

        if (dateMatch && amountMatch) {
          const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
          const isCredit = line.toLowerCase().includes('credit') || 
                          line.toLowerCase().includes('deposit') ||
                          line.toLowerCase().includes('inflow') ||
                          line.toLowerCase().includes('payment received');
          const isDebit = line.toLowerCase().includes('debit') || 
                         line.toLowerCase().includes('withdrawal') ||
                         line.toLowerCase().includes('outflow') ||
                         line.toLowerCase().includes('payment made');
          const category = findMatchingCategory(line);
          const date = formatDate(dateMatch[1]);

          let type: 'income' | 'expense' = 'expense';
          if (isCredit) {
            type = 'income';
          } else if (isDebit) {
            type = 'expense';
          } else if (amount > 0) {
            const hasPositiveWords = line.toLowerCase().includes('credit') || 
                                    line.toLowerCase().includes('deposit');
            type = hasPositiveWords ? 'income' : 'expense';
          }

          entries.push({
            date,
            description: line.substring(0, 200),
            type,
            amount: Math.abs(amount),
            category: category?.name || 'Other',
            categoryId: category?.id || (type === 'income' ? 'other_income' : 'other_expense'),
            note: line.substring(0, 200),
          });
        }
      }

      if (entries.length === 0) {
        throw new Error('No transactions could be extracted from the file');
      }

      const totalIncome = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
      const totalExpenses = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);

      return {
        totalRows: entries.length,
        entries,
        summary: {
          totalIncome,
          totalExpenses,
          netBalance: totalIncome - totalExpenses,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'PASSWORD_REQUIRED') {
        throw error;
      }
      console.error('Parse error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to parse file');
    }
  };

  // ==================== FILE HANDLING ====================
  const handleFileSelect = async (fileList: FileList | null) => {
    if (!fileList) return;

    for (const file of fileList) {
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
        const previewData = await parseStatementFile(file);
        setFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'preview', previewData }
              : f
          )
        );
        if (!selectedFileId) setSelectedFileId(fileId);
        toast.success(`Parsed ${previewData.totalRows} transactions`);
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
          toast.error(`Failed to parse "${file.name}"`);
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
      const previewData = await parseStatementFile(actualFile, password);
      setFiles(prev =>
        prev.map(f =>
          f.id === file.id
            ? { ...f, status: 'preview', previewData }
            : f
        )
      );
      if (!selectedFileId) setSelectedFileId(file.id);
      setPasswordDialog({ open: false, fileId: '', fileName: '' });
      toast.success(`Unlocked! ${previewData.totalRows} transactions found`);
    } catch (error: any) {
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
            await addEntry({
              date: entry.date,
              type: entry.type,
              amount: entry.amount,
              categoryId: entry.categoryId,
              note: entry.note || `Imported from ${file.name}`,
              journalType: activeJournalType,
            });
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

  // ==================== DRAG & DROP ====================
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

  // ==================== RENDER ====================
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
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-(--bg-primary) border-(--border-color)">
          <DialogHeader>
            <DialogTitle className="text-xl text-(--text-primary) font-display">
              Upload Bank Statement
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Upload Area */}
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
                accept=".csv,.xlsx,.xls,.pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <Upload className="h-12 w-12 mx-auto text-(--text-secondary)/40 mb-4" />
              <p className="text-(--text-primary) font-medium">
                Drop your bank statement here or click to browse
              </p>
              <p className="text-sm text-(--text-secondary) mt-1">
                Supports CSV, Excel, and PDF files (including password-protected PDFs)
              </p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-(--text-secondary)">
                    {files.length} file{files.length > 1 ? 's' : ''} uploaded
                  </p>
                  <div className="flex gap-2">
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

                {/* File Chips */}
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
                        setSelectedFileId(file.id);
                        setCurrentPage(1);
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

                {/* Password Required Notice */}
                {files.some(f => f.status === 'password_required') && (
                  <div className="p-4 rounded-xl bg-(--color-accent-yellow)/10 border border-(--color-accent-yellow)/30 mb-4">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-(--color-accent-yellow)" />
                      <div>
                        <p className="text-sm font-medium text-(--text-primary)">
                          Password Protected PDF Detected
                        </p>
                        <p className="text-xs text-(--text-secondary)">
                          Click the file with the lock icon to enter the password and preview transactions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview Table */}
                {isPreviewReady && (
                  <div className="border border-(--border-color) rounded-xl overflow-hidden">
                    {/* Summary */}
                    <div className="grid grid-cols-4 gap-4 p-4 bg-(--bg-secondary) border-b border-(--border-color)">
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

                    {/* Table */}
                    <div className="overflow-x-auto max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-(--bg-primary)">
                          <tr className="border-b border-(--border-color)">
                            <th className="px-4 py-2 text-left text-(--text-secondary) text-xs uppercase tracking-wider">Date</th>
                            <th className="px-4 py-2 text-left text-(--text-secondary) text-xs uppercase tracking-wider">Description</th>
                            <th className="px-4 py-2 text-left text-(--text-secondary) text-xs uppercase tracking-wider">Category</th>
                            <th className="px-4 py-2 text-left text-(--text-secondary) text-xs uppercase tracking-wider">Type</th>
                            <th className="px-4 py-2 text-right text-(--text-secondary) text-xs uppercase tracking-wider">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.entries
                            .slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage)
                            .map((entry, idx) => (
                              <tr key={idx} className="border-b border-(--border-color) hover:bg-(--bg-secondary)/50">
                                <td className="px-4 py-2 text-(--text-primary) whitespace-nowrap">{entry.date}</td>
                                <td className="px-4 py-2 text-(--text-primary) truncate max-w-[200px]">{entry.description}</td>
                                <td className="px-4 py-2 text-(--text-primary)">
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-(--bg-secondary)">
                                    {entry.category}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <span className={cn(
                                    'text-xs px-2 py-0.5 rounded-full',
                                    entry.type === 'income'
                                      ? 'bg-success/20 text-success'
                                      : 'bg-destructive/20 text-destructive'
                                  )}>
                                    {entry.type === 'income' ? 'INFLOW' : 'OUTFLOW'}
                                  </span>
                                </td>
                                <td className={cn(
                                  'px-4 py-2 text-right font-semibold',
                                  entry.type === 'income' ? 'text-success' : 'text-destructive'
                                )}>
                                  {entry.type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
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
              </div>
            )}

            <p className="text-xs text-(--text-secondary) text-center">
              Your bank statement data is processed securely. We only read transaction data to create journal entries.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
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