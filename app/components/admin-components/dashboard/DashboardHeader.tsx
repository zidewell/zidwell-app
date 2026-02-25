// components/admin/dashboard/DashboardHeader.tsx
import { BarChart3, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { RangeOption } from "@/types/admin-dashoard"; 

interface DashboardHeaderProps {
  range: RangeOption;
  onRangeChange: (value: RangeOption) => void;
  onRefresh: () => void;
}

export const DashboardHeader = ({ range, onRangeChange, onRefresh }: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h2>
        <div className="mt-1 text-sm text-gray-500 flex items-center gap-2">
          <BarChart3 size={14} />
          <span>Range: {range === "total" ? "All time" : range}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <label className="text-xs text-gray-500 mb-1">Filter Range</label>
          <Select value={range} onValueChange={onRangeChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="total">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="180days">Last 180 Days</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh Data
        </button>
      </div>
    </div>
  );
};