import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CHART_COLORS } from "@/constants/dashboard";
import { formatCurrency } from "@/lib/dashboard-utils";
import { RangeOption, RevenueMonthlyData } from "@/types/admin-dashoard"; 

interface RevenueChartProps {
  data: RevenueMonthlyData[];
  range: RangeOption;
}

export const RevenueChart = ({ data, range }: RevenueChartProps) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload;
      if (!item) return null;

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">Total Revenue:</span>
              <span className="font-medium text-gray-900">{formatCurrency(item.total)}</span>
            </div>
            <div className="border-t pt-2 mt-1">
              <div className="flex items-center justify-between gap-4 text-green-600">
                <span className="text-sm">App Fees (Platform):</span>
                <span className="font-medium">{formatCurrency(item.app_fees)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-orange-600">
                <span className="text-sm">Nomba Fees (Provider):</span>
                <span className="font-medium">{formatCurrency(item.nomba_fees)}</span>
              </div>
            </div>
            <div className="border-t pt-2 mt-1">
              <div className="flex items-center justify-between gap-4 text-blue-600">
                <span className="text-sm">Transfers:</span>
                <span className="font-medium">{formatCurrency(item.transfers)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-purple-600">
                <span className="text-sm">Invoices:</span>
                <span className="font-medium">{formatCurrency(item.invoice)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-amber-600">
                <span className="text-sm">Contracts:</span>
                <span className="font-medium">{formatCurrency(item.contract)}</span>
              </div>
            </div>
            {item.breakdown && (
              <div className="border-t pt-2 mt-1">
                <p className="text-xs font-medium text-gray-700 mb-1">App Fee Breakdown:</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span className="text-gray-600">Transactions:</span>
                  <span className="text-right font-medium">{formatCurrency(item.breakdown.app_fees.transactions)}</span>
                  <span className="text-gray-600">Invoice Creation:</span>
                  <span className="text-right font-medium">{formatCurrency(item.breakdown.app_fees.invoice_creation)}</span>
                  <span className="text-gray-600">Invoice Fees:</span>
                  <span className="text-right font-medium">{formatCurrency(item.breakdown.app_fees.invoices)}</span>
                  <span className="text-gray-600">Contracts:</span>
                  <span className="text-right font-medium">{formatCurrency(item.breakdown.app_fees.contracts)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border lg:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Revenue Trend by Source
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-600">App Fees</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-xs text-gray-600">Nomba Fees</span>
          </div>
          <div className="text-sm text-gray-500">
            Filtered: {range === "total" ? "All time" : range}
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} />
          <YAxis tick={{ fontSize: 12 }} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="transfers"
            stackId="a"
            fill="#3b82f6"
            name="Transfers"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="invoice"
            stackId="a"
            fill="#8b5cf6"
            name="Invoices"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="contract"
            stackId="a"
            fill="#f59e0b"
            name="Contracts"
            radius={[4, 4, 0, 0]}
          />
          <Area
            type="monotone"
            dataKey="app_fees"
            stroke="#10b981"
            fill="none"
            strokeWidth={2}
            name="App Fees"
          />
          <Area
            type="monotone"
            dataKey="nomba_fees"
            stroke="#f97316"
            fill="none"
            strokeWidth={2}
            name="Nomba Fees"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};