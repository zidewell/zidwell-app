// app/auth/signup/page.tsx
"use client";
import Carousel from "@/app/components/Carousel";
import RegisterForm from "@/app/components/RegisterForm";
import { Button } from "@/app/components/ui/button";
import { TooltipProvider } from "@/app/components/ui/tooltip";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

export default function RegisterPage() {
  const router = useRouter();
  return (
    <div className="lg:flex lg:justify-between min-h-screen bg-(--bg-primary)">
      <Button
        onClick={() => router.push("/")}
        variant="outline"
        className="absolute top-4 left-4 md:top-8 md:left-8 hover:bg-(--bg-secondary) transition-colors z-10 cursor-pointer squircle-md border-(--border-color) text-(--text-primary)"
        aria-label="Go back"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--color-accent-yellow) mx-auto"></div>
              <p className="mt-4 text-(--text-secondary)">Loading...</p>
            </div>
          </div>
        }
      >
        <TooltipProvider>
          <RegisterForm />
        </TooltipProvider>
      </Suspense>

      <Carousel />
    </div>
  );
}
