"use client";

import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import FeeDisplay from "../FeeDisplay";
import TransferTypeSelector from "./TransferTypeSelector";
import MyAccountDetails from "./MyAccountDetails";
import BankAccountFields from "./BankAccountFields";
import P2PFields from "./P2PFields";
import ExpenseCategoryDropdown from "./ExpenseCategoryDropdown";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface TransferFormProps {
  transferType: "my-account" | "other-bank" | "p2p";
  setTransferType: (value: "my-account" | "other-bank" | "p2p") => void;
  amount: string;
  setAmount: (value: string) => void;
  narration: string;
  setNarration: (value: string) => void;
  expenseCategory: string;
  setExpenseCategory: (id: string) => void;
  expenseCategories: any[];
  loadingCategories: boolean;
  onToggleFavorite: (category: any, e: React.MouseEvent) => void;
  calculatedFee: number;
  totalDebit: number;
  setCalculatedFee: (fee: number) => void;
  setTotalDebit: (total: number) => void;
  errors: { [key: string]: string };
  isDisabled: boolean;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  // Props for child components
  loading2: boolean;
  userDetails: any;
  savedAccounts: any[];
  savedP2PBeneficiaries: any[];
  showSavedAccounts: boolean;
  setShowSavedAccounts: (show: boolean) => void;
  showSavedP2PBeneficiaries: boolean;
  setShowSavedP2PBeneficiaries: (show: boolean) => void;
  selectedSavedAccount: any;
  setSelectedSavedAccount: (account: any) => void;
  selectedSavedP2PBeneficiary: any;
  setSelectedSavedP2PBeneficiary: (beneficiary: any) => void;
  bankCode: string;
  setBankCode: (code: string) => void;
  bankName: string;
  setBankName: (name: string) => void;
  accountNumber: string;
  setAccountNumber: (number: string) => void;
  accountName: string;
  setAccountName: (name: string) => void;
  recepientAcc: string;
  setRecepientAcc: (acc: string) => void;
  p2pDetails: any;
  setP2pDetails: (details: any) => void;
  saveAccount: boolean;
  setSaveAccount: (save: boolean) => void;
  saveP2PBeneficiary: boolean;
  setSaveP2PBeneficiary: (save: boolean) => void;
  lookupLoading: boolean;
  // Beneficiary suggestions
  showBeneficiarySuggestions: boolean;
  matchingBeneficiaries: any[];
  onSelectBeneficiary: (beneficiary: any) => void;
  onCloseSuggestions: () => void;
  beneficiaryContainerRef: React.RefObject<HTMLDivElement>;
  accountInputRef: React.RefObject<HTMLInputElement>;
  p2pInputRef: React.RefObject<HTMLInputElement>;
  setIsInputFocused: (focused: boolean) => void;
  isInputFocused: boolean;
  banks: any[];
  open: boolean;
  setOpen: (open: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
  filteredBanks: any[];
  handleSelectBank: (bank: any) => void;
  getAllBeneficiaries: () => any[];
}

export default function TransferForm({
  transferType,
  setTransferType,
  amount,
  setAmount,
  narration,
  setNarration,
  expenseCategory,
  setExpenseCategory,
  expenseCategories,
  loadingCategories,
  onToggleFavorite,
  calculatedFee,
  totalDebit,
  setCalculatedFee,
  setTotalDebit,
  errors,
  isDisabled,
  loading,
  onSubmit,
  loading2,
  userDetails,
  savedAccounts,
  savedP2PBeneficiaries,
  showSavedAccounts,
  setShowSavedAccounts,
  showSavedP2PBeneficiaries,
  setShowSavedP2PBeneficiaries,
  selectedSavedAccount,
  setSelectedSavedAccount,
  selectedSavedP2PBeneficiary,
  setSelectedSavedP2PBeneficiary,
  bankCode,
  setBankCode,
  bankName,
  setBankName,
  accountNumber,
  setAccountNumber,
  accountName,
  setAccountName,
  recepientAcc,
  setRecepientAcc,
  p2pDetails,
  setP2pDetails,
  saveAccount,
  setSaveAccount,
  saveP2PBeneficiary,
  setSaveP2PBeneficiary,
  lookupLoading,
  showBeneficiarySuggestions,
  matchingBeneficiaries,
  onSelectBeneficiary,
  onCloseSuggestions,
  beneficiaryContainerRef,
  accountInputRef,
  p2pInputRef,
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
}: TransferFormProps) {
  return (
    <Card className="shadow-xl border rounded-2xl bg-(--bg-primary) border-(--border-color)">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-(--text-primary)">
          Transfer Funds
        </CardTitle>
        <p className="text-sm text-(--text-secondary)">
          Choose how you want to transfer funds from your wallet.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Transfer Type */}
          <TransferTypeSelector
            transferType={transferType}
            setTransferType={setTransferType}
          />

          {/* Amount */}
          <div className="space-y-1">
            <Label className="text-(--text-primary)">Amount (₦)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="bg-(--bg-primary) border-(--border-color) text-(--text-primary) placeholder:text-(--text-secondary)"
            />
            {transferType !== "p2p" && (
              <FeeDisplay
                type="transfer"
                amount={Number(amount)}
                paymentMethod="bank_transfer"
                onFeeCalculated={(fee, total) => {
                  setCalculatedFee(fee);
                  setTotalDebit(total);
                }}
              />
            )}
            {errors.amount && <p className="text-red-600 text-sm">{errors.amount}</p>}
          </div>

          {/* My Account Details */}
          {transferType === "my-account" && (
            <MyAccountDetails loading2={loading2} userDetails={userDetails} error={errors.myAccount} />
          )}

          {/* Other Bank Fields */}
          {transferType === "other-bank" && (
            <BankAccountFields
              savedAccounts={savedAccounts}
              showSavedAccounts={showSavedAccounts}
              setShowSavedAccounts={setShowSavedAccounts}
              selectedSavedAccount={selectedSavedAccount}
              setSelectedSavedAccount={setSelectedSavedAccount}
              bankCode={bankCode}
              setBankCode={setBankCode}
              bankName={bankName}
              setBankName={setBankName}
              accountNumber={accountNumber}
              setAccountNumber={setAccountNumber}
              accountName={accountName}
              setAccountName={setAccountName}
              saveAccount={saveAccount}
              setSaveAccount={setSaveAccount}
              lookupLoading={lookupLoading}
              errors={errors}
              showBeneficiarySuggestions={showBeneficiarySuggestions}
              matchingBeneficiaries={matchingBeneficiaries}
              onSelectBeneficiary={onSelectBeneficiary}
              onCloseSuggestions={onCloseSuggestions}
              beneficiaryContainerRef={beneficiaryContainerRef}
              accountInputRef={accountInputRef}
              setIsInputFocused={setIsInputFocused}
              isInputFocused={isInputFocused}
              banks={banks}
              open={open}
              setOpen={setOpen}
              search={search}
              setSearch={setSearch}
              filteredBanks={filteredBanks}
              handleSelectBank={handleSelectBank}
              getAllBeneficiaries={getAllBeneficiaries}
            />
          )}

          {/* P2P Fields */}
          {transferType === "p2p" && (
            <P2PFields
              savedP2PBeneficiaries={savedP2PBeneficiaries}
              showSavedP2PBeneficiaries={showSavedP2PBeneficiaries}
              setShowSavedP2PBeneficiaries={setShowSavedP2PBeneficiaries}
              selectedSavedP2PBeneficiary={selectedSavedP2PBeneficiary}
              setSelectedSavedP2PBeneficiary={setSelectedSavedP2PBeneficiary}
              recepientAcc={recepientAcc}
              setRecepientAcc={setRecepientAcc}
              p2pDetails={p2pDetails}
              setP2pDetails={setP2pDetails}
              saveP2PBeneficiary={saveP2PBeneficiary}
              setSaveP2PBeneficiary={setSaveP2PBeneficiary}
              lookupLoading={lookupLoading}
              errors={errors}
              showBeneficiarySuggestions={showBeneficiarySuggestions}
              matchingBeneficiaries={matchingBeneficiaries}
              onSelectBeneficiary={onSelectBeneficiary}
              onCloseSuggestions={onCloseSuggestions}
              beneficiaryContainerRef={beneficiaryContainerRef}
              p2pInputRef={p2pInputRef}
              setIsInputFocused={setIsInputFocused}
              isInputFocused={isInputFocused}
              getAllBeneficiaries={getAllBeneficiaries}
            />
          )}

          {/* Expense Category Dropdown */}
          <ExpenseCategoryDropdown
            expenseCategories={expenseCategories}
            expenseCategory={expenseCategory}
            setExpenseCategory={setExpenseCategory}
            setNarration={setNarration}
            loading={loadingCategories}
            error={errors.expenseCategory}
            onToggleFavorite={onToggleFavorite}
          />

          {/* Narration */}
          <div className="space-y-1">
            <Label className="text-(--text-primary)">
              Narration{" "}
              <span className="text-sm text-(--text-secondary)">(purpose of transaction)</span>
            </Label>
            <Input
              type="text"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="e.g. Food"
              maxLength={100}
              className="bg-(--bg-primary) border-(--border-color) text-(--text-primary) placeholder:text-(--text-secondary)"
            />
            {errors.narration && <p className="text-red-600 text-sm">{errors.narration}</p>}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isDisabled}
            className="w-full bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 md:w-[200px]"
          >
            {loading ? "Processing..." : "Transfer Now"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}