"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

const PrecisionBento: React.FC = () => {
  return (
    <section className="relative overflow-hidden rounded-t-[40px] bg-white px-4 py-14 sm:rounded-t-[60px] sm:px-6 sm:py-20 lg:px-24">

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5 flex flex-col text-center lg:text-left"
          >
            <h2 className="mb-8 font-serif text-2xl font-medium leading-[1.35] tracking-tight text-[#1C1A16] sm:text-3xl md:text-4xl lg:text-[40px]">
              <span className="block sm:whitespace-nowrap">
                We Measure What Matters.
              </span>
              <span className="block italic text-[#2A5340] sm:whitespace-nowrap">
                You Feel The Difference.
              </span>
            </h2>
            <br />
            {/* Stats */}
            <div className="grid grid-cols-2 gap-y-8 sm:gap-y-12 mb-12">
              {[
                ["50,000+", "Lives Impacted"],
                ["120+", "Expert Nutritionists"],
                ["94%", "Success Rate"],
                ["15+", "Lab Partners"],
              ].map(([number, label], i) => (
                <div key={i}>
                  <div className="font-serif text-2xl font-medium text-[#1C1A16] sm:text-3xl md:text-4xl">
                    {number}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#4A4A4A]">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Guarantee Card */}
            <div className="relative overflow-hidden rounded-3xl border border-[#E4DFD4] bg-[#F6F3EC] p-6 shadow-sm sm:rounded-4xl sm:p-8">
              <h4 className="mb-2 font-serif text-lg font-medium text-[#1C1A16] sm:text-xl">
                Quality Guarantee
              </h4>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-[#333333] lg:mx-0">
                Every plan is reviewed by a panel of board-certified doctors and clinical nutritionists before it reaches you.
              </p>

              <div className="absolute -right-3 -bottom-3 opacity-10">
                <RibbonIcon />
              </div>
            </div>
          </motion.div>

          {/* CENTER COLUMN */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-3 flex flex-col gap-6"
          >
            {/* IMAGE - Reduced height on mobile, square on desktop */}
            <div className="h-[250px] lg:aspect-square rounded-3xl sm:rounded-[40px] overflow-hidden border border-slate-100 shadow-sm lg:self-end w-full lg:w-[85%]">
              <img
                src="https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?q=80&w=764&auto=format&fit=crop"
                alt="Clinical nutrition research supporting Indian micronutrient deficiency recovery"
                className="w-full h-full object-cover"
              />
            </div>

            {/* QUOTE CARD */}
            <div className="relative z-10 flex w-full translate-x-0 flex-col justify-center rounded-3xl bg-[#2A5340] p-6 text-center text-white shadow-sm sm:rounded-4xl sm:p-8 sm:text-left lg:w-[95%] lg:translate-x-7 lg:self-end">
              <p className="mb-4 font-serif text-base font-medium leading-tight sm:text-lg">
                &ldquo;Health is not just absence of disease, but a state of complete vitality.&rdquo;
              </p>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5D4CB]">
                — Beetamin Philosophy
              </span>
            </div>
          </motion.div>

          {/* RIGHT COLUMN */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="lg:col-span-4 flex flex-col gap-6"
          >
            {/* TEXT CARD */}
            <div className="rounded-3xl bg-[#2A5340] p-6 text-center text-white shadow-sm sm:rounded-[40px] sm:p-8 lg:text-left">
              <Users className="mx-auto mb-4 lg:mx-0" size={24} />
              <h3 className="mb-2 font-serif text-lg font-medium sm:text-xl">
                Community Driven
              </h3>
              <p className="text-sm leading-snug text-[#C5D4CB]">
                Join thousands of others in our health transformation challenge.
              </p>
            </div>

            {/* IMAGE */}
            <div className="h-[220px] sm:h-[260px] rounded-3xl sm:rounded-[40px] overflow-hidden border border-slate-100 shadow-sm lg:self-end w-full lg:w-[90%] translate-x-0 lg:-translate-x-4">
              <img
                src="https://images.unsplash.com/photo-1543362906-acfc16c67564?q=80&w=765&auto=format&fit=crop"
                alt="Iron-rich and B12-friendly Indian ingredients for deficiency recovery meal plans"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

const RibbonIcon: React.FC = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1}
    className="text-[#2A5340]"
  >
    <path d="M12 15L15 18L12 21L9 18L12 15Z" />
    <circle cx="12" cy="9" r="7" />
  </svg>
);

export default PrecisionBento;