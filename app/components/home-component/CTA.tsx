import { useRouter } from "next/navigation";
import { Button } from "../ui/button"; 
import { ArrowRight, Sparkles } from "lucide-react";
import { Button2 } from "../ui/button2";

const CTA = () => {
     const router = useRouter();
  return (
    <section className="relative py-20 md:py-32 overflow-hidden bg-[#01402e]/5 dark:bg-[#f7f0e5]/5">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f4c600]/10 border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600] mb-8">
            <Sparkles className="w-4 h-4 text-[#f4c600]" />
            <span className="text-sm font-semibold text-[#01402e] dark:text-[#f7f0e5]">The Future of Zidwell</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-balance text-[#01402e] dark:text-[#f7f0e5]">
            We're building toward a future where Africans have{" "}
            <span className="relative inline-block">
              <span className="relative z-10">full visibility</span>
              <span className="absolute bottom-2 left-0 right-0 h-4 bg-[#f4c600]/40 z-0" />
            </span>{" "}
            and control over their money
          </h2>

          <p className="text-lg text-[#01402e]/60 dark:text-[#f7f0e5]/60 mb-8 max-w-2xl mx-auto">
            Savings, spending, records, and growth — all in one place. Zidwell is just getting started.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button2 variant="hero" size="xl"   onClick={() => router.push("/auth/signup")}>
              Get Started Free
              <ArrowRight className="ml-2" />
            </Button2>
          </div>

          <div className="mt-16 flex justify-center gap-4">
            <div className="w-4 h-4 bg-[#f4c600] border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600]" />
            <div className="w-4 h-4 bg-[#01402e] dark:bg-[#f7f0e5]" />
            <div className="w-4 h-4 bg-[#f4c600] border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600]" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
