// app/components/admin-components/dashboard/DashboardError.tsx
import AdminLayout from '../layout'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface DashboardErrorProps {
  onRetry: () => void
}

export const DashboardError = ({ onRetry }: DashboardErrorProps) => {
  return (
    <AdminLayout>
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-rose-500/10 blur-2xl" />
            <div className="relative p-6 rounded-2xl bg-[var(--bg-card)] border border-rose-200 dark:border-rose-900/30 shadow-xl">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-950/30">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-semibold font-[var(--font-space-grotesk)]">Failed to Load Dashboard</h3>
                <p className="text-[var(--text-secondary)] text-sm">
                  There was an error loading the dashboard data. Please try refreshing the page.
                </p>
                <button
                  onClick={onRetry}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--color-amber)] to-[var(--color-amber-dark)] text-[var(--color-ink)] font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-[var(--color-amber)]/20 hover:scale-105"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}