"use client";

import React from "react";
import { Button } from "../ui/button";
import { Edit, Trash2 } from "lucide-react";
import { InvoiceItem } from "./types";

interface InvoiceItemRowProps {
  item: InvoiceItem;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}

const InvoiceItemRow: React.FC<InvoiceItemRowProps> = ({
  item,
  onEdit,
  onRemove,
}) => {
  return (
    <div className="grid grid-cols-12 gap-2 md:gap-3 items-center mb-3 p-3 border rounded-md hover:bg-[var(--bg-secondary)] transition-colors border-[var(--border-color)]">
      {/* Description */}
      <div className="col-span-7 md:col-span-5">
        <div
          className="font-medium truncate text-sm md:text-base text-[var(--text-primary)]"
          title={item.description}
        >
          {item.description || "No description"}
        </div>
      </div>

      {/* Quantity */}
      <div className="col-span-2 md:col-span-1">
        <div className="text-[var(--text-secondary)] text-center text-xs md:text-sm">
          {item.quantity}
        </div>
        <div className="text-[10px] text-[var(--text-secondary)] text-center md:hidden">
          Qty
        </div>
      </div>

      {/* Unit Price */}
      <div className="col-span-3 md:col-span-2">
        <div className="text-[var(--text-secondary)] text-right text-xs md:text-sm">
          ₦{item.unitPrice.toLocaleString()}
        </div>
        <div className="text-[10px] text-[var(--text-secondary)] text-right md:hidden">
          Price
        </div>
      </div>

      {/* Total - Desktop */}
      <div className="hidden md:block md:col-span-2">
        <div className="font-semibold text-right text-[var(--text-primary)]">
          ₦{item.total.toLocaleString()}
        </div>
      </div>

      {/* Actions */}
      <div className="col-span-2 flex justify-end space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(item.id)}
          className="h-7 w-7 md:h-8 md:w-8 hover:bg-[var(--bg-secondary)] text-[var(--color-accent-yellow)]"
        >
          <Edit className="h-3 w-3 md:h-3.5 md:w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.id)}
          className="h-7 w-7 md:h-8 md:w-8 hover:bg-[var(--destructive)]/10 text-[var(--destructive)]"
        >
          <Trash2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
        </Button>
      </div>

      {/* Mobile: Total below */}
      <div className="col-span-7 mt-1 md:hidden">
        <div className="text-xs font-semibold text-[var(--text-primary)]">
          Total: ₦{item.total.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default InvoiceItemRow;