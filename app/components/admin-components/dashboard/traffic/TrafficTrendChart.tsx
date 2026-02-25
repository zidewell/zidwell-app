// components/admin/dashboard/traffic/TrafficTrendChart.tsx
import { ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TRAFFIC_COLORS } from "@/constants/dashboard";
import { formatNumber } from "@/lib/dashboard-utils";

interface TrafficTrendChartProps {
  data: Array<{ date: string; users: number; pageViews: number; newUsers: number }>;
}

export const TrafficTrendChart = ({ data }: TrafficTrendChartProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Traffic Trend
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Page Views</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-xs text-gray-600">New Users</span>
          </div>
        </div>
      </div>
      <div className="h-[400px]">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: any, name: string) => {
                  const names: Record<string, string> = {
                    users: "Users",
                    pageViews: "Page Views",
                    newUsers: "New Users",
                  };
                  return [formatNumber(Number(value)), names[name] || name];
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="users"
                stroke={TRAFFIC_COLORS.users}
                fill="url(#colorUsers)"
                name="users"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="pageViews"
                stroke={TRAFFIC_COLORS.pageViews}
                name="pageViews"
                strokeWidth={2}
              />
              <Bar
                yAxisId="left"
                dataKey="newUsers"
                fill={TRAFFIC_COLORS.newUsers}
                name="newUsers"
                opacity={0.6}
              />
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TRAFFIC_COLORS.users} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={TRAFFIC_COLORS.users} stopOpacity={0} />
                </linearGradient>
              </defs>
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            No traffic data available for the selected period
          </div>
        )}
      </div>
    </div>
  );
};