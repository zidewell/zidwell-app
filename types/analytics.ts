// types/analytics.ts
export interface WebsiteAnalytics {
  summary: {
    totalUsers: number;
    totalPageViews: number;
    totalSessions: number;
    bounceRate: string;
    avgSessionDuration: string;
    newUsers: number;
    returningUsers: number;
    engagementRate: string;
  };
  daily: Array<{
    date: string;
    users: number;
    pageViews: number;
    newUsers: number;
  }>;
  topPages: Array<{
    path: string;
    title: string;
    views: number;
    users: number;
  }>;
  trafficSources: Array<{
    source: string;
    medium: string;
    sessions: number;
    users: number;
  }>;
  range: string;
}