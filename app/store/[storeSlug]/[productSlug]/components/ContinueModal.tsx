// app/store/[storeSlug]/[productSlug]/components/ContinueModal.tsx
"use client";

import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  PRIMARY_BG,
  PRIMARY_BG_HOVER,
  PRIMARY_TEXT,
} from "../utils/helpers";

interface Props {
  isSchoolPage: boolean;
  lookupInput: string;
  setLookupInput: (v: string) => void;
  lookupError: string;
  setLookupError: (v: string) => void;
  lookingUp: boolean;
  onLookup: () => void;
  onClose: () => void;
}

export function ContinueModal({
  isSchoolPage,
  lookupInput,
  setLookupInput,
  lookupError,
  setLookupError,
  lookingUp,
  onLookup,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-2xl border border-border bg-background p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {isSchoolPage ? "Find my payments" : "Find your plan"}
          </h3>
          <button
            onClick={onClose}
            className="text-foreground/50 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-foreground/60">
          {isSchoolPage
            ? "Enter the email or phone number you used when paying for a student."
            : "Enter the email or phone number you used for your first installment."}
        </p>

        <div className="space-y-3">
          <Input
            value={lookupInput}
            onChange={(e) => {
              setLookupInput(e.target.value);
              setLookupError("");
            }}
            placeholder="Email or phone number"
            onKeyDown={(e) => {
              if (e.key === "Enter") onLookup();
            }}
          />

          {lookupError && (
            <p className="text-xs text-red-500">{lookupError}</p>
          )}

          <Button
            onClick={onLookup}
            disabled={lookingUp}
            className={`w-full rounded-lg ${PRIMARY_BG} ${PRIMARY_TEXT} ${PRIMARY_BG_HOVER} py-3 text-sm font-semibold`}
          >
            {lookingUp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Looking up
              </>
            ) : isSchoolPage ? (
              "Find my payments"
            ) : (
              "Find my plan"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}