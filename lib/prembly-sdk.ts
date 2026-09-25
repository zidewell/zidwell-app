// lib/prembly-sdk.ts
const PREMBLY_SDK_BASE = "https://sdk-live.prembly.com";

interface InitiateSessionResponse {
  success: boolean;
  sessionId: string;
  redirectUrl?: string;
  error?: string;
}

export async function startPremblyVerification(
  returnUrl: string
): Promise<void> {
  const res = await fetch("/api/prembly/initiate-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ redirectUrl: returnUrl }),
  });

  const data: InitiateSessionResponse = await res.json();

  if (!res.ok || !data?.sessionId) {
    throw new Error(data?.error || "Could not start verification session");
  }

  if (typeof window !== "undefined") {
    sessionStorage.setItem("prembly_session_id", data.sessionId);
  }

  window.location.href = `${PREMBLY_SDK_BASE}/?session=${data.sessionId}`;
}