"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Zap, FileText, Star } from "lucide-react";
import Link from "next/link";

const FEATURES = [
  "Top 4 deficiencies in India — Vitamin D, Iron, B12, Omega-3",
  "Exact symptoms to watch for each deficiency",
  "Best Indian foods to fix each gap — dals, greens, millets & more",
  "A 7-day starter meal plan using Indian ingredients",
];

const PAGES = [
  { label: "Vitamin D", color: "#facc15", bg: "rgba(250,204,21,0.12)", bar: 72 },
  { label: "Iron", color: "#f87171", bg: "rgba(248,113,113,0.12)", bar: 88 },
  { label: "B12", color: "#60a5fa", bg: "rgba(96,165,250,0.12)", bar: 55 },
  { label: "Omega-3", color: "#34d399", bg: "rgba(52,211,153,0.12)", bar: 64 },
];

export default function LeadMagnet() {
  return (
    <section
      className="relative overflow-hidden py-24 lg:py-32"
      style={{ background: "#040d05" }}
    >
      {/* ── DECORATIVE ── */}
      {/* Top separator */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0,230,118,0.15) 40%, rgba(0,230,118,0.15) 60%, transparent)",
        }}
        aria-hidden
      />
      {/* Ambient glow top-right */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -120,
          right: -80,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,230,118,0.05) 0%, transparent 65%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1320px] px-6 lg:px-12">

        {/* ── SECTION LABEL ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 flex items-center gap-4"
        >
          <div
            className="h-px w-8"
            style={{ background: "rgba(0,230,118,0.3)" }}
          />
          <span
            className="text-[10px] font-black uppercase tracking-[0.22em]"
            style={{ color: "rgba(0,230,118,0.55)" }}
          >
            Personalised PDF Report
          </span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-start">

          {/* ══════════════════════════════
              LEFT — PDF CARD MOCKUP
          ══════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="flex flex-col items-center lg:items-start"
          >
            {/* Outer glow wrapper */}
            <div
              className="relative w-full max-w-sm"
              style={{ filter: "drop-shadow(0 0 40px rgba(0,230,118,0.07))" }}
            >
              {/* Stacked depth cards */}
              <div
                className="absolute inset-0 rounded-[28px]"
                style={{
                  transform: "translate(8px, 8px) rotate(1.5deg)",
                  background: "#071509",
                  border: "1px solid rgba(0,230,118,0.07)",
                }}
              />
              <div
                className="absolute inset-0 rounded-[28px]"
                style={{
                  transform: "translate(4px, 4px) rotate(0.7deg)",
                  background: "#091b0a",
                  border: "1px solid rgba(0,230,118,0.1)",
                }}
              />

              {/* ── MAIN CARD ── */}
              <div
                className="relative rounded-[28px] overflow-hidden"
                style={{
                  background: "#0b1e0d",
                  border: "1px solid rgba(0,230,118,0.18)",
                }}
              >
                {/* Fake window chrome */}
                <div
                  className="flex items-center justify-between px-5 py-3.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="flex items-center gap-1.5">
                    {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
                      <span
                        key={i}
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ background: c, opacity: 0.6 }}
                      />
                    ))}
                  </div>
                  <div
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <FileText size={11} style={{ color: "rgba(0,230,118,0.5)" }} />
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      DeficiencyReport.pdf
                    </span>
                  </div>
                </div>

                {/* Card content */}
                <div className="px-6 py-7">

                  {/* Header row */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p
                        className="text-[9px] font-black uppercase tracking-[0.2em] mb-1.5"
                        style={{ color: "rgba(0,230,118,0.5)" }}
                      >
                        Personalised for Bhoomi
                      </p>
                      <h3
                        className="text-xl font-black leading-tight text-white"
                      >
                        Deficiency Recovery<br />
                        <span style={{ color: "#00E676" }}>Starter Guide</span>
                      </h3>
                    </div>
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-2xl shrink-0"
                      style={{
                        background: "rgba(0,230,118,0.1)",
                        border: "1px solid rgba(0,230,118,0.2)",
                      }}
                    >
                      <Star size={16} style={{ color: "#00E676" }} />
                    </div>
                  </div>

                  {/* Deficiency bars — this is what makes it feel like a real report */}
                  <div className="space-y-3 mb-6">
                    <p
                      className="text-[9px] font-black uppercase tracking-[0.15em] mb-3"
                      style={{ color: "rgba(255,255,255,0.2)" }}
                    >
                      Your deficiency profile
                    </p>
                    {PAGES.map(({ label, color, bg, bar }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: color }}
                            />
                            <span
                              className="text-xs font-semibold"
                              style={{ color: "rgba(255,255,255,0.6)" }}
                            >
                              {label}
                            </span>
                          </div>
                          <span
                            className="text-[10px] font-black"
                            style={{ color }}
                          >
                            {bar}% gap
                          </span>
                        </div>
                        <div
                          className="w-full rounded-full h-1.5"
                          style={{ background: "rgba(255,255,255,0.05)" }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${bar}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ background: color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer row */}
                  <div
                    className="flex items-center justify-between rounded-2xl px-4 py-3"
                    style={{
                      background: "rgba(0,230,118,0.06)",
                      border: "1px solid rgba(0,230,118,0.12)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Zap size={13} style={{ color: "#00E676" }} />
                      <span
                        className="text-xs font-bold"
                        style={{ color: "rgba(0,230,118,0.8)" }}
                      >
                        7-day Indian meal plan included
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      12 pages
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price tag below card */}
            <div className="mt-7 flex items-center gap-3">
              <span
                className="text-[3.2rem] font-black leading-none"
                style={{ color: "#00E676" }}
              >
                ₹39
              </span>
              <div className="flex flex-col">
                <span
                  className="text-base line-through leading-none mb-1"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  ₹199
                </span>
                <span
                  className="text-[10px] font-black uppercase tracking-wide rounded-md px-2 py-0.5 leading-none"
                  style={{
                    background: "rgba(0,230,118,0.1)",
                    border: "1px solid rgba(0,230,118,0.2)",
                    color: "#00E676",
                  }}
                >
                  80% off
                </span>
              </div>
            </div>
          </motion.div>

          {/* ══════════════════════════════
              RIGHT — COPY
          ══════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.12 }}
            className="flex flex-col lg:pt-2"
          >
            <h2
              className="font-black leading-[0.93] tracking-tight mb-6"
              style={{ fontSize: "clamp(2.8rem, 4.2vw, 4.2rem)" }}
            >
              <span className="text-white block">Find what's</span>
              <span style={{ color: "#00E676" }} className="block">
                actually
              </span>
              <span className="text-white block">draining you.</span>
            </h2>

            <p
              className="text-base leading-relaxed mb-10 max-w-[380px]"
              style={{ color: "rgba(255,255,255,0.42)" }}
            >
              A 12-page PDF built directly from your assessment answers — the
              exact Indian foods and meal plan to close your gaps. Not a
              generic template.
            </p>

            {/* Feature list */}
            <ul className="space-y-4 mb-11">
              {FEATURES.map((f, i) => (
                <motion.li
                  key={f}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  className="flex items-start gap-3.5"
                >
                  <CheckCircle2
                    size={16}
                    className="shrink-0 mt-0.5"
                    style={{ color: "#00E676" }}
                  />
                  <span
                    className="text-sm leading-snug"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    {f}
                  </span>
                </motion.li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl px-7 py-4 text-sm font-black transition-all duration-200 active:scale-[0.97]"
                style={{
                  background: "#00E676",
                  color: "#030a04",
                  boxShadow: "0 0 28px rgba(0,230,118,0.2)",
                }}
              >
                Start Free Assessment
              </Link>
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-sm font-bold transition-all duration-200"
                style={{
                  background: "rgba(0,230,118,0.07)",
                  border: "1px solid rgba(0,230,118,0.18)",
                  color: "rgba(0,230,118,0.82)",
                }}
              >
                Get PDF — ₹39
                <ArrowRight size={14} />
              </Link>
            </div>

            <p
              className="text-xs mb-10"
              style={{ color: "rgba(255,255,255,0.22)" }}
            >
              Take the free assessment first — your PDF is generated from your answers.
            </p>

            {/* Social proof strip */}
            <div
              className="flex items-center gap-4 pt-8"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              {/* Initials stack */}
              <div className="flex -space-x-2.5">
                {[
                  { i: "A", opacity: 0.95 },
                  { i: "P", opacity: 0.75 },
                  { i: "R", opacity: 0.55 },
                  { i: "M", opacity: 0.38 },
                ].map(({ i, opacity }, idx) => (
                  <div
                    key={idx}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black"
                    style={{
                      background: `rgba(0,230,118,${opacity * 0.18})`,
                      border: "2px solid #040d05",
                      color: `rgba(0,230,118,${opacity})`,
                      zIndex: 4 - idx,
                    }}
                  >
                    {i}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-white leading-snug">
                  50,000+ Indians assessed
                </p>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: "rgba(255,255,255,0.28)" }}
                >
                  Initials shown for privacy
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom separator */}
      <div
        className="absolute inset-x-0 bottom-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.05) 60%, transparent)",
        }}
        aria-hidden
      />
    </section>
  );
}
