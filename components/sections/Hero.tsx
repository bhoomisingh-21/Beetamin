"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardList, ArrowRight, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { getClientAssessmentFlags } from "@/lib/booking-actions";

type AssessmentFlags = Awaited<ReturnType<typeof getClientAssessmentFlags>>;

const TICKER = ["Vitamin D", "Iron", "B12", "Omega-3"];

const NUTRIENTS = [
  { name: "Vitamin D", className: "bg-[#F3E8C8] text-[#7C4A02]" },
  { name: "Iron", className: "bg-[#F8E4E8] text-[#9F1239]" },
  { name: "B12", className: "bg-[#E4EAF4] text-[#1E3A5F]" },
  { name: "Omega-3", className: "bg-[#DCEEEA] text-[#0F766E]" },
];

const STATS = [
  { val: "50K+", label: "Indians assessed" },
  { val: "₹3,999", label: "90-day plan" },
  { val: "12 pg", label: "personalised PDF" },
  { val: "94%", label: "success rate" },
];

export default function Hero() {
  const { isSignedIn, user } = useUser();
  const [flags, setFlags] = useState<AssessmentFlags | null>(null);
  const [tick, setTick] = useState(0);
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % TICKER.length), 2200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fn = () => setStickyVisible(window.scrollY > 420);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!isSignedIn || !user?.id) return;
    let cancelled = false;
    getClientAssessmentFlags(user.id)
      .then((f) => { if (!cancelled) setFlags(f); })
      .catch(() => { if (!cancelled) setFlags(null); });
    return () => { cancelled = true; };
  }, [isSignedIn, user?.id]);

  const activeFlags = isSignedIn ? flags : null;

  const assessmentHref =
    !isSignedIn ? "/assessment"
    : activeFlags?.recoveryReportReady
      ? `/report/${encodeURIComponent(activeFlags.recoveryReportReady.report_id)}`
    : activeFlags?.recoveryReportGenerating
      ? `/report/${encodeURIComponent(activeFlags.recoveryReportGenerating.report_id)}`
    : activeFlags?.hasFreeAssessment ? "/assessment/results"
    : "/assessment";

  const hasPaidReport =
    Boolean(activeFlags?.recoveryReportReady) || Boolean(activeFlags?.recoveryReportGenerating);

  const primaryLabel =
    !isSignedIn || activeFlags === null ? "Take Your Free Assessment"
    : hasPaidReport ? "Open My PDF Report"
    : activeFlags.hasFreeAssessment ? "View My Free Report"
    : "Take Your Free Assessment";

  return (
    <>
      {/* ─── MAIN HERO ─── */}
      <section id="hero" className="relative overflow-hidden bg-white">
        <div className="relative mx-auto flex max-w-[1320px] flex-col justify-start px-5 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-12 lg:px-12 lg:py-16">

          {/* TWO-COL GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 lg:gap-14 items-center">

            {/* LEFT — text & actions */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-4 sm:mb-7"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-[#2A5340]/20 bg-[#E8EEE9] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2A5340]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#2A5340]" />
                  {isSignedIn && user?.firstName
                    ? `Welcome back, ${user.firstName}`
                    : "India's deficiency recovery platform"}
                </span>
              </motion.div>

              {/* Headline — sr-only H1 lives in HomePageSeoHead for primary keyword */}
              <motion.h2
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.08 }}
                className="font-serif font-medium leading-[1.08] tracking-tight text-[#111111]"
                style={{ fontSize: "clamp(2.35rem, 5vw, 4.35rem)" }}
              >
                Tired all day.
                <br />
                We know
                <br />
                <span className="text-[#2A5340] italic">exactly why.</span>
              </motion.h2>

              {/* Deficiency ticker */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-3 flex items-center justify-center gap-3 sm:mt-5 lg:justify-start"
              >
                <span className="text-sm font-medium text-[#333333]">
                  We find your
                </span>
                <span className="relative inline-block h-[30px] min-w-[100px] overflow-hidden rounded-full border border-[#2A5340]/20 bg-[#E8EEE9] px-3 py-1 text-sm font-medium">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={tick}
                      initial={{ y: 14, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -14, opacity: 0 }}
                      transition={{ duration: 0.28 }}
                      className="absolute inset-0 flex items-center justify-center font-serif text-[#2A5340]"
                    >
                      {TICKER[tick]}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span className="text-sm font-medium text-[#333333]">
                  gap
                </span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                className="mx-auto mt-4 max-w-[340px] text-[15px] leading-snug text-[#333333] lg:hidden"
              >
                Free 2-minute health assessment. See your nutrient gaps instantly.
              </motion.p>

              {/* Body copy — desktop keeps the original paragraph */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                className="mx-auto mt-5 hidden max-w-[420px] text-base leading-relaxed text-[#333333] lg:mx-0 lg:block"
              >
                Answer 7 questions. We pinpoint your Vitamin D, Iron, B12 and Omega-3
                gaps and deliver a{" "}
                <strong className="font-semibold text-[#1C1A16]">
                  personalised 12-page PDF
                </strong>{" "}
                with Indian foods and a{" "}
                <Link href="/personalised-meal-plan" className="text-[#2A5340] underline-offset-2 hover:underline">
                  meal plan
                </Link>{" "}
                — for just ₹39.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.42 }}
                className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start"
              >
                {NUTRIENTS.map((n) => (
                  <span
                    key={n.name}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${n.className}`}
                  >
                    {n.name}
                  </span>
                ))}
              </motion.div>

              {/* CTA — primary free assessment + highlighted ₹3,999 plan */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.46 }}
                className="mt-6 sm:mt-8 flex w-full max-w-md lg:max-w-none flex-col lg:flex-row gap-3 justify-center lg:justify-start"
              >
                <a
                  href={assessmentHref}
                  className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#2A5340] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(42,83,64,0.28)] transition hover:bg-[#1F3F30] lg:min-w-0 lg:flex-1 lg:px-7"
                >
                  <ClipboardList size={16} strokeWidth={2.2} className="shrink-0" />
                  <span>{primaryLabel}</span>
                </a>

                <a
                  href="#pricing"
                  className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[#2A5340]/25 bg-white px-6 py-3.5 text-sm font-semibold text-[#2A5340] transition hover:bg-[#E8EEE9] lg:min-w-0 lg:flex-1 lg:px-7"
                >
                  <span className="truncate">Book session</span>
                  <ArrowRight size={14} className="shrink-0" />
                </a>
              </motion.div>

              {isSignedIn ? (
                <a
                  href="/sessions"
                  className="mt-3 text-center text-xs font-medium text-[#333333] hover:text-black lg:text-left"
                >
                  My Sessions →
                </a>
              ) : null}

              {/* MOBILE IMAGE — below the CTA so the first viewport is the assessment action */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.52 }}
                className="relative mt-7 w-full overflow-hidden rounded-2xl lg:hidden"
              >
                <Image
                  src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800"
                  alt="Indian thali with dal, vegetables and roti — personalised meal plan for nutrient deficiency recovery"
                  width={800}
                  height={500}
                  className="h-[200px] w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1A2E24]/75 to-transparent px-4 pb-3 pt-10">
                  <p className="font-serif text-sm italic text-white">Personalised Indian plates</p>
                </div>
              </motion.div>

              {/* Referral */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.64 }}
                className="mt-4 text-center lg:text-left"
              >
                <Link
                  href="/dashboard/referral"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#2A5340]/20 bg-[#E8EEE9] px-4 py-2 text-xs font-medium text-[#2A5340] transition-colors hover:bg-[#DCE6E0] sm:text-sm"
                >
                  🎁 Refer friends — earn ₹300 per booking
                </Link>
              </motion.div>
            </div>

            {/* RIGHT — image + floating cards */}
            <div className="relative hidden lg:flex flex-col items-center justify-center">
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2A5340]/[0.08]"
                aria-hidden
              />

              {/* Stat pills — right edge */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute -right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3"
              >
                {STATS.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className="flex flex-col rounded-xl border border-[#E6E1D6] border-l-4 border-l-[#2A5340] bg-white px-4 py-3 shadow-[0_10px_28px_rgba(28,26,22,0.1)]"
                  >
                    <span className="font-serif text-xl font-medium text-[#2A5340]">
                      {s.val}
                    </span>
                    <span className="mt-1 text-[10px] font-medium leading-tight text-[#4A4A4A]">
                      {s.label}
                    </span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Main image */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative mx-auto mr-16 w-full max-w-[440px]"
              >
                <div className="relative overflow-hidden rounded-[2.5rem] shadow-[0_28px_70px_rgba(42,83,64,0.18)]">
                  <Image
                    src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800"
                    alt="Indian thali with dal, vegetables and roti — personalised meal plan for nutrient deficiency recovery"
                    width={600}
                    height={700}
                    className="w-full object-cover"
                    style={{ height: 520 }}
                    priority
                  />
                  <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#1A2E24]/80 to-transparent px-6 pb-6 pt-16">
                    <p className="font-serif text-lg italic text-white">Personalised Indian plates</p>
                    <p className="mt-1 text-xs font-medium text-white/80">Built around your Vitamin D, Iron, B12 and Omega-3 gaps</p>
                  </div>
                </div>

                {/* Floating alert card */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -left-14 top-10 z-30 flex min-w-[210px] items-center gap-3 rounded-2xl border border-[#E4DFD4] bg-white px-4 py-3 shadow-[0_12px_32px_rgba(28,26,22,0.14)]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F3E8E4]">
                    <Activity size={16} className="text-[#8A4A3C]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8A4A3C]">
                      Deficiency Alert
                    </p>
                    <p className="text-xs font-medium leading-tight text-[#1C1A16]">
                      Iron &amp; B12 levels low
                    </p>
                  </div>
                </motion.div>

                {/* Floating success card */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1.5, ease: "easeInOut" }}
                  className="absolute -right-10 bottom-20 z-30 flex min-w-[220px] items-center gap-3 rounded-2xl border border-[#E4DFD4] bg-white px-4 py-3 shadow-[0_12px_32px_rgba(28,26,22,0.14)]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E8EEE9]">
                    <Activity size={16} className="text-[#2A5340]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#2A5340]">
                      PDF Ready
                    </p>
                    <p className="text-xs font-medium leading-tight text-[#1C1A16]">
                      Your personalised plan is here
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </div>

          </div>
        </div>

      </section>

      {/* ─── MOBILE STICKY CTA ─── */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-[#E8E4DC] bg-white/95 px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-md transition-transform duration-300 lg:hidden ${
          stickyVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <a
          href={assessmentHref}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#2A5340] py-3.5 text-sm font-semibold text-white"
        >
          <ClipboardList size={15} strokeWidth={2.8} />
          {primaryLabel}
        </a>
      </div>
    </>
  );
}
