
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

// Form state uses strings so inputs can genuinely be empty
interface FormData {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

const InvoiceItemForm: React.FC<InvoiceItemFormProps> = ({
  item,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<FormData>({
    id: "",
    description: "",
    quantity: "",
    unitPrice: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing item or reset form
  useEffect(() => {
    if (item) {
      setFormData({
        id: item.id,
        description: item.description,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
      });
    } else {
      setFormData({
        id: "",
        description: "",
        quantity: "",
        unitPrice: "",
      });
    }

    setErrors({});
  }, [item]);

  // Calculate total
  const quantity =
    formData.quantity === ""
      ? 0
      : Number(formData.quantity);

  const unitPrice =
    formData.unitPrice === ""
      ? 0
      : Number(formData.unitPrice);

  const total = quantity * unitPrice;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (
      formData.quantity === "" ||
      Number(formData.quantity) <= 0
    ) {
      newErrors.quantity =
        "Quantity must be greater than 0";
    }

    if (
      formData.unitPrice === "" ||
      Number(formData.unitPrice) < 0
    ) {
      newErrors.unitPrice =
        "Price must be 0 or greater";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const quantityNumber = Number(formData.quantity);
    const unitPriceNumber = Number(formData.unitPrice);

    const invoiceItem: InvoiceItem = {
      id: formData.id,
      description: formData.description.trim(),
      quantity: quantityNumber,
      unitPrice: unitPriceNumber,
      total: quantityNumber * unitPriceNumber,
    };

    onSubmit(invoiceItem);
    onClose();
  };

  const handleChange = (
    field: keyof FormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-(--bg-primary) rounded-lg shadow-pop max-w-md w-full max-h-[90vh] overflow-y-auto squircle-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-(--border-color)">
          <h2 className="text-lg font-semibold text-(--text-primary)">
            {item ? "Edit Item" : "Add New Item"}
          </h2>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-(--text-secondary) hover:bg-(--bg-secondary)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4"
        >
          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-(--text-secondary)"
            >
              Description *
            </Label>

            <Input
              id="description"
              placeholder="Item/Service name"
              value={formData.description}
              onChange={(e) =>
                handleChange(
                  "description",
                  e.target.value
                )
              }
              required
              autoFocus
              className={
                errors.description
                  ? "border-destructive"
                  : "border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow)"
              }
              style={{
                outline: "none",
                boxShadow: "none",
              }}
            />

            {errors.description && (
              <p className="text-destructive text-xs mt-1">
                {errors.description}
              </p>
            )}
          </div>

          {/* Quantity + Unit Price */}
          <div className="grid grid-cols-2 gap-4">
            {/* Quantity */}
            <div className="space-y-2">
              <Label
                htmlFor="quantity"
                className="text-(--text-secondary)"
              >
                Quantity *
              </Label>

              <Input
                id="quantity"
                type="number"
                placeholder="Qty"
                value={formData.quantity}
                onChange={(e) =>
                  handleChange(
                    "quantity",
                    e.target.value
                  )
                }
                min="1"
                step="1"
                required
                className={
                  errors.quantity
                    ? "border-destructive"
                    : "border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow)"
                }
                style={{
                  outline: "none",
                  boxShadow: "none",
                }}
              />

              {errors.quantity && (
                <p className="text-destructive text-xs mt-1">
                  {errors.quantity}
                </p>
              )}
            </div>

            {/* Unit Price */}
            <div className="space-y-2">
              <Label
                htmlFor="unitPrice"
                className="text-(--text-secondary)"
              >
                Unit Price (₦) *
              </Label>

              <Input
                id="unitPrice"
                type="number"
                placeholder="Price"
                value={formData.unitPrice}
                onChange={(e) =>
                  handleChange(
                    "unitPrice",
                    e.target.value
                  )
                }
                min="0"
                step="0.01"
                required
                className={
                  errors.unitPrice
                    ? "border-destructive"
                    : "border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow)"
                }
                style={{
                  outline: "none",
                  boxShadow: "none",
                }}
              />

              {errors.unitPrice && (
                <p className="text-destructive text-xs mt-1">
                  {errors.unitPrice}
                </p>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="space-y-2">
            <Label className="text-(--text-secondary)">
              Total
            </Label>

            <div className="p-3 bg-(--bg-secondary) rounded-md text-lg font-semibold text-(--text-primary)">
              ₦
              {total.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-(--border-color) text-(--text-secondary) hover:bg-(--bg-secondary)"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
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
