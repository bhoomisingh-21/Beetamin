"use client";

import Link from "next/link";
import { Users, Zap, User, Brain, Heart, FlaskConical, Scale } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface Card {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  accent: string;
  badge: string;
  title: string;
  desc: string | ReactNode;
}

const CARDS: Card[] = [
  {
    icon: Zap,
    iconBg: "bg-[#F3E8C8]",
    iconColor: "text-[#B45309]",
    accent: "bg-[#D97706]",
    badge: "ENERGY",
    title: "Chronic Fatigue",
    desc: "Exhausted despite 8hrs of sleep? Fix the cellular energy gaps driving your constant tiredness.",
  },
  {
    icon: User,
    iconBg: "bg-[#F8E4E8]",
    iconColor: "text-[#9F1239]",
    accent: "bg-[#BE123C]",
    badge: "SKIN & HAIR",
    title: "Hair Loss & Dull Skin",
    desc: "Thinning hair and dull skin are early signs of micronutrient deficiency — not aging.",
  },
  {
    icon: Brain,
    iconBg: "bg-[#E4EAF4]",
    iconColor: "text-[#1E3A5F]",
    accent: "bg-[#1E3A5F]",
    badge: "COGNITIVE",
    title: "Brain Fog & Low Focus",
    desc: (
      <>
        Can&apos;t concentrate?{' '}
        <Link href="/nutrient-deficiency" className="text-[#2A5340] underline-offset-2 hover:underline">
            B12 and Omega-3 deficiency
        </Link>{' '}
        are directly linked to cognitive slowdown. We fix the root cause.
      </>
    ),
  },
  {
    icon: Heart,
    iconBg: "bg-[#F6E4DC]",
    iconColor: "text-[#9A3412]",
    accent: "bg-[#C2410C]",
    badge: "HORMONAL",
    title: "PCOS & Hormonal Issues",
    desc: "Hormonal imbalances are directly linked to specific vitamin and mineral deficiencies in women.",
  },
  {
    icon: FlaskConical,
    iconBg: "bg-[#DCEEEA]",
    iconColor: "text-[#0F766E]",
    accent: "bg-[#0F766E]",
    badge: "GUT HEALTH",
    title: "Gut & Digestive Problems",
    desc: "Bloating, IBS, poor absorption — your gut microbiome needs the right nutritional environment.",
  },
  {
    icon: Scale,
    iconBg: "bg-[#EDE6DA]",
    iconColor: "text-[#7C4A1E]",
    accent: "bg-[#A16207]",
    badge: "WEIGHT",
    title: "Weight & Metabolism",
    desc: "Slow metabolism often means nutrient deficiency, not lack of willpower. We reset your baseline.",
  },
];

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1 },
  }),
};

export default function BuiltForYou() {
  return (
    <section className="relative overflow-x-hidden bg-white py-16 sm:py-28">
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E4DFD4] bg-white px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#333333] sm:mb-8 sm:px-5">
            <Users size={13} className="text-[#2A5340]" />
            DO YOU SEE YOURSELF HERE?
          </span>

          <h2 className="font-serif text-3xl font-medium tracking-tight leading-[1.2] sm:text-4xl md:text-5xl">
            <span className="text-[#111111]">Beetamin Is Built</span>
            <br />
            <span className="italic text-[#2A5340]">Specifically For You</span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#333333] sm:mt-6 sm:text-base md:text-lg">
            If any of these sound familiar, our nutritionists are already trained to solve it.
          </p>
        </div>

        {/* Mobile — stacked vertically */}
        <div className="lg:hidden mt-12 flex flex-col gap-4 max-w-md mx-auto w-full px-2">
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariant}
                className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-[#E4DFD4] bg-white p-5"
              >
                <div className={`absolute inset-x-0 top-0 h-1 ${card.accent}`} />
                <div className="mb-5 flex items-center justify-between">
                  <div className={`${card.iconBg} ${card.iconColor} rounded-xl p-2`}>
                    <Icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className="rounded-full border border-[#E4DFD4] bg-[#F6F3EC] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-[#333333]">
                    {card.badge}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-semibold text-[#111111]">{card.title}</h3>
                  <p className="text-sm leading-[1.55] text-[#333333]">{card.desc}</p>
                </div>

                <div className="mt-5 border-t border-[#E4DFD4] pt-4">
                  <a
                    href="/assessment"
                    className="inline-flex items-center text-xs font-semibold text-[#2A5340]"
                  >
                    Get a personalized plan
                    <span className="ml-2">→</span>
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ✅ DESKTOP GRID (UNCHANGED) */}
        <div className="hidden lg:grid grid-cols-3 gap-4 sm:gap-5 mt-12 sm:mt-20">
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={cardVariant}
                whileHover={{ boxShadow: "0 16px 40px rgba(28,26,22,0.06)", borderColor: "#D8D2C6" }}
                className="relative flex min-h-[240px] flex-col overflow-hidden rounded-2xl border border-[#E4DFD4] bg-white p-4 transition-all duration-300 sm:min-h-[280px] sm:rounded-[1.5rem] sm:p-7"
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 ${card.accent}`} />
                <div className="mb-5 flex items-center justify-between sm:mb-6">
                  <div className={`${card.iconBg} ${card.iconColor} rounded-xl p-2 sm:p-2.5`}>
                    <Icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className="rounded-full border border-[#E4DFD4] bg-[#F6F3EC] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-[#333333] sm:px-3">
                    {card.badge}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-semibold text-[#111111] sm:text-xl">
                    {card.title}
                  </h3>
                  <p className="text-sm leading-[1.55] text-[#333333]">{card.desc}</p>
                </div>

                <div className="mt-5 border-t border-[#E4DFD4] pt-4 sm:mt-6 sm:pt-5">
                  <a
                    href="/assessment"
                    className="inline-flex items-center text-xs font-semibold text-[#2A5340] sm:text-[13px]"
                  >
                    Get a personalized plan
                    <span className="ml-2">→</span>
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

      <div className="pb-12 sm:pb-20" />
    </section>
  );
}