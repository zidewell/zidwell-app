// components/admin/dashboard/TransactionsTable.tsx
import { useState } from "react";

interface TransactionsTableProps {
  transactions: any[];
  page: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onNext: () => void;
  onPrev: () => void;
  formatCurrency: (value: any) => string;
  formatDateSafely: (date: string) => string;
}

export const TransactionsTable = ({
  transactions,
  page,
  hasNextPage,
  hasPrevPage,
  onNext,
  onPrev,
  formatCurrency,
  formatDateSafely,
}: TransactionsTableProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Recent Transactions
        </h3>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">Page: {page}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              disabled={!hasPrevPage}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !hasPrevPage
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              Previous
            </button>
            <button
              onClick={onNext}
              disabled={!hasNextPage}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !hasNextPage
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.length > 0 ? (
              transactions.map((tx: any) => (
                <tr
                  key={tx.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(tx.amount)}
                    </div>
                    {tx.fee > 0 && (
                      <div className="text-xs text-amber-600 mt-1">
                        Fee: {formatCurrency(tx.fee)}
                      </div>
                    )}
                    {(tx.type?.toLowerCase() || "").includes(
                      "contract"
                    ) && (
                      <div className="text-xs text-indigo-600 mt-1">
                        Contract Fee
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {tx.description || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (tx.type?.toLowerCase() || "").includes("fee")
                          ? "bg-amber-100 text-amber-800"
                        : (tx.type?.toLowerCase() || "").includes(
                            "deposit"
                          ) ||
                          (tx.type?.toLowerCase() || "").includes(
                            "received"
                          )
                          ? "bg-green-100 text-green-800"
                        : (tx.type?.toLowerCase() || "").includes(
                            "withdrawal"
                          ) ||
                          (tx.type?.toLowerCase() || "").includes("sent")
                          ? "bg-red-100 text-red-800"
                        : (tx.type?.toLowerCase() || "").includes(
                            "contract"
                          )
                          ? "bg-indigo-100 text-indigo-800"
                        : (tx.type?.toLowerCase() || "").includes("invoice")
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {tx.type || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tx.status === "success"
                          ? "bg-green-100 text-green-800"
                        : tx.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {tx.status || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDateSafely(tx.created_at)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};