"use client";
import { useState, useEffect } from 'react';
import { Pencil, Trash2, X, Check, Star, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useJournal } from '@/app/context/JournalContext';
import { Category, EntryType } from './types';
import { IconPicker } from './IconPicker';

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryManager({ open, onOpenChange }: CategoryManagerProps) {
  const { categories, updateCategory, deleteCategory, addCategory } = useJournal();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editType, setEditType] = useState<EntryType | 'both'>('expense');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📦');
  const [newCategoryType, setNewCategoryType] = useState<EntryType>('expense');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [favoriteOrder, setFavoriteOrder] = useState<Record<string, number>>({});

  // Load favorite order from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('category_favorite_order');
    if (saved) {
      setFavoriteOrder(JSON.parse(saved));
    }
  }, []);

  const saveFavoriteOrder = (order: Record<string, number>) => {
    setFavoriteOrder(order);
    localStorage.setItem('category_favorite_order', JSON.stringify(order));
  };

  const toggleFavorite = (cat: Category) => {
    const newIsFavorite = !cat.isFavorite;
    const updates: Partial<Category> = { isFavorite: newIsFavorite };
    
    if (newIsFavorite) {
      const maxOrder = Math.max(0, ...Object.values(favoriteOrder));
      updates.favoriteOrder = maxOrder + 1;
      saveFavoriteOrder({ ...favoriteOrder, [cat.id]: maxOrder + 1 });
    } else {
      const newOrder = { ...favoriteOrder };
      delete newOrder[cat.id];
      saveFavoriteOrder(newOrder);
      updates.favoriteOrder = 0;
    }
    
    updateCategory(cat.id, updates);
  };

  // Sort categories: favorites first, then by name
  const sortedCategories = [...categories].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    if (a.isFavorite && b.isFavorite) {
      return (favoriteOrder[a.id] || 0) - (favoriteOrder[b.id] || 0);
    }
    return a.name.localeCompare(b.name);
  });

  const filteredCategories = sortedCategories.filter(cat => {
    if (filterType === 'all') return true;
    if (filterType === 'income') return cat.type === 'income' || cat.type === 'both';
    return cat.type === 'expense' || cat.type === 'both';
  }).filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.icon.includes(searchTerm)
  );

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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsAddingCategory(true);
    try {
      await addCategory({
        name: newCategoryName.trim(),
        icon: newCategoryIcon,
        type: newCategoryType,
      });
      setNewCategoryName('');
      setNewCategoryIcon('📦');
      setShowNewCategory(false);
    } catch (error) {
      console.error('Failed to add category:', error);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const favorites = filteredCategories.filter(c => c.isFavorite);
  const regulars = filteredCategories.filter(c => !c.isFavorite);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-hidden flex flex-col bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-[var(--text-primary)]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Manage Categories
          </DialogTitle>
        </DialogHeader>

        {/* Search and Add Button */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
              style={{ outline: "none", boxShadow: "none" }}
            />
          </div>
          <Button
            onClick={() => setShowNewCategory(true)}
            className="bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 squircle-md"
          >
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 p-1 rounded-xl bg-[var(--bg-secondary)]">
          {(['all', 'income', 'expense'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={cn(
                'flex-1 py-2 rounded-lg font-medium text-sm capitalize transition-all',
                filterType === type ? 'shadow-soft' : ''
              )}
              style={{
                backgroundColor: filterType === type ? 'var(--bg-primary)' : 'transparent',
                color: filterType === type ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Categories list */}
        <div className="flex-1 overflow-y-auto space-y-4 mt-4 pr-1">
          {/* Favorites Section */}
          {favorites.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-[var(--color-accent-yellow)]" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Favorites</h3>
              </div>
              <div className="space-y-2">
                {favorites.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    editingId={editingId}
                    editName={editName}
                    editIcon={editIcon}
                    editType={editType}
                    onEditChange={(field, value) => {
                      if (field === 'name') setEditName(value);
                      if (field === 'icon') setEditIcon(value);
                      if (field === 'type') setEditType(value as EntryType | 'both');
                    }}
                    onStartEdit={startEdit}
                    onCancelEdit={cancelEdit}
                    onSaveEdit={saveEdit}
                    onDelete={handleDelete}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Categories Section */}
          {regulars.length > 0 && (
            <div>
              {favorites.length > 0 && (
                <div className="flex items-center gap-2 mb-2 mt-4">
                  <div className="h-px flex-1 bg-[var(--border-color)]" />
                  <h3 className="text-xs font-medium text-[var(--text-secondary)]">All Categories</h3>
                  <div className="h-px flex-1 bg-[var(--border-color)]" />
                </div>
              )}
              <div className="space-y-2">
                {regulars.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    editingId={editingId}
                    editName={editName}
                    editIcon={editIcon}
                    editType={editType}
                    onEditChange={(field, value) => {
                      if (field === 'name') setEditName(value);
                      if (field === 'icon') setEditIcon(value);
                      if (field === 'type') setEditType(value as EntryType | 'both');
                    }}
                    onStartEdit={startEdit}
                    onCancelEdit={cancelEdit}
                    onSaveEdit={saveEdit}
                    onDelete={handleDelete}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* New Category Dialog */}
      <Dialog open={showNewCategory} onOpenChange={setShowNewCategory}>
        <DialogContent className="sm:max-w-md bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-[var(--text-primary)]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Add New Category
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium block mb-1 text-[var(--text-secondary)]">Category Name</label>
              <Input
                placeholder="e.g., Freelance, Subscription"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
                style={{ outline: "none", boxShadow: "none" }}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1 text-[var(--text-secondary)]">Icon</label>
              <IconPicker value={newCategoryIcon} onChange={setNewCategoryIcon} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1 text-[var(--text-secondary)]">Category Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewCategoryType('income')}
                  className={cn(
                    "flex-1 py-2 rounded-lg font-medium text-sm transition-all",
                    newCategoryType === 'income' ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                  )}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setNewCategoryType('expense')}
                  className={cn(
                    "flex-1 py-2 rounded-lg font-medium text-sm transition-all",
                    newCategoryType === 'expense' ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                  )}
                >
                  Expense
                </button>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim() || isAddingCategory}
                className="flex-1 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 squircle-md"
              >
                {isAddingCategory ? 'Adding...' : 'Add Category'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNewCategory(false)}
                className="flex-1 border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// Category Row Component
function CategoryRow({ 
  category, 
  editingId, 
  editName, 
  editIcon, 
  editType,
  onEditChange,
  onStartEdit, 
  onCancelEdit, 
  onSaveEdit, 
  onDelete,
  onToggleFavorite
}: any) {
  const isEditing = editingId === category.id;

  if (isEditing) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
        <IconPicker value={editIcon} onChange={(icon: string) => onEditChange('icon', icon)} />
        <Input
          value={editName}
          onChange={(e) => onEditChange('name', e.target.value)}
          className="flex-1 h-9 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
          style={{ outline: "none", boxShadow: "none" }}
        />
        <select
          value={editType}
          onChange={(e) => onEditChange('type', e.target.value)}
          className="h-9 px-2 rounded-md border text-sm bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]"
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="both">Both</option>
        </select>
        <Button size="icon" variant="ghost" onClick={onSaveEdit} className="h-8 w-8 text-[var(--color-lemon-green)]">
          <Check className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={onCancelEdit} className="h-8 w-8 text-[var(--text-secondary)]">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
      <button
        onClick={() => onToggleFavorite(category)}
        className="hover:scale-110 transition-transform"
      >
        <Star 
          className={cn("w-4 h-4", category.isFavorite ? "fill-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)]" : "text-[var(--border-color)]")} 
        />
      </button>
      <span className="text-xl w-8 text-center text-[var(--text-primary)]">{category.icon}</span>
      <span className="flex-1 font-medium text-[var(--text-primary)]">{category.name}</span>
      <span 
        className="text-xs px-2 py-0.5 rounded-full capitalize"
        style={{
          backgroundColor: category.type === 'income' ? 'rgba(0, 182, 79, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          color: category.type === 'income' ? 'var(--color-lemon-green)' : 'var(--destructive)'
        }}
      >
        {category.type}
      </span>
      <Button size="icon" variant="ghost" onClick={() => onStartEdit(category)} className="h-8 w-8 text-[var(--text-secondary)]">
        <Pencil className="h-4 w-4" />
      </Button>
      {category.isCustom && (
        <Button size="icon" variant="ghost" onClick={() => onDelete(category.id)} className="h-8 w-8 text-[var(--text-secondary)]">
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}