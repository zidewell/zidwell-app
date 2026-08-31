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
  saveP2PBeneficiary: boolean;
  setSaveP2PBeneficiary: (save: boolean) => void;
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
  saveP2PBeneficiary,
  setSaveP2PBeneficiary,
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
      {/* Beneficiary Suggestions */}
      {showBeneficiarySuggestions && matchingBeneficiaries.length > 0 && (
        <BeneficiarySuggestions
          matchingBeneficiaries={matchingBeneficiaries}
          onSelect={onSelectBeneficiary}
          onClose={onCloseSuggestions}
          containerRef={beneficiaryContainerRef}
        />
      )}

      {/* Saved P2P Beneficiaries */}
      <SavedAccountsList
        type="p2p"
        accounts={savedP2PBeneficiaries}
        show={showSavedP2PBeneficiaries}
        onToggle={() => setShowSavedP2PBeneficiaries(!showSavedP2PBeneficiaries)}
        onSelect={setSelectedSavedP2PBeneficiary}
        selectedId={selectedSavedP2PBeneficiary?.id}
      />

      {/* Account Number */}
      <div className="space-y-1 relative beneficiary-input-trigger">
        <Label className="text-(--text-primary)">Account Number (Zidwell User)</Label>
        <Input
          ref={p2pInputRef}
          type="text"
          value={recepientAcc}
          onChange={(e) => setRecepientAcc(e.target.value)}
          onFocus={() => {
            setIsInputFocused(true);
            if (recepientAcc.length > 0) {
              const allBeneficiaries = getAllBeneficiaries();
              const matches = allBeneficiaries.filter(
                (b) =>
                  b.account_number.includes(recepientAcc) ||
                  b.account_name.toLowerCase().includes(recepientAcc.toLowerCase())
              );
              if (matches.length > 0) {
                // This would need to be handled by parent
              }
            }
          }}
          onBlur={() => {
            setTimeout(() => {
              if (!document.activeElement?.closest(".beneficiary-suggestions-container")) {
                setIsInputFocused(false);
              }
            }, 200);
          }}
          placeholder="Enter account number"
          className="bg-(--bg-primary) border-(--border-color) text-(--text-primary) placeholder:text-(--text-secondary)"
        />
        {errors.recepientAcc && <p className="text-red-600 text-sm">{errors.recepientAcc}</p>}
      </div>

      {/* Account Name */}
      {lookupLoading && (
        <p className="text-(--color-accent-yellow) text-sm flex items-center gap-2">
          <Loader2 className="animate-spin" /> Verifying account...
        </p>
      )}
      {p2pDetails?.name && !errors.recepientAcc && (
        <div className="space-y-2">
          <p className="text-(--color-accent-yellow) text-sm font-semibold">
            Account Name: {p2pDetails.name}
          </p>
          {!selectedSavedP2PBeneficiary && recepientAcc.length >= 6 && p2pDetails?.name && (
            <div className="flex items-center justify-between p-3 bg-(--bg-secondary) rounded-lg border border-(--border-color)">
              <span className="text-sm font-medium text-(--text-primary)">Save to beneficiaries</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveP2PBeneficiary}
                  onChange={(e) => setSaveP2PBeneficiary(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--color-accent-yellow) dark:bg-gray-600"></div>
              </label>
            </div>
          )}
        </div>
      )}
    </>
  );
}