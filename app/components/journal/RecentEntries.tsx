// app/components/journal/RecentEntries.tsx

import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Trash2, Pencil, Edit2, Loader2, ChevronDown, Wallet as WalletIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button'; 
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useJournal } from '@/app/context/JournalContext'; 
import { JournalEntry, UnifiedTransaction  } from './types'; 
import Swal from 'sweetalert2';

interface RecentEntriesProps {
  onEdit?: (entry: JournalEntry) => void;
  limit?: number;
}

export function RecentEntries({ onEdit, limit }: RecentEntriesProps) {
  const { unifiedEntries, categories, deleteEntry, refetch, updateWalletEntry } = useJournal();
  const [editingEntry, setEditingEntry] = useState<UnifiedTransaction | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [visibleCount, setVisibleCount] = useState(limit || 5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Create maps for quick lookup
  const categoryMap = useMemo(() => {
    const byName = new Map();
    const byId = new Map();
    categories.forEach(cat => {
      byName.set(cat.name.toLowerCase(), cat);
      byId.set(cat.id, cat);
    });
    return { byName, byId };
  }, [categories]);

  // Get visible entries based on count
  const visibleEntries = unifiedEntries.slice(0, visibleCount);
  const hasMore = visibleCount < unifiedEntries.length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleDelete = async (entry: UnifiedTransaction) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      html: `You are about to delete this transaction:<br/><strong>${getDisplayText(entry)}</strong><br/>Amount: ${formatCurrency(entry.amount)}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--destructive)',
      cancelButtonColor: 'var(--text-secondary)',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      background: 'var(--bg-primary)',
      customClass: {
        popup: 'squircle-lg',
      },
    });

    if (result.isConfirmed) {
      await deleteEntry(entry.id);
      await Swal.fire({
        title: entry.source === 'wallet' ? 'Hidden!' : 'Deleted!',
        text: entry.source === 'wallet' 
          ? 'Transaction has been hidden from your journal.' 
          : 'Transaction has been deleted successfully.',
        icon: 'success',
        confirmButtonColor: 'var(--color-accent-yellow)',
        background: 'var(--bg-primary)',
        timer: 2000,
        showConfirmButton: true,
        customClass: { popup: 'squircle-lg' },
      });
      await refetch();
    }
  };

  const handleEditCategory = (entry: UnifiedTransaction) => {
    setEditingEntry(entry);
    setSelectedCategory(entry.categoryId);
    setShowEditDialog(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingEntry || !selectedCategory) return;

    if (editingEntry.source === 'wallet' && editingEntry.originalTransactionId) {
      await updateWalletEntry(editingEntry.originalTransactionId, selectedCategory);
    } else if (onEdit) {
      const manualEntry = {
        ...editingEntry,
        id: editingEntry.id.replace('manual_', ''),
      };
      onEdit(manualEntry as JournalEntry);
    }

    setShowEditDialog(false);
    setEditingEntry(null);

    await Swal.fire({
      title: 'Updated!',
      text: 'Category has been updated successfully.',
      icon: 'success',
      confirmButtonColor: 'var(--color-accent-yellow)',
      background: 'var(--bg-primary)',
      timer: 1500,
      showConfirmButton: true,
      customClass: { popup: 'squircle-lg' },
    });

    await refetch();
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setVisibleCount((prev) => prev + 5);
    setIsLoadingMore(false);
  };

  // Get the primary display text
  const getDisplayText = (entry: UnifiedTransaction) => {
    if (entry.note) return entry.note;
    if (entry.transactionDescription) return entry.transactionDescription;
    return entry.type === 'income' ? 'Income' : 'Expense';
  };

  // Get category name with proper fallback
  const getCategoryName = (entry: UnifiedTransaction) => {
    if (entry.categoryName && typeof entry.categoryName === 'string' && entry.categoryName.trim()) {
      const catName = entry.categoryName.trim();
      const matched = categoryMap.byName.get(catName.toLowerCase());
      if (matched && matched.name) {
        return matched.name;
      }
      return catName;
    }
    
    if (entry.categoryId) {
      const matched = categoryMap.byId.get(entry.categoryId);
      if (matched && matched.name) {
        return matched.name;
      }
    }
    
    return entry.type === 'income' ? 'Income' : 'Expense';
  };

  // Get category icon
  const getCategoryIcon = (entry: UnifiedTransaction): string => {
    if (entry.categoryName && typeof entry.categoryName === 'string' && entry.categoryName.trim()) {
      const categoryName = entry.categoryName.trim();
      const matched = categoryMap.byName.get(categoryName.toLowerCase());
      if (matched && matched.icon) {
        return matched.icon;
      }
    }
    
    if (entry.categoryId) {
      const matched = categoryMap.byId.get(entry.categoryId);
      if (matched && matched.icon) {
        return matched.icon;
      }
    }
    
    return '📦';
  };

  const getIconColor = (type: string) => {
    return type === 'income' ? 'var(--color-lemon-green)' : 'var(--destructive)';
  };

  if (unifiedEntries.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-(--text-secondary)">
          No entries yet. Start journaling or make wallet transactions!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3  p-2 rounded-xl">
        {visibleEntries.map((entry) => {
          const isWalletEntry = entry.source === 'wallet';
          const displayText = getDisplayText(entry);
          const categoryName = getCategoryName(entry);
          const categoryIcon = getCategoryIcon(entry);
          const iconColor = getIconColor(entry.type);

          return (
            <div
              key={entry.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border shadow-soft hover:shadow-pop transition-all bg-(--bg-primary) border-(--border-color) squircle-lg"
            >
              {/* Icon */}
              <div
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center self-start sm:self-center"
                style={{ backgroundColor: `${iconColor}10` }}
              >
                <span className="text-xl" style={{ color: iconColor }}>
                  {categoryIcon}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-(--bg-secondary) text-(--text-secondary) font-medium">
                    {categoryName}
                  </span>
                  {isWalletEntry && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1">
                      <WalletIcon className="h-3 w-3" />
                      Auto-synced
                    </span>
                  )}
                </div>
                
                <p className="text-sm font-medium text-(--text-primary) mt-1 line-clamp-2">
                  {displayText}
                </p>
                
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-1 text-(--text-secondary)">
                  <span>{format(parseISO(entry.date), 'MMM d, yyyy')}</span>
                  {isWalletEntry && entry.walletTransactionType && (
                    <span className="opacity-70 capitalize">
                      • {entry.walletTransactionType.replace(/_/g, ' ')}
                    </span>
                  )}
                  {entry.reference && (
                    <span className="opacity-70 font-mono">
                      • Ref: {entry.reference.slice(0, 8)}...
                    </span>
                  )}
                </div>
              </div>

              {/* Amount and Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0">
                <p
                  className={cn('font-semibold tabular-nums text-base sm:text-lg')}
                  style={{
                    color: entry.type === 'income'
                      ? 'var(--color-lemon-green)'
                      : 'var(--destructive)',
                  }}
                >
                  {entry.type === 'income' ? '+' : '-'}
                  {formatCurrency(entry.amount)}
                </p>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-(--color-accent-yellow) hover:bg-(--bg-secondary)"
                    onClick={() => handleEditCategory(entry)}
                    title="Edit Category"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-(--bg-secondary)"
                    onClick={() => handleDelete(entry)}
                    title="Delete Entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Load More */}
        {hasMore && (
          <div className="text-center flex flex-col items-center justify-center pt-4">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-6 sm:px-8 py-2 font-medium rounded-md transition-colors text-sm flex items-center gap-2 bg-(--bg-secondary) text-(--color-accent-yellow) border border-(--border-color) squircle-md hover:bg-(--bg-secondary)/80"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load More
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-xs mt-2 text-(--text-secondary)">
              Showing {visibleCount} of {unifiedEntries.length} entries
            </p>
          </div>
        )}
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg w-[95%] sm:w-full max-h-[90vh] overflow-y-auto bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
          <DialogHeader>
            <DialogTitle
              className="text-xl text-(--text-primary)"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Edit Category
            </DialogTitle>
          </DialogHeader>

          {editingEntry && (
            <div className="space-y-5 mt-4">
              <div className="p-4 rounded-xl bg-(--bg-secondary) squircle-md">
                <p className="text-sm text-(--text-secondary)">Transaction</p>
                <p className="font-medium text-(--text-primary) text-sm sm:text-base line-clamp-2">
                  {getDisplayText(editingEntry)}
                </p>
                <p
                  className="text-lg sm:text-xl font-semibold mt-1"
                  style={{
                    color: editingEntry.type === 'income'
                      ? 'var(--color-lemon-green)'
                      : 'var(--destructive)',
                  }}
                >
                  {editingEntry.type === 'income' ? '+' : '-'}
                  {formatCurrency(editingEntry.amount)}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-(--text-secondary)">
                  Select Category
                </label>
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {categories
                    .filter(
                      (cat) => cat.type === editingEntry.type || cat.type === 'both',
                    )
                    .map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center',
                          selectedCategory === cat.id
                            ? 'border-(--color-accent-yellow) bg-(--color-accent-yellow)/10'
                            : 'border-(--border-color) hover:border-(--color-accent-yellow)/50'
                        )}
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-xs font-medium truncate w-full text-(--text-primary)">
                          {cat.name}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              <Button
                onClick={handleUpdateCategory}
                disabled={!selectedCategory}
                className="w-full font-semibold h-12 bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 squircle-md"
              >
                Update Category
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}