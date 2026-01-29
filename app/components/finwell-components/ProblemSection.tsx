"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  AlertTriangle,
  Users,
  FileX,
  GraduationCap,
  Battery,
} from "lucide-react";

const problems = [
  {
    icon: GraduationCap,
    title: "Financial Illiteracy",
    description:
      "Most business owners were never taught how to manage business finances, separate personal and business money, or understand cash flow vs. profit.",
  },
  {
    icon: Users,
    title: "Isolation",
    description:
      "Entrepreneurs struggle alone with financial decisions, with no peer support or mentorship to guide them through challenges.",
  },
  {
    icon: FileX,
    title: "Lack of Structure",
    description:
      "Many businesses operate without proper SOPs and financial structure, leading to late payments, missed tax deadlines, and cash flow crises.",
  },
  {
    icon: AlertTriangle,
    title: "Limited Access to Knowledge",
    description:
      "Quality financial education is either too expensive, too complex, or simply unavailable to the average business owner.",
  },
  {
    icon: Battery,
    title: "Burnout",
    description:
      "Business owners focus solely on making money, neglecting their mental and physical wellness, which ultimately affects business performance.",
  },
];

const ProblemSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="problem"
      className="section-padding bg-charcoal text-primary-foreground"
      ref={ref}
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1 rounded-full text-[#E7B008] bg-[#473C1B] font-medium text-sm mb-4">
            The Problem
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Most Small Businesses Fail Within{" "}
            <span className="text-gradient-gold">5 Years</span>
          </h2>
          <p className="text-lg text-primary-foreground/70">
            Despite Africa&apos;s vibrant entrepreneurial ecosystem, brilliant
            business ideas die and hardworking entrepreneurs burn out—not due to
            lack of ideas or effort, but because of poor financial management.
          </p>
        </motion.div>

        {/* Problem cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              className={`p-6 rounded-2xl backdrop-blur-xl bg-linear-to-br from-[#2A2A2A]/80 to-[#1A1A1A]/80 border border-white/10 hover:border-[#E7B008] shadow-lg transition-all duration-300 ${
                index === 4 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="w-12 h-12 backdrop-blur-md bg-linear-to-br from-[#E7B008]/10 to-[#473C1B]/20 rounded-xl flex items-center justify-center mb-4 border border-[#E7B008]/20">
                <problem.icon className="w-6 h-6 text-[#E7B008]" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">
                {problem.title}
              </h3>
              <p className="text-primary-foreground/70">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-12 p-8 rounded-3xl backdrop-blur-xl bg-linear-to-br from-[#2A2A2A]/80 to-[#1A1A1A]/80 border border-white/10 text-center"
        >
          <p className="font-display text-xl md:text-2xl font-bold">
            The result? Brilliant business ideas die. Hardworking entrepreneurs
            burn out.
            <span className="text-accent">
              {" "}
              Economic potential remains untapped.
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;
