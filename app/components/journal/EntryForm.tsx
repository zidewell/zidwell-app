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
  const [favoriteOrder, setFavoriteOrder] = useState<Record<string, number>>(
    {},
  );

  const isEditing = !!editEntry;

  // Load favorite order from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("category_favorite_order");
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
    const filtered = categories.filter(
      (cat) => cat.type === type || cat.type === "both",
    );

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
  <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg p-4 sm:p-6 md:p-8">
    <DialogHeader>
      <DialogTitle
        className="text-xl md:text-2xl lg:text-3xl text-(--text-primary)"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        {isEditing ? "Edit" : "Add"}{" "}
        {type === "income" ? "Income" : "Expense"}
      </DialogTitle>
    </DialogHeader>

    <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6 mt-4">
      {/* Entry Type Toggle - Larger on mobile */}
      <div className="flex gap-2 p-1 rounded-xl bg-(--bg-secondary)">
        <button
          type="button"
          onClick={() => setType("income")}
          className={cn(
            "flex-1 py-3 md:py-3.5 rounded-lg font-medium text-sm md:text-base transition-all",
            type === "income" ? "shadow-soft" : "",
          )}
          style={{
            backgroundColor:
              type === "income"
                ? "var(--color-accent-yellow)"
                : "transparent",
            color:
              type === "income"
                ? "var(--color-ink)"
                : "var(--text-secondary)",
          }}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => setType("expense")}
          className={cn(
            "flex-1 py-3 md:py-3.5 rounded-lg font-medium text-sm md:text-base transition-all",
            type === "expense" ? "shadow-soft" : "",
          )}
          style={{
            backgroundColor:
              type === "expense" ? "var(--destructive)" : "transparent",
            color:
              type === "expense"
                ? "var(--color-white)"
                : "var(--text-secondary)",
          }}
        >
          Expense
        </button>
      </div>

      {/* Two-column layout for larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {/* Date Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-(--text-secondary)">
            Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal border-(--border-color) bg-(--bg-primary) text-(--text-primary) h-11 md:h-12",
                  !date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 z-50 bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-md"
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
          <label className="text-sm font-medium text-(--text-secondary)">
            Amount (₦)
          </label>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg md:text-xl font-semibold h-11 md:h-12 border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
            style={{ outline: "none", boxShadow: "none" }}
            min="0"
            step="0.01"
            required
          />
        </div>
      </div>

      {/* Category Section - Full width */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-(--text-secondary)">
            Category
          </label>
          <button
            type="button"
            onClick={() => setShowNewCategory(!showNewCategory)}
            className="text-xs md:text-sm hover:underline flex items-center gap-1 text-(--color-accent-yellow)"
          >
            <Plus className="h-3 w-3 md:h-4 md:w-4" />
            Add custom
          </button>
        </div>

        {showNewCategory && (
          <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-xl mb-2 bg-(--bg-secondary)">
            <Input
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) h-11"
              style={{ outline: "none", boxShadow: "none" }}
            />
            <div className="flex gap-2">
              <IconPicker
                value={newCategoryIcon}
                onChange={setNewCategoryIcon}
              />
              <Button
                type="button"
                size="icon"
                onClick={handleAddCategory}
                className="shrink-0 bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 squircle-md h-11 w-11"
                disabled={isAddingCategory}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setShowNewCategory(false)}
                className="shrink-0 text-(--text-secondary) h-11 w-11"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Responsive category grid - more columns on larger screens */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3 max-h-60 overflow-y-auto pr-1">
          {getSortedCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 md:p-4 rounded-xl border transition-all text-center relative hover:scale-105 active:scale-95 duration-200",
                categoryId === cat.id ? "shadow-soft" : "",
              )}
              style={{
                borderColor:
                  categoryId === cat.id
                    ? "var(--color-accent-yellow)"
                    : "var(--border-color)",
                backgroundColor:
                  categoryId === cat.id
                    ? "rgba(253, 192, 32, 0.1)"
                    : "var(--bg-primary)",
              }}
            >
              {cat.isFavorite && (
                <Star className="absolute top-1 right-1 w-3 h-3 fill-(--color-accent-yellow) text-(--color-accent-yellow)" />
              )}
              <span className="text-2xl md:text-3xl text-(--text-primary)">
                {cat.icon}
              </span>
              <span className="text-xs md:text-sm font-medium truncate w-full text-(--text-primary)">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Note - Full width */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-(--text-secondary)">
          Note (optional)
        </label>
        <Textarea
          placeholder="Add a note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="resize-none border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) min-h-[80px]"
          style={{ outline: "none", boxShadow: "none" }}
          rows={3}
        />
      </div>

      {/* Submit Button - Larger and more prominent */}
      <Button
        type="submit"
        className="w-full font-semibold py-3 md:py-4 text-base md:text-lg bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 squircle-md shadow-soft transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        disabled={!amount || !categoryId}
        size="lg"
      >
        {isEditing ? "Update Entry" : "Save Entry"}
      </Button>
    </form>
  </DialogContent>
</Dialog>
  );
}