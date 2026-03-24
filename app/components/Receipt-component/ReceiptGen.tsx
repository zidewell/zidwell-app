"use client";

import { useState } from "react";
import { Plus, Search, AlertCircle, Crown } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import ReceiptList from "./RecieptLIst";
import CreateReceipt from "@/app/components/Receipt-component/CreateReciept";
import Link from "next/link";
import { Badge } from "../ui/badge";

interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Receipt {
  id: string;
  receipt_id: string;
  user_id: string;
  token: string;
  initiator_email: string;
  initiator_phone: string;
  initiator_name: string;
  business_name: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  bill_to: string;
  from_name: string;
  issue_date: string;
  customer_note: string;
  payment_for: string;
  payment_method: string;
  subtotal: number;
  total: number;
  status: "draft" | "pending" | "signed";
  signing_link: string;
  verification_code: string;
  receipt_items: ReceiptItem[];
  seller_signature: string | null;
  client_signature: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  metadata: any;
}

interface ReceiptGenProps {
  receipts: Receipt[];
  loading: boolean;
  userTier?: "free" | "zidlite" | "growth" | "premium" | "elite";
  remainingReceipts?: string | number;
}

export default function ReceiptGen({
  receipts,
  loading,
  userTier,
  remainingReceipts = 5,
}: ReceiptGenProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [activeTab, setActiveTab] = useState("Receipts");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Calculate limits based on tier
  const isPremium = userTier === "premium" || userTier === "elite";
  const isGrowth = userTier === "growth";
  const isZidLite = userTier === "zidlite";
  const isFree = userTier === "free";

  const hasUnlimitedReceipts = isPremium || isGrowth;
  const receiptCount = receipts.length;
  const receiptLimit = isFree ? 5 : isZidLite ? 20 : Infinity;
  const hasReachedLimit = !hasUnlimitedReceipts && receiptCount >= receiptLimit;

  const totalAmount = receipts.reduce((sum, receipt) => {
    return sum + receipt.total;
  }, 0);

  const signedReceipt = receipts.filter(
    (rcp) => rcp.status === "signed",
  ).length;
  const pendingReceipt = receipts.filter(
    (rcp) => rcp.status === "pending",
  ).length;
  const draftReceipt = receipts.filter((rcp) => rcp.status === "draft").length;

  const filteredReceipts = receipts?.filter((receipt) => {
    const title = receipt.client_name || receipt.bill_to || "";
    const status = receipt.status || "";
    const matchesSearch = title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "All" ||
      (selectedStatus === "Signed" && status === "signed") ||
      (selectedStatus === "Pending" && status === "pending") ||
      (selectedStatus === "Draft" && status === "draft");
    return matchesSearch && matchesStatus;
  });

  const handleCreateClick = () => {
    if (hasReachedLimit) {
      setShowUpgradePrompt(true);
    } else {
      setActiveTab("create");
    }
  };

  const getRemainingText = () => {
    if (hasUnlimitedReceipts) return "Unlimited";
    if (isZidLite) return `${Math.max(0, 20 - receiptCount)} remaining`;
    return `${Math.max(0, 5 - receiptCount)} remaining`;
  };

  const getUsageColor = () => {
    if (hasUnlimitedReceipts)
      return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
    if (isZidLite) {
      if (receiptCount >= 20)
        return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
      if (receiptCount >= 8)
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400";
      return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
    }
    if (receiptCount >= 5)
      return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
    if (receiptCount >= 4)
      return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
  };

  return (
    <div className="space-y-6">
      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2 dark:text-white">
              Upgrade Required
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {isZidLite
                ? "You've used all your ZidLite receipts. Upgrade to continue creating unlimited receipts!"
                : "You've used all your free receipts. Upgrade to continue creating unlimited receipts!"}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={() => setShowUpgradePrompt(false)}
              >
                Cancel
              </Button>
              <Link href="/pricing?upgrade=growth" className="flex-1">
                <Button className="w-full bg-primary hover:bg-primary-dark text-white">
                  View Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tier Badge */}
      <div className="flex items-center justify-between">
        <div
          className={`px-3 py-1 rounded-full ${
            isPremium
              ? "bg-primary-light-bg border border-primary dark:bg-primary-light-bg"
              : isGrowth
                ? "bg-green-100 border border-green-200 dark:bg-green-900/30 dark:border-green-800"
                : isZidLite
                  ? "bg-blue-100 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800"
                  : "bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
          } inline-block`}
        >
          <span
            className={`font-medium text-sm flex items-center gap-1 ${
              isPremium
                ? "text-primary dark:text-primary"
                : isGrowth
                  ? "text-green-600 dark:text-green-400"
                  : isZidLite
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isPremium
                  ? "bg-primary"
                  : isGrowth
                    ? "bg-green-600 dark:bg-green-400"
                    : isZidLite
                      ? "bg-blue-600 dark:bg-blue-400"
                      : "bg-gray-600 dark:bg-gray-400"
              }`}
            ></span>
            {isPremium
              ? "PREMIUM"
              : isGrowth
                ? "GROWTH"
                : isZidLite
                  ? "ZIDLITE"
                  : "FREE TRIAL"}{" "}
            • {getRemainingText()}
          </span>
        </div>
      </div>

      {/* Usage Stats Banner */}
      {!hasUnlimitedReceipts && (
        <div
          className={`p-3 rounded-lg border ${
            hasReachedLimit
              ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
              : isZidLite && receiptCount >= 8
                ? "bg-green-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                : !isZidLite && receiptCount >= 4
                  ? "bg-green-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                  : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isZidLite ? "ZidLite" : "Free Trial"} Receipt Usage:
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${getUsageColor()}`}
              >
                {receiptCount}/{isZidLite ? 20 : 5} used
              </span>
            </div>

            {hasReachedLimit && (
              <Link href="/pricing?upgrade=growth">
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary-dark text-white h-8 text-xs"
                >
                  Upgrade for Unlimited
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {activeTab === "Receipts" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Receipts
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {receipts.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Value
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₦{totalAmount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Signed
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {signedReceipt}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Pending
                </p>
                <p className="text-2xl font-bold text-primary dark:text-primary">
                  {pendingReceipt + draftReceipt}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-2 mb-4 dark:bg-gray-800">
          <TabsTrigger value="Receipts">All Receipts</TabsTrigger>
          <TabsTrigger
            value="create"
            disabled={hasReachedLimit && !hasUnlimitedReceipts}
            className={
              hasReachedLimit && !hasUnlimitedReceipts
                ? "opacity-50 cursor-not-allowed"
                : ""
            }
          >
            Create Receipt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="Receipts" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Search Input */}
                <div className="relative w-full sm:flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                  <Input
                    placeholder="Search by client name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>

                {/* Status Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                  {["All", "Signed", "Pending", "Draft"].map((status) => (
                    <Button
                      key={status}
                      variant={
                        selectedStatus === status ? "default" : "outline"
                      }
                      size="sm"
                      className={`hover:bg-primary hover:text-white border hover:shadow-xl transition-all duration-300 ${
                        selectedStatus === status
                          ? "bg-primary text-white"
                          : "dark:text-gray-300 dark:border-gray-600"
                      }`}
                      onClick={() => setSelectedStatus(status)}
                    >
                      {status}
                    </Button>
                  ))}
                </div>

                {/* New Receipt Button */}
                <div className="w-full sm:w-auto">
                  <Button
                    className={`w-full sm:w-auto hover:shadow-xl transition-all duration-300 ${
                      hasReachedLimit && !hasUnlimitedReceipts
                        ? "bg-gray-400 cursor-not-allowed dark:bg-gray-600"
                        : "bg-primary hover:bg-primary-dark text-white"
                    }`}
                    onClick={handleCreateClick}
                    disabled={hasReachedLimit && !hasUnlimitedReceipts}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Receipt
                  </Button>
                </div>
              </div>

              {/* Upgrade info message */}
              {hasReachedLimit && !hasUnlimitedReceipts && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Crown className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {isZidLite
                        ? "You've reached your ZidLite receipt limit. Upgrade your plan for unlimited receipts."
                        : "You've reached your free receipt limit. Upgrade your plan for unlimited receipts."}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Receipts List */}
          <ReceiptList receipts={filteredReceipts} loading={loading} />
        </TabsContent>

        <TabsContent value="create">
          <CreateReceipt
            userTier={userTier}
            hasReachedLimit={hasReachedLimit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
