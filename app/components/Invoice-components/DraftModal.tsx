"use client";

import React, { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { X, Clock, Calendar, FileText, Eye } from "lucide-react";
import { DraftsModalProps } from "./types";

const DraftsModal: React.FC<DraftsModalProps> = ({
  isOpen,
  onClose,
  drafts,
  onLoadDraft,
  onViewAll,
  onStartFresh,
}) => {
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="bg-[var(--bg-primary)] rounded-lg shadow-pop max-w-4xl w-full max-h-[85vh] overflow-hidden border border-[var(--border-color)] squircle-lg">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-color)] p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Saved Drafts</h2>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              You have {drafts.length} saved draft
              {drafts.length !== 1 ? "s" : ""}. Choose an action:
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Drafts List */}
          <div className="grid gap-4 mb-8">
            {drafts.slice(0, 3).map((draft) => (
              <div
                key={draft.id}
                className={`p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${
                  selectedDraftId === draft.id
                    ? "border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10"
                    : "border-[var(--border-color)]"
                }`}
                onClick={() => setSelectedDraftId(draft.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded border border-amber-200 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Draft
                      </span>
                      <span className="text-sm font-medium text-[var(--text-secondary)]">
                        {draft.invoice_id}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                      {draft.business_name || "Untitled Invoice"}
                    </h3>
                    {draft.client_name && (
                      <p className="text-sm text-[var(--text-secondary)] mb-1">
                        Client: {draft.client_name}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(draft.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {formatCurrency(draft.total_amount)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadDraft(draft);
                      onClose();
                    }}
                    className="ml-4 border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/10"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Load
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {drafts.length > 3 && (
            <div className="text-center mb-6">
              <p className="text-[var(--text-secondary)]">
                ...and {drafts.length - 3} more draft
                {drafts.length - 3 !== 1 ? "s" : ""}
              </p>
              <Button
                variant="link"
                onClick={onViewAll}
                className="text-[var(--color-accent-yellow)] hover:text-[var(--color-accent-yellow)]/80"
              >
                View All Drafts
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--bg-primary)] border-t border-[var(--border-color)] p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={onStartFresh} 
              className="flex-1 border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            >
              Start Fresh
            </Button>
            {selectedDraftId && (
              <Button
                onClick={() => {
                  const selectedDraft = drafts.find(
                    (d) => d.id === selectedDraftId
                  );
                  if (selectedDraft) onLoadDraft(selectedDraft);
                }}
                className="flex-1 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90"
              >
                Load Selected Draft
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DraftsModal;