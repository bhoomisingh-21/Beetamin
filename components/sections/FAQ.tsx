"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SITE_FAQS } from "@/lib/faq-content";

const FAQS = SITE_FAQS;


export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-14 sm:py-16 px-4 sm:px-6 overflow-x-hidden">
      <div className="max-w-3xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-gray-900 font-black text-3xl sm:text-4xl md:text-5xl leading-tight">
            Common{" "}
            <span className="text-[#00E676]">Questions</span>
          </h2>
          <p className="text-gray-500 mt-3 text-sm sm:text-base">
            Everything you need to know about your journey. Still unsure?{" "}
            <a href="mailto:hi@thebeetamin.com" className="text-emerald-600 hover:underline font-medium">
              Email us
            </a>
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-sm transition cursor-pointer"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <div className="p-4 sm:p-5 flex justify-between items-start gap-3 sm:gap-4">
                <p className="text-gray-900 font-semibold text-sm sm:text-base leading-snug text-center lg:text-left w-full">
                  {faq.q}
                </p>
                <ChevronDown
                  size={17}
                  className={`text-gray-400 transition-transform duration-300 shrink-0 mt-0.5 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </div>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-gray-500 text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}