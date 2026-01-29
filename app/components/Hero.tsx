import { useRouter } from "next/navigation";
import { ArrowRight, Users } from "lucide-react";
import GridBackground from "./Gridbackground";
import { Button2 } from "./ui/button2";

const Hero = () => {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <GridBackground />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 bg-[#C29307]/10 border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] mb-8">
            <span className="w-2 h-2 bg-[#C29307] rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              Financial wellness for Businesses with a vision to grow
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="animate-fade-up-delay-1 text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight mb-6 text-balance text-gray-900 dark:text-gray-50">
            Money should not be the{" "}
            <span className="relative inline-block">
              <span className="relative z-10">hardest part</span>
              <span className="absolute bottom-2 left-0 right-0 h-4 bg-[#C29307]/40 z-0" />
            </span>{" "}
            of building a business.
          </h1>

          {/* Subheading */}
          <p className="animate-fade-up-delay-2 text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8 text-balance">
            We’ve created ONE PLATFORM with all the tools to manage your
            business finances. Think of invoices, receipts, simple contracts,
            bookkeeping, tax manager - it’s all here. Signup and check it out
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button2
              onClick={() => router.push("/auth/signup")}
              variant="hero"
              size="xl"
            >
              Get Started Free
              <ArrowRight className="ml-2" />
            </Button2>
            <Button2
              onClick={() => router.push("https://tally.so/r/aQNyzW")}
              variant="heroOutline"
              size="xl"
              className="cursor-pointer"
            >
              <Users className="mr-2" />
              Join our Community
            </Button2>
          </div>

          {/* Trust Indicators */}
          <div className="animate-fade-up-delay-3 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>No hidden fees</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Start for free</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 left-10 w-16 h-16 border-2 border-gray-900 dark:border-gray-50 bg-[#C29307] shadow-[6px_6px_0px_#111827] dark:shadow-[6px_6px_0px_#fbbf24] animate-float hidden lg:block" />
        <div
          className="absolute bottom-1/4 right-10 w-12 h-12 border-2 border-gray-900 dark:border-gray-50 bg-gray-50 dark:bg-gray-950 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] animate-float hidden lg:block"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-8 h-8 border-2 border-gray-900 dark:border-gray-50 bg-[#C29307]/50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] animate-float hidden lg:block"
          style={{ animationDelay: "2s" }}
        />
      </div>
    </section>
  );
};

export default Hero;
