"use client";

import Image from "next/image";
import { AlertTriangle, Activity, User, Battery, Zap, Brain, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface ProblemCard {
  image: string;
  imageAlt: string;
  icon: LucideIcon;
  title: string;
  stat: string;
  risk: string;
  restore: string;
}

const CARDS: ProblemCard[] = [
  {
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80",
    imageAlt: "Indian woman with dull skin and hair loss linked to vitamin C and zinc deficiency",
    icon: User,
    title: "Skin & Hair",
    stat: "COLLAGEN SUPPORT",
    risk: "Premature dermal thinning",
    restore: "Vitamin C + zinc pathway",
  },
  {
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80",
    imageAlt: "Low mood and mental fatigue from B6 and serotonin pathway nutrient gaps",
    icon: Battery,
    title: "Mood & Mental",
    stat: "MOOD & SEROTONIN",
    risk: "Neuro-chemical imbalance",
    restore: "Tryptophan + B6 pathway",
  },
  {
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
    imageAlt: "Chronic fatigue and low energy from iron and mitochondrial dysfunction in Indians",
    icon: Zap,
    title: "Energy Levels",
    stat: "FATIGUE STARTS AT THE CELL",
    risk: "Mitochondrial + iron dysfunction",
    restore: "Cellular energy restoration",
  },
  {
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80",
    imageAlt: "Brain fog and poor focus from B12 and Omega-3 deficiency affecting cognition",
    icon: Brain,
    title: "Focus & Memory",
    stat: "COGNITIVE PERFORMANCE",
    risk: "B12 + Omega-3 impact",
    restore: "Clinically documented",
  },
];

export default function ProblemSection() {
  return (
    <section className="relative z-10 -mt-16 overflow-x-hidden rounded-t-[4rem] bg-white py-16 sm:py-24">

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="font-serif text-3xl font-medium leading-[1.3] tracking-tight text-[#1C1A16] sm:text-4xl lg:text-5xl">
            When cells starve, <br className="hidden sm:block" />
            <span className="italic text-[#2A5340]">everything starts failing.</span>
          </h2>
        </div>

        {/* ✅ MOBILE SCROLL */}
        <div className="relative">
          <div className="flex lg:hidden overflow-x-auto gap-4 pl-2 pr-8 pb-4 scrollbar-hide">
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group flex flex-col bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm min-w-[85vw] max-w-[85vw] flex-shrink-0"
              >
                {/* IMAGE (NO GRAYSCALE) */}
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={card.image}
                    alt={card.imageAlt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 z-10 rounded-xl bg-[#2A5340] p-2 text-white shadow-lg">
                    <Icon size={15} strokeWidth={2.5} />
                  </div>
                </div>

                {/* CONTENT CENTERED */}
                <div className="p-5 flex flex-col flex-1 text-center items-center">
                  <h3 className="mb-1 text-base font-bold text-[#111111]">
                    {card.title}
                  </h3>

                  <p className="mb-4 border-b border-slate-50 pb-3 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#2A5340]">
                    {card.stat}
                  </p>

                  <div className="space-y-4">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={11} className="text-red-500/80" />
                        <span className="text-red-500/80 text-[9px] font-bold tracking-widest uppercase">RISK</span>
                      </div>
                      <p className="text-xs leading-snug text-[#333333]">
                        {card.risk}
                      </p>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5">
                        <Activity size={11} className="text-[#2A5340]" />
                        <span className="text-[#2A5340] text-[9px] font-bold tracking-widest uppercase">RESTORE</span>
                      </div>
                      <p className="text-xs leading-snug text-[#333333]">
                        {card.restore}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-end bg-gradient-to-l from-white pr-1 lg:hidden"
            aria-hidden
          >
            <ChevronRight className="text-slate-400" size={22} strokeWidth={2} />
          </div>
        </div>

        {/* ✅ DESKTOP GRID (UNCHANGED) */}
        <div className="hidden lg:grid grid-cols-4 gap-6 mt-10 sm:mt-16" id="science">
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group flex flex-col bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={card.image}
                    alt={card.imageAlt}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute left-4 top-4 rounded-xl bg-[#2A5340] p-2 text-white shadow-lg">
                    <Icon size={15} strokeWidth={2.5} />
                  </div>
                </div>

                <div className="p-7 flex flex-col flex-1">
                  <h3 className="mb-1 text-lg font-bold text-[#111111]">{card.title}</h3>

                  <p className="mb-4 border-b border-slate-50 pb-3 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#2A5340]">
                    {card.stat}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={11} className="text-red-500/80" />
                        <span className="text-red-500/80 text-[9px] font-bold tracking-widest uppercase">RISK</span>
                      </div>
                      <p className="text-[13px] text-[#333333]">{card.risk}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <Activity size={11} className="text-[#2A5340]" />
                        <span className="text-[#2A5340] text-[9px] font-bold tracking-widest uppercase">RESTORE</span>
                      </div>
                      <p className="text-[13px] text-[#333333]">{card.restore}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

    </section>
  );
}