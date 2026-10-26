"use client";

import Image from "next/image";
import { Medal, ShieldCheck, CheckCircle2, Users, Star } from "lucide-react";
import { motion } from "framer-motion";

const EXPERTS = [
  {
    name: "Dr. Priya Sharma",
    title: "Chief Clinical Nutritionist",
    experience: "11 Years Experience",
    specialty: "HORMONAL & WOMEN'S HEALTH",
    badgeClass: "bg-[#9F1239]",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=85&fit=crop&crop=faces",
    credentials: ["M.Sc Clinical Nutrition", "DNCC Certified"],
  },
  {
    name: "Rahul Mehta",
    title: "Sports & Metabolic Nutritionist",
    experience: "9 Years Experience",
    specialty: "ENERGY & PERFORMANCE",
    badgeClass: "bg-[#B45309]",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=85",
    credentials: ["M.Sc Dietetics", "DNCC Certified"],
  },
  {
    name: "Dr. Ananya Iyer",
    title: "Integrative Medicine Nutritionist",
    experience: "8 Years Experience",
    specialty: "GUT HEALTH & IMMUNITY",
    badgeClass: "bg-[#0F766E]",
    image: "https://images.unsplash.com/photo-1659353888906-adb3e0041693?w=600&q=85&fit=crop&crop=faces",
    credentials: ["Ph.D Nutritional Science", "DNCC Certified"],
  },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Doctor-Reviewed Protocol", iconColor: "text-[#1E3A5F]" },
  { icon: CheckCircle2, label: "DNCC Certified Experts", iconColor: "text-[#0F766E]" },
  { icon: Users, label: "120+ Expert Nutritionists", iconColor: "text-[#2A5340]" },
  { icon: Star, label: "94% Client Success Rate", iconColor: "text-[#C4A35A]" },
];

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

export default function Experts() {
  return (
    <section className="scroll-mt-24 rounded-t-[3rem] bg-[#F6F3EC] py-16 md:py-20" id="experts">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10">

        <div className="flex flex-col items-center text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#2A5340]/20 bg-[#E8EEE9] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#2A5340]">
            <Medal size={12} className="text-[#2A5340]" />
            REAL EXPERTS. REAL RESULTS.
          </span>

          <h2 className="text-center font-serif text-4xl font-medium leading-[1.25] tracking-tight text-[#1C1A16] md:text-5xl">
            <span className="block">Meet Your Personal</span>
            <span className="block italic text-[#2A5340]">Nutrition Team</span>
          </h2>

          <p className="mt-4 max-w-full text-center text-sm text-[#333333] md:max-w-none md:whitespace-nowrap md:text-base">
            Every plan is designed by certified nutritionists and reviewed by doctors — not AI.
          </p>

          <div className="mt-8 w-full max-w-lg mx-auto md:max-w-none">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:hidden">
              {TRUST_BADGES.map(({ icon: Icon, label, iconColor }) => (
                <div
                  key={label}
                  className="bg-gray-50/80 border border-gray-100 rounded-full px-3 py-2 sm:px-4 flex items-center gap-2 min-w-0"
                >
                  <Icon size={15} className={`${iconColor} shrink-0 stroke-[2.5]`} />
                  <span className="text-black text-[11px] sm:text-xs font-semibold leading-tight text-left">{label}</span>
                </div>
              ))}
            </div>
            <div className="hidden md:flex justify-center gap-3 flex-wrap">
              {TRUST_BADGES.map(({ icon: Icon, label, iconColor }) => (
                <div
                  key={`d-${label}`}
                  className="bg-gray-50/80 border border-gray-100 rounded-full px-4 py-2 flex items-center gap-2.5"
                >
                  <Icon size={15} className={`${iconColor} stroke-[2.5]`} />
                  <span className="text-black text-xs font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile — stacked vertically */}
        <div className="md:hidden mt-12 flex flex-col gap-6 max-w-md mx-auto w-full px-2">
          {EXPERTS.map((expert, i) => (
            <motion.div
              key={expert.name}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariant}
              className="flex w-full flex-col overflow-hidden rounded-3xl border border-[#E4DFD4] bg-white shadow-[0_16px_40px_rgba(28,26,22,0.08)]"
            >
              <ExpertCardContent expert={expert} />
            </motion.div>
          ))}
        </div>

        {/* ✅ DESKTOP GRID (UNCHANGED) */}
        <div className="hidden md:grid grid-cols-3 gap-8 mt-16">
          {EXPERTS.map((expert, i) => (
            <motion.div
              key={expert.name}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariant}
              whileHover={{ scale: 1.02 }}
              className="flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-[#E4DFD4] bg-white shadow-[0_16px_40px_rgba(28,26,22,0.08)] transition-shadow hover:shadow-xl"
            >
              <ExpertCardContent expert={expert} />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}

function ExpertCardContent({ expert }: { expert: (typeof EXPERTS)[number] }) {
  return (
    <>
      <div className="relative h-[320px] w-full overflow-hidden group">
        <Image
          src={expert.image}
          alt={`${expert.name} — certified Indian nutritionist specialising in ${expert.specialty.toLowerCase()}`}
          fill
          className="object-cover object-top transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 80vw, 33vw"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
        <span className={`absolute bottom-4 left-4 z-10 rounded-full px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-tight text-white shadow-md transition-transform duration-300 group-hover:-translate-y-1 ${expert.badgeClass}`}>
          {expert.specialty}
        </span>
      </div>

      <div className="p-8 bg-white flex-1">
        <div className="flex flex-col gap-1">
          <p className="font-serif text-2xl font-medium leading-tight tracking-tight text-[#1C1A16]">
            {expert.name}
          </p>
          <p className="mt-0.5 text-sm font-medium text-[#333333]">
            {expert.title}
          </p>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-px w-6 rounded-full bg-[#2A5340]" />
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[#2A5340]">
            {expert.experience}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 mt-5">
          {expert.credentials.map((cred) => (
            <span
              key={cred}
              className="bg-gray-50 text-black text-[10px] font-bold px-3 py-1.5 rounded-lg border border-gray-100"
            >
              {cred}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}