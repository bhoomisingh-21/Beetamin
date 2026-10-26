"use client";

import Link from "next/link";
import { X, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const ROWS = [
  {
    feature: "Consultation Type",
    typical: "AI chatbot / generic advice",
    beetamin: "1-on-1 certified nutritionist",
    beetaminHref: "/expert-nutritionist-consultation",
  },
  {
    feature: "Diet Plans",
    typical: "Generic templates",
    beetamin: "Fully personalized to your body",
    beetaminHref: "/personalised-meal-plan",
  },
  {
    feature: "Vitamin Guidance",
    typical: "None or generic multivitamin",
    beetamin: "Targeted micronutrient optimization",
    beetaminHref: "/nutrient-deficiency",
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

function BeetaminCell({ text, href }: { text: string; href?: string }) {
  if (!href) return <>{text}</>;
  return (
    <Link href={href} className="underline-offset-2 hover:underline">
      {text}
    </Link>
  );
}

export default function Comparison() {
  return (
    <section
      id="comparison"
      aria-label="Why TheBeetamin"
      className="relative scroll-mt-28 overflow-x-hidden bg-white py-14 sm:py-24"
    >

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">

        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#2A5340]/20 bg-[#E8EEE9] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2A5340]">
            WHY BEETAMIN IS DIFFERENT
          </span>

          <h2 className="mb-4 font-serif text-3xl font-medium leading-[1.2] tracking-tight text-[#1C1A16] sm:text-4xl md:text-5xl">
            Why TheBeetamin — Not Just Another Health App
          </h2>
          <p className="mb-2 font-serif text-lg italic text-[#2A5340] sm:text-xl">
            A real nutrition system, not a generic diet app.
          </p>

          <p className="mt-4 text-sm text-[#333333] sm:text-base">
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

              <div className="border-b bg-[#2A5340] p-3 text-center">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-[#F6F3EC]">Beetamin</p>
              </div>
            </div>

            {/* Rows */}
            {ROWS.map((row, i) => (
              <div key={row.feature} className="grid grid-cols-2">

                <div className={`p-4 border-b ${i % 2 === 0 ? "bg-[#F8F9FA]" : "bg-white"}`}>
                  <div className="flex gap-2">
                    <X size={14} className="text-red-400 mt-1" />
                    <p className="text-xs text-[#4A4A4A]">{row.typical}</p>
                  </div>
                </div>

                <div className={`p-4 border-b ${i % 2 === 0 ? "bg-[#F1FDF6]" : "bg-white"}`}>
                  <div className="flex gap-2">
                    <CheckCircle2 size={14} className="mt-1 text-[#2A5340]" />
                    <p className="text-xs font-semibold text-[#1C1A16]">
                      <BeetaminCell text={row.beetamin} href={row.beetaminHref} />
                    </p>
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
                  <span className="text-center text-sm text-[#4A4A4A]">
                    {row.typical}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* BEETAMIN */}
            <div className="relative z-10 -mt-2 flex flex-col rounded-[24px] border border-[#E4DFD4] bg-[#F6F3EC] shadow-sm">
              <div className="flex h-[108px] flex-col items-center justify-center rounded-t-[24px] bg-[#2A5340] p-4">
                <span className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8EEE9]">
                  BEETAMIN
                </span>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                  <CheckCircle2 size={15} className="text-[#C5D4CB]" />
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
                    i % 2 === 0 ? "bg-[#E8EEE9]" : "bg-white"
                  }`}
                >
                  <CheckCircle2 size={17} className="text-[#2A5340]" />
                  <span className="text-sm font-semibold text-[#1C1A16]">
                    <BeetaminCell text={row.beetamin} href={row.beetaminHref} />
                  </span>
                </motion.div>
              ))}
            </div>

          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="/assessment"
            className="inline-block w-full rounded-full bg-[#2A5340] px-8 py-3.5 font-semibold text-white transition hover:bg-[#1F3F30] sm:w-auto"
          >
            Start Your Free Assessment
          </a>

          {/* BADGES */}
          <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm text-[#4A4A4A]">
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