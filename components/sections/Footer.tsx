"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, Play, Rss, MessageCircle } from "lucide-react";

type FooterLinks = {
  [key: string]: string[];
};

const Footer: React.FC = () => {
  const footerLinks: FooterLinks = {
    Services: [
      "Deep Discovery",
      "Expert Strategy",
      "Active Tracking",
      "My Profile",
    ],
    Company: ["About Us", "Careers", "Contact Us", "Privacy Policy"],
    Support: ["FAQs", "Help Center", "Community", "Referral Program"],
  };

  const socialIcons = [Camera, Play, Rss, MessageCircle];

  return (
    <footer className="bg-[#020617] text-white pt-12 sm:pt-16 pb-8 px-4 sm:px-6 lg:px-10 font-sans relative overflow-x-hidden">

      {/* TOP LINE */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 sm:gap-12 mb-12 sm:mb-16 text-center sm:text-left">

          {/* BRAND */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-4 flex flex-col items-center sm:items-start"
          >
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter mb-4 sm:mb-6">
              BEETAMIN<span className="text-blue-500">.</span>
            </h2>

            <p className="text-slate-400 text-sm leading-relaxed mb-6 sm:mb-8 max-w-xs">
              Bridging your nutrient gaps through science-backed discovery and
              expert-led tracking.
            </p>

            {/* Social icons — centered on mobile */}
            <div className="flex gap-3 sm:gap-4 justify-center sm:justify-start">
              {socialIcons.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 transition-all border border-white/10"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </motion.div>

          {/* LINKS */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10"
          >
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4 sm:mb-6">
                  {title}
                </h4>
                <ul className="space-y-3">
                  {links.map((link: string) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-slate-400 text-sm hover:text-blue-400 transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>

          {/* NEWSLETTER */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2 w-full max-w-sm mx-auto sm:mx-0"
          >
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4 sm:mb-6">
              Stay Updated
            </h4>

            <div>
              <input
                type="email"
                placeholder="Your email"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button className="mt-3 w-full py-3 bg-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                Subscribe
              </button>
            </div>
          </motion.div>
        </div>

        {/* BOTTOM */}
        <div className="pt-6 sm:pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-slate-500 text-xs">
            © 2026 Beetamin Health. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:gap-6 md:justify-end">
            <Link
              href="/login?redirect=/admin"
              className="text-slate-500 text-xs hover:text-emerald-400 transition-colors"
            >
              Admin login / sign up
            </Link>
            {["Terms", "Privacy", "Cookies"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-slate-500 text-xs hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* BACKGROUND PATTERN */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='104' viewBox='0 0 60 104'%3E%3Cpath stroke='%23ffffff' stroke-width='1' fill='none' d='M30 0l30 17.3v34.6L30 69.2 0 51.9V17.3z'/%3E%3C/svg%3E")`,
          backgroundSize: "80px 138px",
        }}
      />
    </footer>
  );
};

export default Footer;
