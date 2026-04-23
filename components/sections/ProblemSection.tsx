"use client";

import Image from "next/image";
import { AlertTriangle, Activity, User, Battery, Zap, Brain, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface ProblemCard {
  image: string;
  icon: LucideIcon;
  title: string;
  stat: string;
  risk: string;
  restore: string;
}

const CARDS: ProblemCard[] = [
  {
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80",
    icon: User,
    title: "Skin & Hair",
    stat: "2.4X COLLAGEN SYNTHESIS",
    risk: "Premature dermal thinning",
    restore: "Structural elasticity restore",
  },
  {
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80",
    icon: Battery,
    title: "Mood & Mental",
    stat: "60% SEROTONIN PRECURSOR LINK",
    risk: "Neuro-chemical burnout",
    restore: "Emotional baseline stability",
  },
  {
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
    icon: Zap,
    title: "Energy Levels",
    stat: "88% OF FATIGUE IS CELLULAR",
    risk: "Mitochondrial decay",
    restore: "Rapid ATP regeneration",
  },
  {
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80",
    icon: Brain,
    title: "Focus & Memory",
    stat: "32% FASTER NEURAL FIRING",
    risk: "Cognitive erosion",
    restore: "Synaptic clarity",
  },
];

export default function ProblemSection() {
  return (
    <section className="relative bg-white rounded-t-[4rem] -mt-16 z-10 py-16 sm:py-24 overflow-x-hidden">

      {/* Background */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='138.6' viewBox='0 0 80 138.6'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cpath stroke='%232dd4bf' strokeWidth='1' d='M40 0l40 23.1v46.2L40 92.4 0 69.3V23.1zM40 138.6l40-23.1V69.3L40 46.2 0 69.3v46.2z'/%3E%3Ccircle fill='%232dd4bf' cx='40' cy='46' r='3'/%3E%3Ccircle fill='%232dd4bf' cx='0' cy='23' r='3'/%3E%3Ccircle fill='%232dd4bf' cx='80' cy='23' r='3'/%3E%3Ccircle fill='%232dd4bf' cx='40' cy='92' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "80px 138.6px",
        }}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.3] text-slate-900">
            When cells starve, <br className="hidden sm:block" />
            <span className="text-[#00E676]">everything starts failing.</span>
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
                    alt={card.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-[#00E676] text-black p-2 rounded-xl shadow-lg z-10">
                    <Icon size={15} strokeWidth={2.5} />
                  </div>
                </div>

                {/* CONTENT CENTERED */}
                <div className="p-5 flex flex-col flex-1 text-center items-center">
                  <h3 className="text-base font-bold text-slate-800 mb-1">
                    {card.title}
                  </h3>

                  <p className="text-[#00E676] text-[9px] font-black tracking-[0.15em] uppercase mb-4 border-b border-slate-50 pb-3">
                    {card.stat}
                  </p>

                  <div className="space-y-4">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={11} className="text-red-500/80" />
                        <span className="text-red-500/80 text-[9px] font-bold tracking-widest uppercase">RISK</span>
                      </div>
                      <p className="text-slate-500 text-xs leading-snug">
                        {card.risk}
                      </p>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5">
                        <Activity size={11} className="text-[#00E676]" />
                        <span className="text-[#00E676] text-[9px] font-bold tracking-widest uppercase">RESTORE</span>
                      </div>
                      <p className="text-slate-500 text-xs leading-snug">
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
        <div className="hidden lg:grid grid-cols-4 gap-6 mt-10 sm:mt-16">
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
                    alt={card.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-[#00E676] text-black p-2 rounded-xl shadow-lg">
                    <Icon size={15} strokeWidth={2.5} />
                  </div>
                </div>

                <div className="p-7 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{card.title}</h3>

                  <p className="text-[#00E676] text-[9px] font-black tracking-[0.15em] uppercase mb-4 border-b border-slate-50 pb-3">
                    {card.stat}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={11} className="text-red-500/80" />
                        <span className="text-red-500/80 text-[9px] font-bold tracking-widest uppercase">RISK</span>
                      </div>
                      <p className="text-slate-500 text-[13px]">{card.risk}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <Activity size={11} className="text-[#00E676]" />
                        <span className="text-[#00E676] text-[9px] font-bold tracking-widest uppercase">RESTORE</span>
                      </div>
                      <p className="text-slate-500 text-[13px]">{card.restore}</p>
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