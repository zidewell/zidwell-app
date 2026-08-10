"use client";

import { Bookmark, User } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

interface SavedAccount {
  id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
  is_default: boolean;
  last_used?: string;
}

interface SavedP2PBeneficiary {
  id: string;
  wallet_id: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
  created_at: string;
  last_used?: string;
}

interface SavedAccountsListProps {
  type: "bank" | "p2p";
  accounts: SavedAccount[] | SavedP2PBeneficiary[];
  show: boolean;
  onToggle: () => void;
  onSelect: (account: any) => void;
  selectedId?: string;
}

export default function SavedAccountsList({
  type,
  accounts,
  show,
  onToggle,
  onSelect,
  selectedId,
}: SavedAccountsListProps) {
  if (accounts.length === 0) return null;

  const isBank = type === "bank";
  const bgColor = isBank ? "blue" : "purple";
  const title = isBank ? "Saved Accounts" : "Saved Beneficiaries";
  const icon = isBank ? <Bookmark className="h-4 w-4" /> : <User className="h-4 w-4" />;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-(--text-primary)">{title}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="flex items-center gap-1 border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary)"
        >
          {icon}
          {show ? "Hide" : "Show"} Saved
        </Button>
      </div>
      {show && (
        <div className={`bg-${bgColor}-50 border border-${bgColor}-200 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto dark:bg-${bgColor}-900/20 dark:border-${bgColor}-800`}>
          {accounts.map((account: any) => (
            <div
              key={account.id}
              onClick={() => onSelect(account)}
              className={`p-2 rounded cursor-pointer transition-colors ${
                selectedId === account.id
                  ? `bg-${bgColor}-100 border border-${bgColor}-300 dark:bg-${bgColor}-900/40 dark:border-${bgColor}-700`
                  : "bg-white hover:bg-gray-50 border dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm dark:text-gray-100">
                    {account.account_name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {account.account_number} • {isBank ? account.bank_name : "Zidwell User"}
                  </p>
                </div>
                {account.is_default && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full ml-2 dark:bg-green-900/30 dark:text-green-400">
                    Default
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}