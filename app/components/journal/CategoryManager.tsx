"use client"
import { useState } from 'react';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useJournalStore } from '@/app/hooks/useJournalStore'; 
import { Category, EntryType } from './types';
import { IconPicker } from './IconPicker'; 

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryManager({ open, onOpenChange }: CategoryManagerProps) {
  const { categories, updateCategory, deleteCategory } = useJournalStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editType, setEditType] = useState<EntryType | 'both'>('expense');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const filteredCategories = categories.filter(cat => {
    if (filterType === 'all') return true;
    return cat.type === filterType || cat.type === 'both';
  });

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon);
    setEditType(cat.type);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditIcon('');
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    
    updateCategory(editingId, {
      name: editName.trim(),
      icon: editIcon,
      type: editType,
    });
    cancelEdit();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategory(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col" 
        style={{
          backgroundColor: '#fcfbf9',
          borderColor: '#e6dfd6'
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Manage Categories
          </DialogTitle>
        </DialogHeader>

        {/* Filter tabs */}
        <div 
          className="flex gap-2 p-1 rounded-xl" 
          style={{
            backgroundColor: '#f5f1ea'
          }}
        >
          {(['all', 'income', 'expense'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={cn(
                'flex-1 py-2 rounded-lg font-medium text-sm capitalize transition-all',
                filterType === type
                  ? 'shadow-[0_2px_20px_-4px_rgba(38,33,28,0.08)]'
                  : ''
              )}
              style={{
                backgroundColor: filterType === type ? '#fcfbf9' : 'transparent',
                color: filterType === type ? '#26121c' : '#80746e'
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Categories list */}
        <div className="flex-1 overflow-y-auto space-y-2 mt-4 pr-1">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{
                backgroundColor: 'rgba(245, 241, 234, 0.5)',
                borderColor: '#e6dfd6'
              }}
            >
              {editingId === cat.id ? (
                <>
                  <IconPicker value={editIcon} onChange={setEditIcon} />
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 h-9"
                    style={{
                      backgroundColor: '#fcfbf9'
                    }}
                  />
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as EntryType | 'both')}
                    className="h-9 px-2 rounded-md border text-sm"
                    style={{
                      backgroundColor: '#fcfbf9',
                      borderColor: '#e6dfd6'
                    }}
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                    <option value="both">Both</option>
                  </select>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={saveEdit} 
                    className="h-8 w-8"
                    style={{ color: '#16a34a' }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={cancelEdit} 
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-xl w-8 text-center">{cat.icon}</span>
                  <span className="flex-1 font-medium">{cat.name}</span>
                  <span 
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full capitalize'
                    )}
                    style={{
                      backgroundColor: 
                        cat.type === 'income' ? 'rgba(22, 163, 74, 0.2)' :
                        cat.type === 'expense' ? 'rgba(225, 29, 72, 0.2)' :
                        'rgba(234, 179, 8, 0.2)',
                      color: 
                        cat.type === 'income' ? '#16a34a' :
                        cat.type === 'expense' ? '#e11d48' :
                        '#eab308'
                    }}
                  >
                    {cat.type}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEdit(cat)}
                    className="h-8 w-8"
                    style={{ color: '#80746e' }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {cat.isCustom && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(cat.id)}
                      className="h-8 w-8"
                      style={{ color: '#80746e' }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}