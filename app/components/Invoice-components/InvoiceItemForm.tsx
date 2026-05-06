"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { X } from "lucide-react";
import { InvoiceItem } from "./types";

interface InvoiceItemFormProps {
  item: InvoiceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: InvoiceItem) => void;
}

const InvoiceItemForm: React.FC<InvoiceItemFormProps> = ({
  item,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<InvoiceItem>({
    id: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
    total: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        id: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        total: 0,
      });
    }
    setErrors({});
  }, [item]);

  useEffect(() => {
    const total = formData.quantity * formData.unitPrice;
    setFormData((prev: any) => ({ ...prev, total }));
  }, [formData.quantity, formData.unitPrice]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }
    if (!formData.unitPrice || formData.unitPrice < 0) {
      newErrors.unitPrice = "Price must be 0 or greater";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      onClose();
    }
  };

  const handleChange = (field: keyof InvoiceItem, value: string | number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-primary)] rounded-lg shadow-pop max-w-md w-full max-h-[90vh] overflow-y-auto squircle-lg">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {item ? "Edit Item" : "Add New Item"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[var(--text-secondary)]">
              Description *
            </Label>
            <Input
              id="description"
              placeholder="Item/Service name"
              value={formData.description}
              onChange={(e: any) => handleChange("description", e.target.value)}
              required
              autoFocus
              className={errors.description ? "border-[var(--destructive)]" : "border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)]"}
              style={{ outline: "none", boxShadow: "none" }}
            />
            {errors.description && (
              <p className="text-[var(--destructive)] text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-[var(--text-secondary)]">
                Quantity *
              </Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Qty"
                value={formData.quantity}
                onChange={(e: any) =>
                  handleChange("quantity", parseFloat(e.target.value) || 0)
                }
                min="1"
                step="1"
                required
                className={errors.quantity ? "border-[var(--destructive)]" : "border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)]"}
                style={{ outline: "none", boxShadow: "none" }}
              />
              {errors.quantity && (
                <p className="text-[var(--destructive)] text-xs mt-1">{errors.quantity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice" className="text-[var(--text-secondary)]">
                Unit Price (₦) *
              </Label>
              <Input
                id="unitPrice"
                type="number"
                placeholder="Price"
                value={formData.unitPrice}
                onChange={(e: any) =>
                  handleChange("unitPrice", parseFloat(e.target.value) || 0)
                }
                min="0"
                step="0.01"
                required
                className={errors.unitPrice ? "border-[var(--destructive)]" : "border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)]"}
                style={{ outline: "none", boxShadow: "none" }}
              />
              {errors.unitPrice && (
                <p className="text-[var(--destructive)] text-xs mt-1">{errors.unitPrice}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--text-secondary)]">Total</Label>
            <div className="p-3 bg-[var(--bg-secondary)] rounded-md text-lg font-semibold text-[var(--text-primary)]">
              ₦
              {formData.total.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90"
            >
              {item ? "Update Item" : "Add Item"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceItemForm;