// components/Testimonials.tsx
import { Quote } from "lucide-react";
import Image from "next/image";
import zainabImg from "../../../public/zainab.jpg";
import peterImg from "../../../public/peter.jpg";
import johnsonImg from "../../../public/johnson.jpg";
import bimboImg from "../../../public/bimbo.jpg";

const testimonials = [
  {
    quote:
      "Zidwell helped me stop guessing my finances. Everything feels more organised now.",
    author: "Zainab",
    role: "Business Owner, Lagos",
    image: zainabImg,
  },
  {
    quote:
      "I like that it's not just about paying bills — it actually helps you think better about money.",
    author: "Peter",
    role: "Entrepreneur, Abuja",
    image: peterImg,
  },
  {
    quote: "The receipts and tax support alone are worth it.",
    author: "Johnson",
    role: "Small Business Owner, Port Harcourt",
    image: johnsonImg,
  },
  {
    quote: "Can't believe I didn't find this app sooner!",
    author: "Bimbo",
    role: "Freelancer, Ibadan",
    image: bimboImg,
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 md:py-32 bg-(--bg-primary)">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-(--text-primary)">
            Loved by Our{" "}
            <span className="text-(--color-accent-yellow)">Users</span>
          </h2>
          <p className="text-lg text-(--text-secondary)">
            Real stories from real Nigerian businesses
          </p>
        </div>

        <div className="flex justify-center items-center gap-4 mb-12">
          <div className="flex -space-x-4">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="relative w-16 h-16 md:w-20 md:h-20 squircle-full border-4 border-[var(--bg-primary)] overflow-hidden "
                style={{ zIndex: testimonials.length - index }}
              >
                <Image
                  src={testimonial.image}
                  alt={testimonial.author}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <div className="ml-4">
            <p className="font-bold text-lg text-(--text-primary)">500+</p>
            <p className="text-sm text-(--text-secondary)">Happy Users</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-(--bg-primary) border-2 border-(--border-color)  p-6 md:p-8  hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150 squircle-lg"
            >
              <Quote className="w-10 h-10 text-(--color-accent-yellow) mb-4" />
              <p className="text-lg font-medium mb-6 text-(--text-primary)">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 squircle-full border-2 border-(--border-color) overflow-hidden">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.author}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold text-(--text-primary)">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-(--text-secondary)">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
