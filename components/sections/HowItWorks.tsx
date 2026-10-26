"use client";

import Image from "next/image";
import { CheckCircle, Play } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  {
    number: "01",
    label: "DAY 1",
    title: "Health Assessment",
    desc: "Complete a detailed questionnaire covering symptoms, lifestyle, diet and medical history.",
  },
  {
    number: "02",
    label: "WEEK 1",
    title: "Expert Consultation",
    desc: "1-on-1 30-minute call with your dedicated nutritionist to map your deficiencies and goals.",
  },
  {
    number: "03",
    label: "WEEK 2",
    title: "Your Personalized Plan",
    desc: "Receive a custom diet plan + targeted supplement protocol built for your biology.",
  },
  {
    number: "04",
    label: "MONTH 1-3",
    title: "90-Day Tracking",
    desc: "Fortnightly check-ins, plan adjustments every 30 days, and WhatsApp support throughout.",
  },
];

const PILLS = ["Doctor-Reviewed Protocol", "Personalised Plan"];

export default function TransformationJourney() {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-28 overflow-x-hidden bg-[#1A2E24] px-4 py-14 font-sans sm:px-6 sm:py-20"
    >
      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="mb-5 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C5D4CB]">
            The 90-day path
          </span>
          <h2 className="mb-4 font-serif text-3xl font-medium text-white sm:mb-6 sm:text-4xl md:text-5xl">
            Your 90-Day Transformation Journey
          </h2>
          <p className="text-sm text-[#E8E4DC] sm:text-base">
            No guesswork. No generic advice. Just a clear science-guided path.
          </p>
        </motion.div>

        {/* MOBILE */}
        <div className="block lg:hidden mb-10">
          {STEPS.map((step, idx) => (
            <div key={idx} className="relative mb-10 flex flex-col items-center text-center">
              <div className="z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#C5D4CB]">
                <span className="font-serif text-sm font-medium text-[#1A2E24]">{step.number}</span>
              </div>

              <span className="mb-1 text-[10px] font-semibold tracking-[0.2em] text-[#C5D4CB]">
                {step.label}
              </span>

              <h3 className="mb-2 text-lg font-semibold text-white">
                {step.title}
              </h3>

              <p className="max-w-xs text-sm text-[#E8E4DC]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* DESKTOP */}
        <div className="relative hidden lg:grid grid-cols-4 gap-8 mb-4">
          <div className="absolute top-8 left-[10%] right-[10%] z-0 h-px bg-white/15" />

          {STEPS.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.2 }}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#C5D4CB] shadow-[0_0_0_8px_rgba(197,212,203,0.12)]">
                <span className="font-serif text-xl font-medium text-[#1A2E24]">{step.number}</span>
              </div>
              <span className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-[#C5D4CB]">
                {step.label}
              </span>
              <h3 className="mb-3 text-xl font-semibold text-white">{step.title}</h3>
              <p className="max-w-[260px] text-sm leading-relaxed text-[#E8E4DC]">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* VIDEO SECTION */}
        {/* 🔥 FULL CARD WITH GLOW BORDER */}
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6, ease: "easeOut" }}
  className="relative mt-4 lg:mt-12 z-20 group"
>

  <div className="relative overflow-hidden rounded-2xl bg-[#F6F3EC] p-5 sm:rounded-[32px] sm:p-8 md:p-14">

    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-10">

      {/* CONTENT */}
      <div className="flex-1 w-full space-y-4 sm:space-y-5 text-center lg:text-left order-2 lg:order-1">
        <h2 className="font-serif text-2xl font-medium leading-[1.2] tracking-tight text-[#1C1A16] sm:text-3xl md:text-4xl">
          Invest In Your Future Self
        </h2>

        <p className="mx-auto max-w-md text-sm leading-relaxed text-[#333333] sm:text-base lg:mx-0">
          Stop guessing. Start repairing. Your personalized nutrition system is one
          assessment away.
        </p>

        <div className="flex flex-row flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 pt-1">
          {PILLS.map((pill) => (
            <div
              key={pill}
              className="flex items-center gap-2 rounded-full border border-[#2A5340]/15 bg-[#E8EEE9] px-4 py-2.5"
            >
              <CheckCircle className="h-4 w-4 shrink-0 text-[#2A5340]" />
              <span className="text-sm font-medium text-[#1C1A16]">{pill}</span>
            </div>
          ))}
        </div>
      </div>

      {/* VIDEO (unchanged) */}
      <div className="relative w-full lg:w-[500px] xl:w-[580px] h-48 sm:h-64 lg:aspect-[16/10] lg:h-auto rounded-xl sm:rounded-[24px] overflow-hidden group cursor-pointer shadow-2xl shrink-0 order-1 lg:order-2">
        <Image
          src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800"
          alt="Certified nutritionist reviewing a personalised Indian diet plan on video call"
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 580px"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 transition-all group-hover:scale-110 shadow-2xl">
            <Play className="text-white fill-white w-5 h-5 ml-1" />
          </div>
        </div>
      </div>

    </div>
  </div>
</motion.div>
      </div>
    </section>
  );
}