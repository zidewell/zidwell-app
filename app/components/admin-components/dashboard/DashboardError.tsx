import AdminLayout from "../layout";

interface DashboardErrorProps {
  onRetry: () => void;
}

export const DashboardError = ({ onRetry }: DashboardErrorProps) => {
  return (
    <AdminLayout>
      <div className="px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">
            Failed to load dashboard data. Please try refreshing the page.
          </p>
          <button
            onClick={onRetry}
            className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};