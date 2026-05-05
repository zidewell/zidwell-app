"use client";
import { useState, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Plus, X, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useJournal } from "@/app/context/JournalContext";
import { EntryType, JournalEntry } from "./types";
import { IconPicker } from "./IconPicker";

interface EntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: EntryType;
  editEntry?: JournalEntry | null;
}

export function EntryForm({
  open,
  onOpenChange,
  defaultType = "expense",
  editEntry,
}: EntryFormProps) {
  const { categories, addEntry, updateEntry, activeJournalType, addCategory } =
    useJournal();
  const [date, setDate] = useState<Date>(new Date());
  const [type, setType] = useState<EntryType>(defaultType);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("📦");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [favoriteOrder, setFavoriteOrder] = useState<Record<string, number>>({});

  const isEditing = !!editEntry;

  // Load favorite order from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('category_favorite_order');
    if (saved) {
      setFavoriteOrder(JSON.parse(saved));
    }
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (editEntry) {
      setDate(parseISO(editEntry.date));
      setType(editEntry.type);
      setAmount(editEntry.amount.toString());
      setCategoryId(editEntry.categoryId);
      setNote(editEntry.note || "");
    } else {
      resetForm();
      setType(defaultType);
    }
  }, [editEntry, defaultType, open]);

  const resetForm = () => {
    setAmount("");
    setCategoryId("");
    setNote("");
    setDate(new Date());
    setShowNewCategory(false);
    setNewCategoryName("");
    setNewCategoryIcon("📦");
  };

  // Sort categories: favorites first based on type
  const getSortedCategories = useMemo(() => {
    const filtered = categories.filter(cat => cat.type === type || cat.type === "both");
    
    return filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      if (a.isFavorite && b.isFavorite) {
        return (favoriteOrder[a.id] || 0) - (favoriteOrder[b.id] || 0);
      }
      return a.name.localeCompare(b.name);
    });
  }, [categories, type, favoriteOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId) return;

    if (isEditing && editEntry) {
      updateEntry(editEntry.id, {
        date: date.toISOString(),
        type,
        amount: parseFloat(amount),
        categoryId,
        note: note || undefined,
      });
    } else {
      addEntry({
        date: date.toISOString(),
        type,
        amount: parseFloat(amount),
        categoryId,
        note: note || undefined,
        journalType: activeJournalType,
      });
    }

    resetForm();
    onOpenChange(false);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsAddingCategory(true);
    try {
      const newCat = await addCategory({
        name: newCategoryName,
        icon: newCategoryIcon,
        type,
      });

      setCategoryId(newCat.id);
      setNewCategoryName("");
      setNewCategoryIcon("📦");
      setShowNewCategory(false);
    } catch (error) {
      console.error("Failed to add category:", error);
    } finally {
      setIsAddingCategory(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-[var(--text-primary)]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {isEditing ? "Edit" : "Add"}{" "}
            {type === "income" ? "Income" : "Expense"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Entry Type Toggle */}
          <div className="flex gap-2 p-1 rounded-xl bg-[var(--bg-secondary)]">
            <button
              type="button"
              onClick={() => setType("income")}
              className={cn(
                "flex-1 py-2.5 rounded-lg font-medium text-sm transition-all",
                type === "income" ? "shadow-soft" : "",
              )}
              style={{
                backgroundColor: type === "income" ? "var(--color-accent-yellow)" : "transparent",
                color: type === "income" ? "var(--color-ink)" : "var(--text-secondary)",
              }}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType("expense")}
              className={cn(
                "flex-1 py-2.5 rounded-lg font-medium text-sm transition-all",
                type === "expense" ? "shadow-soft" : "",
              )}
              style={{
                backgroundColor: type === "expense" ? "var(--destructive)" : "transparent",
                color: type === "expense" ? "var(--color-white)" : "var(--text-secondary)",
              }}
            >
              Expense
            </button>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 z-50 bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-md"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Amount (₦)
            </label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-semibold border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
              style={{ outline: "none", boxShadow: "none" }}
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--text-secondary)]">
                Category
              </label>
              <button
                type="button"
                onClick={() => setShowNewCategory(!showNewCategory)}
                className="text-xs hover:underline flex items-center gap-1 text-[var(--color-accent-yellow)]"
              >
                <Plus className="h-3 w-3" />
                Add custom
              </button>
            </div>

            {showNewCategory && (
              <div className="flex gap-2 p-3 rounded-xl mb-2 bg-[var(--bg-secondary)]">
                <Input
                  placeholder="Category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
                  style={{ outline: "none", boxShadow: "none" }}
                />
                <IconPicker
                  value={newCategoryIcon}
                  onChange={setNewCategoryIcon}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={handleAddCategory}
                  className="shrink-0 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 squircle-md"
                  disabled={isAddingCategory}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowNewCategory(false)}
                  className="shrink-0 text-[var(--text-secondary)]"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {getSortedCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center relative",
                    categoryId === cat.id ? "shadow-soft" : "",
                  )}
                  style={{
                    borderColor: categoryId === cat.id ? "var(--color-accent-yellow)" : "var(--border-color)",
                    backgroundColor: categoryId === cat.id ? "rgba(253, 192, 32, 0.1)" : "var(--bg-primary)",
                  }}
                >
                  {cat.isFavorite && (
                    <Star className="absolute top-1 right-1 w-3 h-3 fill-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)]" />
                  )}
                  <span className="text-xl text-[var(--text-primary)]">{cat.icon}</span>
                  <span className="text-xs font-medium truncate w-full text-[var(--text-primary)]">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Note (optional)
            </label>
            <Textarea
              placeholder="Add a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
              style={{ outline: "none", boxShadow: "none" }}
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full font-semibold bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 squircle-md shadow-soft"
            disabled={!amount || !categoryId}
          >
            {isEditing ? "Update Entry" : "Save Entry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}