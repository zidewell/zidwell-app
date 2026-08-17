// app/components/admin-components/dashboard/DashboardHeader.tsx
'use client'

import { RefreshCw, Sparkles } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { RangeOption } from '@/types/admin-dashoard'

interface DashboardHeaderProps {
  range: RangeOption
  onRangeChange: (value: RangeOption) => void
  onRefresh: () => void
}

export const DashboardHeader = ({ range, onRangeChange, onRefresh }: DashboardHeaderProps) => {
  return (
    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[var(--color-amber)]/20 to-[var(--color-amber)]/5 border border-[var(--border)]/50">
            <Sparkles className="w-5 h-5 text-[var(--color-amber)]" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-[var(--font-space-grotesk)] tracking-tight bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">
              Admin Dashboard
            </h2>
            <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-emerald)] animate-pulse" />
              Live overview of your platform
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="flex flex-col items-end w-full sm:w-auto">
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1.5">Time Range</label>
          <Select value={range} onValueChange={onRangeChange}>
            <SelectTrigger className="w-full sm:w-44 bg-[var(--bg-secondary)] border-2 border-transparent rounded-xl focus:border-[var(--color-amber)] transition-all duration-200">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl border border-[var(--border)]">
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
          className="group flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-secondary)] rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-300 hover:shadow-md mt-6 sm:mt-0"
        >
          <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </div>
  )
}