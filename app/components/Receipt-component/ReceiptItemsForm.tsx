"use client";

import React, { useRef, useEffect } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface ReceiptItem {
  id: string;
  description: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
}

interface ReceiptItemsFormProps {
  items: ReceiptItem[];
  onChange: (items: ReceiptItem[]) => void;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const ReceiptItemsForm: React.FC<ReceiptItemsFormProps> = ({
  items,
  onChange,
  disabled = false,
  onFocus,
  onBlur,
}) => {
  const itemRefs = useRef<(HTMLInputElement | null)[]>([]);

  const addItem = () => {
    if (disabled) return;
    const newItem: ReceiptItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: "",
      amount: 0,
      quantity: 1,
      unitPrice: 0,
    };
    onChange([...items, newItem]);

    setTimeout(() => {
      const lastIndex = items.length;
      if (itemRefs.current[lastIndex]) {
        itemRefs.current[lastIndex]?.focus();
      }
    }, 100);
  };

  const updateItem = (id: string, field: keyof ReceiptItem, value: any) => {
    if (disabled) return;
    const updatedItems = items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };

        if (field === "quantity" || field === "unitPrice") {
          const quantity = field === "quantity" ? value : item.quantity || 1;
          const unitPrice = field === "unitPrice" ? value : item.unitPrice || 0;
          updatedItem.amount = quantity * unitPrice;
        }

        return updatedItem;
      }
      return item;
    });
    onChange(updatedItems);
  };

  const removeItem = (id: string) => {
    if (disabled) return;
    if (items.length > 1) {
      onChange(items.filter((item) => item.id !== id));
    }
  };

  useEffect(() => {
    if (itemRefs.current[0] && items.length > 0 && !disabled) {
      setTimeout(() => {
        itemRefs.current[0]?.focus();
      }, 300);
    }
  }, [items.length, disabled]);

  useEffect(() => {
    if (items.length === 0 && !disabled) {
      addItem();
    }
  }, [items.length, disabled]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-medium text-[var(--text-primary)]">Items & Services</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/10 squircle-sm"
          disabled={disabled}
        >
          Add Item
        </Button>
      </div>

      {items.map((item, index) => (
        <div
          key={item.id}
          className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg border-[var(--border-color)] squircle-md"
        >
          <div className="md:col-span-5">
            <Label htmlFor={`item-${index}-description`} className="text-[var(--text-secondary)]">Description</Label>
            <Input
              id={`item-${index}-description`}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              placeholder="Item/service description"
              value={item.description}
              onChange={(e) => updateItem(item.id, "description", e.target.value)}
              className="mt-1.5 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
              style={{ outline: "none", boxShadow: "none" }}
              disabled={disabled}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor={`item-${index}-quantity`} className="text-[var(--text-secondary)]">Quantity</Label>
            <Input
              id={`item-${index}-quantity`}
              type="number"
              min="1"
              step="1"
              placeholder="Qty"
              value={item.quantity || 1}
              onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 1)}
              className="mt-1.5 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
              style={{ outline: "none", boxShadow: "none" }}
              disabled={disabled}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor={`item-${index}-unitPrice`} className="text-[var(--text-secondary)]">Unit Price (₦)</Label>
            <Input
              id={`item-${index}-unitPrice`}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={item.unitPrice || 0}
              onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
              className="mt-1.5 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
              style={{ outline: "none", boxShadow: "none" }}
              disabled={disabled}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
          <div className="md:col-span-2">
            <Label className="text-[var(--text-secondary)]">Amount (₦)</Label>
            <div className="mt-1.5 p-2 border rounded bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium border-[var(--border-color)]">
              {(item.amount || 0).toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="md:col-span-1 flex items-end">
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.id)}
                className="text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                disabled={disabled}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      ))}
      
      {items.length === 0 && !disabled && (
        <div className="text-center py-8 border-2 border-dashed border-[var(--border-color)] rounded-lg squircle-lg">
          <p className="text-[var(--text-secondary)]">No items added. Click "Add Item" to get started.</p>
        </div>
      )}
    </div>
  );
};