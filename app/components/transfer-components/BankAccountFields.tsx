"use client";

import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "../ui/command";
import { Check, ChevronsUpDown, Loader2, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import SavedAccountsList from "./SavedAccountsList";
import BeneficiarySuggestions from "./BeneficiarySuggestions";

interface Bank {
  name: string;
  code: string;
}

interface BankAccountFieldsProps {
  savedAccounts: any[];
  showSavedAccounts: boolean;
  setShowSavedAccounts: (show: boolean) => void;
  selectedSavedAccount: any;
  setSelectedSavedAccount: (account: any) => void;
  bankCode: string;
  setBankCode: (code: string) => void;
  bankName: string;
  setBankName: (name: string) => void;
  accountNumber: string;
  setAccountNumber: (number: string) => void;
  accountName: string;
  setAccountName: (name: string) => void;
  saveAccount: boolean;
  setSaveAccount: (save: boolean) => void;
  lookupLoading: boolean;
  errors: { [key: string]: string };
  showBeneficiarySuggestions: boolean;
  matchingBeneficiaries: any[];
  onSelectBeneficiary: (beneficiary: any) => void;
  onCloseSuggestions: () => void;
  beneficiaryContainerRef: React.RefObject<HTMLDivElement>;
  accountInputRef: React.RefObject<HTMLInputElement>;
  setIsInputFocused: (focused: boolean) => void;
  isInputFocused: boolean;
  banks: Bank[];
  open: boolean;
  setOpen: (open: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
  filteredBanks: Bank[];
  handleSelectBank: (bank: Bank) => void;
  getAllBeneficiaries: () => any[];
}

export default function BankAccountFields({
  savedAccounts,
  showSavedAccounts,
  setShowSavedAccounts,
  selectedSavedAccount,
  setSelectedSavedAccount,
  bankCode,
  setBankCode,
  bankName,
  setBankName,
  accountNumber,
  setAccountNumber,
  accountName,
  setAccountName,
  saveAccount,
  setSaveAccount,
  lookupLoading,
  errors,
  showBeneficiarySuggestions,
  matchingBeneficiaries,
  onSelectBeneficiary,
  onCloseSuggestions,
  beneficiaryContainerRef,
  accountInputRef,
  setIsInputFocused,
  isInputFocused,
  banks,
  open,
  setOpen,
  search,
  setSearch,
  filteredBanks,
  handleSelectBank,
  getAllBeneficiaries,
}: BankAccountFieldsProps) {
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

      {/* Saved Accounts */}
      <SavedAccountsList
        type="bank"
        accounts={savedAccounts}
        show={showSavedAccounts}
        onToggle={() => setShowSavedAccounts(!showSavedAccounts)}
        onSelect={setSelectedSavedAccount}
        selectedId={selectedSavedAccount?.id}
      />

      {/* Bank Selection */}
      <div className="space-y-1">
        <Label className="text-(--text-primary)">Select Bank Name</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-full flex justify-between items-center border border-(--border-color) rounded px-3 py-2 text-sm bg-(--bg-primary) text-(--text-primary)"
              aria-expanded={open}
            >
              {bankName || "Search bank..."}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 bg-(--bg-primary) border-(--border-color)">
            <Command className="bg-(--bg-primary)">
              <CommandInput
                placeholder="Search bank..."
                value={search}
                onValueChange={setSearch}
                autoFocus
                className="bg-(--bg-primary) border-(--border-color) text-(--text-primary)"
              />
              <CommandList>
                <CommandEmpty className="text-(--text-secondary)">No bank found.</CommandEmpty>
                <CommandGroup>
                  {filteredBanks.map((bank) => (
                    <CommandItem
                      key={bank.code}
                      onSelect={() => handleSelectBank(bank)}
                      className="text-(--text-primary) hover:bg-(--bg-secondary)"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          bankCode === bank.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {bank.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {errors.otherBank && <p className="text-red-600 text-sm">{errors.otherBank}</p>}
      </div>

      {/* Account Number */}
      <div className="space-y-1 relative beneficiary-input-trigger">
        <Label className="text-(--text-primary)">Account Number</Label>
        <Input
          ref={accountInputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
          onFocus={() => {
            setIsInputFocused(true);
            if (accountNumber.length > 0) {
              const allBeneficiaries = getAllBeneficiaries();
              const matches = allBeneficiaries.filter(
                (b) =>
                  b.account_number.includes(accountNumber) ||
                  b.account_name.toLowerCase().includes(accountNumber.toLowerCase())
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
          placeholder="10-digit account number"
          className="bg-(--bg-primary) border-(--border-color) text-(--text-primary) placeholder:text-(--text-secondary) [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {errors.accountNumber && <p className="text-red-600 text-sm">{errors.accountNumber}</p>}
      </div>

      {/* Account Name */}
      {lookupLoading && (
        <p className="text-(--color-accent-yellow) text-sm flex items-center gap-2">
          <Loader2 className="animate-spin" /> Verifying account...
        </p>
      )}
      {accountName && !errors.accountNumber && (
        <div className="space-y-2">
          <p className="text-(--color-accent-yellow) text-sm font-semibold">
            Account Name: {accountName}
          </p>
          {!selectedSavedAccount && accountNumber.length === 10 && accountName && (
            <div className="flex items-center justify-between p-3 bg-(--bg-secondary) rounded-lg border border-(--border-color)">
              <span className="text-sm font-medium text-(--text-primary)">Save to beneficiaries</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAccount}
                  onChange={(e) => setSaveAccount(e.target.checked)}
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