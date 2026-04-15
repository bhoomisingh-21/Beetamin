"use client";

import Image from "next/image";
import { CheckCircle, Play } from "lucide-react";
import { motion } from "framer-motion";

const HEX_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='92'><rect width='80' height='92' fill='%23060a0e'/><polygon points='40,3 77,22 77,70 40,89 3,70 3,22' fill='%23060a0e' stroke='%2311181f' stroke-width='1.7'/></svg>`;
const HEX_URL = `data:image/svg+xml,${HEX_SVG}`;

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

const PILLS = ["Calorie Quality Index", "Sleep Analytics"];

export default function TransformationJourney() {
  return (
    <section
      className="bg-[#05080b] py-14 sm:py-20 px-4 sm:px-6 font-sans relative overflow-x-hidden"
      style={{
        backgroundImage: `url("${HEX_URL}")`,
        backgroundSize: "80px 92px",
        backgroundRepeat: "repeat",
      }}
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
          <h2 className="text-white font-bold text-3xl sm:text-4xl md:text-5xl mb-4 sm:mb-6">
            Your 90-Day Transformation Journey
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">
            No guesswork. No generic advice. Just a clear science-guided path.
          </p>
        </motion.div>

        {/* MOBILE */}
        <div className="block lg:hidden mb-10">
          {STEPS.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center text-center mb-10 relative">

              {idx !== STEPS.length - 1 && (
                <div className="absolute top-[60px] w-[2px] h-[55px] bg-blue-500/20" />
              )}

              <div className="w-12 h-12 rounded-full bg-[#0d1520] border border-blue-500/40 flex items-center justify-center mb-4 z-10">
                <span className="text-blue-400 font-bold text-sm">{step.number}</span>
              </div>

              <span className="text-emerald-400 text-[10px] font-black tracking-[0.2em] mb-1">
                {step.label}
              </span>

              <h3 className="text-white font-bold text-lg mb-2">
                {step.title}
              </h3>

              <p className="text-gray-400 text-sm max-w-xs">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* DESKTOP */}
        <div className="relative hidden lg:grid grid-cols-4 gap-8 mb-4">
          <div className="absolute top-8 left-[10%] right-[10%] h-[1px] bg-blue-500/20 z-0" />

          {STEPS.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.2 }}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#0d1520] border border-blue-500/40 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                <span className="text-blue-400 font-bold text-xl">{step.number}</span>
              </div>
              <span className="text-emerald-400 text-[10px] font-black tracking-[0.2em] mb-3">
                {step.label}
              </span>
              <h3 className="text-white font-bold text-xl mb-3">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-[260px]">{step.desc}</p>
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

  {/* Glow Border */}
  <div className="absolute -inset-[1px] rounded-2xl sm:rounded-[32px] bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 opacity-50 blur-md group-hover:opacity-80 transition duration-500" />

  {/* Actual Card */}
  <div className="relative bg-[#09101a] rounded-2xl sm:rounded-[32px] border border-white/5 p-5 sm:p-8 md:p-14 overflow-hidden">

    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-10">

      {/* CONTENT */}
      <div className="flex-1 w-full space-y-4 sm:space-y-5 text-center lg:text-left order-2 lg:order-1">
        <h2 className="text-white font-bold text-2xl sm:text-3xl md:text-4xl tracking-tight leading-[1.2]">
          Invest In Your Future Self
        </h2>

        <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto lg:mx-0">
          Stop guessing. Start repairing. Your personalized nutrition system is one
          assessment away.
        </p>

        <div className="flex flex-row flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 pt-1">
          {PILLS.map((pill) => (
            <div
              key={pill}
              className="flex items-center gap-2 bg-[#051613] border border-emerald-500/10 rounded-full px-4 py-2.5"
            >
              <CheckCircle className="text-emerald-500 w-4 h-4 shrink-0" />
              <span className="text-gray-200 text-sm font-medium">{pill}</span>
            </div>
          ))}
        </div>
      </div>

      {/* VIDEO (unchanged) */}
      <div className="relative w-full lg:w-[500px] xl:w-[580px] h-48 sm:h-64 lg:aspect-[16/10] lg:h-auto rounded-xl sm:rounded-[24px] overflow-hidden group cursor-pointer shadow-2xl shrink-0 order-1 lg:order-2">
        <Image
          src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800"
          alt="Nutritionist at work"
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