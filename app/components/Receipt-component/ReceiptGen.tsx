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
      return "bg-(--color-accent-yellow)/20 text-(--color-accent-yellow) dark:bg-(--color-accent-yellow)/20 dark:text-(--color-accent-yellow)";
    }
    if (receiptCount >= 5)
      return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
    if (receiptCount >= 4)
      return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-(--color-accent-yellow)/20 text-(--color-accent-yellow) dark:bg-(--color-accent-yellow)/20 dark:text-(--color-accent-yellow)";
  };

  return (
    <div className="space-y-6">
      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-(--bg-primary) dark:bg-gray-900 rounded-xl max-w-md w-full p-6 shadow-pop border border-(--border-color) squircle-lg">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2 text-(--text-primary)">
              Upgrade Required
            </h3>
            <p className="text-(--text-secondary) text-center mb-6">
              {isZidLite
                ? "You've used all your ZidLite receipts. Upgrade to continue creating unlimited receipts!"
                : "You've used all your free receipts. Upgrade to continue creating unlimited receipts!"}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary) squircle-md"
                onClick={() => setShowUpgradePrompt(false)}
              >
                Cancel
              </Button>
              <Link href="/pricing?upgrade=growth" className="flex-1">
                <Button className="w-full bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 squircle-md">
                  View Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {activeTab === "Receipts" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-(--text-secondary) mb-1">
                  Total Receipts
                </p>
                <p className="text-2xl font-bold text-(--text-primary)">
                  {receipts.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-(--text-secondary) mb-1">
                  Total Value
                </p>
                <p className="text-2xl font-bold text-(--text-primary)">
                  ₦{totalAmount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-(--text-secondary) mb-1">Signed</p>
                <p className="text-2xl font-bold text-(--color-lemon-green)">
                  {signedReceipt}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-(--text-secondary) mb-1">Pending</p>
                <p className="text-2xl font-bold text-(--color-accent-yellow)">
                  {pendingReceipt + draftReceipt}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-2 mb-4 bg-(--bg-secondary) p-1 rounded-xl">
          <TabsTrigger
            value="Receipts"
            className="data-[state=active]:bg-(--bg-primary) data-[state=active]:text-(--color-accent-yellow) text-(--text-secondary) squircle-md"
          >
            All Receipts
          </TabsTrigger>
          <TabsTrigger
            value="create"
            disabled={hasReachedLimit && !hasUnlimitedReceipts}
            className={`squircle-md ${
              hasReachedLimit && !hasUnlimitedReceipts
                ? "opacity-50 cursor-not-allowed"
                : "data-[state=active]:bg-(--bg-primary) data-[state=active]:text-(--color-accent-yellow) text-(--text-secondary)"
            }`}
          >
            Create Receipt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="Receipts" className="space-y-6">
          {/* Search and Filter */}
          <Card className="bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Search Input */}
                <div className="relative w-full sm:flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-(--text-secondary) w-4 h-4" />
                  <Input
                    placeholder="Search by client name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                    style={{ outline: "none", boxShadow: "none" }}
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
                      className={`transition-all duration-300 ${
                        selectedStatus === status
                          ? "bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
                          : "border-(--border-color) text-(--text-secondary) hover:bg-(--bg-secondary)"
                      } squircle-sm`}
                      onClick={() => setSelectedStatus(status)}
                    >
                      {status}
                    </Button>
                  ))}
                </div>

                {/* New Receipt Button */}
                <div className="w-full sm:w-auto">
                  <Button
                    className={`w-full sm:w-auto transition-all duration-300 squircle-md ${
                      hasReachedLimit && !hasUnlimitedReceipts
                        ? "bg-gray-400 cursor-not-allowed dark:bg-gray-600"
                        : "bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
                    }`}
                    onClick={handleCreateClick}
                    disabled={hasReachedLimit && !hasUnlimitedReceipts}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Receipt
                  </Button>
                </div>
              </div>
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
