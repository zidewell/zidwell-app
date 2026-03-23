"use client"
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    name: "Adaeze O.",
    role: "Entrepreneur",
    quote: "The Business Growth Program gave me a clear roadmap. Within 2 months of completing the course, I doubled my revenue.",
  },
  {
    name: "Tunde M.",
    role: "Business Owner",
    quote: "I finally understand how to use data to make real business decisions. The analytics course was a game-changer.",
  },
  {
    name: "Sarah K.",
    role: "Product Manager",
    quote: "The PM program was exactly what I needed to transition into tech. Practical, concise, and immediately applicable.",
  },
];

const TestimonialsSection = () => {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((p) => (p + 1) % testimonials.length);
  const prev = () => setCurrent((p) => (p - 1 + testimonials.length) % testimonials.length);

  const t = testimonials[current];

  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container">
        <div className="mb-12 text-center">
          <span className="brutal-button bg-secondary text-secondary-foreground px-4 py-1 text-xs inline-block mb-4">
            Testimonials
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            What Our Students Say
          </h2>
        </div>

        <div className="max-w-2xl mx-auto text-center">
          <blockquote className="text-lg sm:text-xl font-body leading-relaxed mb-6 min-h-[80px]">
            "{t.quote}"
          </blockquote>
          <p className="font-display font-bold">{t.name}</p>
          <p className="text-sm font-body opacity-70">{t.role}</p>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="border-2 border-primary-foreground w-10 h-10 flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground hover:border-secondary transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-display text-sm">
              {current + 1} / {testimonials.length}
            </span>
            <button
              onClick={next}
              className="border-2 border-primary-foreground w-10 h-10 flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground hover:border-secondary transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
