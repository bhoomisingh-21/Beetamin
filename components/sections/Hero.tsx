"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ClipboardList, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { getClientAssessmentFlags } from "@/lib/booking-actions";

type AssessmentFlags = Awaited<ReturnType<typeof getClientAssessmentFlags>>;

export default function Hero() {
  const { isSignedIn, user } = useUser();
  const [flags, setFlags] = useState<AssessmentFlags | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const fn = () => setStickyVisible(window.scrollY > 420);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

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
    Boolean(flags?.recoveryReportReady) ||
    Boolean(flags?.recoveryReportGenerating);

  const primaryLabel =
    !isSignedIn || flags === null
      ? "Start Free Assessment"
      : hasPaidReport
        ? "Open My PDF Report"
        : flags.hasFreeAssessment
          ? "View My Free Report"
          : "Start Free Assessment";

  const secondaryHref = isSignedIn ? "/sessions" : "/booking";
  const secondaryLabel = isSignedIn ? "My Sessions" : "90-Day Plan — ₹3,999";

  return (
    <>
      <section className="relative bg-[#030a04] min-h-[90vh] lg:min-h-screen overflow-hidden">
        <div
          className="pointer-events-none absolute"
          style={{
            top: "-10%",
            left: "-5%",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,230,118,0.055) 0%, transparent 65%)",
          }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-[1320px] px-6 lg:px-12 min-h-[90vh] lg:min-h-screen flex flex-col justify-center pt-24 pb-20 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black tracking-[0.18em] uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
              >
                {isSignedIn && user?.firstName
                  ? `Welcome back, ${user.firstName}`
                  : "India's deficiency recovery platform"}
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.08 }}
                className="font-black leading-[1.02] tracking-tight text-white"
                style={{ fontSize: "clamp(2.75rem, 5vw, 4.75rem)" }}
              >
                Tired all day.
                <br />
                <span className="text-[#00E676]">We know exactly why.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="mt-5 text-base sm:text-lg leading-relaxed max-w-[440px] text-white/55"
              >
                7 quick questions. We map your Vitamin D, Iron, B12 and Omega-3
                gaps — then guide you with Indian foods, expert sessions, and a
                90-day recovery plan.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.36 }}
                className="lg:hidden mt-8 w-full relative rounded-2xl overflow-hidden border border-emerald-500/15"
              >
                <Image
                  src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800"
                  alt="Personalised Indian nutrition bowl"
                  width={800}
                  height={480}
                  className="w-full object-cover aspect-[16/10]"
                  priority
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.44 }}
                className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center lg:justify-start"
              >
                <a
                  href={assessmentHref}
                  className="inline-flex items-center justify-center gap-2.5 font-black rounded-2xl px-7 py-4 text-sm bg-[#00E676] text-[#030a04] shadow-[0_0_24px_rgba(0,230,118,0.2)] transition-transform active:scale-[0.97]"
                >
                  <ClipboardList size={15} strokeWidth={2.8} />
                  {primaryLabel}
                </a>
                <a
                  href={secondaryHref}
                  className="inline-flex items-center justify-center gap-2 font-bold rounded-2xl px-7 py-4 text-sm border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition-colors"
                >
                  {secondaryLabel}
                  <ArrowRight size={14} />
                </a>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.52 }}
                className="mt-5 text-xs text-white/40"
              >
                Free assessment · No card required · Doctor-reviewed
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block w-full max-w-[480px] mx-auto lg:ml-auto"
            >
              <div className="relative rounded-[2rem] overflow-hidden border border-emerald-500/15 shadow-[0_0_80px_rgba(0,230,118,0.06)]">
                <Image
                  src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800"
                  alt="Personalised Indian nutrition bowl"
                  width={600}
                  height={640}
                  className="object-cover w-full aspect-[5/6]"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

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
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black bg-[#00E676] text-[#030a04]"
        >
          <ClipboardList size={15} strokeWidth={2.8} />
          {primaryLabel}
        </a>
      </div>
    </>
  );
}
