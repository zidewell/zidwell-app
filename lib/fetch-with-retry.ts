// lib/fetch-with-retry.ts
// ─────────────────────────────────────────────────────────────
// Fetch wrapper with:
//   - Retries on network failure (not on 4xx)
//   - Exponential backoff (500ms, 1.5s, 4.5s)
//   - Configurable timeout per attempt (default 20s)
// ─────────────────────────────────────────────────────────────

export interface FetchRetryOptions extends RequestInit {
  retries?: number;
  timeoutMs?: number;
}

export async function fetchWithRetry(
  input: RequestInfo,
  options: FetchRetryOptions = {}
): Promise<Response> {
  const { retries = 2, timeoutMs = 20_000, ...init } = options;

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      // 4xx → don't retry, return to caller
      if (res.status >= 400 && res.status < 500) {
        return res;
      }

      // 5xx → retry if attempts remain
      if (res.status >= 500 && attempt < retries) {
        lastError = new Error(`Server error ${res.status}`);
        await sleep(500 * Math.pow(3, attempt));
        continue;
      }

      return res;
    } catch (err: any) {
      clearTimeout(timeout);
      lastError = err;

      if (attempt < retries) {
        await sleep(500 * Math.pow(3, attempt));
        continue;
      }
    }
  }

  throw lastError || new Error("Network request failed");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isNetworkError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || "").toLowerCase();
  return (
    err.name === "AbortError" ||
    msg.includes("network") ||
    msg.includes("failed to fetch") ||
    msg.includes("timeout") ||
    msg.includes("load failed")
  );
}