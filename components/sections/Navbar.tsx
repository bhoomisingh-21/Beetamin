"use client";

import { useEffect, useState } from "react";
import { Leaf, Phone, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "Our Experts", href: "#experts" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Free Assessment", href: "#assessment" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`sticky top-0 z-50 backdrop-blur-md bg-black/80 border-b border-white/5 transition-shadow duration-300 overflow-x-hidden ${
          scrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.6)]" : "shadow-none"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 shrink-0">
            <Leaf className="text-emerald-500" size={20} />
            <span className="text-white font-bold text-base md:text-xl">TheBeetamin</span>
          </a>

          {/* Center nav links — hidden on mobile */}
          <ul className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <a
                  href={href}
                  className="text-gray-300 text-sm hover:text-emerald-400 transition-colors duration-200"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Phone — hidden on mobile */}
            <a
              href="tel:919022234475"
              className="hidden md:flex items-center gap-1.5 text-emerald-400 text-sm"
            >
              <Phone size={14} />
              91-9022234475
            </a>

            {/* Book Now — hidden on mobile */}
            <a
              href="/assessment"
              className="hidden md:inline-flex items-center bg-emerald-500 text-black font-bold rounded-full px-5 py-2 text-sm hover:bg-emerald-400 transition-all duration-200 hover:scale-105"
            >
              Book Now
            </a>

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden text-gray-300 hover:text-white transition-colors p-1"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Full-screen mobile overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-md flex flex-col md:hidden"
          >
            {/* Close button */}
            <div className="flex items-center justify-between px-6 h-14 border-b border-white/10">
              <a href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                <Leaf className="text-emerald-500" size={20} />
                <span className="text-white font-bold text-base">TheBeetamin</span>
              </a>
              <button
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="text-gray-300 hover:text-white transition-colors p-1"
              >
                <X size={24} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 flex flex-col justify-center px-6">
              <ul className="space-y-0">
                {NAV_LINKS.map(({ label, href }, i) => (
                  <motion.li
                    key={href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, ease: "easeOut" }}
                  >
                    <a
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className="block text-white text-xl font-semibold py-4 border-b border-white/10 hover:text-emerald-400 transition-colors text-center"
                    >
                      {label}
                    </a>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, ease: "easeOut" }}
                className="mt-8 space-y-4"
              >
                <a
                  href="tel:919022234475"
                  className="flex items-center justify-center gap-2 text-emerald-400 text-base font-medium"
                >
                  <Phone size={16} />
                  91-9022234475
                </a>
                <a
                  href="/assessment"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center bg-emerald-500 text-black font-bold rounded-full px-6 py-4 text-base hover:bg-emerald-400 transition-all"
                >
                  Book Now — Free Assessment
                </a>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
