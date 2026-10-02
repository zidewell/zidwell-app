"use client";

import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Loader2 } from "lucide-react";
import SavedAccountsList from "./SavedAccountsList";
import BeneficiarySuggestions from "./BeneficiarySuggestions";

interface P2PFieldsProps {
  savedP2PBeneficiaries: any[];
  showSavedP2PBeneficiaries: boolean;
  setShowSavedP2PBeneficiaries: (show: boolean) => void;
  selectedSavedP2PBeneficiary: any;
  setSelectedSavedP2PBeneficiary: (beneficiary: any) => void;
  recepientAcc: string;
  setRecepientAcc: (acc: string) => void;
  p2pDetails: any;
  setP2pDetails: (details: any) => void;
  lookupLoading: boolean;
  errors: { [key: string]: string };
  showBeneficiarySuggestions: boolean;
  matchingBeneficiaries: any[];
  onSelectBeneficiary: (beneficiary: any) => void;
  onCloseSuggestions: () => void;
  beneficiaryContainerRef: React.RefObject<HTMLDivElement>;
  p2pInputRef: React.RefObject<HTMLInputElement>;
  setIsInputFocused: (focused: boolean) => void;
  isInputFocused: boolean;
  getAllBeneficiaries: () => any[];
}

export default function P2PFields({
  savedP2PBeneficiaries,
  showSavedP2PBeneficiaries,
  setShowSavedP2PBeneficiaries,
  selectedSavedP2PBeneficiary,
  setSelectedSavedP2PBeneficiary,
  recepientAcc,
  setRecepientAcc,
  p2pDetails,
  setP2pDetails,
  lookupLoading,
  errors,
  showBeneficiarySuggestions,
  matchingBeneficiaries,
  onSelectBeneficiary,
  onCloseSuggestions,
  beneficiaryContainerRef,
  p2pInputRef,
  setIsInputFocused,
  isInputFocused,
  getAllBeneficiaries,
}: P2PFieldsProps) {
  return (
    <>
      {showBeneficiarySuggestions && matchingBeneficiaries.length > 0 && (
        <BeneficiarySuggestions
          matchingBeneficiaries={matchingBeneficiaries}
          onSelect={onSelectBeneficiary}
          onClose={onCloseSuggestions}
          containerRef={beneficiaryContainerRef}
        />
      )}

      <SavedAccountsList
        type="p2p"
        accounts={savedP2PBeneficiaries}
        show={showSavedP2PBeneficiaries}
        onToggle={() =>
          setShowSavedP2PBeneficiaries(!showSavedP2PBeneficiaries)
        }
        onSelect={setSelectedSavedP2PBeneficiary}
        selectedId={selectedSavedP2PBeneficiary?.id}
      />

      <div className="space-y-1 relative beneficiary-input-trigger">
        <Label className="text-(--text-primary)">
          Account Number (Zidwell User)
        </Label>
        <Input
          ref={p2pInputRef}
          type="text"
          value={recepientAcc}
          onChange={(e) => setRecepientAcc(e.target.value)}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => {
            setTimeout(() => {
              if (
                !document.activeElement?.closest(
                  ".beneficiary-suggestions-container"
                )
              ) {
                setIsInputFocused(false);
              }
            }, 200);
          }}
          placeholder="Enter account number"
          className="bg-(--bg-primary) border-(--border-color) text-(--text-primary) placeholder:text-(--text-secondary)"
        />
        {errors.recepientAcc && (
          <p className="text-red-600 text-sm">{errors.recepientAcc}</p>
        )}
      </div>

      {lookupLoading && (
        <p className="text-(--color-accent-yellow) text-sm flex items-center gap-2">
          <Loader2 className="animate-spin" /> Verifying account...
        </p>
      )}

      {p2pDetails?.name && !errors.recepientAcc && (
        <p className="text-(--color-accent-yellow) text-sm font-semibold">
          Account Name: {p2pDetails.name}
        </p>
      )}
    </>
  );
}