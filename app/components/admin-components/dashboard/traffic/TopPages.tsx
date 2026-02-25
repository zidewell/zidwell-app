// components/admin/dashboard/traffic/TopPages.tsx
import { ExternalLink } from "lucide-react";
import { formatNumber } from "@/lib/dashboard-utils";

interface TopPagesProps {
  pages: Array<{
    path: string;
    title: string;
    views: number;
    users: number;
  }>;
}

export const TopPages = ({ pages }: TopPagesProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Top Pages
      </h3>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {pages && pages.length > 0 ? (
          pages.map((page, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 w-6">
                    #{index + 1}
                  </span>
                  <p className="text-sm font-medium text-gray-900 truncate" title={page.title}>
                    {page.title || page.path}
                  </p>
                </div>
                <p className="text-xs text-gray-500 truncate pl-8">
                  {page.path}
                </p>
              </div>
              <div className="flex items-center gap-4 ml-4">
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-600">
                    {formatNumber(page.views)}
                  </div>
                  <div className="text-xs text-gray-500">views</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-600">
                    {formatNumber(page.users)}
                  </div>
                  <div className="text-xs text-gray-500">users</div>
                </div>
                <a
                  href={page.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            No page data available
          </div>
        )}
      </div>
    </div>
  );
};