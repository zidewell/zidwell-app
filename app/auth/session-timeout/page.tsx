// app/auth/session-timeout/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { ArrowRight, Clock, ShieldCheck, Zap } from "lucide-react";
import logo from "@/public/logo.png";

export default function SessionTimeoutPage() {
  const router = useRouter();
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("lastActivity");
      }
    } catch {
      // ignore
    }

    const params = new URLSearchParams(window.location.search);
    const cb = params.get("callbackUrl");
    if (cb && cb.startsWith("/")) setCallbackUrl(cb);
  }, []);

  const loginHref = callbackUrl
    ? `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/auth/login";

  return (
    <div className="min-h-screen bg-(--bg-primary) flex items-center justify-center px-4 py-10 fade-in">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center mb-8">
          <Image
            src={logo}
            alt="Zidwell"
            width={40}
            height={40}
            className="w-14 h-14 object-contain"
            priority
          />
        </div>

        <Card className="w-full shadow-soft squircle-lg border border-(--border-color) bg-(--bg-primary)">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-500" strokeWidth={1.8} />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-(--text-primary) mb-3">
              Session Timeout
            </h1>

            <p className="text-(--text-secondary) text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              You have been logged out due to inactivity. Click login to get
              back to your activities.
            </p>

            <Button
              onClick={() => router.push(loginHref)}
              className="w-full bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 transition-colors squircle-md py-3 font-semibold"
            >
              Login
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>

            <p className="text-xs text-(--text-secondary) mt-4">
              <ShieldCheck className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
              For your security, we end idle sessions automatically.
            </p>
          </CardContent>
        </Card>

        <Card className="w-full mt-5 shadow-soft squircle-lg border border-(--border-color) bg-(--bg-primary) overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-(--bg-secondary) flex items-center justify-center shrink-0">
                <Zap
                  className="w-5 h-5 text-(--color-accent-yellow)"
                  strokeWidth={1.9}
                />
              </div>
              <div>
                <h2 className="text-base font-semibold text-(--text-primary)">
                  Funds Transfer API
                </h2>
              </div>
            </div>

            <p className="text-sm text-(--text-secondary) leading-relaxed mb-5">
              Integrate with our transfer API to experience blazing-fast,
              reliable and secure instant electronic transfer of funds across
              all banks in Nigeria.
            </p>

            <Button
              variant="outline"
              onClick={() => router.push("/docs/api/transfers")}
              className="w-full squircle-md border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary) transition-colors"
            >
              Click here to get started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-(--text-secondary) hover:text-(--text-primary) transition-colors"
          >
            ← Back to Zidwell home
          </Link>
        </div>
      </div>
    </div>
  );
}