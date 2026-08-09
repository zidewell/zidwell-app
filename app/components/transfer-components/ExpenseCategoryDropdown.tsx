"use client";

import { useState, useRef } from "react";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "../ui/command";
import { Check, ChevronsUpDown, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  type: string;
  isCustom: boolean;
  is_favorite?: boolean;
  favorite_order?: number;
}

interface ExpenseCategoryDropdownProps {
  expenseCategories: ExpenseCategory[];
  expenseCategory: string;
  setExpenseCategory: (id: string) => void;
  setNarration?: (value: string) => void;
  loading: boolean;
  error?: string;
  onToggleFavorite?: (category: ExpenseCategory, e: React.MouseEvent) => void;
}

export default function ExpenseCategoryDropdown({
  expenseCategories,
  expenseCategory,
  setExpenseCategory,
  setNarration,
  loading,
  error,
  onToggleFavorite,
}: ExpenseCategoryDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const pendingFavoritesRef = useRef<Set<string>>(new Set());

  const getSelectedCategory = () => {
    return expenseCategories.find((c) => c.id === expenseCategory);
  };

  const getSelectedCategoryName = () => {
    const category = getSelectedCategory();
    return category ? category.name : "Select category";
  };

  const getSelectedCategoryIcon = () => {
    const category = getSelectedCategory();
    return category ? category.icon : "📦";
  };

  const handleSelectCategory = (category: ExpenseCategory) => {
    setExpenseCategory(category.id);
    if (setNarration) {
      setNarration(category.name);
    }
    setShowDropdown(false);
    setSearch("");
  };

  if (loading) {
    return (
      <div className="space-y-1">
        <Label className="text-(--text-primary)">
          Expense Category <span className="text-sm text-red-500">*</span>
        </Label>
        <div className="flex items-center justify-center p-4 border border-(--border-color) rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin text-(--color-accent-yellow)" />
          <span className="ml-2 text-(--text-secondary)">Loading categories...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Label className="text-(--text-primary)">
        Expense Category <span className="text-sm text-red-500">*</span>
      </Label>

      <Popover open={showDropdown} onOpenChange={setShowDropdown}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full flex justify-between items-center border border-(--border-color) rounded-lg px-4 py-2.5 text-sm bg-(--bg-primary) text-(--text-primary) hover:bg-(--bg-secondary) transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">{getSelectedCategoryIcon()}</span>
              <span>{getSelectedCategoryName()}</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[400px] p-0 bg-(--bg-primary) border-(--border-color) max-h-[400px] overflow-y-auto"
          align="start"
        >
          <Command className="bg-(--bg-primary)">
            <CommandInput
              placeholder="Search category..."
              value={search}
              onValueChange={setSearch}
              className="bg-(--bg-primary) border-(--border-color) text-(--text-primary)"
            />
            <CommandList>
              <CommandEmpty className="text-(--text-secondary) p-4 text-center">
                No category found.
              </CommandEmpty>
              <CommandGroup>
                {filterCategories(expenseCategories, search).map((item) => {
                  if ("isGroupHeader" in item && item.isGroupHeader) {
                    const hasFavorites = expenseCategories.some((cat) => cat.is_favorite);
                    const isDailyEssentials = item.groupName === "DAILY ESSENTIALS";
                    return (
                      <div key={`header-${item.groupName}`} className="px-2 py-2 mt-2 first:mt-0">
                        <div className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">
                          {item.groupName}
                        </div>
                        {isDailyEssentials && !hasFavorites && (
                          <div className="text-xs text-(--text-secondary) mt-0.5">
                            Empty till you add favourites
                          </div>
                        )}
                      </div>
                    );
                  }
                  const category = item as ExpenseCategory;
                  return (
                    <CommandItem
                      key={category.id}
                      onSelect={() => handleSelectCategory(category)}
                      className="flex items-center justify-between cursor-pointer hover:bg-(--bg-secondary)"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{category.icon}</span>
                        <span className="text-(--text-primary)">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {onToggleFavorite && (
                          <button
                            type="button"
                            onClick={(e) => onToggleFavorite(category, e)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={cn(
                                "h-4 w-4",
                                category.is_favorite
                                  ? "fill-[#f59e0b] text-[#f59e0b]"
                                  : "text-(--text-secondary)"
                              )}
                            />
                          </button>
                        )}
                        {expenseCategory === category.id && (
                          <Check className="h-4 w-4 text-(--color-accent-yellow)" />
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <p className="text-xs text-(--text-secondary) mt-1">
        ⭐ Click the star to favorite a category - favorites appear at the top for quick access
      </p>
    </div>
  );
}

// Helper function to filter and group categories
function filterCategories(categories: ExpenseCategory[], search: string) {
  const DAILY_ESSENTIALS_LIST = [
    "Food",
    "Household Items",
    "Electricity bill",
    "Water bill",
    "Fuel",
    "Data / Internet",
    "Call Airtime",
    "Cleaning fee",
    "Transport",
    "Cash Withdrawal",
    "Children Expenses",
    "Family Support",
    "Religious Giving",
    "Hospital Bills",
    "Medication",
    "Digital Subscriptions",
    "Vehicle Maintenance",
  ];

  const favorites: ExpenseCategory[] = [];
  const dailyEssentials: ExpenseCategory[] = [];
  const otherCategories: ExpenseCategory[] = [];

  categories.forEach((cat) => {
    if (cat.is_favorite) {
      favorites.push(cat);
    } else if (DAILY_ESSENTIALS_LIST.includes(cat.name)) {
      dailyEssentials.push(cat);
    } else {
      otherCategories.push(cat);
    }
  });

  favorites.sort((a, b) => (a.favorite_order || 0) - (b.favorite_order || 0));
  dailyEssentials.sort((a, b) => {
    return DAILY_ESSENTIALS_LIST.indexOf(a.name) - DAILY_ESSENTIALS_LIST.indexOf(b.name);
  });
  otherCategories.sort((a, b) => a.name.localeCompare(b.name));

  const result: (ExpenseCategory | { isGroupHeader: boolean; groupName: string })[] = [];

  if (favorites.length > 0) {
    result.push({ isGroupHeader: true, groupName: "FAVOURITES" });
    result.push(...favorites);
  }

  result.push({ isGroupHeader: true, groupName: "DAILY ESSENTIALS" });
  result.push(...dailyEssentials);

  result.push({ isGroupHeader: true, groupName: "OTHER CATEGORIES" });
  result.push(...otherCategories);

  // Filter by search
  return result.filter((item) => {
    if ("isGroupHeader" in item) return true;
    return (item as ExpenseCategory).name.toLowerCase().includes(search.toLowerCase());
  });
}