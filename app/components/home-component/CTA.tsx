// components/CTA.tsx
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button2 } from "../ui/button2";

const CTA = () => {
  const router = useRouter();
  return (
    <section className="relative py-20 md:py-32 overflow-hidden bg-(--bg-secondary)/30">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-(--color-accent-yellow)/10 border-2 border-(--border-color) shadow-[4px_4px_0px_var(--border-color)] dark:shadow-[4px_4px_0px_var(--color-accent-yellow)] mb-8 squircle-md">
            <Sparkles className="w-4 h-4 text-(--color-accent-yellow)" />
            <span className="text-sm font-semibold text-(--text-primary)">
              The Future of Zidwell
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-balance text-(--text-primary)">
            We're building toward a future where Africans have{" "}
            <span className="relative inline-block">
              <span className="relative z-10">full visibility</span>
              <span className="absolute bottom-2 left-0 right-0 h-4 bg-(--color-accent-yellow)/40 z-0" />
            </span>{" "}
            and control over their money
          </h2>
          <p className="text-lg text-(--text-secondary) mb-8 max-w-2xl mx-auto">
            Savings, spending, records, and growth — all in one place. Zidwell
            is just getting started.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button2
              variant="hero"
              size="xl"
              onClick={() => router.push("/auth/signup")}
              className="squircle-md"
            >
              Get Started Free
              <ArrowRight className="ml-2" />
            </Button2>
          </div>
          <div className="mt-16 flex justify-center gap-4">
            <div className="w-4 h-4 bg-(--color-accent-yellow) border-2 border-(--border-color) shadow-[4px_4px_0px_var(--border-color)] dark:shadow-[4px_4px_0px_var(--color-accent-yellow)]" />
            <div className="w-4 h-4 bg-[var(--border-color)]" />
            <div className="w-4 h-4 bg-(--color-accent-yellow) border-2 border-(--border-color) shadow-[4px_4px_0px_var(--border-color)] dark:shadow-[4px_4px_0px_var(--color-accent-yellow)]" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
