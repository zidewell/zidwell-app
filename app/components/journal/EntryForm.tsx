"use client";
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Plus, X } from "lucide-react";
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

  const isEditing = !!editEntry;

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

  const filteredCategories = categories.filter(
    (cat) => cat.type === type || cat.type === "both",
  );

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
      // Optionally show an error toast/alert here
    } finally {
      setIsAddingCategory(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700"
        style={{
          backgroundColor: "#fcfbf9",
          borderColor: "#e6dfd6",
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-xl dark:text-gray-100"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {isEditing ? "Edit" : "Add"}{" "}
            {type === "income" ? "Income" : "Expense"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Entry Type Toggle */}
          <div
            className="flex gap-2 p-1 rounded-xl dark:bg-gray-700"
            style={{ backgroundColor: "#f5f1ea" }}
          >
            <button
              type="button"
              onClick={() => setType("income")}
              className={cn(
                "flex-1 py-2.5 rounded-lg font-medium text-sm transition-all",
                type === "income"
                  ? "shadow-[0_2px_20px_-4px_rgba(38,33,28,0.08)]"
                  : "",
              )}
              style={{
                backgroundColor: type === "income" ? "#16a34a" : "transparent",
                color: type === "income" ? "#ffffff" : "#80746e",
              }}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType("expense")}
              className={cn(
                "flex-1 py-2.5 rounded-lg font-medium text-sm transition-all",
                type === "expense"
                  ? "shadow-[0_2px_20px_-4px_rgba(38,33,28,0.08)]"
                  : "",
              )}
              style={{
                backgroundColor: type === "expense" ? "#e11d48" : "transparent",
                color: type === "expense" ? "#ffffff" : "#80746e",
              }}
            >
              Expense
            </button>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium dark:text-gray-300" style={{ color: "#80746e" }}>
              Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300",
                    !date && "text-muted-foreground",
                  )}
                  style={{
                    backgroundColor: "#fcfbf9",
                    borderColor: "#e6dfd6",
                  }}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 z-50 dark:bg-gray-800 dark:border-gray-700"
                align="start"
                style={{
                  backgroundColor: "#fcfbf9",
                  borderColor: "#e6dfd6",
                }}
              >
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="pointer-events-auto dark:bg-gray-800 dark:text-gray-100"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium dark:text-gray-300" style={{ color: "#80746e" }}>
              Amount (₦)
            </label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-semibold dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              style={{ backgroundColor: "#fcfbf9" }}
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                className="text-sm font-medium dark:text-gray-300"
                style={{ color: "#80746e" }}
              >
                Category
              </label>
              <button
                type="button"
                onClick={() => setShowNewCategory(!showNewCategory)}
                className="text-xs hover:underline flex items-center gap-1 dark:text-[#3aa873]"
                style={{ color: "#2b825b" }}
              >
                <Plus className="h-3 w-3" />
                Add custom
              </button>
            </div>

            {showNewCategory && (
              <div
                className="flex gap-2 p-3 rounded-xl mb-2 dark:bg-gray-700"
                style={{ backgroundColor: "#f5f1ea" }}
              >
                <Input
                  placeholder="Category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  style={{ backgroundColor: "#fcfbf9" }}
                />
                <IconPicker
                  value={newCategoryIcon}
                  onChange={setNewCategoryIcon}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={handleAddCategory}
                  className="shrink-0 dark:bg-[#2b825b] dark:hover:bg-[#1e5f43]"
                  disabled={isAddingCategory}
                  style={{ backgroundColor: "#2b825b" }}
                >
                  <Plus className="h-4 w-4 text-white" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowNewCategory(false)}
                  className="shrink-0 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center",
                    categoryId === cat.id
                      ? "shadow-[0_2px_20px_-4px_rgba(38,33,28,0.08)]"
                      : "",
                  )}
                  style={{
                    borderColor: categoryId === cat.id ? "#2b825b" : "#e6dfd6",
                    backgroundColor:
                      categoryId === cat.id
                        ? "rgba(43, 130, 91, 0.1)"
                        : "#fcfbf9",
                  }}
                >
                  <span className="text-xl dark:text-gray-300">{cat.icon}</span>
                  <span className="text-xs font-medium truncate w-full dark:text-gray-300">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium dark:text-gray-300" style={{ color: "#80746e" }}>
              Note (optional)
            </label>
            <Textarea
              placeholder="Add a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
              style={{ backgroundColor: "#fcfbf9" }}
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full font-semibold hover:opacity-90 transition-opacity dark:bg-[#2b825b] dark:hover:bg-[#1e5f43]"
            style={{
              background: "#2b825b",
              color: "#ffffff",
              boxShadow: "0 4px 20px -4px rgba(43, 130, 91, 0.3)",
            }}
            disabled={!amount || !categoryId}
          >
            {isEditing ? "Update Entry" : "Save Entry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}