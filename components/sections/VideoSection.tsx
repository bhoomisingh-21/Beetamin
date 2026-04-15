"use client";

import Image from "next/image";
import { CheckCircle, Play } from "lucide-react";
import { motion } from "framer-motion";

const HEX_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='116'><rect width='100' height='116' fill='%230a0f14'/><polygon points='50,3 97,27 97,89 50,113 3,89 3,27' fill='%230a0f14' stroke='white' stroke-width='1' opacity='0.2'/></svg>`;
const HEX_URL = `data:image/svg+xml,${HEX_SVG}`;

const PILLS = ["Calorie Quality Index", "Sleep Analytics", "Micronutrient Tracker"];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export default function VideoSection() {
  return (
    <section
      className="bg-[#0a0f14] py-12 sm:py-16 overflow-x-hidden"
      style={{
        backgroundImage: `url("${HEX_URL}")`,
        backgroundSize: "100px 116px",
        backgroundRepeat: "repeat",
      }}
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="max-w-6xl mx-auto px-4 sm:px-6"
      >
        <div className="bg-[#0d1520] rounded-2xl sm:rounded-3xl border border-blue-900/30 p-6 sm:p-10 lg:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">

            {/* LEFT */}
            <div>
              <h2 className="text-white font-black text-2xl sm:text-3xl sm:text-4xl leading-tight">
                Invest In Your Future Self
              </h2>
              <p className="text-gray-400 text-sm sm:text-base mt-3 sm:mt-4 leading-relaxed max-w-sm">
                Stop guessing. Start repairing. Your personalized nutrition system is one
                assessment away.
              </p>

              {/* Pills — flex-col on mobile, flex-wrap on sm */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 mt-6 sm:mt-8">
                {PILLS.map((pill) => (
                  <div
                    key={pill}
                    className="border border-emerald-800/40 bg-emerald-950/30 rounded-full px-4 sm:px-5 py-2 inline-flex items-center gap-2 w-full sm:w-fit"
                  >
                    <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                    <span className="text-white text-sm">{pill}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — video thumbnail: h-48 on mobile */}
            <div className="rounded-xl sm:rounded-2xl overflow-hidden relative h-48 sm:h-64 lg:h-80">
              <Image
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600"
                alt="Nutritionist consultation"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <button
                  aria-label="Play video"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
                >
                  <Play size={22} className="text-white fill-white ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
