"use client";

import { X, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";

const ROWS = [
  {
    feature: "Consultation Type",
    typical: "AI chatbot / generic advice",
    beetamin: "1-on-1 certified nutritionist",
  },
  {
    feature: "Diet Plans",
    typical: "Generic templates",
    beetamin: "Fully personalized to your body",
  },
  {
    feature: "Vitamin Guidance",
    typical: "None or generic multivitamin",
    beetamin: "Targeted micronutrient optimization",
  },
  {
    feature: "Doctor Review",
    typical: "No medical oversight",
    beetamin: "Every plan doctor-reviewed",
  },
  {
    feature: "Pricing Model",
    typical: "₹999–₹3,999/month recurring",
    beetamin: "One-time ₹3,999 for 3 months",
  },
  {
    feature: "Support",
    typical: "Email tickets (48hr reply)",
    beetamin: "WhatsApp support + check-ins",
  },
  {
    feature: "Tracking",
    typical: "Self-reported only",
    beetamin: "Nutritionist-guided 90-day tracking",
  },
];

export default function Comparison() {
  const { isSignedIn } = useUser()

  return (
    <section className="relative bg-white py-14 sm:py-24 overflow-x-hidden">

      {/* Background */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='138.6' viewBox='0 0 80 138.6'%3E%3Cpath stroke='%232dd4bf' strokeWidth='1' fill='none' d='M40 0l40 23.1v46.2L40 92.4 0 69.3V23.1z'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">

        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <span className="inline-flex items-center gap-2 border border-red-100 bg-red-50 text-red-500 text-[10px] font-bold tracking-[0.2em] uppercase rounded-full px-4 py-1.5 mb-6">
            <X size={12} /> WHY BEETAMIN IS DIFFERENT
          </span>

         <h2 className="font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight text-[#050B0D] leading-[1.2] mb-4"> Not Another Diet App. <br /> <span className="text-[#2DD48F]">A Real Nutrition System.</span> </h2>

          <p className="text-slate-500 text-sm sm:text-base mt-4">
            See exactly how we compare to typical diet apps and generic nutrition plans.
          </p>
        </div>

        {/* ✅ MOBILE (2 COLUMN ONLY) */}
        <div className="sm:hidden mb-12">
          <div className="border border-gray-100 rounded-xl overflow-hidden">

            {/* Headers */}
            <div className="grid grid-cols-2">
              <div className="bg-[#F8F9FA] p-3 text-center border-b">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Typical Apps</p>
              </div>

              <div className="bg-[#050B0D] p-3 text-center border-b">
                <p className="text-[9px] font-bold text-[#2DD48F] uppercase">Beetamin</p>
              </div>
            </div>

            {/* Rows */}
            {ROWS.map((row, i) => (
              <div key={row.feature} className="grid grid-cols-2">

                <div className={`p-4 border-b ${i % 2 === 0 ? "bg-[#F8F9FA]" : "bg-white"}`}>
                  <div className="flex gap-2">
                    <X size={14} className="text-red-400 mt-1" />
                    <p className="text-xs text-slate-500">{row.typical}</p>
                  </div>
                </div>

                <div className={`p-4 border-b ${i % 2 === 0 ? "bg-[#F1FDF6]" : "bg-white"}`}>
                  <div className="flex gap-2">
                    <CheckCircle2 size={14} className="text-[#2DD48F] mt-1" />
                    <p className="text-xs font-semibold text-[#050B0D]">{row.beetamin}</p>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* ✅ DESKTOP (FULL ORIGINAL RESTORED) */}
        <div className="hidden sm:block mt-12 mb-20">
          <div className="grid grid-cols-[1.1fr_1fr_1fr] items-stretch">

            {/* FEATURES */}
            <div className="flex flex-col">
              <div className="h-[100px]" />
              {ROWS.map((row, i) => (
                <motion.div
                  key={row.feature}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className={`h-20 flex items-center px-4 ${
                    i % 2 === 0 ? "bg-[#F8FDFB]" : "bg-white"
                  }`}
                >
                  <span className="text-slate-800 font-semibold text-sm">
                    {row.feature}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* TYPICAL APPS */}
            <div className="flex flex-col bg-[#F8F9FA] rounded-t-[20px]">
              <div className="h-[100px] flex flex-col items-center justify-center border-b border-white">
                <span className="text-slate-400 font-bold text-[10px] tracking-[0.2em] uppercase mb-1">
                  TYPICAL APPS
                </span>
                <div className="flex items-center gap-1 text-red-400 text-xs font-bold">
                  <X size={13} strokeWidth={3} /> Generic & Automated
                </div>
              </div>

              {ROWS.map((row, i) => (
                <motion.div
                  key={row.feature}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className={`h-20 flex items-center justify-center gap-2 px-4 border-b border-white ${
                    i % 2 === 0 ? "bg-[#F1F3F5]/50" : "bg-[#F8F9FA]"
                  }`}
                >
                  <X size={13} className="text-red-300 shrink-0" />
                  <span className="text-slate-400 text-sm text-center">
                    {row.typical}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* BEETAMIN */}
            <div className="flex flex-col bg-[#F4FFF9] rounded-[24px] shadow-lg relative z-10 -mt-2">
              <div className="h-[108px] bg-[#050B0D] rounded-t-[24px] flex flex-col items-center justify-center p-4">
                <span className="text-[#2DD48F] font-bold text-[11px] tracking-[0.2em] uppercase mb-1">
                  BEETAMIN
                </span>
                <div className="flex items-center gap-1.5 text-white text-sm font-bold">
                  <CheckCircle2 size={15} className="text-[#2DD48F]" />
                  Expert-Led System
                </div>
              </div>

              {ROWS.map((row, i) => (
                <motion.div
                  key={row.feature}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className={`h-20 flex items-center px-6 gap-3 border-b ${
                    i % 2 === 0 ? "bg-[#F1FDF6]" : "bg-white"
                  }`}
                >
                  <CheckCircle2 size={17} className="text-[#2DD48F]" />
                  <span className="text-[#050B0D] font-semibold text-sm">
                    {row.beetamin}
                  </span>
                </motion.div>
              ))}
            </div>

          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href={isSignedIn ? "/booking/dashboard" : "/booking"}
            className="inline-block bg-[#050B0D] text-white px-8 py-4 rounded-full font-bold w-full sm:w-auto hover:bg-[#1a2a1a] transition"
          >
            {isSignedIn ? "Manage My Sessions →" : "Start 90-Day Transformation →"}
          </a>

          {/* BADGES */}
          <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm text-slate-400">
            <span>One-time ₹3,999</span>
            <span>•</span>
            <span>No subscriptions</span>
            <span>•</span>
            <span>Cancel anytime</span>
          </div>
        </div>

      </div>
    </section>
  );
}