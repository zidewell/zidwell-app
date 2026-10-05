"use client";

import { Bookmark, User, Trash2, Star } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import Swal from "sweetalert2";

interface SavedAccount {
  id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
  is_default: boolean;
  last_used_at?: string;
  use_count?: number;
}

interface SavedP2PBeneficiary {
  id: string;
  wallet_id: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
  created_at: string;
  last_used_at?: string;
  use_count?: number;
}

interface SavedAccountsListProps {
  type: "bank" | "p2p";
  accounts: SavedAccount[] | SavedP2PBeneficiary[];
  show: boolean;
  onToggle: () => void;
  onSelect: (account: any) => void;
  selectedId?: string;
  onDeleted?: (id: string) => void;
  onDefaultChanged?: (id: string) => void;
}

function relativeTime(iso?: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function SavedAccountsList({
  type,
  accounts,
  show,
  onToggle,
  onSelect,
  selectedId,
  onDeleted,
  onDefaultChanged,
}: SavedAccountsListProps) {
  if (accounts.length === 0) return null;

  const isBank = type === "bank";
  const title = isBank ? "Saved Accounts" : "Saved Beneficiaries";
  const icon = isBank ? (
    <Bookmark className="h-4 w-4" />
  ) : (
    <User className="h-4 w-4" />
  );

  const handleDelete = async (e: React.MouseEvent, account: any) => {
    e.stopPropagation();
    const confirmed = await Swal.fire({
      icon: "warning",
      title: "Remove beneficiary?",
      text: `${account.account_name} will be removed from your saved list.`,
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!confirmed.isConfirmed) return;

    try {
      const url = isBank
        ? `/api/saved-accounts?userId=${account.user_id}&id=${account.id}`
        : `/api/save-p2p-beneficiary?userId=${account.user_id}&id=${account.id}`;

      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        onDeleted?.(account.id);
        Swal.fire({
          icon: "success",
          title: "Removed",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to remove",
          text: data.message || "Please try again",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong",
      });
    }
  };

  const handleSetDefault = async (e: React.MouseEvent, account: any) => {
    e.stopPropagation();
    try {
      const url = isBank
        ? "/api/saved-accounts"
        : "/api/save-p2p-beneficiary";

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: account.user_id,
          id: account.id,
          isDefault: !account.is_default,
        }),
      });
      const data = await res.json();

      if (data.success) {
        onDefaultChanged?.(account.id);
      }
    } catch (err) {
      console.error("Failed to set default:", err);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-(--text-primary)">
          {title}
        </Label>
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
        <div className="bg-(--bg-secondary) border border-(--border-color) rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
          {accounts.map((account: any) => (
            <div
              key={account.id}
              onClick={() => onSelect(account)}
              className={`p-2 rounded cursor-pointer transition-colors group ${
                selectedId === account.id
                  ? "bg-(--color-accent-yellow)/20 border border-(--color-accent-yellow)"
                  : "bg-(--bg-primary) hover:bg-(--bg-secondary) border border-(--border-color)"
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-(--text-primary) text-sm truncate">
                    {account.account_name}
                  </p>
                  <p className="text-xs text-(--text-secondary) truncate">
                    {account.account_number} •{" "}
                    {isBank ? account.bank_name : "Zidwell"}
                  </p>
                  <p className="text-[10px] text-(--text-secondary) mt-0.5">
                    {account.use_count
                      ? `Used ${account.use_count}×`
                      : "Saved"}{" "}
                    • {relativeTime(account.last_used_at)}
                  </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleSetDefault(e, account)}
                    className="p-1.5 hover:bg-(--bg-secondary) rounded"
                    title={account.is_default ? "Unset default" : "Set as default"}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${
                        account.is_default
                          ? "fill-(--color-accent-yellow) text-(--color-accent-yellow)"
                          : "text-(--text-secondary)"
                      }`}
                    />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, account)}
                    className="p-1.5 hover:bg-red-500/20 rounded"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>

                {account.is_default && (
                  <span className="px-2 py-0.5 text-[10px] bg-green-100 text-green-800 rounded-full dark:bg-green-900/30 dark:text-green-400 flex-shrink-0">
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