// components/admin/dashboard/traffic/TrafficKPIs.tsx
import KPICard from "../../KPICard"; 
import { Users, Eye, MousePointer, Clock, TrendingDown, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/dashboard-utils";

interface TrafficKPIsProps {
  summary: {
    totalUsers: number;
    totalPageViews: number;
    totalSessions: number;
    avgSessionDuration: string;
    bounceRate: string;
    engagementRate: string;
    newUsers: number;
    returningUsers: number;
  };
}

export const TrafficKPIs = ({ summary }: TrafficKPIsProps) => {
  return (
    <>
      {/* Traffic KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Users"
          value={formatNumber(summary?.totalUsers || 0)}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          className="border-l-4 border-l-blue-500"
          subtitle="Users (selected period)"
        />
        <KPICard
          title="Page Views"
          value={formatNumber(summary?.totalPageViews || 0)}
          icon={<Eye className="w-5 h-5 text-green-600" />}
          className="border-l-4 border-l-green-500"
          subtitle="Total views"
        />
        <KPICard
          title="Sessions"
          value={formatNumber(summary?.totalSessions || 0)}
          icon={<MousePointer className="w-5 h-5 text-purple-600" />}
          className="border-l-4 border-l-purple-500"
          subtitle="Total sessions"
        />
        <KPICard
          title="Avg. Session Duration"
          value={summary?.avgSessionDuration || "0m 0s"}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          className="border-l-4 border-l-amber-500"
          subtitle="Average time on site"
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Bounce Rate</span>
            <TrendingDown className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {summary?.bounceRate || "0"}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {parseFloat(summary?.bounceRate || "0") < 50 
              ? "👍 Below average" 
              : "👎 Above average"}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Engagement Rate</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {summary?.engagementRate || "0"}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Users engaged with content
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">New vs Returning</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">
                {formatNumber(summary?.newUsers || 0)}
              </div>
              <div className="text-xs text-gray-500">New</div>
            </div>
            <div className="text-gray-300">|</div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {formatNumber(summary?.returningUsers || 0)}
              </div>
              <div className="text-xs text-gray-500">Returning</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};