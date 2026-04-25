"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Sparkles, ClipboardList, ArrowRight, Activity, CheckCircle2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { getClientAssessmentFlags } from "@/lib/booking-actions";

const HEX_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='70' viewBox='0 0 60 70'>
  <path d='M30 0L60 17.5V52.5L30 70L0 52.5V17.5L30 0Z' fill='none' stroke='#22C55E' stroke-width='0.5' stroke-opacity='0.27'/>
</svg>`;
const HEX_URL = `data:image/svg+xml,${encodeURIComponent(HEX_SVG)}`;

const HEADLINE_LINES = [
  ["Fix", "Your", "Nutrient"],
  ["Deficiencies", "in"],
];

type AssessmentFlags = Awaited<ReturnType<typeof getClientAssessmentFlags>>;

export default function Hero() {
  const { isSignedIn, user } = useUser();
  const [flags, setFlags] = useState<AssessmentFlags | null>(null);

  useEffect(() => {
    if (!isSignedIn || !user?.id) {
      setFlags(null);
      return;
    }
    let cancelled = false;
    getClientAssessmentFlags(user.id)
      .then((f) => {
        if (!cancelled) setFlags(f);
      })
      .catch(() => {
        if (!cancelled) setFlags(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, user?.id]);

  const assessmentHref =
    !isSignedIn
      ? "/assessment"
      : flags?.recoveryReportReady
        ? `/report/${encodeURIComponent(flags.recoveryReportReady.report_id)}`
        : flags?.recoveryReportGenerating
          ? `/report/${encodeURIComponent(flags.recoveryReportGenerating.report_id)}`
          : flags?.hasFreeAssessment
            ? "/assessment/results"
            : "/assessment";

  const hasPaidReport =
    Boolean(flags?.recoveryReportReady) || Boolean(flags?.recoveryReportGenerating);

  const assessmentLabel =
    !isSignedIn
      ? "Start Free Health Assessment"
      : flags === null
        ? "Start Free Health Assessment"
        : hasPaidReport
          ? "Open My PDF Report"
          : flags.hasFreeAssessment
            ? "View My Free Report"
            : "Start Free Health Assessment";

  let wordIndex = 0;

  return (
    <section
      className="relative bg-[#010d06] overflow-x-hidden min-h-screen flex items-center"
      style={{
        backgroundImage: `url("${HEX_URL}")`,
        backgroundSize: "60px 70px",
        backgroundRepeat: "repeat",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#010d06]/80 to-[#010d06] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#010d06]/90 pointer-events-none" />

      <div className="relative w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-0 lg:gap-16 items-center w-full">

          {/* ── TEXT COLUMN ── */}
          <div className="flex flex-col z-10 items-center text-center lg:items-start lg:text-left">

            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase rounded-full px-4 py-1.5 mb-6"
            >
              <Sparkles size={10} className="fill-emerald-400" />
              {isSignedIn && user?.firstName
                ? `👋 WELCOME BACK, ${user.firstName.toUpperCase()}!`
                : "INDIA'S #1 PERSONALIZED NUTRITION SYSTEM"}
            </motion.span>

            <h1 className="font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.2] lg:leading-[1.05] tracking-tight mb-6 max-w-xl">
              {HEADLINE_LINES.map((lineWords, li) => (
                <span key={li} className="block">
                  {lineWords.map((word) => {
                    const delay = 0.1 + wordIndex++ * 0.08;
                    return (
                      <motion.span
                        key={word + li}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay }}
                        className="text-white inline-block mr-[0.25em]"
                      >
                        {word}
                      </motion.span>
                    );
                  })}
                </span>
              ))}
              <span className="block">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + wordIndex * 0.08 }}
                  className="text-[#00E676]"
                >
                  90 Days.
                </motion.span>
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-gray-400 text-sm sm:text-base leading-relaxed sm:leading-7 max-w-md"
            >
              Personalized{" "}
              <span className="text-white font-bold">Diet + Vitamin Plans</span>{" "}
              designed by real nutritionists — based on your unique health
              assessment, not generic templates.
            </motion.p>

            {/* ✅ DESKTOP CTA (UNCHANGED) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.72 }}
              className="hidden lg:flex flex-col gap-3 sm:flex-row sm:items-center mt-8 sm:mt-10 w-full"
            >
              <a
                href={assessmentHref}
                className="flex items-center justify-center gap-2 sm:gap-3 bg-[#00E676] text-black font-bold rounded-full px-6 sm:px-8 py-4 h-13 sm:h-14 hover:bg-[#00c864] transition-all shadow-lg shadow-emerald-500/10 w-full sm:w-auto text-sm sm:text-base"
              >
                <ClipboardList size={17} strokeWidth={2.5} />
                {assessmentLabel}
              </a>

              <a
                href={isSignedIn ? "/sessions" : "/booking"}
                className="flex items-center justify-center gap-2 border border-white/10 bg-white/5 text-white font-semibold rounded-full px-6 sm:px-8 py-4 h-13 sm:h-14 hover:bg-white/10 transition-all w-full sm:w-auto text-sm sm:text-base"
              >
                {isSignedIn ? "My Sessions" : "Book a Nutritionist"}
                <ArrowRight size={17} />
              </a>
            </motion.div>

            {/* ✅ BADGES — horizontal scroll on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="relative mt-6 w-full max-w-full lg:max-w-xl"
            >
              <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory flex-nowrap gap-2 overflow-x-auto px-4 pb-2 pr-10 lg:mx-0 lg:flex-wrap lg:justify-center lg:overflow-visible lg:px-0 lg:pb-0 lg:pr-0">
                {[
                  "Doctor-Reviewed Protocol",
                  "50,000+ Lives Transformed",
                  "Real 1-on-1 Consultations",
                ].map((text, i) => (
                  <div
                    key={i}
                    className="flex shrink-0 snap-start items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 whitespace-nowrap lg:shrink"
                  >
                    <CheckCircle2 size={12} className="text-[#00E676]" />
                    <span className="text-[11px] font-medium text-gray-300">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-end bg-gradient-to-l from-[#010d06] to-transparent lg:hidden"
                aria-hidden
              >
                <ChevronRight className="text-emerald-500/70" size={20} strokeWidth={2.5} />
              </div>
            </motion.div>
          </div>

          {/* ── IMAGE COLUMN ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative flex flex-col items-center lg:justify-end mt-10 lg:mt-0"
          >
            {/* IMAGE */}
            <div className="relative rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl w-full max-w-md lg:max-w-[500px]">
              <Image
                src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800"
                alt="Healthy nutrition bowl"
                width={600}
                height={700}
                className="object-cover w-full h-64 sm:h-80 lg:h-[450px]"
                priority
              />
            </div>

            {/* ✅ MOBILE CTA BELOW IMAGE */}
            <div className="flex flex-col gap-3 w-full max-w-md mt-6 lg:hidden">
              <a
                href={assessmentHref}
                className="flex items-center justify-center gap-2 bg-[#00E676] text-black font-bold rounded-full px-6 py-4 text-sm"
              >
                <ClipboardList size={16} />
                {assessmentLabel}
              </a>

              <a
                href={isSignedIn ? "/sessions" : "/booking"}
                className="flex items-center justify-center gap-2 border border-white/10 bg-white/5 text-white font-semibold rounded-full px-6 py-4 text-sm"
              >
                {isSignedIn ? "My Sessions" : "Book a Nutritionist"}
                <ArrowRight size={16} />
              </a>
            </div>

            {/* FLOATING CARDS (DESKTOP ONLY — UNTOUCHED) */}
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [-1, 1, -1] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -left-8 top-12 bg-[#121212]/95 border border-white/10 rounded-xl shadow-2xl p-4 hidden lg:flex items-center gap-4"
            >
              <div className="bg-red-500/20 p-2 rounded-lg">
                <Activity size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-red-500 text-[9px] font-black uppercase tracking-widest">Alert</p>
                <p className="text-white text-xs font-semibold">Oxygen transport declining</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -10, 0], rotate: [1, -1, 1] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              className="absolute -right-3 bottom-10 bg-[#121212]/95 border border-white/10 rounded-xl shadow-2xl p-4 hidden lg:flex items-center gap-4"
            >
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <Activity size={18} className="text-[#00E676]" />
              </div>
              <div>
                <p className="text-[#00E676] text-[9px] font-black uppercase tracking-widest">Plan Created</p>
                <p className="text-white text-xs font-semibold">Your personalized plan is ready</p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}