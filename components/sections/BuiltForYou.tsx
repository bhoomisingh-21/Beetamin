"use client";

import { Users, Zap, User, Brain, Heart, FlaskConical, Scale, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

const HEX_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='92'><rect width='80' height='92' fill='%23060a0e'/><polygon points='40,3 77,22 77,70 40,89 3,70 3,22' fill='%23060a0e' stroke='%2311181f' stroke-width='1.5'/></svg>`;
const HEX_URL = `data:image/svg+xml,${HEX_SVG}`;

interface Card {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  badge: string;
  title: string;
  desc: string;
}

const CARDS: Card[] = [
  {
    icon: Zap,
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-400",
    badge: "ENERGY",
    title: "Chronic Fatigue",
    desc: "Exhausted despite 8hrs of sleep? Fix the cellular energy gaps driving your constant tiredness.",
  },
  {
    icon: User,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    badge: "SKIN & HAIR",
    title: "Hair Loss & Dull Skin",
    desc: "Thinning hair and dull skin are early signs of micronutrient deficiency — not aging.",
  },
  {
    icon: Brain,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    badge: "COGNITIVE",
    title: "Brain Fog & Low Focus",
    desc: "Can't concentrate? Nutrient-depleted neurons fire 32% slower. We fix the root cause.",
  },
  {
    icon: Heart,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
    badge: "HORMONAL",
    title: "PCOS & Hormonal Issues",
    desc: "Hormonal imbalances are directly linked to specific vitamin and mineral deficiencies in women.",
  },
  {
    icon: FlaskConical,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    badge: "GUT HEALTH",
    title: "Gut & Digestive Problems",
    desc: "Bloating, IBS, poor absorption — your gut microbiome needs the right nutritional environment.",
  },
  {
    icon: Scale,
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-400",
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
    <section
      className="relative py-16 sm:py-28 overflow-x-hidden bg-[#060a0e]"
      style={{
        backgroundImage: `url("${HEX_URL}")`,
        backgroundSize: "80px 92px",
        backgroundRepeat: "repeat",
      }}
    >
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 border border-white/10 bg-[#11181f] text-gray-400 text-[10px] font-bold tracking-[0.2em] uppercase rounded-full px-4 sm:px-5 py-2 mb-6 sm:mb-8">
            <Users size={13} className="text-gray-500" />
            DO YOU SEE YOURSELF HERE?
          </span>

          <h2 className="font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.2]">
            <span className="text-white">Beetamin Is Built</span>
            <br />
            <span className="text-[#00E676]">Specifically For You</span>
          </h2>

          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mt-4 sm:mt-6 leading-relaxed">
            If any of these sound familiar, our nutritionists are already trained to solve it.
          </p>
        </div>

        {/* ✅ MOBILE: HORIZONTAL SCROLL */}
        <div className="relative mt-12">
          <div className="flex lg:hidden overflow-x-auto gap-4 pb-4 pl-2 pr-8 scrollbar-hide">
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
                className="bg-[#0a1219] border border-[#1a2329] rounded-2xl p-5 flex flex-col min-w-[85vw] max-w-[85vw] flex-shrink-0"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className={`${card.iconBg} ${card.iconColor} rounded-xl p-2`}>
                    <Icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className="bg-[#11181f] border border-white/5 text-gray-500 text-[9px] font-black tracking-widest uppercase rounded-md px-2 py-1">
                    {card.badge}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-400 text-xs leading-[1.5]">{card.desc}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/5">
                  <a
                    href="/assessment"
                    className="inline-flex items-center text-[#00E676] text-xs font-bold"
                  >
                    Get a personalized plan
                    <span className="ml-2">→</span>
                  </a>
                </div>
              </motion.div>
            );
          })}
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-end bg-gradient-to-l from-[#060a0e] pr-1 lg:hidden"
            aria-hidden
          >
            <ChevronRight className="text-emerald-500/60" size={22} strokeWidth={2} />
          </div>
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
                whileHover={{ boxShadow: "0 0 30px rgba(16,185,129,0.15)", borderColor: "#2a363f" }}
                className="bg-[#0a1219] border border-[#1a2329] rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-7 flex flex-col min-h-[240px] sm:min-h-[280px] transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-5 sm:mb-6">
                  <div className={`${card.iconBg} ${card.iconColor} rounded-xl p-2 sm:p-2.5`}>
                    <Icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className="bg-[#11181f] border border-white/5 text-gray-500 text-[9px] font-black tracking-widest uppercase rounded-md px-2 sm:px-2.5 py-1">
                    {card.badge}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg sm:text-xl mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-[14px] leading-[1.5]">{card.desc}</p>
                </div>

                <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-white/5">
                  <a
                    href="/assessment"
                    className="inline-flex items-center text-[#00E676] text-xs sm:text-[13px] font-bold"
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