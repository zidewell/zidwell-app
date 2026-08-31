// app/components/admin-components/dashboard/DashboardLoading.tsx
import { Skeleton } from '../../ui/skeleton'
import AdminLayout from '../layout'

export const DashboardLoading = () => {
  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6 md:space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-32 rounded-lg" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
        </div>

        {/* KPI Cards Skeleton - 4x2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(8)
            .fill(null)
            .map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 w-full rounded-2xl lg:col-span-2" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>

        {/* Table Skeleton */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
          <Skeleton className="h-6 w-56 rounded-lg mb-6" />
          <div className="space-y-3">
            {Array(5)
              .fill(null)
              .map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}