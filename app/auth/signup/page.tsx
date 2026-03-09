
"use client";
import Carousel from "@/app/components/Carousel";
import RegisterForm from "@/app/components/RegisterForm";
import { Button } from "@/app/components/ui/button";
import { TooltipProvider } from "@/app/components/ui/tooltip";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";



export default function RegisterPage() {
  return (
    <div className="lg:flex lg:justify-between min-h-screen bg-gray-50">
      <Button
        onClick={() => window.history.back()}
        variant="outline"
        className="absolute top-4 left-4 md:top-8 md:left-8 hover:bg-white/20 transition-colors z-10 cursor-pointer"
        aria-label="Go back"
      >
        <ArrowLeft />
      </Button>
      
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(43,91%,39%)] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }>
        <TooltipProvider>
          <RegisterForm />
        </TooltipProvider>
      </Suspense>

      <Carousel />
    </div>
  );
}