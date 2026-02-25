// components/admin/dashboard/PlatformSummary.tsx
import { formatCurrency } from "@/lib/dashboard-utils";

interface PlatformSummaryProps {
  totalUsers: number;
  totalTransactions: number;
  successfulTransactions: number;
  contractFees: number;
  invoiceRevenue: number;
  transactionRevenue: number;
  nombaBalance: number;  
  mainWalletBalance: number;
  contractSignRate: string;
  invoicePaymentRate: string;
  range: string;
}

export const PlatformSummary = ({
  totalUsers,
  totalTransactions,
  successfulTransactions,
  contractFees,
  invoiceRevenue,
  transactionRevenue,
  nombaBalance,
  mainWalletBalance,
  contractSignRate,
  invoicePaymentRate,
  range,
}: PlatformSummaryProps) => {
  const successRate = totalTransactions > 0
    ? ((successfulTransactions / totalTransactions) * 100).toFixed(1)
    : "0";

  return (
    <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-2xl shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Platform Performance Summary
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-2xl font-bold text-gray-900">
            {totalUsers.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="text-sm text-gray-500">Success Rate</div>
          <div className="text-2xl font-bold text-gray-900">
            {successRate}%
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="text-sm text-gray-500">Contract Revenue</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(contractFees)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="text-sm text-gray-500">Invoice Revenue</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(invoiceRevenue)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="text-sm text-gray-500">Transaction Revenue</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(transactionRevenue)}
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Total App Revenue:</span>{" "}
          {formatCurrency(nombaBalance - mainWalletBalance)}  {/* Using nombaBalance */}
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Contract Sign Rate:</span>{" "}
          {contractSignRate}%
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Invoice Payment Rate:</span>{" "}
          {invoicePaymentRate}%
        </div>
      </div>
    </div>
  );
};