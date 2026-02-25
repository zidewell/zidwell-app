// components/admin/dashboard/overview/ContractStatusPie.tsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "@/constants/dashboard";
import { formatCurrency, formatNumber } from "@/lib/dashboard-utils";

interface ContractStatusPieProps {
  data: Array<{ name: string; value: number; color: string }>;
  contractFees: number;
  contractRevenueShare: string;
}

export const ContractStatusPie = ({ data, contractFees, contractRevenueShare }: ContractStatusPieProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Contract Status
        </h3>
        <div className="text-sm text-gray-500">Distribution</div>
      </div>
      <div className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  formatNumber(value),
                  "Contracts",
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            No contract data
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-indigo-50 p-3 rounded-lg">
          <div className="text-xs text-indigo-700 mb-1">
            Contract Revenue
          </div>
          <div className="text-lg font-bold text-indigo-900">
            {formatCurrency(contractFees)}
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-xs text-green-700 mb-1">
            Revenue Share
          </div>
          <div className="text-lg font-bold text-green-900">
            {contractRevenueShare}%
          </div>
        </div>
      </div>
    </div>
  );
};