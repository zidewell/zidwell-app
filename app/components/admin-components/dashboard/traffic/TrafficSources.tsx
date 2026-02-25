// components/admin/dashboard/traffic/TrafficSources.tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { TRAFFIC_COLORS } from "@/constants/dashboard";
import { formatNumber } from "@/lib/dashboard-utils";

interface TrafficSourcesProps {
  sources: Array<{
    source: string;
    medium: string;
    sessions: number;
    users: number;
  }>;
}

export const TrafficSources = ({ sources }: TrafficSourcesProps) => {
  const getSourceDisplay = (source: string, medium: string) => {
    if (source === "(direct)") return "Direct";
    if (medium === "organic") return `Organic Search`;
    if (medium === "referral") return `Referral`;
    if (medium === "cpc" || medium === "paid") return `Paid Ads`;
    if (medium === "social") return `Social Media`;
    if (medium === "email") return `Email`;
    return `${source}`;
  };

  const totalSessions = sources.reduce((sum, s) => sum + s.sessions, 0);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Traffic Sources
      </h3>
      <div className="space-y-4">
        {sources && sources.length > 0 ? (
          <>
            {/* Pie Chart for Source Distribution */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sources.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="sessions"
                    nameKey="source"
                  >
                    {sources.slice(0, 5).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={TRAFFIC_COLORS.sources[index % TRAFFIC_COLORS.sources.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatNumber(value), "Sessions"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Source List */}
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {sources.map((source, index) => {
                const percentage = totalSessions > 0 
                  ? ((source.sessions / totalSessions) * 100).toFixed(1)
                  : "0";

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 w-16">
                          {getSourceDisplay(source.source, source.medium)}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({source.medium})
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-600">
                          {formatNumber(source.sessions)} sessions
                        </span>
                        <span className="text-xs font-medium text-blue-600 w-12 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No traffic source data available
          </div>
        )}
      </div>
    </div>
  );
};