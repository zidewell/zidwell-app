"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { X, Eye, Clock, Calendar, FileText } from "lucide-react";
import { Badge } from "../ui/badge";

interface Draft {
  id: string;
  business_name: string;
  invoice_id: string;
  created_at: string;
  total_amount: number;
  client_name?: string;
  client_email?: string;
}

interface DraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: Draft[];
  onLoadDraft: (draft: Draft) => void;
  onViewAll?: () => void;
  onStartFresh: () => void;
}

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
      <Card className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Saved Drafts</h2>
            <p className="text-gray-600 text-sm mt-1">
              You have {drafts.length} saved draft
              {drafts.length !== 1 ? "s" : ""}. Choose an action:
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 hover:bg-gray-100"
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
                    ? "border-[#2b825b] bg-amber-50"
                    : "border-gray-200"
                }`}
                onClick={() => setSelectedDraftId(draft.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                        <Clock className="h-3 w-3 mr-1" />
                        Draft
                      </Badge>
                      <span className="text-sm font-medium text-gray-500">
                        {draft.invoice_id}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {draft.business_name || "Untitled Invoice"}
                    </h3>
                    {draft.client_name && (
                      <p className="text-sm text-gray-600 mb-1">
                        Client: {draft.client_name}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
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
                    }}
                    className="ml-4"
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
              <p className="text-gray-600">
                ...and {drafts.length - 3} more draft
                {drafts.length - 3 !== 1 ? "s" : ""}
              </p>
              <Button
                variant="link"
                onClick={onViewAll}
                className="text-[#2b825b] hover:text-[#b38606]"
              >
                View All Drafts
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={onStartFresh} className="flex-1">
              Start Fresh
            </Button>
            {selectedDraftId && (
              <Button
                onClick={() => {
                  const selectedDraft = drafts.find(
                    (d) => d.id === selectedDraftId,
                  );
                  if (selectedDraft) onLoadDraft(selectedDraft);
                }}
                className="flex-1 bg-[#2b825b] hover:bg-[#1e5d42] text-white"
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
