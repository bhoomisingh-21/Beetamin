"use client";

import { motion, useScroll } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] bg-emerald-500 z-[100] origin-left"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
