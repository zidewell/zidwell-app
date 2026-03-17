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

    // Focus on the new item's description field
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

        // Calculate amount if quantity or unitPrice changes
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

  // Focus on the first item's description when component mounts
  useEffect(() => {
    if (itemRefs.current[0] && items.length > 0 && !disabled) {
      setTimeout(() => {
        itemRefs.current[0]?.focus();
      }, 300);
    }
  }, [items.length, disabled]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-medium">Items & Services</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="border-[#2b825b] text-[#2b825b] hover:bg-[#2b825b]/10"
          disabled={disabled}
        >
          Add Item
        </Button>
      </div>

      {items.map((item, index) => (
        <div
          key={item.id}
          className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg"
        >
          <div className="md:col-span-5">
            <Label htmlFor={`item-${index}-description`}>Description</Label>
            <Input
              id={`item-${index}-description`}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              placeholder="Item/service description"
              value={item.description}
              onChange={(e) =>
                updateItem(item.id, "description", e.target.value)
              }
              className="mt-1.5 bg-card"
              disabled={disabled}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  // Focus on quantity field
                  const quantityInput = document.getElementById(
                    `item-${index}-quantity`,
                  );
                  if (quantityInput) {
                    (quantityInput as HTMLInputElement).focus();
                  }
                }
              }}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor={`item-${index}-quantity`}>Quantity</Label>
            <Input
              id={`item-${index}-quantity`}
              type="number"
              min="1"
              placeholder="Qty"
              value={item.quantity || 1}
              onChange={(e) =>
                updateItem(item.id, "quantity", parseFloat(e.target.value) || 1)
              }
              className="mt-1.5 bg-card"
              disabled={disabled}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  // Focus on unit price field
                  const priceInput = document.getElementById(
                    `item-${index}-unitPrice`,
                  );
                  if (priceInput) {
                    (priceInput as HTMLInputElement).focus();
                  }
                }
              }}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor={`item-${index}-unitPrice`}>Unit Price (₦)</Label>
            <Input
              id={`item-${index}-unitPrice`}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={item.unitPrice || 0}
              onChange={(e) =>
                updateItem(
                  item.id,
                  "unitPrice",
                  parseFloat(e.target.value) || 0,
                )
              }
              className="mt-1.5 bg-card"
              disabled={disabled}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  // If this is not the last item, focus on next item's description
                  if (index < items.length - 1) {
                    const nextIndex = index + 1;
                    if (itemRefs.current[nextIndex]) {
                      itemRefs.current[nextIndex]?.focus();
                    }
                  } else {
                    // Otherwise, add a new item
                    addItem();
                  }
                }
              }}
            />
          </div>
          <div className="md:col-span-3">
            <Label>Amount (₦)</Label>
            <div className="mt-1.5 p-2 border rounded bg-gray-50 text-gray-700 font-medium">
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
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={disabled}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
