import { BetaAnalyticsDataClient } from "@google-analytics/data";

export async function GET() {
  const client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: process.env.GA_CLIENT_EMAIL,
      private_key: process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
  });

  const [response] = await client.runReport({
    property: `properties/${process.env.GA_PROPERTY_ID}`,
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
  });

  return Response.json(response);
}


// useEffect(() => {
//   fetch("/api/analytics")
//     .then(res => res.json())
//     .then(data => console.log(data));
// }, []);