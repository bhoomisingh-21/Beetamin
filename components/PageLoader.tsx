"use client";

import { useState, useEffect } from "react";
import { Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PageLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-[#F7F4EE]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center gap-3"
          >
            <Leaf className="text-[#1B6B45]" size={28} />
            <span className="text-2xl font-bold tracking-tight text-[#1A2A22]">
              TheBeetamin
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
