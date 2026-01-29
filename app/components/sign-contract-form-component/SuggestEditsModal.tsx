"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";

interface SuggestEditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  contractTitle: string;
  contractToken: string;
  signeeEmail: string;
  onSuccess: () => void;
}

export const SuggestEditsModal = ({
  open,
  onOpenChange,
  contractId,
  contractTitle,
  contractToken,
  signeeEmail,
  onSuccess,
}: SuggestEditsModalProps) => {
  const [edits, setEdits] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!edits.trim()) {
      toast({
        title: "Error",
        description: "Please provide your suggested edits",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contract/suggest-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId,
          contractToken,
          contractTitle,
          signeeEmail,
          suggestedEdits: edits,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit edits");
      }

      toast({
        title: "Edits submitted successfully!",
        description: "The contract creator will be notified.",
        variant: "default",
      });

      onSuccess();
      onOpenChange(false);
      setEdits("");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit edits",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Suggest Edits to Contract</DialogTitle>
          <DialogDescription>
            Provide your suggested changes to "{contractTitle}". The contract
            creator will be notified and can accept the edits for ₦500.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Edit Fee</p>
                <p>
                  The contract creator will be charged ₦500 to review and
                  implement your suggested edits. Be clear and specific about
                  the changes you'd like to see.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Suggested Edits *</Label>
            <Textarea
              value={edits}
              onChange={(e) => setEdits(e.target.value)}
              placeholder="Describe the changes you'd like to see in the contract. Be as specific as possible..."
              className="min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Provide detailed suggestions for changes, additions, or deletions
              to the contract terms
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 bg-[#C29307] hover:bg-[#b38606]"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Edits"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
