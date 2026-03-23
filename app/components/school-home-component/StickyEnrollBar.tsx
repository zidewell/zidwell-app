"use client"
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const StickyEnrollBar = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          exit={{ y: 80 }}
          transition={{ duration: 0.15 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-primary border-t-2 border-secondary py-3"
        >
          <div className="container flex items-center justify-between">
            <p className="font-display text-sm font-semibold text-primary-foreground hidden sm:block">
              Ready to grow your business skills?
            </p>
            <a
              href="#pricing"
              className="brutal-button bg-secondary text-secondary-foreground px-6 py-2 text-sm ml-auto"
            >
              Enroll Now →
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyEnrollBar;
