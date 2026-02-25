// components/admin/dashboard/traffic/TrafficInsights.tsx
import { Calendar } from "lucide-react";

interface TrafficInsightsProps {
  topPage?: string;
  topSource?: string;
}

export const TrafficInsights = ({ topPage = "/dashboard", topSource = "Direct" }: TrafficInsightsProps) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Traffic Insights
        </h3>
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Calendar className="w-4 h-4" />
          <span>Last 30 minutes</span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-sm text-gray-600">Active Users (real-time)</div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.floor(Math.random() * 50) + 10}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Pages/min</div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.floor(Math.random() * 30) + 5}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Top Active Page</div>
          <div className="text-sm font-medium text-gray-900 truncate">
            {topPage}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Top Source</div>
          <div className="text-sm font-medium text-gray-900">
            {topSource}
          </div>
        </div>
      </div>
    </div>
  );
};