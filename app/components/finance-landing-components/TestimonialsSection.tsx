import { Star, Quote } from "lucide-react";

import Image from "next/image";

const testimonials: any[] = [
  {
    name: "Adaeze Okonkwo",
    role: "CEO, Nigerian BUsiness Owner",
    location: "Port Harcourt",
    image:
      "https://images.unsplash.com/photo-1614890094520-7b8dd0ec56d2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzJ8fGJsYWNrJTIwYnVzaW5lc3MlMjBtYW58ZW58MHx8MHx8fDA%3D",
    quote:
      "Zidwell transformed how we handle our finances. Before them, I was always stressed about tax deadlines. Now I focus on growing my business while they handle everything.",
    rating: 5,
  },
  {
    name: "Chukwuemeka Ibe",
    role: "Managing Director, Nigerian BUsiness Owner",
    location: "Lagos",
    image:
      "https://images.unsplash.com/photo-1642804425130-0cd9cfa51118?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fGJsYWNrJTIwYnVzaW5lc3MlMjBtYW58ZW58MHx8MHx8fDA%3D",
    quote:
      "The monthly management meetings are incredibly valuable. They don't just give us numbers — they explain what they mean and help us make better decisions.",
    rating: 5,
  },
  {
    name: "Folake Adeyemi",
    role: "Founder, Nigerian BUsiness Owner",
    location: "Lagos",
    image:
      "https://images.unsplash.com/photo-1611432579402-7037e3e2c1e4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmxhY2slMjBidXNpbmVzcyUyMHdvbWFufGVufDB8fDB8fHww",
    quote:
      "I've worked with several accountants before, but Zidwell actually understands Nigerian business realities. Their advisory has saved us from costly mistakes multiple times.",
    rating: 5,
  },
  {
    name: "Tunde Bakare",
    role: "Director, Nigerian BUsiness Owner",
    location: "Abuja",
    image:
      "https://images.unsplash.com/photo-1764169689207-e23fb66e1fcf?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTI3fHxibGFjayUyMGJ1c2luZXNzJTIwbWFufGVufDB8fDB8fHww",
    quote:
      "As a tech startup, we needed a finance partner who could keep up with our pace. Zidwell's tools and responsive WhatsApp support make everything seamless.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className=" bg-secondary/30 relative overflow-hidden py-20 md:py-28 lg:py-32 p-5">
      {/* Decorative elements */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-linear-to-br from-[#C29307]/20 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-10 left-10 w-24 h-24 bg-linear-to-tr from-[#C29307]/15 to-transparent rounded-full blur-xl" />

      <div className="container-custom relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-block px-4 py-1 bg-[#C29307]/20 border border-[#C29307] text-sm font-semibold mb-4">
            TESTIMONIALS
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
            Loved by Our Clients
          </h2>
          <p className="text-lg text-muted-foreground">
            Real stories from real Nigerian businesses
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card border-2 border-foreground p-6 md:p-8 relative hover:shadow-[4px_4px_0px_#C29307] transition-all duration-300"
            >
              {/* Quote icon */}
              <div className="absolute top-6 right-6 w-10 h-10 bg-[#C29307]/20 flex items-center justify-center">
                <Quote className="w-5 h-5 text-[#C29307]" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-[#C29307] text-[#C29307]"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 border-2 border-foreground overflow-hidden">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    width={500}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                  <p className="text-xs text-[#C29307] font-semibold">
                    {testimonial.location}
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

export default TestimonialsSection;
