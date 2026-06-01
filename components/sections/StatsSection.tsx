"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

const PrecisionBento: React.FC = () => {
  return (
    <section className="relative bg-white py-14 sm:py-20 px-4 sm:px-6 lg:px-24 overflow-hidden rounded-t-[40px] sm:rounded-t-[60px]">

      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='138.6' viewBox='0 0 80 138.6'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cpath stroke='%232dd4bf' strokeWidth='1' d='M40 0l40 23.1v46.2L40 92.4 0 69.3V23.1zM40 138.6l40-23.1V69.3L40 46.2 0 69.3v46.2z'/%3E%3Ccircle fill='%232dd4bf' cx='40' cy='46' r='3'/%3E%3Ccircle fill='%232dd4bf' cx='0' cy='23' r='3'/%3E%3Ccircle fill='%232dd4bf' cx='80' cy='23' r='3'/%3E%3Ccircle fill='%232dd4bf' cx='40' cy='92' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "80px 138.6px",
        }}
      />

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
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-black leading-[1.55] tracking-tight text-slate-900 mb-8">
              <span className="block sm:whitespace-nowrap">
                We Measure What Matters.
              </span>
              <span className="block text-green-600 sm:whitespace-nowrap">
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
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900">
                    {number}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Guarantee Card */}
            <div className="bg-[#f0f7ff]/80 backdrop-blur-sm rounded-3xl sm:rounded-4xl p-6 sm:p-8 border border-blue-50 relative overflow-hidden shadow-sm">
              <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                Quality Guarantee
              </h4>
              <p className="text-slate-700 text-sm leading-relaxed max-w-md mx-auto lg:mx-0">
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
                alt="Clinical Research"
                className="w-full h-full object-cover"
              />
            </div>

            {/* QUOTE CARD */}
            <div className="bg-[#0f172a] rounded-3xl sm:rounded-4xl p-6 sm:p-8 text-white flex flex-col justify-center shadow-lg text-center sm:text-left lg:self-end w-full lg:w-[95%] relative z-10 translate-x-0 lg:translate-x-7">
              <p className="text-base sm:text-lg font-bold leading-tight mb-4">
                "Health is not just absence of disease, but a state of complete vitality."
              </p>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
            <div className="bg-[#0f172a] rounded-3xl sm:rounded-[40px] p-6 sm:p-8 text-white shadow-lg text-center lg:text-left">
              <Users className="mb-4 mx-auto lg:mx-0" size={24} />
              <h3 className="text-lg sm:text-xl font-bold mb-2">
                Community Driven
              </h3>
              <p className="text-blue-100 text-sm leading-snug">
                Join thousands of others in our health transformation challenge.
              </p>
            </div>

            {/* IMAGE */}
            <div className="h-[220px] sm:h-[260px] rounded-3xl sm:rounded-[40px] overflow-hidden border border-slate-100 shadow-sm lg:self-end w-full lg:w-[90%] translate-x-0 lg:-translate-x-4">
              <img
                src="https://images.unsplash.com/photo-1543362906-acfc16c67564?q=80&w=765&auto=format&fit=crop"
                alt="Healthy ingredients"
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
    className="text-blue-600"
  >
    <path d="M12 15L15 18L12 21L9 18L12 15Z" />
    <circle cx="12" cy="9" r="7" />
  </svg>
);

export default PrecisionBento;