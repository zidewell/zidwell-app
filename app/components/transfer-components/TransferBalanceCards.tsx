"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Eye, EyeOff, Landmark, CopyIcon } from "lucide-react";
import Swal from "sweetalert2";

interface TransferBalanceCardsProps {
  lifetimeBalance: number;
  balance: number;
  showAlltime: boolean;
  showCurrent: boolean;
  setShowAlltime: (value: boolean) => void;
  setShowCurrent: (value: boolean) => void;
  userDetails: any;
  formatNumber: (value: number) => string;
}

export default function TransferBalanceCards({
  lifetimeBalance,
  balance,
  showAlltime,
  showCurrent,
  setShowAlltime,
  setShowCurrent,
  userDetails,
  formatNumber,
}: TransferBalanceCardsProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Alltime Balance */}
      <Card className="bg-linear-to-r from-(--color-accent-yellow) to-[#E3A521] text-(--color-ink) flex items-center justify-between shadow-lg rounded-xl p-4">
        <CardHeader className="p-0">
          <CardTitle className="text-base md:text-lg font-medium">
            Alltime Balance
            <span className="block font-semibold text-xl mt-1">
              {showAlltime ? `₦${formatNumber(lifetimeBalance)}` : "*****"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <button
            onClick={() => setShowAlltime(!showAlltime)}
            className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition"
          >
            {showAlltime ? (
              <EyeOff className="text-(--color-ink) md:text-2xl" />
            ) : (
              <Eye className="text-(--color-ink) md:text-2xl" />
            )}
          </button>
        </CardContent>
      </Card>

      {/* Current Balance */}
      <Card className="bg-linear-to-r from-gray-600 to-gray-800 text-white flex items-center justify-between shadow-lg rounded-xl p-4">
        <CardHeader className="p-0">
          <CardTitle className="text-base md:text-lg font-medium">
            Current Balance
            <span className="block font-semibold text-xl mt-1">
              {showCurrent ? `₦${formatNumber(balance ?? 0)}` : "*****"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <button
            onClick={() => setShowCurrent(!showCurrent)}
            className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition"
          >
            {showCurrent ? (
              <EyeOff className="text-white md:text-2xl" />
            ) : (
              <Eye className="text-white md:text-2xl" />
            )}
          </button>
        </CardContent>
      </Card>

      {/* Account Number */}
      <Card className="flex items-center justify-between bg-(--bg-primary) border border-(--border-color) shadow-md rounded-xl p-4">
        <CardHeader className="p-0">
          <CardTitle className="text-base md:text-lg font-medium text-(--text-primary)">
            Your Account Number
            <div className="font-semibold flex items-center gap-4 mt-1 text-(--text-primary)">
              {userDetails?.bank_details?.bank_account_number || "N/A"}
              <button
                className="text-sm border border-(--border-color) px-3 py-2 rounded-md cursor-pointer hover:bg-(--bg-secondary) transition"
                onClick={async () => {
                  if (userDetails?.bank_details?.bank_account_number) {
                    await navigator.clipboard.writeText(
                      userDetails.bank_details.bank_account_number
                    );
                    Swal.fire({
                      icon: "success",
                      title: "Copied!",
                      text: "Account number copied to clipboard",
                      timer: 1500,
                      showConfirmButton: false,
                    });
                  }
                }}
              >
                <CopyIcon className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-(--text-secondary)">
              {userDetails?.bank_details?.bank_name || "Loading..."}
            </p>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-(--bg-secondary) p-3 rounded-full">
            <Landmark className="md:text-2xl text-(--text-secondary)" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}