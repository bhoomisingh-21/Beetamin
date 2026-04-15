"use client";

import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const CORE_FEATURES = [
  "6 Expert Nutrition Sessions",
  "3 Months Validity",
  "Doctor-reviewed guidance",
  "Personalized vitamin plan",
];

const BOOSTER_FEATURES = [
  "1 Expert Session",
  "30 Min Duration",
  "Doctor-reviewed guidance",
  "Available only after main plan purchase",
];

export default function PricingSection() {
  return (
    <section className="bg-[#050B0D] py-16 sm:py-24 px-4 sm:px-6 overflow-x-hidden" id="pricing">

      {/* Header */}
      <div className="text-center">
        <h2 className="text-white font-black text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.2]">
          Investment In Your Future Self
        </h2>
        <p className="text-gray-400 mt-3 sm:mt-4 text-sm sm:text-base md:text-lg">
          Transparent pricing. No hidden fees. Just results.
        </p>
      </div>

      {/* Cards */}
      <div className="max-w-5xl mx-auto mt-12 sm:mt-20 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 items-stretch">

        {/* Featured Plan */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-white border-2 border-[#00E676] rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-300"
        >
          {/* Badge */}
          <div className="absolute -top-px -right-px bg-[#00E676] text-black text-[9px] sm:text-[10px] font-bold px-4 sm:px-6 py-2 rounded-tr-[1.4rem] sm:rounded-tr-[1.8rem] rounded-bl-xl sm:rounded-bl-2xl tracking-widest uppercase">
            Most Popular
          </div>

          <p className="text-xl sm:text-2xl font-black text-gray-900 mb-4 sm:mb-6">
            The Core Transformation
          </p>

          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-4xl sm:text-5xl font-black text-gray-900">₹3,999</span>
            <span className="text-gray-400 text-lg sm:text-xl line-through">₹6,999</span>
          </div>

          <p className="text-gray-500 text-sm mb-6 sm:mb-8">
            Comprehensive 3-month metabolic reset.
          </p>

          <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 flex-grow">
            {CORE_FEATURES.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle size={18} className="text-[#00E676] shrink-0" />
                <span className="text-gray-700 text-sm">{item}</span>
              </li>
            ))}
          </ul>

          <button className="w-full bg-[#00E676] text-black font-bold py-4 sm:py-5 rounded-xl sm:rounded-2xl hover:bg-[#00cf6a] transition-all duration-200 text-sm sm:text-base">
            Get Started Now
          </button>
        </motion.div>

        {/* Booster Plan */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative bg-white border border-gray-200 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 flex flex-col shadow-lg opacity-90 hover:-translate-y-1 transition-all duration-300"
        >
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00E676] to-green-300 rounded-t-full" />

          <p className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
            Single Booster
          </p>

          <p className="text-4xl sm:text-5xl font-black text-gray-900 mb-2">₹499</p>

          <p className="text-gray-500 text-sm mb-6 sm:mb-8">
            Individual focused consultation session.
          </p>

          <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 flex-grow opacity-80">
            {BOOSTER_FEATURES.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle size={18} className="text-gray-300 shrink-0" />
                <span className="text-gray-700 text-sm">{item}</span>
              </li>
            ))}
          </ul>

          <button
            disabled
            className="w-full bg-gray-100 text-gray-400 font-bold py-4 sm:py-5 rounded-xl sm:rounded-2xl cursor-not-allowed text-sm sm:text-base"
          >
            Unlock After Main Plan
          </button>

          <p className="text-center text-[10px] text-gray-400 mt-3 sm:mt-4 uppercase tracking-wider">
            Purchase the Core Plan to unlock this booster.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
