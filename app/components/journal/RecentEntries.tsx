import { format, parseISO } from 'date-fns';
import { Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { JournalEntry } from './types';
import { useJournal } from '@/app/context/JournalContext';

interface RecentEntriesProps {
  onEdit?: (entry: JournalEntry) => void;
  limit?: number;
}

export function RecentEntries({ onEdit, limit }: RecentEntriesProps) {
  const { entries, categories, activeJournalType, deleteEntry } = useJournal();

  const filteredEntries = entries
    .filter(e => e.journalType === activeJournalType)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit || 10);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (filteredEntries.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="dark:text-gray-400" style={{ color: '#80746e' }}>No entries yet. Start journaling!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredEntries.map((entry) => {
        const category = categories.find(c => c.id === entry.categoryId);
        
        return (
          <div
            key={entry.id}
            className="flex items-center gap-4 p-4 rounded-xl border shadow-[0_2px_20px_-4px_rgba(38,33,28,0.08)] hover:shadow-[0_4px_24px_-8px_rgba(38,33,28,0.1)] transition-shadow group dark:bg-gray-800 dark:border-gray-700"
            style={{
              backgroundColor: '#fcfbf9',
              borderColor: '#e6dfd6'
            }}
          >
            <div 
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl dark:bg-gray-700"
              style={{ backgroundColor: '#f5f1ea' }}
            >
              {category?.icon || '📦'}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate dark:text-gray-300">{category?.name || 'Other'}</p>
                {entry.note && (
                  <p className="text-sm truncate dark:text-gray-400" style={{ color: '#80746e' }}>• {entry.note}</p>
                )}
              </div>
              <p className="text-xs dark:text-gray-400" style={{ color: '#80746e' }}>
                {format(parseISO(entry.date), 'MMM d, yyyy')}
              </p>
            </div>

            <p className={cn(
              'font-semibold tabular-nums'
            )}
            style={{ color: entry.type === 'income' ? '#16a34a' : '#e11d48' }}>
              {entry.type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
            </p>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="dark:text-gray-400 dark:hover:text-gray-300"
                  style={{ color: '#80746e' }}
                  onClick={() => onEdit(entry)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="dark:text-gray-400 dark:hover:text-gray-300"
                style={{ color: '#80746e' }}
                onClick={() => deleteEntry(entry.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}