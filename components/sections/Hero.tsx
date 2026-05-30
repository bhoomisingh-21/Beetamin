"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { ClipboardList, ArrowRight, Activity, Zap, Shield, ChevronRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { getClientAssessmentFlags } from "@/lib/booking-actions";

type AssessmentFlags = Awaited<ReturnType<typeof getClientAssessmentFlags>>;

const DEFICIENCIES = ["Vitamin D", "Iron", "B12", "Omega-3"];

const STAT_PILLS = [
  { value: "50K+", label: "Indians assessed" },
  { value: "₹39", label: "to start" },
  { value: "12 pg", label: "personalised PDF" },
];

export default function Hero() {
  const { isSignedIn, user } = useUser();
  const [flags, setFlags] = useState<AssessmentFlags | null>(null);
  const [activeDeficiency, setActiveDeficiency] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDeficiency((prev) => (prev + 1) % DEFICIENCIES.length);
    }, 2000);
    return () => clearInterval(timer);
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
    : flags?.recoveryReportReady ? `/report/${encodeURIComponent(flags.recoveryReportReady.report_id)}`
    : flags?.recoveryReportGenerating ? `/report/${encodeURIComponent(flags.recoveryReportGenerating.report_id)}`
    : flags?.hasFreeAssessment ? "/assessment/results"
    : "/assessment";

  const hasPaidReport = Boolean(flags?.recoveryReportReady) || Boolean(flags?.recoveryReportGenerating);

  const assessmentLabel =
    !isSignedIn || flags === null ? "Start Free Assessment"
    : hasPaidReport ? "Open My PDF Report"
    : flags.hasFreeAssessment ? "View My Free Report"
    : "Start Free Assessment";

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#050f07] min-h-screen flex items-center overflow-hidden"
    >
      {/* ── ARCHITECTURAL GRID LINES ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* Vertical lines */}
        {[20, 50, 80].map((pct) => (
          <div
            key={pct}
            className="absolute top-0 bottom-0 w-px"
            style={{ left: `${pct}%`, background: "rgba(255,255,255,0.03)" }}
          />
        ))}
        {/* Horizontal lines */}
        {[25, 50, 75].map((pct) => (
          <div
            key={pct}
            className="absolute left-0 right-0 h-px"
            style={{ top: `${pct}%`, background: "rgba(255,255,255,0.03)" }}
          />
        ))}
        {/* Top accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(0,230,118,0.4), transparent)" }}
        />
        {/* Large ambient circle */}
        <div
          className="absolute rounded-full"
          style={{
            width: 900,
            height: 900,
            top: "50%",
            left: "55%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(0,230,118,0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-16 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-screen lg:min-h-0 items-center">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col justify-center py-20 lg:py-24 z-10 lg:pr-12">

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3 mb-8"
            >
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-[0.18em] uppercase"
                style={{
                  background: "rgba(0,230,118,0.08)",
                  border: "1px solid rgba(0,230,118,0.2)",
                  color: "#00E676",
                }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "#00E676" }}
                />
                {isSignedIn && user?.firstName
                  ? `Welcome back, ${user.firstName}`
                  : "India's deficiency recovery platform"}
              </div>
            </motion.div>

            {/* Headline */}
            <div className="mb-6 overflow-hidden">
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="font-black tracking-tight leading-[0.95]"
                style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)" }}
              >
                <span className="block text-white">You're eating</span>
                <span className="block text-white">right. Still</span>
                <span
                  className="block"
                  style={{ color: "#00E676" }}
                >
                  exhausted?
                </span>
              </motion.h1>
            </div>

            {/* Animated deficiency ticker */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center gap-3 mb-8"
            >
              <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
                We find your
              </span>
              <div
                className="relative overflow-hidden rounded-lg px-3 py-1.5"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  minWidth: 110,
                  height: 32,
                }}
              >
                {DEFICIENCIES.map((d, i) => (
                  <motion.span
                    key={d}
                    animate={{
                      y: i === activeDeficiency ? 0 : i < activeDeficiency ? -32 : 32,
                      opacity: i === activeDeficiency ? 1 : 0,
                    }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center text-sm font-bold"
                    style={{ color: "#00E676" }}
                  >
                    {d}
                  </motion.span>
                ))}
              </div>
              <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
                gap
              </span>
            </motion.div>

            {/* Body copy */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-base leading-relaxed max-w-sm mb-10"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Answer 7 questions. We identify your exact Vitamin D, Iron, B12 and Omega-3
              gaps and deliver a{" "}
              <span className="font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                personalised 12-page PDF
              </span>{" "}
              with Indian foods and a meal plan — for just ₹39.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 mb-8"
            >
              <a
                href={assessmentHref}
                className="group flex items-center justify-center gap-2.5 font-bold rounded-2xl px-7 py-4 text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "#00E676",
                  color: "#050f07",
                  boxShadow: "0 0 0 0 rgba(0,230,118,0.4)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                    "0 0 32px 0 rgba(0,230,118,0.25)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                    "0 0 0 0 rgba(0,230,118,0.4)";
                }}
              >
                <ClipboardList size={16} strokeWidth={2.5} />
                {assessmentLabel}
              </a>

              {isSignedIn ? (
                <a
                  href="/sessions"
                  className="flex items-center justify-center gap-2 font-semibold rounded-2xl px-7 py-4 text-sm transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  My Sessions
                  <ArrowRight size={15} />
                </a>
              ) : (
                <a
                  href="/assessment"
                  className="flex items-center justify-center gap-2 font-semibold rounded-2xl px-7 py-4 text-sm transition-all duration-200"
                  style={{
                    background: "rgba(0,230,118,0.06)",
                    border: "1px solid rgba(0,230,118,0.2)",
                    color: "rgba(0,230,118,0.85)",
                  }}
                >
                  Get PDF Report — ₹39
                  <ArrowRight size={15} />
                </a>
              )}
            </motion.div>

            {/* Trust row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-3"
            >
              {[
                { icon: <Shield size={13} />, text: "Free assessment — no card" },
                { icon: <Zap size={13} />, text: "₹39 PDF — instant delivery" },
                { icon: <Activity size={13} />, text: "Doctor-reviewed protocol" },
              ].map(({ icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-2 text-xs font-medium"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  <span style={{ color: "#00E676" }}>{icon}</span>
                  {text}
                </div>
              ))}
            </motion.div>

            {/* Referral */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.78 }}
              className="mt-6"
            >
              <Link
                href="/dashboard/referral"
                className="inline-flex items-center gap-1.5 text-xs transition-colors"
                style={{ color: "rgba(0,230,118,0.6)" }}
              >
                <span>🎁</span>
                <span className="underline underline-offset-2">
                  Refer friends — earn ₹300 per booking
                </span>
                <ChevronRight size={12} />
              </Link>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="relative hidden lg:flex flex-col items-center justify-center min-h-screen">

            {/* Stat pills — left side */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
              {STAT_PILLS.map(({ value, label }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex flex-col rounded-xl px-4 py-3"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <span className="text-xl font-black" style={{ color: "#00E676" }}>
                    {value}
                  </span>
                  <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {label}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Image */}
            <motion.div
              style={{ y: imageY }}
              className="relative w-full max-w-[440px] mx-auto"
            >
              {/* Outer frame */}
              <div
                className="relative rounded-[2.5rem] overflow-hidden"
                style={{
                  border: "1px solid rgba(0,230,118,0.12)",
                  boxShadow: "0 0 80px rgba(0,230,118,0.06), inset 0 0 0 1px rgba(255,255,255,0.04)",
                }}
              >
                {/* Tinted overlay on image */}
                <div
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(5,15,7,0.1) 0%, rgba(5,15,7,0.5) 100%)",
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

                {/* Bottom label inside image */}
                <div
                  className="absolute bottom-0 left-0 right-0 z-20 px-6 py-5"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(5,15,7,0.96) 0%, transparent 100%)",
                  }}
                >
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-1"
                    style={{ color: "#00E676" }}
                  >
                    Built for India
                  </p>
                  <p className="text-sm font-medium text-white">
                    Dals, millets, greens & local foods — not Western templates
                  </p>
                </div>
              </div>

              {/* Floating alert card — top left */}
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

              {/* Floating success card — bottom right */}
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

      {/* ── MOBILE CTA BAR — sticky on scroll ── */}
      <MobileStickyBar assessmentHref={assessmentHref} assessmentLabel={assessmentLabel} />
    </section>
  );
}

function MobileStickyBar({
  assessmentHref,
  assessmentLabel,
}: {
  assessmentHref: string;
  assessmentLabel: string;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{
        background: "rgba(5,15,7,0.97)",
        borderTop: "1px solid rgba(0,230,118,0.15)",
        padding: "12px 16px",
        paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
      }}
    >
      <a
        href={assessmentHref}
        className="flex items-center justify-center gap-2 w-full font-bold rounded-2xl py-4 text-sm"
        style={{ background: "#00E676", color: "#050f07" }}
      >
        <ClipboardList size={16} strokeWidth={2.5} />
        {assessmentLabel}
      </a>
    </div>
  );
}