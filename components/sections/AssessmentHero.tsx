"use client";

import { ArrowRight, Beaker } from "lucide-react";
import { motion } from "framer-motion";

const TAGS = [
  { emoji: "⏱️", label: "Takes 2 minutes" },
  { emoji: "🔒", label: "100% Private" },
  { emoji: "🎁", label: "Completely Free" },
];

export default function AssessmentHero() {
  return (
    <section className="relative bg-white py-14 sm:py-20 overflow-x-hidden" id="assessment">

      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='138.6' viewBox='0 0 80 138.6'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cpath stroke='%232dd4bf' strokeWidth='1' d='M40 0l40 23.1v46.2L40 92.4 0 69.3V23.1zM40 138.6l40-23.1V69.3L40 46.2 0 69.3v46.2z'/%3E%3Ccircle fill='%232dd4bf' cx='40' cy='46' r='3'/%3E%3Ccircle fill='%232dd4bf' cx='0' cy='23' r='3'/%3E%3Ccircle fill='%232dd4bf' cx='80' cy='23' r='3'/%3E%3Ccircle fill='%232dd4bf' cx='40' cy='92' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "80px 138.6px",
        }}
      />

      {/* Desktop divider */}
      <div className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent hidden lg:block" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">

        {/* ================= MOBILE ================= */}
        <div className="block lg:hidden">

          {/* CONTENT FIRST */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center gap-2 bg-[#E6FFF5] text-[#00E676] px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border border-[#00E676]/10 mb-5">
              FREE • 2 MINUTES • INSTANT RESULTS
            </div>

            <h1 className="text-3xl font-black tracking-tight text-gray-900 leading-[1.15]">
              Discover Your
              <br />
              <span className="text-[#00E676]">Nutrition Gaps</span>
            </h1>

            <p className="mt-4 text-gray-500 text-sm leading-relaxed">
              Answer 4 quick questions and get personalized vitamin insights — completely free.
            </p>

            {/* Social Proof */}
            <div className="mt-5 flex flex-col items-center gap-2 text-sm text-slate-500">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((n) => (
                  <img
                    key={n}
                    src={`https://i.pravatar.cc/40?img=${n}`}
                    alt="User avatar"
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <span className="text-xs">Trusted by 50,000+ users</span>
            </div>

            {/* Benefits */}
            <div className="mt-6 space-y-3">
              {[
                "Identify hidden vitamin deficiencies",
                "Get personalized nutrition insights",
                "Improve energy, sleep & immunity",
              ].map((item) => (
                <div key={item} className="flex justify-center items-center gap-2 text-slate-600 text-sm">
                  <div className="w-2 h-2 bg-[#00E676] rounded-full" />
                  {item}
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-8 flex justify-center gap-8 text-sm">
              {[
                { value: "50K+", label: "Assessments" },
                { value: "94%", label: "Accuracy" },
                { value: "2 min", label: "Completion" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="font-bold text-gray-900 text-base">{value}</div>
                  <div className="text-slate-400 text-xs">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CARD BELOW */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mt-10 flex justify-center"
          >
            <div className="w-full max-w-md bg-[#020817] text-white rounded-[24px] p-6 shadow-xl relative text-center">

              <div className="absolute inset-0 bg-[#00E676]/10 blur-2xl opacity-20 rounded-[24px]" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 bg-[#00E676]/10 border border-[#00E676]/20 rounded-full flex items-center justify-center mb-4">
                  <Beaker size={20} className="text-[#00E676]" />
                </div>

                <h2 className="text-xl font-bold mb-2">
                  Free Nutrition Assessment
                </h2>

                <p className="text-gray-400 text-sm mb-5">
                  4 quick questions to identify your likely nutrient deficiencies.
                </p>

                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {TAGS.map(({ emoji, label }) => (
                    <div
                      key={label}
                      className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs"
                    >
                      <span>{emoji}</span>
                      {label}
                    </div>
                  ))}
                </div>

                <a
                  href="/assessment"
                  className="inline-flex items-center justify-center w-full gap-2 bg-[#00E676] text-black font-semibold px-6 py-3 rounded-full text-sm"
                >
                  Start Free Assessment
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </motion.div>

        </div>

        {/* ================= DESKTOP (FULL ORIGINAL — UNTOUCHED) ================= */}
        <div className="hidden lg:grid grid-cols-2 gap-12 items-start">

          {/* LEFT CARD */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="w-full lg:max-w-md lg:mt-10"
          >
            <div className="bg-[#020817] text-white rounded-[28px] p-8 shadow-xl relative">

              <div className="absolute inset-0 bg-[#00E676]/10 blur-2xl opacity-20 rounded-[28px]" />

              <div className="relative z-10">
                <div className="w-12 h-12 bg-[#00E676]/10 border border-[#00E676]/20 rounded-full flex items-center justify-center mb-5">
                  <Beaker size={20} className="text-[#00E676]" />
                </div>

                <h2 className="text-2xl font-bold mb-3">
                  Free Nutrition Assessment
                </h2>

                <p className="text-gray-400 text-sm mb-6">
                  4 quick questions to identify your likely nutrient deficiencies and get
                  personalized vitamin suggestions.
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {TAGS.map(({ emoji, label }) => (
                    <div
                      key={label}
                      className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs"
                    >
                      <span>{emoji}</span>
                      {label}
                    </div>
                  ))}
                </div>

                <a
                  href="/assessment"
                  className="inline-flex items-center justify-center w-full gap-2 bg-[#00E676] text-black font-semibold px-6 py-3 rounded-full"
                >
                  Start Free Assessment
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </motion.div>

          {/* RIGHT CONTENT (RESTORED EXACTLY) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="w-full"
          >
            <div className="inline-flex items-center gap-2 bg-[#E6FFF5] text-[#00E676] px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border border-[#00E676]/10 mb-6">
              FREE • 2 MINUTES • INSTANT RESULTS
            </div>

            <h1 className="text-5xl font-black tracking-tight text-gray-900 leading-[1.15]">
              Discover Your
              <br />
              <span className="text-[#00E676]">Nutrition Gaps</span>
            </h1>

            <p className="mt-5 text-gray-500 text-base leading-relaxed">
              Answer 4 quick questions and get personalized vitamin insights — completely free.
            </p>

            <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((n) => (
                  <img
                    key={n}
                    src={`https://i.pravatar.cc/40?img=${n}`}
                    alt="User avatar"
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <span>Trusted by 50,000+ users</span>
            </div>

            <div className="mt-8 space-y-3">
              {[
                "Identify hidden vitamin deficiencies",
                "Get personalized nutrition insights",
                "Improve energy, sleep & immunity",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-slate-600 text-sm">
                  <div className="w-2 h-2 bg-[#00E676] rounded-full" />
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-10 flex gap-8 text-sm">
              {[
                { value: "50K+", label: "Assessments" },
                { value: "94%", label: "Accuracy" },
                { value: "2 min", label: "Completion" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="font-bold text-gray-900 text-lg">{value}</div>
                  <div className="text-slate-400 text-xs">{label}</div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}