"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, Play, Rss, MessageCircle } from "lucide-react";
import { CORE_SITE_NAV_LINKS } from "@/lib/site-navigation";

type FooterLink = { label: string; href: string };
type FooterLinks = { [section: string]: FooterLink[] };

const Footer: React.FC = () => {
  const footerLinks: FooterLinks = {
    Services: [
      { label: "Deep Discovery", href: "/sessions" },
      { label: "Expert Strategy", href: "/booking" },
      { label: "Active Tracking", href: "/sessions" },
      { label: "My Profile", href: "/profile" },
    ],
    Company: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Contact Us", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
    Support: [
      { label: "FAQs", href: "/faq" },
      { label: "Help Center", href: "/contact" },
      { label: "Community", href: "/contact" },
      { label: "Referral Program", href: "/dashboard/referral" },
    ],
  };

  const socialIcons = [Camera, Play, Rss, MessageCircle];

  return (
    <footer className="relative overflow-x-hidden bg-[#1A2E24] px-4 pb-8 pt-12 font-sans text-white sm:px-6 sm:pt-16 lg:px-10">

      <div className="absolute left-0 top-0 h-px w-full bg-[#2A5340]/40" />

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
            <p className="mb-4 font-serif text-xl font-medium tracking-tight text-white sm:mb-6 sm:text-2xl">
              TheBeetamin
            </p>

            <nav aria-label="Footer navigation" className="mb-6 sm:mb-8 w-full">
              <ul className="flex flex-wrap justify-center sm:justify-start gap-x-5 gap-y-2 text-sm">
                {CORE_SITE_NAV_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="font-medium text-[#F4F1EA] transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a
                    href="mailto:hi@thebeetamin.com"
                    className="font-medium text-[#F4F1EA] transition-colors hover:text-white"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </nav>

            <p className="mb-6 max-w-xs text-sm leading-relaxed text-[#E8E4DC] sm:mb-8">
              Fix Vitamin D, Iron, B12 and Omega-3 deficiencies with personalised
              reports and expert nutrition sessions. Built for India.
            </p>

            <div className="flex gap-3 sm:gap-4 justify-center sm:justify-start">
              {socialIcons.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all hover:bg-[#2A5340] sm:h-10 sm:w-10"
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
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-sm text-[#E8E4DC] transition-colors hover:text-white"
                      >
                        {label}
                      </Link>
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
                className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm transition-colors focus:border-[#C5D4CB] focus:outline-none"
              />
              <button className="mt-3 w-full rounded-full bg-[#2A5340] py-3 text-sm font-semibold transition-colors hover:bg-[#1F3F30]">
                Subscribe
              </button>
            </div>
          </motion.div>
        </div>

        {/* BOTTOM */}
        <div className="pt-6 sm:pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-slate-500 text-xs">
            © 2026 TheBeetamin. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:gap-6 md:justify-end">
            {([["Terms", "/terms"], ["Privacy", "/privacy"], ["Cookies", "/cookies"]] as const).map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="text-slate-500 text-xs hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
