// app/components/journal/BankStatementUpload.tsx

"use client";

import { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Minus,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,Sparkles,Lock
} from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { cn } from '@/lib/utils';
import { useJournal } from '@/app/context/JournalContext';
import { useUserContextData } from '@/app/context/userData';
import { useTier } from '@/app/context/TierContext';
import { toast } from 'sonner';

interface BankStatementUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'preview' | 'completed' | 'error';
  error?: string;
  entriesAdded?: number;
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

// Match the same inflow/outflow types as TransactionHistory
const inflowTypes = [
  "deposit",
  "virtual_account_deposit",
  "card_deposit",
  "p2p_received",
  "p2p_credit",
  "referral",
  "referral_reward",
];

const outflowTypes = [
  "transfer",
  "withdrawal",
  "debit",
  "airtime",
  "data",
  "electricity",
  "cable",
  "p2p_transfer",
  "p2p_debit",
];

export function BankStatementUpload({ open, onOpenChange, onUploadComplete }: BankStatementUploadProps) {
  const { addEntry, activeJournalType, categories, refetch } = useJournal();
  const { userData } = useUserContextData();
  const { isPremium } = useTier();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFullStatement, setShowFullStatement] = useState(false);
  const entriesPerPage = 10;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const parseStatementFile = async (file: File): Promise<UploadedFile['previewData']> => {
    const entries: UploadedFile['previewData']['entries'] = [];
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
      const amountMatch = line.match(/([\d,]+\.\d{2})/);

      if (dateMatch && amountMatch) {
        const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        const isCredit = line.toLowerCase().includes('credit') || line.toLowerCase().includes('deposit');
        const isDebit = line.toLowerCase().includes('debit') || line.toLowerCase().includes('withdrawal');
        const category = findMatchingCategory(line);
        const date = formatDate(dateMatch[1]);

        entries.push({
          date,
          description: line.substring(0, 200),
          type: isCredit ? 'income' : 'expense',
          amount: Math.abs(amount),
          category: category?.name || 'Other',
          categoryId: category?.id || (isCredit ? 'other_income' : 'other_expense'),
          note: line.substring(0, 200),
        });
      }
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

  const formatDate = (dateStr: string): string => {
    if (dateStr.includes('/')) {
      const [m, d, y] = dateStr.split('/');
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return dateStr;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    for (const file of files) {
      const fileId = crypto.randomUUID();
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'processing',
      };

      setUploadedFiles(prev => [...prev, newFile]);

      try {
        const previewData = await parseStatementFile(file);
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'preview', previewData }
              : f
          )
        );
        if (!selectedFileId) {
          setSelectedFileId(fileId);
        }
        toast.success(`File "${file.name}" parsed successfully! ${previewData.totalRows} transactions found.`);
      } catch (error) {
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Failed to parse file' }
              : f
          )
        );
        toast.error(`Failed to parse "${file.name}"`);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportAll = async () => {
    const filesToImport = uploadedFiles.filter(f => f.status === 'preview' && f.previewData);
    if (filesToImport.length === 0) {
      toast.error('No files ready to import');
      return;
    }

    setIsProcessing(true);
    let totalImported = 0;

    for (const file of filesToImport) {
      try {
        const entries = file.previewData!.entries;
        let entriesAdded = 0;

        for (const entry of entries) {
          try {
            await addEntry({
              date: entry.date,
              type: entry.type,
              amount: entry.amount,
              categoryId: entry.categoryId,
              note: entry.note || `Imported from bank statement: ${file.name}`,
              journalType: activeJournalType,
            });
            entriesAdded++;
          } catch (err) {
            console.error('Failed to add entry:', err);
          }
        }

        totalImported += entriesAdded;
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === file.id
              ? { ...f, status: 'completed', entriesAdded }
              : f
          )
        );
      } catch (error) {
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === file.id
              ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Failed to import' }
              : f
          )
        );
      }
    }

    setIsProcessing(false);
    await refetch();
    if (onUploadComplete) onUploadComplete();
    toast.success(`Successfully imported ${totalImported} transactions!`);
    onOpenChange(false);
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
    if (selectedFileId === id) {
      setSelectedFileId(uploadedFiles.length > 1 ? uploadedFiles.find(f => f.id !== id)?.id || null : null);
    }
  };

  const clearAll = () => {
    setUploadedFiles([]);
    setSelectedFileId(null);
    setCurrentPage(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const getSelectedFile = () => {
    return uploadedFiles.find(f => f.id === selectedFileId);
  };

  const selectedFile = getSelectedFile();
  const previewData = selectedFile?.previewData;
  const isPreviewReady = selectedFile?.status === 'preview' && previewData;

  // Pagination
  const totalPages = isPreviewReady ? Math.ceil(previewData.entries.length / entriesPerPage) : 0;
  const paginatedEntries = isPreviewReady
    ? previewData.entries.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage)
    : [];

  // Full statement pagination
  const [fullStatementPage, setFullStatementPage] = useState(1);
  const fullStatementEntriesPerPage = 20;
  const fullStatementTotalPages = isPreviewReady ? Math.ceil(previewData.entries.length / fullStatementEntriesPerPage) : 0;
  const fullStatementPaginatedEntries = isPreviewReady
    ? previewData.entries.slice((fullStatementPage - 1) * fullStatementEntriesPerPage, fullStatementPage * fullStatementEntriesPerPage)
    : [];

  // Premium check
  if (!isPremium) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-(--bg-primary) border-(--border-color)">
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
                const upgradeEvent = new CustomEvent('openUpgradeModal');
                window.dispatchEvent(upgradeEvent);
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

  // Full Statement Modal
  const FullStatementModal = () => {
    if (!isPreviewReady || !selectedFile) return null;

    return (
      <Dialog open={showFullStatement} onOpenChange={setShowFullStatement}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-(--bg-primary) border-(--border-color)">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl text-(--text-primary) font-display">
                Full Statement - {selectedFile.name}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullStatement(false)}
                className="text-(--text-secondary) hover:text-(--text-primary)"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-(--bg-secondary) rounded-xl border border-(--border-color)">
              <div>
                <p className="text-xs text-(--text-secondary) uppercase tracking-wider">Total Transactions</p>
                <p className="font-semibold text-(--text-primary) text-lg">{previewData.totalRows}</p>
              </div>
              <div>
                <p className="text-xs text-(--text-secondary) uppercase tracking-wider">Total Income</p>
                <p className="font-semibold text-success text-lg">{formatCurrency(previewData.summary.totalIncome)}</p>
              </div>
              <div>
                <p className="text-xs text-(--text-secondary) uppercase tracking-wider">Total Expenses</p>
                <p className="font-semibold text-destructive text-lg">{formatCurrency(previewData.summary.totalExpenses)}</p>
              </div>
              <div>
                <p className="text-xs text-(--text-secondary) uppercase tracking-wider">Net Balance</p>
                <p className={cn(
                  'font-semibold text-lg',
                  previewData.summary.netBalance >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {formatCurrency(previewData.summary.netBalance)}
                </p>
              </div>
            </div>

            {/* Full Table */}
            <div className="border border-(--border-color) rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-(--bg-primary) z-10">
                    <tr className="border-b border-(--border-color)">
                      <th className="px-4 py-3 text-left text-(--text-secondary) text-xs uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-left text-(--text-secondary) text-xs uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-(--text-secondary) text-xs uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-(--text-secondary) text-xs uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-(--text-secondary) text-xs uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-right text-(--text-secondary) text-xs uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fullStatementPaginatedEntries.map((entry, index) => {
                      const globalIndex = (fullStatementPage - 1) * fullStatementEntriesPerPage + index + 1;
                      return (
                        <tr key={globalIndex} className="border-b border-(--border-color) hover:bg-(--bg-secondary)/50">
                          <td className="px-4 py-2 text-(--text-secondary) text-center">{globalIndex}</td>
                          <td className="px-4 py-2 text-(--text-primary) whitespace-nowrap">{entry.date}</td>
                          <td className="px-4 py-2 text-(--text-primary) max-w-[300px] truncate">{entry.description}</td>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {fullStatementTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-(--border-color) bg-(--bg-secondary)">
                  <p className="text-xs text-(--text-secondary)">
                    Showing {((fullStatementPage - 1) * fullStatementEntriesPerPage) + 1} - {Math.min(fullStatementPage * fullStatementEntriesPerPage, previewData.entries.length)} of {previewData.entries.length} entries
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFullStatementPage(p => Math.max(1, p - 1))}
                      disabled={fullStatementPage === 1}
                      className="h-8 px-3"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="flex items-center px-3 text-sm text-(--text-secondary)">
                      Page {fullStatementPage} of {fullStatementTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFullStatementPage(p => Math.min(fullStatementTotalPages, p + 1))}
                      disabled={fullStatementPage === fullStatementTotalPages}
                      className="h-8 px-3"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-(--border-color)">
            <Button
              onClick={() => setShowFullStatement(false)}
              variant="outline"
              className="border-(--border-color) text-(--text-secondary)"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

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
                'border-2 border-dashed rounded-2xl p-8 text-center transition-all',
                dragActive
                  ? 'border-(--color-accent-yellow) bg-(--color-accent-yellow)/5'
                  : 'border-(--border-color) hover:border-(--color-accent-yellow)/50',
                'cursor-pointer'
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
                Supports CSV, Excel, and PDF files
              </p>
            </div>

            {/* File List */}
            {uploadedFiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-(--text-secondary)">
                    {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} uploaded
                  </p>
                  <div className="flex gap-2">
                    {uploadedFiles.some(f => f.status === 'preview') && (
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

                {/* File Selection Tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {uploadedFiles.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => {
                        setSelectedFileId(file.id);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all',
                        selectedFileId === file.id
                          ? 'border-(--color-accent-yellow) bg-(--color-accent-yellow)/10'
                          : 'border-(--border-color) hover:bg-(--bg-secondary)',
                        file.status === 'completed' && 'border-success/50 bg-success/5',
                        file.status === 'error' && 'border-destructive/50 bg-destructive/5'
                      )}
                    >
                      <FileText className={cn(
                        'h-4 w-4',
                        file.status === 'completed' ? 'text-success' :
                        file.status === 'error' ? 'text-destructive' :
                        file.status === 'processing' ? 'text-(--color-accent-yellow)' :
                        'text-(--text-secondary)'
                      )} />
                      <span className="text-sm truncate max-w-[120px]">{file.name}</span>
                      {file.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-success" />}
                      {file.status === 'error' && <AlertCircle className="h-3 w-3 text-destructive" />}
                      {file.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin text-(--color-accent-yellow)" />}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                        className="ml-1 p-0.5 hover:bg-(--bg-primary) rounded"
                        disabled={isProcessing}
                      >
                        <X className="h-3 w-3 text-(--text-secondary)" />
                      </button>
                    </button>
                  ))}
                </div>

                {/* Preview */}
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

                    {/* Transactions Table */}
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
                          {paginatedEntries.map((entry, index) => (
                            <tr key={index} className="border-b border-(--border-color) hover:bg-(--bg-secondary)/50">
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

                    {/* Pagination and Actions */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-(--border-color) bg-(--bg-secondary) flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-(--text-secondary)">
                          Showing {((currentPage - 1) * entriesPerPage) + 1} - {Math.min(currentPage * entriesPerPage, previewData.entries.length)} of {previewData.entries.length}
                        </p>
                        {totalPages > 1 && (
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className="h-7 px-2"
                            >
                              <ArrowLeft className="h-3 w-3" />
                            </Button>
                            <span className="flex items-center px-2 text-xs text-(--text-secondary)">
                              {currentPage} / {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                              className="h-7 px-2"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowFullStatement(true)}
                          className="border-(--border-color) text-(--color-accent-yellow) hover:bg-(--bg-secondary)"
                        >
                          <Maximize2 className="h-4 w-4 mr-1.5" />
                          View Full Statement
                        </Button>
                        <Button
                          onClick={handleImportAll}
                          disabled={isProcessing}
                          size="sm"
                          className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1.5" />
                              Import {previewData.entries.length}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
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

      {/* Full Statement Modal */}
      <FullStatementModal />
    </>
  );
}