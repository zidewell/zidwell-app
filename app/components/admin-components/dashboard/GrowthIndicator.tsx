// app/components/admin-components/dashboard/GrowthIndicator.tsx
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface GrowthIndicatorProps {
  value: number
  className?: string
}

export const GrowthIndicator = ({ value, className = '' }: GrowthIndicatorProps) => {
  if (value === 0) {
    return (
      <div className={`flex items-center text-[var(--text-muted)] ${className}`}>
        <Minus size={14} className="stroke-2" />
        <span className="ml-1 text-xs font-medium">0%</span>
      </div>
    )
  }

  const isPositive = value > 0
  const Icon = isPositive ? TrendingUp : TrendingDown
  const colorClass = isPositive ? 'text-emerald-500' : 'text-rose-500'
  const bgClass = isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10'

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${bgClass} ${colorClass} ${className}`}>
      <Icon size={12} className="stroke-2" />
      <span className="text-xs font-semibold">
        {Math.abs(value).toFixed(1)}%
      </span>
    </div>
  )
}