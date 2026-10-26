"use client";

import Link from "next/link";
import { ArrowRight, Coins } from "lucide-react";
import { motion } from "framer-motion";

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
        className="relative mx-auto flex max-w-7xl flex-row items-center justify-between gap-6 overflow-hidden rounded-[2rem] bg-[#2A5340] p-6 shadow-sm sm:gap-12 sm:rounded-[3rem] sm:p-8 lg:flex-row lg:p-14"
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
            <span className="h-2 w-2 rounded-full bg-[#A9C4B5]" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#A9C4B5] sm:text-[10px]">
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
            className="font-serif text-lg font-medium leading-snug text-white sm:text-4xl sm:leading-tight lg:text-5xl"
          >
            Spread Health,
            <span className="block italic text-[#C5D4CB] sm:inline">
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
            className="mt-4 max-w-[220px] text-xs leading-relaxed text-[#F4F1EA] sm:mt-3 sm:max-w-md sm:text-base"
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
            <Link
              href="/dashboard/referral"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#2A5340] transition-all duration-200 hover:bg-[#F6F3EC] sm:px-6 sm:py-3 sm:text-base"
            >
              Get Referral Link
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>

        {/* RIGHT CARD */}
        <div className="relative w-24 h-24 sm:w-44 sm:h-44 lg:w-60 lg:h-60 flex items-center justify-center shrink-0">
          
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-full h-full"
          >
            <div className="flex h-full w-full rotate-[-6deg] items-center justify-center rounded-[1.5rem] bg-[#1F3F30] sm:rounded-[2rem]">
              <Coins size={40} className="text-white opacity-90 sm:hidden" />
              <Coins size={70} className="text-white opacity-90 hidden sm:block" />
            </div>
          </motion.div>

          <div className="absolute bottom-0 right-0 z-10 flex items-center justify-center rounded-full border-4 border-[#2A5340] bg-white p-2 shadow-sm sm:bottom-2 sm:right-2 sm:p-3">
            <span className="font-serif text-xs font-medium text-[#2A5340] sm:text-lg">₹</span>
          </div>
        </div>

      </motion.div>
    </section>
  );
}