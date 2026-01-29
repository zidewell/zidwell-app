import { Button2 } from "./ui/button2";
import { ArrowRight, Sparkles } from "lucide-react";
import GridBackground from "./Gridbackground";
import { useRouter } from "next/navigation";

const CTA = () => {
  const router = useRouter();
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <GridBackground />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C29307]/10 border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] mb-8">
            <Sparkles className="w-4 h-4 text-[#C29307]" />
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              The Future of Zidwell
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-balance text-gray-900 dark:text-gray-50">
            We're building toward a future where Africans have{" "}
            <span className="relative inline-block">
              <span className="relative z-10">full visibility</span>
              <span className="absolute bottom-2 left-0 right-0 h-4 bg-[#C29307]/40 z-0" />
            </span>{" "}
            and control over their money
          </h2>

          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Savings, spending, records, and growth — all in one place. Zidwell
            is just getting started. Join us. Build with clarity. Live with
            financial peace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button2
              onClick={() => router.push("/auth/signup")}
              variant="hero"
              size="xl"
            >
              Get Started Free
              <ArrowRight className="ml-2" />
            </Button2>
          </div>

          {/* Decorative */}
          <div className="mt-16 flex justify-center gap-4">
            <div className="w-4 h-4 bg-[#C29307] border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24]" />
            <div className="w-4 h-4 bg-gray-900 dark:bg-gray-50" />
            <div className="w-4 h-4 bg-[#C29307] border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24]" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
