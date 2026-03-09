// app/components/UsageSummary.tsx
"use client";

import { RefreshCw } from 'lucide-react';

interface UsageSummaryProps {
  usage: any;
  onRefresh: () => void;
}

export default function UsageSummary({ usage, onRefresh }: UsageSummaryProps) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900 dark:text-gray-50">
          📊 Monthly Usage Summary
        </h3>
        <button 
          onClick={onRefresh}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Refresh usage"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Bookkeeping Trial Banner */}
      {usage.bookkeepingTrial?.isActive && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <span className="font-semibold">✨ Bookkeeping Trial</span>
            <span className="text-sm">{usage.bookkeepingTrial.daysRemaining} days remaining</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Invoices</span>
            <span className="font-medium text-gray-900 dark:text-gray-50">
              {usage.invoices.used} / {usage.invoices.limit}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                (usage.invoices.used / usage.invoices.limit) >= 0.9 ? 'bg-red-500' :
                (usage.invoices.used / usage.invoices.limit) >= 0.7 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${(usage.invoices.used / usage.invoices.limit) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {usage.invoices.remaining} invoices remaining this month
          </p>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Receipts</span>
            <span className="font-medium text-gray-900 dark:text-gray-50">
              {usage.receipts.used} / {usage.receipts.limit}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                (usage.receipts.used / usage.receipts.limit) >= 0.9 ? 'bg-red-500' :
                (usage.receipts.used / usage.receipts.limit) >= 0.7 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${(usage.receipts.used / usage.receipts.limit) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {usage.receipts.remaining} receipts remaining this month
          </p>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Contracts</span>
            <span className="font-medium text-gray-900 dark:text-gray-50">
              {usage.contracts.used} / {usage.contracts.limit}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                (usage.contracts.used / usage.contracts.limit) >= 0.9 ? 'bg-red-500' :
                (usage.contracts.used / usage.contracts.limit) >= 0.7 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${(usage.contracts.used / usage.contracts.limit) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {usage.contracts.remaining} contracts remaining this month
          </p>
        </div>
      </div>

      {/* Upgrade Prompt when limits are low */}
      {(usage.invoices.remaining <= 2 || usage.receipts.remaining <= 2 || usage.contracts.remaining <= 0) && (
        <div className="mt-4 p-3 bg-[#C29307]/10 rounded-lg border border-[#C29307]/20">
          <p className="text-sm text-[#C29307] font-medium">
            ⚡ You're running low on free items. Upgrade to Growth plan for unlimited access!
          </p>
          <button 
            onClick={() => window.location.href = '/#pricing'}
            className="mt-2 text-sm bg-[#C29307] text-white px-3 py-1 rounded hover:bg-[#C29307]/90 transition-colors"
          >
            View Plans
          </button>
        </div>
      )}
    </div>
  );
}