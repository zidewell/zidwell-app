// app/api/analytics/website/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    // Get credentials from environment variable
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    if (!credentialsJson) {
      console.error("GOOGLE_APPLICATION_CREDENTIALS_JSON is not set");
      return NextResponse.json(
        { error: "Google Analytics credentials not configured" },
        { status: 500 }
      );
    }

    // Parse credentials with error handling
    let credentials;
    try {
      // Remove any surrounding quotes if present
      const cleanJson = credentialsJson.trim().replace(/^['"]|['"]$/g, '');
      credentials = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:", parseError);
      console.error("First 100 chars:", credentialsJson.substring(0, 100));
      return NextResponse.json(
        { error: "Invalid Google Analytics credentials format" },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!credentials.client_email) {
      console.error("Missing client_email in credentials");
      return NextResponse.json(
        { error: "Missing client_email in Google Analytics credentials" },
        { status: 500 }
      );
    }

    if (!credentials.private_key) {
      console.error("Missing private_key in credentials");
      return NextResponse.json(
        { error: "Missing private_key in Google Analytics credentials" },
        { status: 500 }
      );
    }

    // Initialize GA4 client
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    });

    const propertyId = process.env.GA4_PROPERTY_ID;
    
    if (!propertyId) {
      console.error("GA4_PROPERTY_ID is not set");
      return NextResponse.json(
        { error: "Google Analytics property ID not configured" },
        { status: 500 }
      );
    }

    // Get date range from query params
    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "total";

    // Parse date range
    const dateRange = getDateRangeForGA(range);

    // Fetch key website metrics
    const [metricsResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [dateRange],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'newUsers' },
        { name: 'totalUsers' },
        { name: 'engagedSessions' },
        { name: 'engagementRate' },
      ],
    });

    // Fetch daily trend data
    const [dailyResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [dateRange],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'newUsers' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    });

    // Fetch top pages
    const [pagesResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [dateRange],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    });

    // Fetch traffic sources
    const [sourcesResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [dateRange],
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    });

    // Process metrics
    const metrics = metricsResponse.rows?.[0]?.metricValues || [];
    
    // Process daily data
    const dailyData = (dailyResponse.rows || []).map(row => ({
      date: formatDateForDisplay(row.dimensionValues?.[0]?.value || ''),
      users: parseInt(row.metricValues?.[0]?.value || '0'),
      pageViews: parseInt(row.metricValues?.[1]?.value || '0'),
      newUsers: parseInt(row.metricValues?.[2]?.value || '0'),
    }));

    // Process pages data
    const topPages = (pagesResponse.rows || []).map(row => ({
      path: row.dimensionValues?.[0]?.value || '',
      title: row.dimensionValues?.[1]?.value || '',
      views: parseInt(row.metricValues?.[0]?.value || '0'),
      users: parseInt(row.metricValues?.[1]?.value || '0'),
    }));

    // Process traffic sources
    const trafficSources = (sourcesResponse.rows || []).map(row => ({
      source: row.dimensionValues?.[0]?.value || '',
      medium: row.dimensionValues?.[1]?.value || '',
      sessions: parseInt(row.metricValues?.[0]?.value || '0'),
      users: parseInt(row.metricValues?.[1]?.value || '0'),
    }));

    // Calculate summary metrics
    const totalUsers = parseInt(metrics[0]?.value || '0');
    const totalPageViews = parseInt(metrics[1]?.value || '0');
    const totalSessions = parseInt(metrics[2]?.value || '0');
    const bounceRate = parseFloat(metrics[3]?.value || '0');
    const avgSessionDuration = parseFloat(metrics[4]?.value || '0');
    const newUsers = parseInt(metrics[5]?.value || '0');
    const returningUsers = totalUsers - newUsers;
    const engagementRate = parseFloat(metrics[8]?.value || '0') * 100;

    // Format session duration
    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}m ${secs}s`;
    };

    return NextResponse.json({
      summary: {
        totalUsers,
        totalPageViews,
        totalSessions,
        bounceRate: bounceRate.toFixed(2),
        avgSessionDuration: formatDuration(avgSessionDuration),
        newUsers,
        returningUsers,
        engagementRate: engagementRate.toFixed(2),
      },
      daily: dailyData,
      topPages,
      trafficSources,
      range,
    });

  } catch (error) {
    console.error("GA4 API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch website analytics", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

function getDateRangeForGA(range: string) {
  const now = new Date();
  
  switch (range) {
    case "today":
      return {
        startDate: now.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
    case "week":
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return {
        startDate: weekAgo.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
    case "month":
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      return {
        startDate: monthAgo.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
    case "90days":
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(now.getDate() - 90);
      return {
        startDate: ninetyDaysAgo.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
    case "180days":
      const oneEightyDaysAgo = new Date(now);
      oneEightyDaysAgo.setDate(now.getDate() - 180);
      return {
        startDate: oneEightyDaysAgo.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
    case "year":
      const yearAgo = new Date(now);
      yearAgo.setFullYear(now.getFullYear() - 1);
      return {
        startDate: yearAgo.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
    case "total":
    default:
      const twoYearsAgo = new Date(now);
      twoYearsAgo.setFullYear(now.getFullYear() - 2);
      return {
        startDate: twoYearsAgo.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
  }
}

function formatDateForDisplay(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return dateStr;
  }
}