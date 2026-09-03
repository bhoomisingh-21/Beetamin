"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardList, ArrowRight, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { getClientAssessmentFlags } from "@/lib/booking-actions";

const BOOKING_SIGN_UP = "/sign-up?redirect_after_auth=%2Fbooking%2Fcheckout";

type AssessmentFlags = Awaited<ReturnType<typeof getClientAssessmentFlags>>;

const TICKER = ["Vitamin D", "Iron", "B12", "Omega-3"];

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
  const [ctaInteracted, setCtaInteracted] = useState(false);

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
      <section className="relative bg-[#030a04] min-h-screen overflow-hidden">

        {/* Radial glow */}
        <div
          className="pointer-events-none absolute"
          style={{
            top: "-10%",
            left: "-5%",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,230,118,0.055) 0%, transparent 65%)",
          }}
          aria-hidden
        />

        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(0,230,118,0.35) 40%, rgba(0,230,118,0.35) 60%, transparent)",
          }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-[1320px] px-5 sm:px-6 lg:px-12 min-h-[100dvh] lg:min-h-screen flex flex-col justify-center pt-[5.5rem] pb-10 sm:pt-24 sm:pb-16 lg:py-0">

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
                <span
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black tracking-[0.18em] uppercase"
                  style={{
                    background: "rgba(0,230,118,0.07)",
                    border: "1px solid rgba(0,230,118,0.18)",
                    color: "#00E676",
                  }}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{
                      background: "#00E676",
                      boxShadow: "0 0 6px #00E676",
                      animation: "beetPulse 2s ease-in-out infinite",
                    }}
                  />
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
                className="font-black leading-[0.96] tracking-tight text-white"
                style={{ fontSize: "clamp(2.35rem, 5.5vw, 5.2rem)" }}
              >
                Tired all day.
                <br />
                We know
                <br />
                <span style={{ color: "#00E676" }}>exactly why.</span>
              </motion.h2>

              {/* Deficiency ticker */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-3 sm:mt-5 flex items-center justify-center lg:justify-start gap-3"
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.38)" }}
                >
                  We find your
                </span>
                <span
                  className="relative inline-block rounded-lg px-3 py-1 text-sm font-black overflow-hidden"
                  style={{
                    background: "rgba(0,230,118,0.1)",
                    border: "1px solid rgba(0,230,118,0.22)",
                    minWidth: 100,
                    height: 30,
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={tick}
                      initial={{ y: 14, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -14, opacity: 0 }}
                      transition={{ duration: 0.28 }}
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ color: "#00E676" }}
                    >
                      {TICKER[tick]}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.38)" }}
                >
                  gap
                </span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                className="lg:hidden mt-4 text-sm leading-snug max-w-[340px] mx-auto"
                style={{ color: "rgba(255,255,255,0.52)" }}
              >
                Free 2-minute health assessment. See your nutrient gaps instantly.
              </motion.p>

              {/* Body copy — desktop keeps the original paragraph */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                className="hidden lg:block mt-5 text-[15px] leading-relaxed max-w-[420px] mx-auto lg:mx-0"
                style={{ color: "rgba(255,255,255,0.48)" }}
              >
                Answer 7 questions. We pinpoint your Vitamin D, Iron, B12 and Omega-3
                gaps and deliver a{" "}
                <strong style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>
                  personalised 12-page PDF
                </strong>{" "}
                with Indian foods and a{" "}
                <Link href="/personalised-meal-plan" className="text-emerald-400/90 underline-offset-2 hover:underline">
                  meal plan
                </Link>{" "}
                — for just ₹39.
              </motion.p>

              {/* CTA — mobile: full-width primary first; desktop: original side-by-side row */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.46 }}
                className="mt-6 sm:mt-8 flex w-full max-w-md lg:max-w-none flex-col lg:flex-row gap-3 justify-center lg:justify-start"
              >
                <a
                  href={assessmentHref}
                  onClick={() => setCtaInteracted(true)}
                  className={`inline-flex w-full lg:flex-1 lg:min-w-0 items-center justify-center gap-2 font-black rounded-2xl px-5 lg:px-7 py-4 text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97] ${
                    ctaInteracted ? "" : "hero-cta-attention lg:animate-none"
                  }`}
                  style={{
                    background: "#00E676",
                    color: "#030a04",
                    boxShadow: "0 0 24px rgba(0,230,118,0.28)",
                  }}
                >
                  <ClipboardList size={16} strokeWidth={2.8} className="shrink-0" />
                  <span>{primaryLabel}</span>
                </a>

                {isSignedIn ? (
                  <a
                    href="/sessions"
                    className="hidden lg:inline-flex flex-1 min-w-0 items-center justify-center gap-2 font-bold rounded-2xl px-7 py-4 text-sm whitespace-nowrap transition-all duration-200 border border-white/10 bg-white/5 text-white/72"
                  >
                    <span className="truncate">My Sessions</span>
                    <ArrowRight size={14} className="shrink-0" />
                  </a>
                ) : (
                  <a
                    href={BOOKING_SIGN_UP}
                    className="hidden lg:inline-flex flex-1 min-w-0 items-center justify-center gap-2 font-bold rounded-2xl px-7 py-4 text-sm whitespace-nowrap transition-all duration-200 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/15"
                  >
                    <span className="truncate">Book ₹3,999 Consultation</span>
                    <ArrowRight size={14} className="shrink-0" />
                  </a>
                )}

                {!isSignedIn ? (
                  <a
                    href={BOOKING_SIGN_UP}
                    className="lg:hidden text-center text-xs font-semibold text-emerald-400/80 hover:text-emerald-300"
                  >
                    Or book a ₹3,999 consultation →
                  </a>
                ) : (
                  <a
                    href="/sessions"
                    className="lg:hidden text-center text-xs font-semibold text-white/55 hover:text-white/80"
                  >
                    My Sessions →
                  </a>
                )}
              </motion.div>

              {/* MOBILE IMAGE — below the CTA so the first viewport is the assessment action */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.52 }}
                className="lg:hidden mt-7 relative rounded-2xl overflow-hidden w-full"
                style={{ border: "1px solid rgba(0,230,118,0.14)" }}
              >
                <Image
                  src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800"
                  alt="Indian thali with dal, vegetables and roti — personalised meal plan for nutrient deficiency recovery"
                  width={800}
                  height={500}
                  className="w-full object-cover h-[200px]"
                />
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
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-300 hover:text-emerald-200 transition-colors"
                  style={{
                    background: "rgba(0,230,118,0.12)",
                    border: "1px solid rgba(0,230,118,0.35)",
                  }}
                >
                  🎁 Refer friends — earn ₹300 per booking
                </Link>
              </motion.div>
            </div>

            {/* RIGHT — image + floating cards */}
            <div className="relative hidden lg:flex flex-col items-center justify-center">

              {/* Stat pills — right edge */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute -right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20"
              >
                {STATS.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className="flex flex-col rounded-xl px-4 py-3"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <span
                      className="text-xl font-black"
                      style={{ color: "#00E676" }}
                    >
                      {s.val}
                    </span>
                    <span
                      className="mt-1 text-[10px] font-medium leading-tight"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
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
                className="relative w-full max-w-[440px] mx-auto mr-16"
              >
                <div
                  className="relative rounded-[2.5rem] overflow-hidden"
                  style={{
                    border: "1px solid rgba(0,230,118,0.12)",
                    boxShadow: "0 0 80px rgba(0,230,118,0.06), inset 0 0 0 1px rgba(255,255,255,0.04)",
                  }}
                >
                  <div
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(3,10,4,0.08) 0%, rgba(3,10,4,0.5) 100%)",
                    }}
                  />
                  <Image
                    src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800"
                    alt="Indian thali with dal, vegetables and roti — personalised meal plan for nutrient deficiency recovery"
                    width={600}
                    height={700}
                    className="object-cover w-full"
                    style={{ height: 520 }}
                    priority
                  />
                </div>

                {/* Floating alert card */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -left-14 top-10 flex items-center gap-3 rounded-2xl px-4 py-3 z-30"
                  style={{
                    background: "rgba(10,10,12,0.92)",
                    border: "1px solid rgba(255,80,80,0.25)",
                    backdropFilter: "blur(16px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    minWidth: 210,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(255,80,80,0.15)" }}
                  >
                    <Activity size={16} style={{ color: "#ff5050" }} />
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-black uppercase tracking-widest"
                      style={{ color: "#ff5050" }}
                    >
                      Deficiency Alert
                    </p>
                    <p className="text-xs font-semibold text-white leading-tight">
                      Iron &amp; B12 levels low
                    </p>
                  </div>
                </motion.div>

                {/* Floating success card */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1.5, ease: "easeInOut" }}
                  className="absolute -right-10 bottom-20 flex items-center gap-3 rounded-2xl px-4 py-3 z-30"
                  style={{
                    background: "rgba(10,10,12,0.92)",
                    border: "1px solid rgba(0,230,118,0.25)",
                    backdropFilter: "blur(16px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    minWidth: 220,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(0,230,118,0.12)" }}
                  >
                    <Activity size={16} style={{ color: "#00E676" }} />
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-black uppercase tracking-widest"
                      style={{ color: "#00E676" }}
                    >
                      PDF Ready
                    </p>
                    <p className="text-xs font-semibold text-white leading-tight">
                      Your personalised plan is here
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </div>

          </div>
        </div>

        <style>{`
          @keyframes beetPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          @keyframes heroCtaAttention {
            0%, 100% { transform: translateY(0) rotate(0deg); box-shadow: 0 0 22px rgba(0,230,118,0.22); }
            40% { transform: translateY(-2px) rotate(-0.6deg); box-shadow: 0 0 32px rgba(0,230,118,0.38); }
            70% { transform: translateY(-1px) rotate(0.6deg); box-shadow: 0 0 28px rgba(0,230,118,0.3); }
          }
          .hero-cta-attention {
            animation: heroCtaAttention 2.8s ease-in-out infinite;
          }
          @media (min-width: 1024px) {
            .hero-cta-attention { animation: none; }
          }
          @media (prefers-reduced-motion: reduce) {
            .hero-cta-attention { animation: none; }
          }
        `}</style>
      </section>

      {/* ─── MOBILE STICKY CTA ─── */}
      <div
        className={`lg:hidden fixed bottom-0 inset-x-0 z-50 transition-transform duration-300 ${
          stickyVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          background: "rgba(3,10,4,0.97)",
          borderTop: "1px solid rgba(0,230,118,0.14)",
          padding: "12px 16px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
        }}
      >
        <a
          href={assessmentHref}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black"
          style={{ background: "#00E676", color: "#030a04" }}
        >
          <ClipboardList size={15} strokeWidth={2.8} />
          {primaryLabel}
        </a>
      </div>
    </>
  );
}
