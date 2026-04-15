"use client";

import { ArrowRight, Coins } from "lucide-react";
import { motion } from "framer-motion";

const HEX_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='52' height='60'><rect width='52' height='60' fill='%23010810'/><polygon points='26,3 50,16 50,44 26,57 2,44 2,16' fill='none' stroke='%231e293b' stroke-width='1'/></svg>`;
const HEX_URL = `data:image/svg+xml,${HEX_SVG}`;

const textVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: "easeOut" as const },
  }),
};

export default function ReferralBanner() {
  return (
    <section className="bg-white py-10 sm:py-16 px-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-7xl mx-auto rounded-[2rem] sm:rounded-[3rem] relative overflow-hidden shadow-2xl 
        flex flex-row lg:flex-row items-center justify-between gap-6 sm:gap-12 p-6 sm:p-8 lg:p-14"
        style={{
          backgroundImage: `url("${HEX_URL}")`,
          backgroundSize: "52px 60px",
          backgroundRepeat: "repeat",
          backgroundColor: "#010810",
        }}
      >
        {/* LEFT TEXT */}
        <div className="flex-1 text-left">

          {/* Badge */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={textVariant}
            className="flex items-center gap-2 mb-4"
          >
            <span className="w-2 h-2 rounded-full bg-[#1D61FF]" />
            <span className="text-[#1D61FF] font-bold text-[9px] sm:text-[10px] tracking-[0.2em] uppercase">
              REWARDS PROGRAM
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={textVariant}
            className="text-white font-black text-lg sm:text-4xl lg:text-5xl leading-snug sm:leading-tight"
          >
            Spread Health,
            <span className="text-[#1D61FF] block sm:inline">
              {" "}Earn Rewards
            </span>
          </motion.h2>

          {/* Text */}
          <motion.p
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={textVariant}
            className="text-gray-400 text-xs sm:text-base mt-4 sm:mt-3 max-w-[220px] sm:max-w-md leading-relaxed"
          >
            Refer friends to the Beetamin lifestyle and earn{" "}
            <strong className="text-white">₹300 credit</strong> per signup.
          </motion.p>

          {/* Button */}
          <motion.div
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={textVariant}
            className="mt-5 sm:mt-6"
          >
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 bg-[#1D61FF] hover:bg-[#1650d9] text-white font-bold px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl transition-all duration-200 shadow-[0_10px_20px_rgba(29,97,255,0.3)] text-xs sm:text-base"
            >
              Get Referral Link
              <ArrowRight size={16} />
            </a>
          </motion.div>
        </div>

        {/* RIGHT CARD */}
        <div className="relative w-24 h-24 sm:w-44 sm:h-44 lg:w-60 lg:h-60 flex items-center justify-center shrink-0">
          
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-full h-full"
          >
            <div className="bg-[#1D61FF] rounded-[1.5rem] sm:rounded-[2rem] w-full h-full rotate-[-6deg] flex items-center justify-center shadow-2xl">
              <Coins size={40} className="text-white opacity-90 sm:hidden" />
              <Coins size={70} className="text-white opacity-90 hidden sm:block" />
            </div>
          </motion.div>

          <div className="absolute bottom-0 right-0 sm:bottom-2 sm:right-2 bg-[#00E676] rounded-full p-2 sm:p-3 border-4 border-[#010810] shadow-lg flex items-center justify-center z-10">
            <span className="text-white font-black text-xs sm:text-lg">₹</span>
          </div>
        </div>

      </motion.div>
    </section>
  );
}