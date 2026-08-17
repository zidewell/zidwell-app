// app/components/admin-components/dashboard/traffic/TrafficKPIs.tsx
import { Users, Eye, MousePointer, Clock, TrendingDown, TrendingUp, Activity } from 'lucide-react'
import { formatNumber } from '@/lib/dashboard-utils'

interface TrafficKPIsProps {
  summary: {
    totalUsers: number
    totalPageViews: number
    totalSessions: number
    avgSessionDuration: string
    bounceRate: string
    engagementRate: string
    newUsers: number
    returningUsers: number
  }
}

export const TrafficKPIs = ({ summary }: TrafficKPIsProps) => {
  return (
    <div className="space-y-4">
      {/* Main Traffic KPIs - Distinctive card design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Users',
            value: formatNumber(summary?.totalUsers || 0),
            icon: Users,
            color: 'from-blue-500/20 to-blue-500/5',
            iconColor: 'text-blue-500',
            subtitle: 'Users (selected period)'
          },
          {
            title: 'Page Views',
            value: formatNumber(summary?.totalPageViews || 0),
            icon: Eye,
            color: 'from-emerald-500/20 to-emerald-500/5',
            iconColor: 'text-emerald-500',
            subtitle: 'Total views'
          },
          {
            title: 'Sessions',
            value: formatNumber(summary?.totalSessions || 0),
            icon: MousePointer,
            color: 'from-purple-500/20 to-purple-500/5',
            iconColor: 'text-purple-500',
            subtitle: 'Total sessions'
          },
          {
            title: 'Avg. Session Duration',
            value: summary?.avgSessionDuration || '0m 0s',
            icon: Clock,
            color: 'from-amber-500/20 to-amber-500/5',
            iconColor: 'text-amber-500',
            subtitle: 'Average time on site'
          },
        ].map((item, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.color} border border-[var(--border)]/50`}>
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <span className="text-xs font-medium text-[var(--text-muted)]">{item.subtitle}</span>
              </div>
              <div className="text-2xl font-bold font-[var(--font-space-grotesk)] tracking-tight">
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Metrics Row - Distinctive styling */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            title: 'Bounce Rate',
            value: summary?.bounceRate || '0%',
            icon: TrendingDown,
            color: summary && parseFloat(summary.bounceRate) < 50 ? 'text-emerald-500' : 'text-rose-500',
            bgColor: summary && parseFloat(summary.bounceRate) < 50 ? 'from-emerald-500/10 to-emerald-500/5' : 'from-rose-500/10 to-rose-500/5',
            status: summary && parseFloat(summary.bounceRate) < 50 ? '👍 Below average' : '👎 Above average'
          },
          {
            title: 'Engagement Rate',
            value: summary?.engagementRate || '0%',
            icon: Activity,
            color: 'text-teal-500',
            bgColor: 'from-teal-500/10 to-teal-500/5',
            status: 'Users engaged with content'
          },
          {
            title: 'New vs Returning',
            value: `${formatNumber(summary?.newUsers || 0)} / ${formatNumber(summary?.returningUsers || 0)}`,
            icon: Users,
            color: 'text-purple-500',
            bgColor: 'from-purple-500/10 to-purple-500/5',
            status: 'New / Returning'
          },
        ].map((item, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${item.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-muted)] font-medium">{item.title}</p>
                <p className="text-xl font-bold font-[var(--font-space-grotesk)] tracking-tight mt-1">{item.value}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{item.status}</p>
              </div>
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.bgColor} border border-[var(--border)]/50`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}