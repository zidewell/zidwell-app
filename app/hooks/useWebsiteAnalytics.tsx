// hooks/useWebsiteAnalytics.ts
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useWebsiteAnalytics(range: string = "total") {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/analytics/website?range=${range}`,
    fetcher,
    {
      refreshInterval: 300000, 
      revalidateOnFocus: true,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}