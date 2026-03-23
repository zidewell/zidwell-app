import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center pt-16 relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute top-24 right-10 w-32 h-32 border-2 border-secondary bg-secondary/20 rotate-12 hidden lg:block" />
      <div className="absolute bottom-20 left-10 w-20 h-20 bg-primary hidden lg:block" />
      <div className="absolute top-40 left-1/4 w-4 h-4 bg-secondary hidden lg:block" />
      <div className="absolute bottom-40 right-1/3 w-8 h-8 border-2 border-primary rotate-45 hidden lg:block" />

      <div className="container">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="brutal-button bg-secondary text-secondary-foreground px-4 py-1 text-xs inline-block mb-6">
              The Education Arm of Zidwell Finance
            </span>
          </motion.div>

          <motion.h1
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            Get Skilled Up, Learn and Grow with{" "}
            <span className="bg-secondary text-secondary-foreground px-2 inline-block">Business</span>{" "}
            and Tech Education
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg text-muted-foreground max-w-xl mb-8 font-body leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            Digital Business School is the education arm of Zidwell Finance, and our goal is to coach and mentor entrepreneurs and career professionals on how to build profitable businesses using modern tools, technology, and strategy.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <a
              href="#programs"
              className="brutal-button bg-primary text-primary-foreground px-8 py-3 text-sm"
            >
              View Programs
            </a>
            <a
              href="#pricing"
              className="brutal-button bg-card text-foreground px-8 py-3 text-sm"
            >
              Join the Next Cohort
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
