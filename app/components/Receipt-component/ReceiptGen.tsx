"use client";

import { useState } from "react";
import { Plus, Search, AlertCircle, Wallet } from "lucide-react";
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
  userTier?: 'free' | 'growth' | 'premium' | 'elite';
  remainingReceipts?: string | number;
}

const RECEIPT_FEE = 100; // ₦100 per receipt after limit

export default function ReceiptGen({ 
  receipts, 
  loading, 
  userTier = 'free',
  remainingReceipts = 5 
}: ReceiptGenProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [activeTab, setActiveTab] = useState("Receipts");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Calculate limits based on tier
  const isPremium = userTier === 'premium' || userTier === 'elite';
  const receiptCount = receipts.length;
  const receiptLimit = userTier === 'free' ? 5 : Infinity;
  const hasReachedLimit = !isPremium && receiptCount >= receiptLimit;
  
  // Use total instead of calculating from items
  const totalAmount = receipts.reduce((sum, receipt) => {
    return sum + receipt.total;
  }, 0);

  const signedReceipt = receipts.filter(
    (rcp) => rcp.status === "signed"
  ).length;
  const pendingReceipt = receipts.filter(
    (rcp) => rcp.status === "pending"
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

  return (
    <div className="space-y-6">
      {/* Upgrade/Pay-per-use Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Limit Reached</h3>
            <p className="text-gray-600 text-center mb-6">
              You've used all {receiptCount} free receipts this month. 
              You can pay ₦{RECEIPT_FEE} per receipt or upgrade to Growth plan for unlimited receipts!
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/dashboard/services/receipt/create?payPerUse=true" className="w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Wallet className="w-4 h-4 mr-2" />
                  Pay ₦{RECEIPT_FEE} & Create
                </Button>
              </Link>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowUpgradePrompt(false)}
                >
                  Cancel
                </Button>
                <Link href="/pricing?upgrade=growth" className="flex-1">
                  <Button className="w-full bg-[#C29307] hover:bg-[#b38606] text-white">
                    Upgrade Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Badge */}
      {isPremium && (
        <div className="bg-[#C29307]/10 px-3 py-1 rounded-full border border-[#C29307] inline-block">
          <span className="text-[#C29307] font-medium text-sm flex items-center gap-1">
            <span className="w-2 h-2 bg-[#C29307] rounded-full"></span>
            PREMIUM • Unlimited Receipts
          </span>
        </div>
      )}

      {/* Usage Stats Banner */}
      {!isPremium && (
        <div className={`p-3 rounded-lg border ${
          hasReachedLimit 
            ? 'bg-blue-50 border-blue-200' 
            : receiptCount >= 4
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Monthly Receipt Usage:
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                hasReachedLimit 
                  ? 'bg-blue-100 text-blue-600' 
                  : receiptCount >= 4
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-green-100 text-green-600'
              }`}>
                {receiptCount}/5 used
              </span>
              {hasReachedLimit && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 ml-2">
                  <Wallet className="w-3 h-3 mr-1" />
                  Pay-per-use active
                </Badge>
              )}
            </div>
            
            {hasReachedLimit && (
              <Link href="/dashboard/services/receipt/create?payPerUse=true">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">
                  <Wallet className="w-3 h-3 mr-1" />
                  Pay ₦{RECEIPT_FEE} & Create
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
                <p className="text-sm text-gray-600 mb-1">Total Receipts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {receipts.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{totalAmount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Signed</p>
                <p className="text-2xl font-bold text-green-600">
                  {signedReceipt}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-[#C29307]">
                  {pendingReceipt + draftReceipt}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-2 mb-4">
          <TabsTrigger value="Receipts">All Receipts</TabsTrigger>
          <TabsTrigger 
            value="create" 
            disabled={hasReachedLimit && !isPremium}
            className={hasReachedLimit && !isPremium ? 'opacity-50 cursor-not-allowed' : ''}
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by client name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
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
                      className={`hover:bg-[#C29307] hover:text-white border hover:shadow-xl transition-all duration-300 ${
                        selectedStatus === status ? 'bg-[#C29307] text-white' : ''
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
                      hasReachedLimit && !isPremium
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-[#C29307] hover:bg-black'
                    }`}
                    onClick={handleCreateClick}
                    disabled={hasReachedLimit && !isPremium}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Receipt
                  </Button>
                </div>
              </div>

              {/* Pay-per-use info message */}
              {hasReachedLimit && !isPremium && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Wallet className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-700">
                      You've reached your monthly limit. You can continue with pay-per-use (₦{RECEIPT_FEE} per receipt) or upgrade your plan for unlimited receipts.
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