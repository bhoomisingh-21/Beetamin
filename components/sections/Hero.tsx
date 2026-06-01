"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ClipboardList, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { getClientAssessmentFlags } from "@/lib/booking-actions";
import { FullPlanBookingLink } from "@/components/payment/FullPlanBookingLink";
import { PaymentTrustBlock } from "@/components/sections/PaymentTrustBlock";

type AssessmentFlags = Awaited<ReturnType<typeof getClientAssessmentFlags>>;

const TICKER = ["Vitamin D", "Iron", "B12", "Omega-3"];

const BOOKING_SIGN_UP = "/sign-up?redirect_after_auth=%2Fbooking";

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
    if (!isSignedIn || !user?.id) { setFlags(null); return; }
    let cancelled = false;
    getClientAssessmentFlags(user.id)
      .then((f) => { if (!cancelled) setFlags(f); })
      .catch(() => { if (!cancelled) setFlags(null); });
    return () => { cancelled = true; };
  }, [isSignedIn, user?.id]);

  const assessmentHref =
    !isSignedIn ? "/assessment"
    : flags?.recoveryReportReady
      ? `/report/${encodeURIComponent(flags.recoveryReportReady.report_id)}`
    : flags?.recoveryReportGenerating
      ? `/report/${encodeURIComponent(flags.recoveryReportGenerating.report_id)}`
    : flags?.hasFreeAssessment ? "/assessment/results"
    : "/assessment";

  const hasPaidReport =
    Boolean(flags?.recoveryReportReady) || Boolean(flags?.recoveryReportGenerating);

  const primaryLabel =
    !isSignedIn || flags === null ? "Start Free Assessment"
    : hasPaidReport ? "Open My PDF Report"
    : flags.hasFreeAssessment ? "View My Free Report"
    : "Start Free Assessment";

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

        <div className="relative mx-auto max-w-[1320px] px-6 lg:px-12 min-h-screen flex flex-col justify-center pt-24 pb-16 lg:py-0">

          {/* TWO-COL GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 lg:gap-14 items-center">

            {/* LEFT — text & actions */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-7"
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

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.08 }}
                className="font-black leading-[0.96] tracking-tight text-white"
                style={{ fontSize: "clamp(3.2rem, 5.5vw, 5.2rem)" }}
              >
                Tired all day.
                <br />
                We know
                <br />
                <span style={{ color: "#00E676" }}>exactly why.</span>
              </motion.h1>

              {/* Deficiency ticker */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-5 flex items-center justify-center lg:justify-start gap-3"
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

              {/* Body copy */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                className="mt-5 text-[15px] leading-relaxed max-w-[420px] mx-auto lg:mx-0"
                style={{ color: "rgba(255,255,255,0.48)" }}
              >
                Answer 7 questions. We pinpoint your Vitamin D, Iron, B12 and Omega-3
                gaps and deliver a{" "}
                <strong style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>
                  personalised 12-page PDF
                </strong>{" "}
                with Indian foods and a meal plan — for just ₹39.
              </motion.p>

              {/* MOBILE IMAGE — shown only on small screens */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.44 }}
                className="lg:hidden mt-7 relative rounded-2xl overflow-hidden w-full"
                style={{ border: "1px solid rgba(0,230,118,0.14)" }}
              >
                <Image
                  src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800"
                  alt="Personalised Indian nutrition bowl"
                  width={800}
                  height={500}
                  className="w-full object-cover"
                  style={{ height: 260 }}
                  priority
                />
              </motion.div>

              {/* CTA row */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.46 }}
                className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start"
              >
                <a
                  href={assessmentHref}
                  className="inline-flex items-center gap-2.5 font-black rounded-2xl px-7 py-4 text-sm transition-all duration-200 active:scale-[0.97]"
                  style={{
                    background: "#00E676",
                    color: "#030a04",
                    boxShadow: "0 0 24px rgba(0,230,118,0.2)",
                  }}
                >
                  <ClipboardList size={15} strokeWidth={2.8} />
                  {primaryLabel}
                </a>

                {isSignedIn ? (
                  <FullPlanBookingLink className="inline-flex items-center gap-2 font-bold rounded-2xl px-7 py-4 text-sm transition-all duration-200 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15">
                    Book ₹3,999 Session <ArrowRight size={14} />
                  </FullPlanBookingLink>
                ) : (
                  <a
                    href={BOOKING_SIGN_UP}
                    className="inline-flex items-center gap-2 font-bold rounded-2xl px-7 py-4 text-sm transition-all duration-200"
                    style={{
                      background: "rgba(0,230,118,0.07)",
                      border: "1px solid rgba(0,230,118,0.18)",
                      color: "rgba(0,230,118,0.85)",
                    }}
                  >
                    Book ₹3,999 Session <ArrowRight size={14} />
                  </a>
                )}
              </motion.div>

              <PaymentTrustBlock variant="dark" className="mt-6 max-w-lg" />
            </div>

            {/* RIGHT — hero image */}
            <div className="relative hidden lg:flex flex-col items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative w-full max-w-[440px] mx-auto"
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
                    alt="Personalised Indian nutrition bowl"
                    width={600}
                    height={700}
                    className="object-cover w-full"
                    style={{ height: 520 }}
                    priority
                  />
                </div>
              </motion.div>
            </div>

          </div>
        </div>

        <style>{`
          @keyframes beetPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
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
