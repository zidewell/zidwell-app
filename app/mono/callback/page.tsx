// app/mono/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function MonoCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");

    if (window.opener) {
      if (code) {
        window.opener.postMessage({ type: "mono_success", code }, window.location.origin);
      } else {
        window.opener.postMessage({ type: "mono_error", error: "No code returned" }, window.location.origin);
      }
      window.close();
    }
  }, [searchParams]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <p>Finishing up… you can close this window.</p>
    </div>
  );
}