// lib/fetcher.ts

// ─── Default export: the function itself ───────────────────────────
export default async function fetcher<T = any>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    const text = await res.text().catch(() => "");
    (error as any).info = text;
    (error as any).status = res.status;
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}