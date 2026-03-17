import { Quote } from "lucide-react";
import zainabImg from "../../public/zainab.jpg";
import peterImg from "../../public/peter.jpg";
import johnsonImg from "../../public/johnson.jpg";
import bimboImg from "../../public/bimbo.jpg";
import Image from "next/image";

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
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-gray-900 dark:text-gray-50">
            Loved by Our <span className="text-[#2b825b]">Users</span>
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Real stories from real Nigerian businesses
          </p>
        </div>

        {/* Face Collage */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <div className="flex -space-x-4">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-gray-50 dark:border-gray-950 overflow-hidden shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24]"
                style={{ zIndex: testimonials.length - index }}
              >
                <Image
                  src={testimonial.image}
                  alt={testimonial.author}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <div className="ml-4">
            <p className="font-bold text-lg text-gray-900 dark:text-gray-50">
              500+
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Happy Users
            </p>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] p-6 md:p-8 hover:shadow-[6px_6px_0px_#111827] dark:hover:shadow-[6px_6px_0px_#fbbf24] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150"
            >
              <Quote className="w-10 h-10 text-[#2b825b] mb-4" />
              <p className="text-lg font-medium mb-6 text-gray-900 dark:text-gray-50">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full border-2 border-gray-900 dark:border-gray-50 overflow-hidden">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.author}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-50">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
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
