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
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600",
    credentials: ["M.Sc Clinical Nutrition", "DNCC Certified"],
  },
  {
    name: "Rahul Mehta",
    title: "Sports & Metabolic Nutritionist",
    experience: "9 Years Experience",
    specialty: "ENERGY & PERFORMANCE",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600",
    credentials: ["M.Sc Dietetics", "DNCC Certified"],
  },
  {
    name: "Dr. Ananya Iyer",
    title: "Integrative Medicine Nutritionist",
    experience: "8 Years Experience",
    specialty: "GUT HEALTH & IMMUNITY",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=600",
    credentials: ["Ph.D Nutritional Science", "DNCC Certified"],
  },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Doctor-Reviewed Protocol", iconColor: "text-blue-600" },
  { icon: CheckCircle2, label: "DNCC Certified Experts", iconColor: "text-emerald-600" },
  { icon: Users, label: "120+ Expert Nutritionists", iconColor: "text-purple-600" },
  { icon: Star, label: "94% Client Success Rate", iconColor: "text-yellow-500" },
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
    <section className="bg-white rounded-t-[3rem] py-16 md:py-20" id="experts">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10">

        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 border border-emerald-500/20 bg-emerald-50 text-emerald-600 text-[10px] tracking-[0.1em] uppercase rounded-full px-4 py-1.5 mb-6 font-bold">
            <Medal size={12} className="text-emerald-500" />
            REAL EXPERTS. REAL RESULTS.
          </span>

          {/* ✅ ALWAYS 2 LINES (FIXED GAP ISSUE) */}
          <h2 className="font-extrabold text-4xl md:text-5xl text-black leading-[1.25] tracking-tight text-center">
            <span className="block">Meet Your Personal</span>
            <span className="block text-emerald-500">Nutrition Team</span>
          </h2>

          {/* ✅ DESKTOP 1 LINE, MOBILE FLEXIBLE */}
          <p className="text-black text-sm md:text-base mt-4 text-center md:whitespace-nowrap max-w-full md:max-w-none">
            Every plan is designed by certified nutritionists and reviewed by doctors — not AI.
          </p>

          <div className="flex justify-center gap-3 flex-wrap mt-8">
            {TRUST_BADGES.map(({ icon: Icon, label, iconColor }) => (
              <div
                key={label}
                className="bg-gray-50/80 border border-gray-100 rounded-full px-4 py-2 flex items-center gap-2.5"
              >
                <Icon size={15} className={`${iconColor} stroke-[2.5]`} />
                <span className="text-black text-xs font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ MOBILE SCROLL */}
        <div className="flex md:hidden overflow-x-auto gap-5 mt-16 pb-4 px-6 scrollbar-hide">
          {EXPERTS.map((expert, i) => (
            <motion.div
              key={expert.name}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariant}
              className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm bg-white flex flex-col min-w-[80vw] max-w-[80vw] flex-shrink-0"
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
              className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm bg-white flex flex-col hover:shadow-xl transition-shadow cursor-pointer"
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
      <div className="relative h-[280px] w-full overflow-hidden group">
        <Image
          src={expert.image}
          alt={expert.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 80vw, 33vw"
        />
        <span className="absolute bottom-4 left-4 bg-[#00E676] text-black text-[10px] font-extrabold px-3.5 py-1.5 rounded-md z-10 uppercase tracking-tight shadow-[0_4px_12px_rgba(0,230,118,0.25)] transition-transform duration-300 group-hover:-translate-y-1">
          {expert.specialty}
        </span>
      </div>

      <div className="p-8 bg-white flex-1">
        <div className="flex flex-col gap-1">
          <p className="font-bold text-2xl text-black tracking-tight leading-tight">
            {expert.name}
          </p>
          <p className="text-black text-sm font-semibold mt-0.5">
            {expert.title}
          </p>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <div className="h-[2px] w-6 bg-emerald-500 rounded-full" />
          <p className="text-emerald-600 text-[12px] font-bold uppercase tracking-wider">
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