// components/admin/dashboard/DashboardLoading.tsx
import { Skeleton } from "../../ui/skeleton";
import AdminLayout from "../layout"; 

export const DashboardLoading = () => {
  return (
    <AdminLayout>
      <div className="px-4 py-6 space-y-8">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(8)
            .fill(null)
            .map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <Skeleton className="h-6 w-56 mb-4" />
          <div className="space-y-3">
            {Array(5)
              .fill(null)
              .map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};