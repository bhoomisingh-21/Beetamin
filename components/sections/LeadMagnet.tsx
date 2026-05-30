"use client";

import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

const GUIDE_FEATURES = [
  "Top 4 deficiencies affecting Indians — Vitamin D, Iron, B12, Omega-3",
  "Exact symptoms to watch for each deficiency",
  "Best Indian foods to fix each gap (dals, greens, millets & more)",
  "A 7-day starter meal plan using Indian ingredients",
];

export default function LeadMagnet() {
  return (
    <section className="bg-[#f0fdf4] py-14 sm:py-20 px-4 sm:px-6 overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16"
        >
          {/* LEFT — visual */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="relative w-44 h-56 sm:w-52 sm:h-64">
              {/* shadow stack */}
              <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-2xl bg-emerald-200/60" />
              <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-2xl bg-emerald-300/40" />
              {/* main card */}
              <div className="relative h-full w-full rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex flex-col items-center justify-center p-6 shadow-xl">
                <BookOpen size={40} className="text-white mb-3" />
                <p className="text-white font-black text-center text-base leading-tight">
                  Deficiency<br />Starter Guide
                </p>
                <p className="text-emerald-200 text-xs mt-2 font-semibold">12 pages · PDF</p>
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-emerald-700">₹39</span>
              <span className="text-gray-400 text-sm line-through">₹199</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">80% OFF</span>
            </div>
          </div>

          {/* RIGHT — copy */}
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              ₹39 · Instant PDF Download
            </span>

            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-3">
              Your Deficiency<br />
              <span className="text-emerald-600">Starter Guide</span>
            </h2>

            <p className="text-gray-500 text-base leading-relaxed mb-6">
              A 12-page PDF covering the top 4 deficiencies in India, their symptoms, and the best Indian foods to fix them — delivered instantly to your inbox.
            </p>

            <ul className="space-y-3 mb-8 text-left max-w-md mx-auto lg:mx-0">
              {GUIDE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckCircle2 size={17} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm leading-snug">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/assessment"
                className="flex items-center justify-center gap-2 bg-[#00E676] text-black font-bold rounded-full px-7 py-3.5 text-sm hover:bg-[#00c864] transition-all shadow-md"
              >
                Get Free Assessment First
              </Link>
              <Link
                href="/assessment"
                className="flex items-center justify-center gap-2 bg-emerald-700 text-white font-bold rounded-full px-7 py-3.5 text-sm hover:bg-emerald-800 transition-all"
              >
                Get PDF Guide — ₹39
                <ArrowRight size={15} />
              </Link>
            </div>

            <p className="text-gray-400 text-xs mt-4">
              Take the free assessment first — the PDF report is generated from your answers.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
