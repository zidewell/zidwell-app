"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import workshopImg from "@/public/workshop.jpg";
import Image from "next/image";

const stats = [
  { number: "500+", label: "Business Owners Educated" },
  { number: "500+", label: "Active Community Members" },
  { number: "5+", label: "Financial Wellness Workshops" },
  { number: "100+", label: "Business Partnerships Formed" },
];

const ImpactSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="impact"
      className="section-padding bg-charcoal text-primary-foreground"
      ref={ref}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1 rounded-full text-[#E7B008] bg-[#473C1B] font-medium text-sm mb-4">
              Our Impact
            </span>

            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Making a <span className="text-gradient-gold">Difference</span> in
              African Business
            </h2>

            <p className="text-lg text-primary-foreground/70 mb-8">
              Since inception, FinWell Club has been dedicated to transforming
              the African entrepreneurial landscape through education,
              community, and support.
            </p>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-6 mt-5">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="p-4 rounded-2xl backdrop-blur-xl bg-linear-to-br from-[#2A2A2A]/80 to-[#1A1A1A]/80 border border-white/10 hover:border-[#E7B008]"
                >
                  <p className="font-display text-2xl md:text-3xl font-bold text-[#E7B008] mb-1">
                    {stat.number}
                  </p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden">
              <Image
                src={workshopImg}
                alt="FinWell Club workshop with entrepreneurs"
                className="w-full h-[400px] md:h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-charcoal/60 to-transparent" />
            </div>

            {/* Floating card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="absolute -bottom-6 -left-6 p-6 bg-background rounded-2xl shadow-elevated hidden md:block"
            >
              <p className="font-display text-xl font-bold text-foreground mb-1">
                Free Evaluations
              </p>
              <p className="text-sm text-muted-foreground">
                Helping entrepreneurs understand their financial standing
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
