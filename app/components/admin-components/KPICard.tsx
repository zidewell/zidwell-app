// app/components/admin-components/KPICard.tsx
import { ReactNode } from 'react'

interface KPICardProps {
  title: string
  value: string | number
  growth?: ReactNode
  className?: string
  icon?: ReactNode
  subtitle?: string
  isLoading?: boolean
}

export default function KPICard({
  title,
  value,
  growth,
  className = '',
  icon,
  subtitle,
  isLoading = false,
}: KPICardProps) {
  if (isLoading) {
    return (
      <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-[var(--bg-secondary)] rounded-lg w-24" />
          <div className="h-8 w-8 bg-[var(--bg-secondary)] rounded-xl" />
        </div>
        <div className="h-8 bg-[var(--bg-secondary)] rounded-lg w-3/4 mb-2" />
        {subtitle && <div className="h-3 bg-[var(--bg-secondary)] rounded-lg w-full" />}
      </div>
    )
  }

  return (
    <div className={`
      group relative overflow-hidden bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)]
      transition-all duration-300 hover:shadow-xl hover:-translate-y-1
      ${className}
    `}>
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-amber)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon && <div className="text-[var(--text-muted)] group-hover:text-[var(--color-amber)] transition-colors duration-300">{icon}</div>}
            <div className="text-sm font-medium text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors duration-300">
              {title}
            </div>
          </div>
          {growth && <div className="shrink-0">{growth}</div>}
        </div>

        <div className="mb-1">
          <div className="text-2xl font-bold font-[var(--font-space-grotesk)] tracking-tight text-[var(--text-primary)] truncate">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
        </div>

        {subtitle && (
          <div className="text-xs text-[var(--text-muted)] mt-1 truncate">{subtitle}</div>
        )}
      </div>
    </div>
  )
}