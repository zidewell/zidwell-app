"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Store,
  ArrowRight,
} from "lucide-react";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import { useStore } from "@/app/context/StoreContext";

function ActivationContent() {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get("status");
  const { fetchStore } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "success") {
      fetchStore(true);
    }
  }, [status, fetchStore]);

  const renderContent = () => {
    if (status === "success") {
      return (
        <SuccessPanel onContinue={() => router.push("/dashboard/services/payment/dashboard")} />
      );
    }
    if (status === "failed" || status === "error") {
      return (
        <FailedPanel
          onRetry={() => router.push("/dashboard/services/payment/dashboard")}
        />
      );
    }
    return <ProcessingPanel />;
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="max-w-md w-full">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}

function SuccessPanel({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-lemon-green/15 mx-auto">
        <CheckCircle2 className="size-12 text-lemon-green" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold">Store Activated!</h1>
      <p className="mt-3 text-muted-foreground">
        Your store is now live and ready to accept payments from customers.
      </p>
      <button
        onClick={onContinue}
        className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gold px-6 py-3 text-sm font-bold text-gold-foreground hover:opacity-90"
      >
        Go to dashboard <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

function FailedPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15 mx-auto">
        <XCircle className="size-12 text-red-500" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold">Activation Failed</h1>
      <p className="mt-3 text-muted-foreground">
        We couldn&apos;t confirm your payment. No charges were made. You can try
        again from your store dashboard.
      </p>
      <button
        onClick={onRetry}
        className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gold px-6 py-3 text-sm font-bold text-gold-foreground hover:opacity-90"
      >
        <Store className="size-4" /> Back to store
      </button>
    </div>
  );
}

function ProcessingPanel() {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 text-center">
      <Loader2 className="size-12 mx-auto text-gold animate-spin" />
      <h1 className="mt-6 font-display text-2xl font-bold">
        Processing your activation...
      </h1>
      <p className="mt-3 text-muted-foreground">
        Please wait while we confirm your payment.
      </p>
    </div>
  );
}

export default function ActivationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-gold" />
        </div>
      }
    >
      <ActivationContent />
    </Suspense>
  );
}